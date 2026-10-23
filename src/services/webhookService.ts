import { StudentProfile, ApprovalPayload, ApprovalResponse } from '../types';

const STORAGE_KEYS = {
  PROFILE_URL: 'impactvolunteer_profile_webhook_url',
  RESULT_URL: 'impactvolunteer_result_webhook_url',
  USE_PROXY: 'impactvolunteer_use_proxy',
  SIMULATION_MODE: 'impactvolunteer_simulation_mode',
};

export function getWebhookConfig() {
  const envProfileUrl = (import.meta.env.VITE_PROFILE_MATCH_WEBHOOK_URL || '').trim();
  const envResultUrl = (import.meta.env.VITE_REGISTRATION_RESULT_WEBHOOK_URL || '').trim();

  const customProfileUrl = localStorage.getItem(STORAGE_KEYS.PROFILE_URL) || '';
  const customResultUrl = localStorage.getItem(STORAGE_KEYS.RESULT_URL) || '';
  const storedProxy = localStorage.getItem(STORAGE_KEYS.USE_PROXY);
  const storedSim = localStorage.getItem(STORAGE_KEYS.SIMULATION_MODE);

  const profileMatchUrl = customProfileUrl || envProfileUrl;

  // Only use explicitly configured or environment registration result webhook URL.
  // Do NOT auto-derive or guess an unverified '/registration-result' endpoint (which returns HTTP 404 in n8n).
  const registrationResultUrl = customResultUrl || envResultUrl || '';

  return {
    profileMatchUrl,
    registrationResultUrl,
    envProfileUrl,
    envResultUrl,
    customProfileUrl,
    customResultUrl,
    isCustomProfileUrl: Boolean(customProfileUrl),
    isCustomResultUrl: Boolean(customResultUrl),
    useProxy: storedProxy === null ? true : storedProxy === 'true', // Default to true so browser CORS doesn't block n8n
    simulationMode: storedSim === 'true',
  };
}

export function saveWebhookConfig(config: {
  customProfileUrl?: string;
  customResultUrl?: string;
  useProxy?: boolean;
  simulationMode?: boolean;
}) {
  if (config.customProfileUrl !== undefined) {
    if (config.customProfileUrl) {
      localStorage.setItem(STORAGE_KEYS.PROFILE_URL, config.customProfileUrl.trim());
    } else {
      localStorage.removeItem(STORAGE_KEYS.PROFILE_URL);
    }
  }
  if (config.customResultUrl !== undefined) {
    if (config.customResultUrl) {
      localStorage.setItem(STORAGE_KEYS.RESULT_URL, config.customResultUrl.trim());
    } else {
      localStorage.removeItem(STORAGE_KEYS.RESULT_URL);
    }
  }
  if (config.useProxy !== undefined) {
    localStorage.setItem(STORAGE_KEYS.USE_PROXY, String(config.useProxy));
  }
  if (config.simulationMode !== undefined) {
    localStorage.setItem(STORAGE_KEYS.SIMULATION_MODE, String(config.simulationMode));
  }
}

/**
 * Execute a POST request to an external webhook with timeout and automatic CORS proxy fallback.
 * Note: Never logs signed or temporary URLs to ensure security.
 */
async function postToWebhook(url: string, payload: any, useProxy: boolean): Promise<any> {
  const timeoutMs = 45000;

  // Route through backend proxy to avoid browser CORS restrictions with self-hosted n8n
  const targetEndpoint = useProxy
    ? `/api/proxy?url=${encodeURIComponent(url)}`
    : url;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(targetEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorDetails = `HTTP ${response.status} (${response.statusText || 'Error'})`;
      let errorBodyText = '';
      try {
        const errorBody = await response.json();
        if (errorBody.message || errorBody.error) {
          errorDetails += `: ${errorBody.message || errorBody.error}`;
          errorBodyText = String(errorBody.message || errorBody.error);
        }
      } catch {
        // Not JSON
      }

      // Check if URL is expired or execution is not waiting
      const isExpired =
        response.status === 404 ||
        response.status === 410 ||
        errorBodyText.toLowerCase().includes('not waiting') ||
        errorBodyText.toLowerCase().includes('expired') ||
        errorBodyText.toLowerCase().includes('not found') ||
        errorBodyText.toLowerCase().includes('inactive');

      if (isExpired) {
        const expiredErr: any = new Error(
          'The temporary approval link for this matching session has expired or the workflow is no longer waiting. Please start a fresh matching session to get an active approval link.'
        );
        expiredErr.isExpired = true;
        throw expiredErr;
      }

      throw new Error(`Endpoint returned error: ${errorDetails}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return await response.json();
    }

    const text = await response.text();
    if (!text || !text.trim()) {
      return { status: 'success', message: 'Workflow received request' };
    }

    try {
      return JSON.parse(text);
    } catch {
      return { status: 'success', message: text };
    }
  } catch (err: any) {
    clearTimeout(timeoutId);

    if (err.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs / 1000}s while waiting for n8n workflow.`);
    }

    if (err.isExpired) {
      throw err;
    }

    // If direct fetch failed due to CORS (TypeError: Failed to fetch), attempt proxy as fallback once
    if (!useProxy && err.message?.includes('Failed to fetch')) {
      return postToWebhook(url, payload, true);
    }

    throw err;
  }
}

