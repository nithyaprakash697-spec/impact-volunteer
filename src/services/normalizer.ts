import { NormalizedOpportunity, RawOpportunity, MatchCategory } from '../types';

export interface NormalizationResult {
  opportunities: NormalizedOpportunity[];
  relaxedFiltersMessage: string | null;
  run_id: string | null;
  approve_url: string | null;
  student: any | null;
  rawResponse: any;
  error?: string;
}

/**
 * Normalizes raw agent/n8n response into a clean, safe, consistent opportunity list.
 * Extracts run_id, approve_url, student, and handles matches array or wrapper objects.
 */
export function normalizeAgentResponse(raw: any): NormalizationResult {
  if (!raw) {
    return {
      opportunities: [],
      relaxedFiltersMessage: null,
      run_id: null,
      approve_url: null,
      student: null,
      rawResponse: raw,
    };
  }

  let relaxedFiltersMessage: string | null = null;
  let itemsToParse: any[] = [];
  let run_id: string | null = null;
  let approve_url: string | null = null;
  let student: any = null;

  // Helper to extract session metadata from an object
  const extractMetadata = (obj: any) => {
    if (!obj || typeof obj !== 'object') return;
    if (obj.run_id !== undefined && obj.run_id !== null && !run_id) {
      run_id = String(obj.run_id);
    } else if (obj.runId !== undefined && obj.runId !== null && !run_id) {
      run_id = String(obj.runId);
    }

    if (obj.approve_url && typeof obj.approve_url === 'string' && !approve_url) {
      approve_url = obj.approve_url.trim();
    } else if (obj.approval_url && typeof obj.approval_url === 'string' && !approve_url) {
      approve_url = obj.approval_url.trim();
    } else if (obj.approveUrl && typeof obj.approveUrl === 'string' && !approve_url) {
      approve_url = obj.approveUrl.trim();
    }

    if (obj.student && typeof obj.student === 'object' && !student) {
      student = obj.student;
    }

    if (typeof obj.relaxed_filters_message === 'string') {
      relaxedFiltersMessage = obj.relaxed_filters_message;
    } else if (typeof obj.message === 'string' && obj.message.toLowerCase().includes('relax')) {
      relaxedFiltersMessage = obj.message;
    }
  };

  // Inspect top-level object
  if (typeof raw === 'object' && raw !== null) {
    extractMetadata(raw);
  }

  // 1. Direct array of items or n8n wrapped items
  if (Array.isArray(raw)) {
    // Check elements for metadata and opportunities
    itemsToParse = raw.flatMap((item) => {
      if (item && typeof item === 'object') {
        extractMetadata(item);
        if (item.json && typeof item.json === 'object') {
          extractMetadata(item.json);
          const inner = item.json;
          if (Array.isArray(inner.matches)) return inner.matches;
          if (Array.isArray(inner.opportunities)) return inner.opportunities;
          if (Array.isArray(inner.results)) return inner.results;
          if (Array.isArray(inner.rows)) return inner.rows;
          return [inner];
        }
        if (Array.isArray(item.matches)) return item.matches;
        if (Array.isArray(item.opportunities)) return item.opportunities;
        if (Array.isArray(item.results)) return item.results;
      }
      return [item];
    });
  } else if (typeof raw === 'object' && raw !== null) {
    // 2. Object with matches / opportunities array
    if (Array.isArray(raw.matches)) {
      itemsToParse = raw.matches;
    } else if (Array.isArray(raw.opportunities)) {
      itemsToParse = raw.opportunities;
    } else if (Array.isArray(raw.results)) {
      itemsToParse = raw.results;
    } else if (Array.isArray(raw.rows)) {
      itemsToParse = raw.rows;
    } else if (raw.data && typeof raw.data === 'object') {
      if (Array.isArray(raw.data)) {
        itemsToParse = raw.data;
      } else if (Array.isArray(raw.data.matches)) {
        itemsToParse = raw.data.matches;
      } else if (Array.isArray(raw.data.opportunities)) {
        itemsToParse = raw.data.opportunities;
      } else if (Array.isArray(raw.data.results)) {
        itemsToParse = raw.data.results;
      }
    } else {
      // 3. Might be a single opportunity object (must have an id or title)
      if (raw.opportunity_id || raw.id || raw.title) {
        itemsToParse = [raw];
      }
    }
  }

  const normalized: NormalizedOpportunity[] = [];

  for (const item of itemsToParse) {
    if (!item || typeof item !== 'object') continue;

    // Do not silently treat a pure metadata object as an opportunity
    const isPureMetadata =
      !item.opportunity_id &&
      !item.id &&
      !item.title &&
      !item.organization &&
      (item.status || item.message || item.executionId);

    if (isPureMetadata) {
      if (item.relaxed_filters_message) {
        relaxedFiltersMessage = item.relaxed_filters_message;
      }
      continue;
    }

    const normalizedItem = normalizeSingleOpportunity(item);
    if (normalizedItem) {
      normalized.push(normalizedItem);
    }
  }

  return {
    opportunities: normalized,
    relaxedFiltersMessage,
    run_id,
    approve_url,
    student,
    rawResponse: raw,
  };
}

