export type Cause =
  | 'Environment'
  | 'Education'
  | 'Healthcare'
  | 'Animal Welfare'
  | 'Community Development'
  | 'Technology'
  | 'Other';

export type Availability = 'Weekdays' | 'Weekends' | 'Evenings' | 'Flexible';

export type WorkMode = 'Remote' | 'Hybrid' | 'In-person' | 'Flexible';

export type MatchCategory =
  | 'strong_match'
  | 'strong'
  | 'potential'
  | 'potential_match'
  | 'closest_available'
  | 'excluded'
  | 'blocked_unverified'
  | 'not_recommended'
  | string;

export type RegistrationStatus =
  | 'registered_sandbox'
  | 'registered'
  | 'waitlisted'
  | 'already_registered'
  | 'rejected_by_student'
  | 'excluded'
  | 'blocked_unverified'
  | 'declined'
  | string;

export interface StudentProfile {
  name: string;
  cause: Cause | string;
  skills: string[];
  availability: Availability | string;
  age: number | null;
  background_consent: boolean;
  city: string;
  workmode: WorkMode | string;
}

export interface RawOpportunity {
  opportunity_id?: string | number;
  id?: string | number;
  title?: string;
  name?: string;
  opportunity_title?: string;
  organization?: string;
  org_name?: string;
  provider?: string;
  organization_name?: string;
  match_category?: string;
  category?: string;
  relevance_score?: number | string;
  score?: number | string;
  match_score?: number | string;
  explanation?: string;
  match_reason?: string;
  why?: string;
  eligibility_status?: string;
  eligibility?: string;
  age_restriction?: string | null;
  min_age?: number | string | null;
  selectable?: boolean;
  needs_background_consent?: boolean;
  background_check_required?: boolean;
  is_closest_available?: boolean;
  unknown_requirements?: string[] | string;
  unverified_requirements?: string[] | string;
  required_confirmations?: string[] | string;
  exclusion_reason?: string | null;
  excluded_reason?: string | null;
  location?: string | null;
  event_location?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  work_mode?: string | null;
  workmode?: string | null;
  start?: string | null;
  start_date?: string | null;
  end?: string | null;
  end_date?: string | null;
  event_dates?: string | null;
  dates?: string | null;
  schedule?: string | null;
  listing_url?: string | null;
  url?: string | null;
  link?: string | null;
  source?: string | null;
  skills?: string[] | string;
  skills_required?: string[] | string;
  requirements?: string[] | string;
  capacity?: number | string | null;
  max_volunteers?: number | string | null;
  waitlist_info?: string | null;
  waitlist_status?: string | null;
  waitlist?: boolean | string | null;
  spots_remaining?: number | string | null;
  status?: string | null;
  registration_status?: string | null;
  already_registered?: boolean | null;
  duplicate_status?: string | null;
  [key: string]: any;
}

export interface NormalizedOpportunity {
  opportunity_id: string;
  title: string;
  organization: string;
  match_category: MatchCategory;
  relevance_score: number | null;
  explanation: string;
  eligibility_status: string;
  age_restriction: string | null;
  selectable: boolean;
  needs_background_consent: boolean;
  is_closest_available: boolean;
  unknown_requirements: string[];
  required_confirmations: string[];
  exclusion_reason: string | null;
  location: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  work_mode: string | null;
  start: string | null;
  end: string | null;
  event_dates: string | null;
  schedule: string | null;
  listing_url: string | null;
  source: string;
  skills: string[];
  requirements: string[];
  capacity: string | null;
  waitlist_info: string | null;
  spots_remaining: number | string | null;
  existing_registration_status: string | null;
  raw: any;
}

export interface AgentMatchingResponse {
  run_id?: string | number;
  student?: any;
  matches?: RawOpportunity[];
  approve_url?: string;
  approval_url?: string;
  opportunities?: RawOpportunity[];
  results?: RawOpportunity[];
  rows?: RawOpportunity[];
  data?: RawOpportunity[] | { opportunities?: RawOpportunity[]; results?: RawOpportunity[]; matches?: RawOpportunity[] };
  relaxed_filters_message?: string;
  message?: string;
  status?: string;
  [key: string]: any;
}

export interface ApprovalPayload {
  selected_ids: string[];
  background_check_consent: boolean;
  unverified_requirements_ack: boolean;
}

export interface RegisteredItem {
  opportunity_id: string;
  title: string;
  organization: string;
  status: string; // e.g. "registered_sandbox", "registered"
  confirmation_id?: string;
  verification_status?: string;
  location?: string | null;
  work_mode?: string | null;
  skills?: string[];
  event_dates?: string | null;
  schedule?: string | null;
  reason?: string;
  [key: string]: any;
}

export interface NotRegisteredItem {
  opportunity_id: string;
  title: string;
  organization?: string;
  status: string; // e.g. "waitlisted", "already_registered", "rejected_by_student", "excluded", "blocked_unverified", "consent_required"
  reason?: string;
  location?: string | null;
  confirmation_id?: string;
  previous_confirmation_id?: string;
  work_mode?: string | null;
  skills?: string[];
  event_dates?: string | null;
  schedule?: string | null;
  [key: string]: any;
}

export interface FinalRegistrationResult {
  run_id: string;
  outcome: string; // e.g. "registered", "declined", "waitlisted", "partial", "already_registered"
  status: string; // backward compat with raw status
  student_name: string;
  student_id?: string;
  student_details?: any;
  confirmation_id?: string;
  verification_status?: string;
  registered: RegisteredItem[];
  not_registered: NotRegisteredItem[];
  summary_html?: string | null;
  next_steps?: string;
  timestamp?: string;
  raw?: any;
}

export interface ApprovalResponse {
  status?: string;
  success?: boolean;
  message?: string;
  workflow_resumed?: boolean;
  has_final_result?: boolean;
  is_intermediate_resumption?: boolean;
  approval_id?: string;
  registration_id?: string;
  confirmation_code?: string;
  next_steps?: string;
  timestamp?: string;
  raw?: any;
  missing_integration_notice?: string;
  is_expired?: boolean;
  final_result?: FinalRegistrationResult;
}

export interface WebhookConfig {
  profileMatchUrl: string;
  registrationResultUrl: string;
  useProxy: boolean;
  isCustomProfileUrl: boolean;
  isCustomResultUrl: boolean;
  simulationMode: boolean;
}