/**
 * Submits the student profile to the n8n matching webhook.
 * Transmits the 8 exact student fields and returns run_id, student, matches, and approve_url.
 */
export async function submitStudentProfile(
  profile: StudentProfile,
  callbacks?: { onStatus?: (step: string) => void }
): Promise<any> {
  // Validate exact required fields before transmission
  if (!profile.name || !profile.name.trim()) throw new Error('Student name is required.');
  if (!profile.cause) throw new Error('Cause category is required.');
  if (!Array.isArray(profile.skills) || profile.skills.length === 0) {
    throw new Error('At least one skill must be selected.');
  }
  if (!profile.availability) throw new Error('Availability preference is required.');
  if (profile.age === null || profile.age === undefined || profile.age < 12 || profile.age > 100) {
    throw new Error('A valid student age (12–100) is required.');
  }
  if (!profile.city || !profile.city.trim()) throw new Error('City is required.');
  if (!profile.workmode) throw new Error('Workmode preference is required.');

  // Exact profile payload structure expected by n8n
  const exactPayload = {
    name: profile.name.trim(),
    cause: profile.cause,
    skills: profile.skills,
    availability: profile.availability,
    age: Number(profile.age),
    background_consent: Boolean(profile.background_consent),
    city: profile.city.trim(),
    workmode: profile.workmode,
  };

  const config = getWebhookConfig();

  // If no webhook URL is configured and simulation mode is enabled, provide an honest simulation
  if (!config.profileMatchUrl) {
    if (config.simulationMode) {
      callbacks?.onStatus?.('Running in Test Simulator mode...');
      await new Promise((r) => setTimeout(r, 1800));
      return generateSimulationResponse(exactPayload);
    }
    throw new Error(
      'Profile matching webhook URL is not configured. Please set VITE_PROFILE_MATCH_WEBHOOK_URL or configure your n8n profile webhook in Webhook Settings.'
    );
  }

  return await postToWebhook(config.profileMatchUrl, exactPayload, config.useProxy);
}

/**
 * Submits the approval payload to the dynamically saved approve_url.
 * Resumes the n8n Wait node execution for this specific matching session.
 */
export async function submitOpportunityApproval(
  approveUrl: string | null | undefined,
  payload: ApprovalPayload
): Promise<ApprovalResponse> {
  // 1. Verify that a valid temporary approve_url exists for this session
  if (!approveUrl || typeof approveUrl !== 'string' || !approveUrl.trim()) {
    const err: any = new Error(
      'No active approval URL found for this session. The matching response did not contain an approve_url, or your session has expired. Please start a fresh matching session.'
    );
    err.isMissingUrl = true;
    throw err;
  }

  const cleanApproveUrl = approveUrl.trim();

  // Validate URL structure
  try {
    new URL(cleanApproveUrl);
  } catch {
    const err: any = new Error(
      'The approval resume URL returned by the workflow is malformed. Please start a fresh matching session.'
    );
    err.isMalformedUrl = true;
    throw err;
  }

  // 2. Validate payload structure: exactly one selected opportunity ID
  if (!Array.isArray(payload.selected_ids) || payload.selected_ids.length !== 1) {
    throw new Error('Approval requires exactly one selected opportunity ID.');
  }

  const selectedId = payload.selected_ids[0];
  if (!selectedId || typeof selectedId !== 'string' || !selectedId.trim()) {
    throw new Error('Invalid opportunity ID provided for approval.');
  }

  // Exact 3 fields
  const exactPayload: ApprovalPayload = {
    selected_ids: [selectedId.trim()],
    background_check_consent: Boolean(payload.background_check_consent),
    unverified_requirements_ack: Boolean(payload.unverified_requirements_ack),
  };

  const config = getWebhookConfig();

  // Handle simulation mode if applicable
  if (cleanApproveUrl.includes('impactvolunteer.sim') || config.simulationMode) {
    await new Promise((r) => setTimeout(r, 1200));
    // Simulate resumption; final result will be retrieved via pollRegistrationResult
    return {
      status: 'workflow_resumed',
      success: true,
      workflow_resumed: true,
      has_final_result: false,
      message: 'Workflow resumed (Simulation Mode).',
      timestamp: new Date().toISOString(),
      raw: { message: 'Workflow resumed', simulated: true },
    };
  }

  // 3. Send HTTP POST request to the dynamic approve_url
  const response = await postToWebhook(cleanApproveUrl, exactPayload, config.useProxy);

  // 4. Handle and inspect final registration result vs intermediate resumption
  return parseApprovalWorkflowResponse(response);
}