function normalizeSingleOpportunity(raw: RawOpportunity): NormalizedOpportunity | null {
  // Extract actual ID - never invent fake opportunity IDs
  const rawId = raw.opportunity_id ?? raw.id;
  const opportunity_id = rawId !== undefined && rawId !== null ? String(rawId).trim() : '';

  if (!opportunity_id) {
    // An opportunity without an actual ID cannot be referenced in approval workflow
    return null;
  }

  const title = (raw.title || raw.name || raw.opportunity_title || 'Untitled Opportunity').trim();
  const organization = (
    raw.organization ||
    raw.provider ||
    raw.org_name ||
    raw.organization_name ||
    'Community Partner'
  ).trim();

  // Match category normalization
  const rawCategory = String(raw.match_category || raw.category || raw.status || '').toLowerCase().trim();
  let match_category: MatchCategory = 'potential';
  let is_closest_available = false;

  if (rawCategory === 'strong_match' || rawCategory.includes('strong')) {
    match_category = 'strong_match';
  } else if (rawCategory === 'excluded' || raw.status === 'excluded') {
    match_category = 'excluded';
  } else if (rawCategory === 'blocked_unverified' || raw.status === 'blocked_unverified') {
    match_category = 'blocked_unverified';
  } else if (rawCategory.includes('not') || rawCategory.includes('unsuitable') || rawCategory.includes('rejected')) {
    match_category = 'not_recommended';
  } else if (rawCategory.includes('closest') || rawCategory.includes('relaxed') || raw.is_closest_available) {
    match_category = 'closest_available';
    is_closest_available = true;
  } else if (rawCategory.includes('potential') || rawCategory.includes('good') || rawCategory.includes('moderate')) {
    match_category = 'potential';
  } else if (rawCategory) {
    match_category = rawCategory;
  }

  if (raw.is_closest_available === true) {
    is_closest_available = true;
  }

  // Relevance score parsing (supports 0-1, 0-100, or strings like "95%")
  let relevance_score: number | null = null;
  const candidateScore = raw.relevance_score ?? raw.match_score ?? raw.score;
  if (candidateScore !== undefined && candidateScore !== null) {
    const parsed = typeof candidateScore === 'number'
      ? candidateScore
      : parseFloat(String(candidateScore).replace('%', ''));
    if (!isNaN(parsed)) {
      relevance_score = parsed <= 1 && parsed > 0 ? Math.round(parsed * 100) : Math.round(parsed);
    }
  }

  // Selectable rule: if marked not_recommended or excluded, or selectable is explicitly false, it cannot be selected
  let selectable = true;
  if (raw.selectable !== undefined && raw.selectable !== null) {
    selectable = Boolean(raw.selectable);
  } else if (match_category === 'not_recommended' || match_category === 'excluded') {
    selectable = false;
  }

  // Explanation
  const explanation = (raw.explanation || raw.match_reason || raw.why || '').trim();

  // Exclusion reason
  const exclusion_reason = (
    raw.exclusion_reason ||
    raw.excluded_reason ||
    (match_category === 'excluded' ? raw.explanation || raw.match_reason || raw.reason || null : null)
  )?.trim() || null;

  // Eligibility status and age restrictions
  const eligibility_status = (raw.eligibility_status || raw.eligibility || 'Standard Volunteer Eligibility').trim();
  let age_restriction: string | null = null;
  if (raw.age_restriction && typeof raw.age_restriction === 'string') {
    age_restriction = raw.age_restriction.trim();
  } else if (raw.min_age !== undefined && raw.min_age !== null) {
    age_restriction = `Age ${raw.min_age}+`;
  }

  // Unknown / unverified requirements
  let unknown_requirements: string[] = [];
  const rawUnknown = raw.unknown_requirements || raw.unverified_requirements;
  if (Array.isArray(rawUnknown)) {
    unknown_requirements = rawUnknown.map(String).map((s) => s.trim()).filter(Boolean);
  } else if (typeof rawUnknown === 'string' && rawUnknown.trim()) {
    unknown_requirements = [rawUnknown.trim()];
  }

  // Required confirmations
  let required_confirmations: string[] = [];
  const rawConfirmations = raw.required_confirmations;
  if (Array.isArray(rawConfirmations)) {
    required_confirmations = rawConfirmations.map(String).map((s) => s.trim()).filter(Boolean);
  } else if (typeof rawConfirmations === 'string' && rawConfirmations.trim()) {
    required_confirmations = [rawConfirmations.trim()];
  }

  const needs_background_consent = Boolean(
    raw.needs_background_consent ?? raw.background_check_required
  );

  // Rich Location extraction: city, state, country, event_location
  const city = raw.city ? String(raw.city).trim() : null;
  const state = raw.state ? String(raw.state).trim() : null;
  const country = raw.country ? String(raw.country).trim() : null;
  const event_location = raw.event_location ? String(raw.event_location).trim() : null;

  let location: string | null = null;
  if (raw.location && typeof raw.location === 'string' && raw.location.trim()) {
    location = raw.location.trim();
  } else if (event_location) {
    location = event_location;
  } else {
    const parts = [city, state, country].filter(Boolean);
    location = parts.length > 0 ? parts.join(', ') : null;
  }

  const work_mode = raw.work_mode || raw.workmode ? String(raw.work_mode || raw.workmode).trim() : null;

  // Dates & Schedule
  const start = raw.start || raw.start_date || raw.startDate ? String(raw.start || raw.start_date || raw.startDate).trim() : null;
  const end = raw.end || raw.end_date || raw.endDate ? String(raw.end || raw.end_date || raw.endDate).trim() : null;
  const event_dates = raw.event_dates || raw.dates || (start && end ? `${start} – ${end}` : start || end || null);
  const schedule = raw.schedule ? String(raw.schedule).trim() : null;

  // Validate listing_url
  let listing_url: string | null = null;
  const candidateUrl = raw.listing_url || raw.url || raw.link;
  if (candidateUrl && typeof candidateUrl === 'string') {
    try {
      new URL(candidateUrl);
      listing_url = candidateUrl;
    } catch {
      listing_url = null;
    }
  }

  const source = (raw.source || 'Verified Partner Network').trim();

  // Skills & Requirements
  let skills: string[] = [];
  const rawSkills = raw.skills || raw.skills_required;
  if (Array.isArray(rawSkills)) {
    skills = rawSkills.map(String).map((s) => s.trim()).filter(Boolean);
  } else if (typeof rawSkills === 'string' && rawSkills.trim()) {
    skills = rawSkills.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
  }

  let requirements: string[] = [];
  if (Array.isArray(raw.requirements)) {
    requirements = raw.requirements.map(String).map((s) => s.trim()).filter(Boolean);
  } else if (typeof raw.requirements === 'string' && raw.requirements.trim()) {
    requirements = [raw.requirements.trim()];
  }

  // Capacity & Waitlist
  const rawCapacity = raw.capacity !== undefined && raw.capacity !== null ? raw.capacity : raw.max_volunteers;
  const capacity = rawCapacity !== undefined && rawCapacity !== null ? String(rawCapacity).trim() : null;
  let waitlist_info: string | null = null;
  if (raw.waitlist_info && typeof raw.waitlist_info === 'string') {
    waitlist_info = raw.waitlist_info.trim();
  } else if (raw.waitlist_status && typeof raw.waitlist_status === 'string') {
    waitlist_info = raw.waitlist_status.trim();
  } else if (raw.waitlist === true || String(raw.waitlist).toLowerCase() === 'true') {
    waitlist_info = 'Waitlist available';
  }

  const spots_remaining = raw.spots_remaining !== undefined && raw.spots_remaining !== null
    ? (typeof raw.spots_remaining === 'number' ? raw.spots_remaining : parseInt(String(raw.spots_remaining), 10) || null)
    : null;

  // Existing registration / duplicate flag
  const existing_registration_status = raw.already_registered
    ? 'already_registered'
    : raw.duplicate_status || raw.registration_status || null;

  return {
    opportunity_id,
    title,
    organization,
    match_category,
    relevance_score,
    explanation,
    eligibility_status,
    age_restriction,
    selectable,
    needs_background_consent,
    is_closest_available,
    unknown_requirements,
    required_confirmations,
    exclusion_reason,
    location,
    city,
    state,
    country,
    work_mode,
    start,
    end,
    event_dates,
    schedule,
    listing_url,
    source,
    skills,
    requirements,
    capacity,
    waitlist_info,
    spots_remaining,
    existing_registration_status,
    raw,
  };
}