/**
 * Inspects the response returned by the n8n approve_url.
 * Handles both synchronous full registration results and intermediate "Workflow resumed" responses.
 */
function parseApprovalWorkflowResponse(raw: any): ApprovalResponse {
  if (!raw) {
    return {
      status: 'workflow_resumed',
      success: true,
      workflow_resumed: true,
      has_final_result: false,
      is_intermediate_resumption: true,
      message: 'Workflow execution resumed.',
      raw,
    };
  }

  // Unwrap array formats [ { ... } ] or [ { json: { ... } } ] returned by n8n
  let target: any = raw;
  if (Array.isArray(raw)) {
    if (raw.length === 0) {
      return {
        status: 'workflow_resumed',
        success: true,
        workflow_resumed: true,
        has_final_result: false,
        is_intermediate_resumption: true,
        message: 'Empty response received from workflow.',
        raw,
      };
    }
    target = raw[0]?.json || raw[0];
  } else if (typeof raw === 'object' && raw.json) {
    target = raw.json;
  } else if (typeof raw === 'object' && raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data)) {
    if (raw.data.registered || raw.data.outcome || raw.data.not_registered) {
      target = raw.data;
    }
  }

  const msg = String(target.message || target.status || '').toLowerCase();
  const isGenericResumptionMessage =
    (msg.includes('workflow resumed') || msg.includes('execution resumed') || msg === 'resumed') &&
    !target.registered &&
    !target.not_registered &&
    !target.outcome &&
    !target.summary_html &&
    !target.registration_id &&
    !target.confirmation_code &&
    !target.confirmation_id;

  // Check for presence of real final registration fields from "Build Final Response"
  const hasFinalResult =
    Boolean(
      target.outcome ||
      target.registered !== undefined ||
      target.not_registered !== undefined ||
      target.summary_html !== undefined ||
      target.registration_id ||
      target.confirmation_code ||
      target.confirmation_id ||
      target.registration_status ||
      target.approval_id ||
      target.volunteer_id ||
      (target.status && !['resumed', 'workflow resumed', 'success'].includes(target.status.toLowerCase()))
    ) && !isGenericResumptionMessage;

  if (hasFinalResult) {
    return {
      status: target.outcome || target.status || target.registration_status || 'completed',
      success: true,
      workflow_resumed: true,
      has_final_result: true,
      is_intermediate_resumption: false,
      message: target.message || 'Registration and verification completed successfully.',
      approval_id: target.approval_id || target.registration_id || target.confirmation_code || target.confirmation_id,
      registration_id: target.registration_id || target.confirmation_code || target.confirmation_id,
      confirmation_code: target.confirmation_code || target.confirmation_id,
      next_steps: target.next_steps || target.instructions,
      timestamp: target.timestamp || new Date().toISOString(),
      raw: target,
    };
  }

  // Intermediate resumption acknowledgement returned by Wait node
  return {
    status: 'workflow_resumed',
    success: true,
    workflow_resumed: true,
    has_final_result: false,
    is_intermediate_resumption: true,
    message: target.message || 'Workflow resumed.',
    timestamp: target.timestamp || new Date().toISOString(),
    raw: target,
  };
}

/**
 * Single fetch attempt to retrieve the final registration result from n8n Data Table.
 */
export async function fetchRegistrationResult(
  runId: string,
  targetUrlOverride?: string
): Promise<any> {
  if (!runId || !runId.trim()) {
    throw new Error('Run ID is required to fetch registration result.');
  }

  const config = getWebhookConfig();
  const targetBaseUrl = targetUrlOverride || config.registrationResultUrl;

  if (!targetBaseUrl) {
    if (config.simulationMode) {
      await new Promise((r) => setTimeout(r, 800));
      return generateSimulationResult(runId);
    }
    throw new Error(
      'The approval resume request returned an intermediate response ("Workflow resumed"), but no separate registration-result webhook endpoint is configured in Settings. If your workflow returns final results synchronously, ensure your Wait node or Respond to Webhook node outputs the final registration payload.'
    );
  }

  // Support both query param and body param so n8n can access run_id via $json.query.run_id or $json.body.run_id
  const urlWithQuery = targetBaseUrl.includes('?')
    ? `${targetBaseUrl}&run_id=${encodeURIComponent(runId)}`
    : `${targetBaseUrl}?run_id=${encodeURIComponent(runId)}`;

  const targetEndpoint = config.useProxy
    ? `/api/proxy?url=${encodeURIComponent(urlWithQuery)}`
    : urlWithQuery;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(targetEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ run_id: runId }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 404 || response.status === 204) {
      // Record not yet found/saved in Data Table
      return null;
    }

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      return data;
    }

    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}

/**
 * Polls the n8n registration result endpoint until the Data Table row is saved and available.
 */
export async function pollRegistrationResult(
  runId: string,
  options?: {
    maxAttempts?: number;
    intervalMs?: number;
    onAttempt?: (attempt: number) => void;
    customUrl?: string;
  }
): Promise<any> {
  const maxAttempts = options?.maxAttempts || 15;
  const intervalMs = options?.intervalMs || 2000;
  const config = getWebhookConfig();

  if (config.simulationMode) {
    await new Promise((r) => setTimeout(r, 1400));
    return generateSimulationResult(runId);
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    options?.onAttempt?.(attempt);
    const result = await fetchRegistrationResult(runId, options?.customUrl);
    if (result) {
      // Validate that this is a real result object and not an empty placeholder
      const candidate = Array.isArray(result) ? result[0] : result;
      if (candidate && (
        candidate.outcome !== undefined ||
        candidate.registered !== undefined ||
        candidate.not_registered !== undefined ||
        candidate.summary_html !== undefined ||
        candidate.confirmation_id ||
        candidate.confirmation_code ||
        candidate.registration_id ||
        candidate.status === 'registered' ||
        candidate.status === 'confirmed' ||
        candidate.run_id === runId
      )) {
        return candidate;
      }
    }

    if (attempt < maxAttempts) {
      await new Promise((r) => setTimeout(r, intervalMs));
    }
  }

  throw new Error(
    `Registration workflow completed, but the final record was not retrieved within 30 seconds for Run ID: ${runId}. You can retry checking the Data Table or verify the registration-result webhook.`
  );
}

/**
 * Schema-compliant sample response generator for test simulator mode.
 * Conforms to the current workflow with rich event location, dates, capacity, and requirements.
 */