/**
 * Normalizes the final registration output produced by 'Build Final Response' / n8n Data Table.
 * Supports current workflow schema with: run_id, student { id, name }, outcome, registered, not_registered, summary_html.
 */
export function normalizeFinalRegistrationResult(
  raw: any,
  knownOpportunities: NormalizedOpportunity[] = [],
  defaultStudent?: any
): import('../types').FinalRegistrationResult | null {
  if (!raw) return null;

  // Unpack n8n array format [{ json: { ... } }] or [{ ... }]
  let data: any = raw;
  if (Array.isArray(raw)) {
    if (raw.length === 0) return null;
    const first = raw[0];
    data = first && typeof first === 'object' && first.json ? first.json : first;
  } else if (typeof raw === 'object' && raw.data) {
    data = Array.isArray(raw.data) ? raw.data[0] : raw.data;
  }

  if (!data || typeof data !== 'object') return null;

  // Extract run_id
  const run_id = String(data.run_id || data.runId || defaultStudent?.run_id || '').trim();

  // Extract student details and id
  let student_name = 'Student Volunteer';
  let student_id: string | undefined = undefined;
  let student_details: any = null;

  if (data.student && typeof data.student === 'object') {
    student_details = data.student;
    student_name = data.student.name || data.student.student_name || student_name;
    if (data.student.id || data.student.student_id) {
      student_id = String(data.student.id || data.student.student_id);
    }
  } else if (typeof data.student === 'string') {
    student_name = data.student;
  } else if (data.student_name) {
    student_name = String(data.student_name);
  } else if (defaultStudent?.name) {
    student_name = defaultStudent.name;
    student_details = defaultStudent;
  }

  // Parse registered opportunities
  // Only treat items as registered if they are actually in data.registered and indicate registration
  let rawRegistered = data.registered || data.registered_opportunities;
  if (!rawRegistered && data.registered_id) {
    rawRegistered = [data];
  }

  const registeredItems: import('../types').RegisteredItem[] = [];
  const registeredIds = new Set<string>();

  // Extract confirmation ID and verification status
  const confirmation_id = String(
    data.confirmation_id ||
    data.confirmation_code ||
    data.registration_id ||
    data.approval_id ||
    ''
  ).trim() || undefined;

  const verification_status = String(
    data.verification_status ||
    (data.verified ? 'Verified' : '') ||
    data.status_description ||
    'Verified · Background Check Authorized'
  ).trim();

  if (Array.isArray(rawRegistered)) {
    for (const item of rawRegistered) {
      if (!item) continue;
      const oppId = String(
        typeof item === 'object'
          ? item.opportunity_id || item.id || item.registered_id || ''
          : item
      ).trim();

      if (!oppId) continue;
      registeredIds.add(oppId);

      const matchedKnown = knownOpportunities.find((k) => k.opportunity_id === oppId);
      const title = (
        (typeof item === 'object' && (item.title || item.name)) ||
        matchedKnown?.title ||
        'Approved Community Opportunity'
      ).trim();

      const organization = (
        (typeof item === 'object' && (item.organization || item.org_name || item.provider)) ||
        matchedKnown?.organization ||
        'Community Partner'
      ).trim();

      const itemStatus = String((typeof item === 'object' && item.status) || 'registered_sandbox').trim();
      const itemConfirmationId = String((typeof item === 'object' && item.confirmation_id) || confirmation_id || '').trim() || undefined;

      registeredItems.push({
        opportunity_id: oppId,
        title,
        organization,
        status: itemStatus,
        confirmation_id: itemConfirmationId,
        verification_status: (typeof item === 'object' && item.verification_status) || verification_status,
        location: (typeof item === 'object' && item.location) || matchedKnown?.location || null,
        work_mode: (typeof item === 'object' && (item.work_mode || item.workmode)) || matchedKnown?.work_mode || null,
        event_dates: (typeof item === 'object' && (item.event_dates || item.dates)) || matchedKnown?.event_dates || null,
        schedule: (typeof item === 'object' && item.schedule) || matchedKnown?.schedule || null,
        skills: typeof item === 'object' && Array.isArray(item.skills) ? item.skills : matchedKnown?.skills,
        raw: typeof item === 'object' ? item : { opportunity_id: oppId },
      });
    }
  } else if (rawRegistered && typeof rawRegistered === 'object' && !Array.isArray(rawRegistered)) {
    const oppId = String(rawRegistered.opportunity_id || rawRegistered.id || '').trim();
    if (oppId) {
      registeredIds.add(oppId);
      const matchedKnown = knownOpportunities.find((k) => k.opportunity_id === oppId);
      registeredItems.push({
        opportunity_id: oppId,
        title: rawRegistered.title || matchedKnown?.title || 'Approved Community Opportunity',
        organization: rawRegistered.organization || matchedKnown?.organization || 'Community Partner',
        status: rawRegistered.status || 'registered_sandbox',
        confirmation_id: rawRegistered.confirmation_id || confirmation_id,
        verification_status: rawRegistered.verification_status || verification_status,
        location: rawRegistered.location || matchedKnown?.location || null,
        work_mode: rawRegistered.work_mode || rawRegistered.workmode || matchedKnown?.work_mode || null,
        event_dates: rawRegistered.event_dates || rawRegistered.dates || matchedKnown?.event_dates || null,
        schedule: rawRegistered.schedule || matchedKnown?.schedule || null,
        skills: Array.isArray(rawRegistered.skills) ? rawRegistered.skills : matchedKnown?.skills,
        raw: rawRegistered,
      });
    }
  }

  // Extract outcome (current workflow) and legacy status
  // NEVER default to 'registered' if registeredItems is empty!
  const rawOutcome = String(
    data.outcome ||
    data.registration_outcome ||
    data.status ||
    data.registration_status ||
    ''
  ).toLowerCase().trim();

  let outcome = rawOutcome;
  if (!outcome) {
    if (registeredItems.length > 0) {
      outcome = 'registered';
    } else {
      outcome = 'declined';
    }
  }

  const status = String(
    data.status ||
    data.registration_status ||
    outcome
  ).toLowerCase().trim();

  // Extract summary_html generated by the n8n workflow
  const summary_html = typeof data.summary_html === 'string'
    ? data.summary_html.trim()
    : (typeof data.summary === 'string' ? data.summary.trim() : null);

  // Parse not_registered opportunities
  // Categories from current n8n workflow: waitlisted, already_registered, rejected_by_student, excluded, blocked_unverified, consent_required, etc.
  const notRegisteredItems: import('../types').NotRegisteredItem[] = [];
  const notRegisteredIds = new Set<string>();
  const rawNotRegistered = data.not_registered || data.unregistered || data.other_matches;

  if (Array.isArray(rawNotRegistered) && rawNotRegistered.length > 0) {
    for (const item of rawNotRegistered) {
      if (!item) continue;
      const oppId = String(
        typeof item === 'object'
          ? item.opportunity_id || item.id || ''
          : item
      ).trim();

      if (!oppId) continue;
      notRegisteredIds.add(oppId);

      const matchedKnown = knownOpportunities.find((k) => k.opportunity_id === oppId);
      let itemStatus = String((typeof item === 'object' && item.status) || 'not_registered').trim();
      if (typeof item === 'object') {
        if (item.already_registered === true || itemStatus.includes('already') || itemStatus.includes('duplicate')) {
          itemStatus = 'already_registered';
        } else if (itemStatus.includes('waitlist')) {
          itemStatus = 'waitlisted';
        } else if (itemStatus.includes('exclude')) {
          itemStatus = 'excluded';
        } else if (itemStatus.includes('unverified') || itemStatus.includes('block')) {
          itemStatus = 'blocked_unverified';
        } else if (itemStatus.includes('reject')) {
          itemStatus = 'rejected_by_student';
        }
      }

      const itemReason = (typeof item === 'object' && (item.reason || item.message || item.details)) || undefined;
      const itemConfirmationId = (typeof item === 'object' && (item.confirmation_id || item.previous_confirmation_id)) || undefined;
      const previousConfirmationId = (typeof item === 'object' && (item.previous_confirmation_id || item.confirmation_id)) || undefined;

      notRegisteredItems.push({
        opportunity_id: oppId,
        title: (typeof item === 'object' && item.title) || matchedKnown?.title || 'Community Opportunity',
        organization: (typeof item === 'object' && (item.organization || item.provider)) || matchedKnown?.organization || 'Partner Organization',
        status: itemStatus,
        reason: itemReason,
        location: (typeof item === 'object' && item.location) || matchedKnown?.location || null,
        confirmation_id: itemConfirmationId,
        previous_confirmation_id: previousConfirmationId,
        work_mode: (typeof item === 'object' && (item.work_mode || item.workmode)) || matchedKnown?.work_mode || null,
        event_dates: (typeof item === 'object' && (item.event_dates || item.dates)) || matchedKnown?.event_dates || null,
        schedule: (typeof item === 'object' && item.schedule) || matchedKnown?.schedule || null,
        skills: typeof item === 'object' && Array.isArray(item.skills) ? item.skills : matchedKnown?.skills,
        raw: typeof item === 'object' ? item : { opportunity_id: oppId },
      });
    }
  } else {
    // If not_registered array was not explicitly returned by the workflow, populate from known candidate opportunities that were not registered
    for (const known of knownOpportunities) {
      if (!registeredIds.has(known.opportunity_id)) {
        notRegisteredItems.push({
          opportunity_id: known.opportunity_id,
          title: known.title,
          organization: known.organization,
          status: 'rejected_by_student',
          reason: 'The student did not select this opportunity for placement',
          location: known.location,
          work_mode: known.work_mode,
          event_dates: known.event_dates,
          schedule: known.schedule,
          skills: known.skills,
          raw: known.raw,
        });
      }
    }
  }

  const next_steps = data.next_steps || data.instructions || 'The organization has received your confirmed placement and will contact you directly.';

  return {
    run_id,
    outcome,
    status,
    student_name,
    student_id,
    student_details,
    confirmation_id,
    verification_status,
    registered: registeredItems,
    not_registered: notRegisteredItems,
    summary_html,
    next_steps,
    timestamp: data.timestamp || new Date().toISOString(),
    raw: data,
  };
}