function generateSimulationResponse(profile: {
  name: string;
  cause: string;
  skills: string[];
  city: string;
  workmode: string;
}) {
  const runId = `RUN-SIM-${Date.now().toString(36).toUpperCase()}`;
  return {
    status: 'success',
    run_id: runId,
    student: {
      name: profile.name,
      cause: profile.cause,
      city: profile.city,
      workmode: profile.workmode,
    },
    approve_url: `https://impactvolunteer.sim/webhook-waiting/${runId}`,
    matches: [
      {
        opportunity_id: 'IND-TN-261108-104',
        title: 'Community Health Outreach & Digital Mentorship',
        organization: 'Arogya Community Health Initiative',
        provider: 'Arogya Trust',
        match_category: 'strong',
        relevance_score: 96,
        explanation: `Matches ${profile.name}'s passion in ${profile.cause} and foundational skills.`,
        eligibility_status: 'Eligible · Fast-track onboarding available',
        age_restriction: 'Age 16+ required',
        selectable: true,
        needs_background_consent: true,
        background_check_required: true,
        is_closest_available: false,
        unknown_requirements: [],
        location: profile.city ? `${profile.city}, India` : 'Coimbatore, Tamil Nadu, India',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        country: 'India',
        work_mode: profile.workmode || 'Hybrid',
        start: '2026-11-08',
        end: '2027-02-15',
        event_dates: 'Nov 8, 2026 – Feb 15, 2027',
        schedule: 'Weekends (Saturday mornings)',
        skills: ['Communication', 'Basic Computer Skills', 'Empathy'],
        requirements: ['Age 16+', 'Background check authorization'],
        capacity: '20 volunteers',
        spots_remaining: 6,
        listing_url: 'https://example.org/volunteer/ind-tn-261108-104',
        source: 'Tamil Nadu Civic Impact Exchange',
      },
      {
        opportunity_id: 'IND-KL-261114-315',
        title: 'Community Eco-Restoration & Coastal Reserve Mapping',
        organization: 'Green Canopy Coastal Reserve',
        provider: 'Green Canopy Initiative',
        match_category: 'strong',
        relevance_score: 91,
        explanation: 'Aligned with environmental preservation and field documentation.',
        eligibility_status: 'Waitlist Open · Orientation provided',
        age_restriction: 'Age 18+ preferred',
        selectable: true,
        needs_background_consent: false,
        is_closest_available: false,
        unknown_requirements: ['Physical activity waiver required'],
        location: 'Kochi, Kerala, India',
        city: 'Kochi',
        state: 'Kerala',
        country: 'India',
        work_mode: profile.workmode === 'Remote' ? 'Hybrid' : profile.workmode,
        start: '2026-11-14',
        end: '2026-12-28',
        event_dates: 'Nov 14, 2026 – Dec 28, 2026',
        schedule: 'Flexible weekday afternoons',
        skills: ['Research', 'Field Mapping', 'Communication'],
        requirements: ['Physical activity waiver', 'Sun protection'],
        capacity: '15 volunteers',
        waitlist_info: 'Waitlist active (2 queued)',
        spots_remaining: 0,
        listing_url: 'https://example.org/volunteer/ind-kl-261114-315',
        source: 'South Asia Conservation Exchange',
      },
    ],
  };
}

/**
 * Schema-compliant final registration response generator for simulator mode.
 * Matches current workflow's representative contract: outcome, registered, not_registered, summary_html.
 */
function generateSimulationResult(runId: string) {
  return {
    run_id: runId,
    student: {
      id: 'stu_sim_004',
      name: 'Maya Chen',
    },
    outcome: 'registered',
    status: 'registered',
    registered: [
      {
        opportunity_id: 'IND-TN-261108-104',
        title: 'Community Health Outreach & Digital Mentorship',
        organization: 'Arogya Community Health Initiative',
        status: 'registered_sandbox',
        confirmation_id: `SBX-${Math.floor(100000 + Math.random() * 900000)}`,
        verification_status: 'Verified · Background Check Authorized',
        location: 'Coimbatore, Tamil Nadu, India',
        work_mode: 'Hybrid',
      },
    ],
    not_registered: [
      {
        opportunity_id: 'IND-KL-261114-315',
        title: 'Community Eco-Restoration & Coastal Reserve Mapping',
        organization: 'Green Canopy Coastal Reserve',
        status: 'waitlisted',
        reason: 'Opportunity is full',
        location: 'Kochi, Kerala, India',
      },
      {
        opportunity_id: 'IND-TN-261108-200',
        title: 'Community Health Outreach Volunteer',
        organization: 'Regional Health Trust',
        status: 'already_registered',
        reason: 'Already registered for this opportunity',
        location: 'Coimbatore, Tamil Nadu, India',
      },
      {
        opportunity_id: 'IND-TN-261108-300',
        title: 'Youth Digital Skills Workshop Tutor',
        organization: 'Education First Foundation',
        status: 'rejected_by_student',
        reason: 'The student did not select this opportunity',
        location: 'Coimbatore, Tamil Nadu, India',
      },
    ],
    summary_html:
      '<p><strong>Registration summary generated by the n8n workflow.</strong> All preliminary requirements and background authorizations have been processed in the sandbox environment. Your coordinator will contact you directly with onboarding materials.</p>',
    next_steps:
      'The volunteer coordinator at Arogya Community Health Initiative has been notified and will email orientation details to you within 2 business days.',
    timestamp: new Date().toISOString(),
  };
}
