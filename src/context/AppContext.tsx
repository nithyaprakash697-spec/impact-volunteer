import React, { createContext, useContext, useState } from 'react';
import {
  StudentProfile,
  NormalizedOpportunity,
  ApprovalPayload,
  ApprovalResponse,
  FinalRegistrationResult,
} from '../types';
import {
  normalizeAgentResponse,
  normalizeFinalRegistrationResult,
} from '../services/normalizer';
import {
  submitStudentProfile as apiSubmitStudentProfile,
  submitOpportunityApproval as apiSubmitApproval,
  pollRegistrationResult as apiPollRegistrationResult,
} from '../services/webhookService';

export type AppView =
  | 'landing'
  | 'profile'
  | 'matching'
  | 'results'
  | 'approval'
  | 'approval_success';

interface AppContextType {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  profile: StudentProfile;
  setProfile: React.Dispatch<React.SetStateAction<StudentProfile>>;
  updateProfile: (fields: Partial<StudentProfile>) => void;

  // Matching session state
  runId: string | null;
  approveUrl: string | null;
  sessionResultUrl: string | null;
  studentData: any | null;
  isSubmittingProfile: boolean;
  matchingError: string | null;
  rawResponse: any;
  opportunities: NormalizedOpportunity[];
  relaxedFiltersMessage: string | null;

  // Selection
  selectedOpportunityId: string | null;
  selectedOpportunity: NormalizedOpportunity | null;
  selectOpportunity: (id: string) => void;

  // Approval state
  isSubmittingApproval: boolean;
  approvalError: string | null;
  isApprovalExpired: boolean;
  isApprovalMissingUrl: boolean;
  approvalResponse: ApprovalResponse | null;

  // Final Registration Result state from n8n Data Table / Build Final Response
  finalResult: FinalRegistrationResult | null;
  isFetchingFinalResult: boolean;
  finalResultError: string | null;
  finalResultPollAttempt: number;

  // Actions
  startMatchingFlow: () => void;
  submitProfileForm: () => Promise<void>;
  retryMatching: () => Promise<void>;
  proceedToApproval: () => void;
  backToResults: () => void;
  submitApprovalAction: (
    backgroundConsent: boolean,
    requirementsAck: boolean
  ) => Promise<void>;
  retryFetchFinalResult: () => Promise<void>;
  resetToStart: () => void;

  // Webhook settings modal
  isWebhookModalOpen: boolean;
  setIsWebhookModalOpen: (open: boolean) => void;
}

const defaultProfile: StudentProfile = {
  name: '',
  cause: 'Environment',
  skills: ['Communication', 'Basic Computer Skills'],
  availability: 'Weekends',
  age: 17,
  background_consent: false,
  city: 'Coimbatore, India',
  workmode: 'Remote',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [profile, setProfile] = useState<StudentProfile>(defaultProfile);

  // Dynamic session execution variables returned by n8n
  const [runId, setRunId] = useState<string | null>(null);
  const [approveUrl, setApproveUrl] = useState<string | null>(null);
  const [sessionResultUrl, setSessionResultUrl] = useState<string | null>(null);
  const [studentData, setStudentData] = useState<any | null>(null);

  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [matchingError, setMatchingError] = useState<string | null>(null);
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [opportunities, setOpportunities] = useState<NormalizedOpportunity[]>([]);
  const [relaxedFiltersMessage, setRelaxedFiltersMessage] = useState<string | null>(null);

  // Single-selection rule: exactly ONE opportunity ID
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string | null>(null);

  // Approval execution state
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
  const [approvalError, setApprovalError] = useState<string | null>(null);
  const [isApprovalExpired, setIsApprovalExpired] = useState(false);
  const [isApprovalMissingUrl, setIsApprovalMissingUrl] = useState(false);
  const [approvalResponse, setApprovalResponse] = useState<ApprovalResponse | null>(null);

  // Final Registration state
  const [finalResult, setFinalResult] = useState<FinalRegistrationResult | null>(null);
  const [isFetchingFinalResult, setIsFetchingFinalResult] = useState(false);
  const [finalResultError, setFinalResultError] = useState<string | null>(null);
  const [finalResultPollAttempt, setFinalResultPollAttempt] = useState(0);

  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);

  const updateProfile = (fields: Partial<StudentProfile>) => {
    setProfile((prev) => ({ ...prev, ...fields }));
  };

  const selectOpportunity = (id: string) => {
    const opp = opportunities.find((o) => o.opportunity_id === id);
    if (!opp) return;
    if (!opp.selectable || opp.match_category === 'not_recommended') {
      return;
    }
    // Single selection: replaces any previous selection
    setSelectedOpportunityId(id);
  };

  const selectedOpportunity = React.useMemo(() => {
    if (!selectedOpportunityId) return null;
    return opportunities.find((o) => o.opportunity_id === selectedOpportunityId) || null;
  }, [selectedOpportunityId, opportunities]);

  // Clears stale session and starts fresh matching intake
  const startMatchingFlow = () => {
    setRunId(null);
    setApproveUrl(null);
    setSessionResultUrl(null);
    setStudentData(null);
    setSelectedOpportunityId(null);
    setApprovalResponse(null);
    setFinalResult(null);
    setIsFetchingFinalResult(false);
    setFinalResultError(null);
    setFinalResultPollAttempt(0);
    setApprovalError(null);
    setIsApprovalExpired(false);
    setIsApprovalMissingUrl(false);
    setMatchingError(null);
    setCurrentView('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submitProfileForm = async () => {
    if (isSubmittingProfile) return;

    // Reset previous session state to avoid stale approvals
    setMatchingError(null);
    setRunId(null);
    setApproveUrl(null);
    setSessionResultUrl(null);
    setStudentData(null);
    setSelectedOpportunityId(null);
    setApprovalResponse(null);
    setFinalResult(null);
    setIsFetchingFinalResult(false);
    setFinalResultError(null);
    setFinalResultPollAttempt(0);
    setApprovalError(null);
    setIsApprovalExpired(false);
    setIsApprovalMissingUrl(false);

    setIsSubmittingProfile(true);
    setCurrentView('matching');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const raw = await apiSubmitStudentProfile(profile);
      setRawResponse(raw);

      const normalized = normalizeAgentResponse(raw);
      setOpportunities(normalized.opportunities);
      setRelaxedFiltersMessage(normalized.relaxedFiltersMessage);

      // Save the dynamically returned run_id and approve_url for this session
      setRunId(normalized.run_id);
      setApproveUrl(normalized.approve_url);
      setStudentData(normalized.student);

      // Extract result_url if returned in initial matching response
      const candidateResultUrl = raw?.result_url || raw?.status_url || raw?.registration_result_url;
      if (candidateResultUrl && typeof candidateResultUrl === 'string') {
        setSessionResultUrl(candidateResultUrl.trim());
      }

      // Student must intentionally select ONE opportunity
      setSelectedOpportunityId(null);
      setCurrentView('results');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Profile matching error:', err);
      setMatchingError(err.message || 'Failed to connect to matching agent.');
      setCurrentView('results');
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  const retryMatching = async () => {
    await submitProfileForm();
  };

  const proceedToApproval = () => {
    if (!selectedOpportunityId) return;
    setApprovalError(null);
    setIsApprovalExpired(false);
    setIsApprovalMissingUrl(false);
    setFinalResultError(null);
    setCurrentView('approval');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const backToResults = () => {
    setCurrentView('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Helper to fetch/poll final registration result from the n8n Data Table
  const fetchFinalRegistrationData = async (targetRunId: string) => {
    setIsFetchingFinalResult(true);
    setFinalResultError(null);
    setFinalResultPollAttempt(1);

    try {
      const rawData = await apiPollRegistrationResult(targetRunId, {
        customUrl: sessionResultUrl || undefined,
        onAttempt: (attempt) => setFinalResultPollAttempt(attempt),
      });

      const normalized = normalizeFinalRegistrationResult(rawData, opportunities, studentData);
      if (normalized) {
        setFinalResult(normalized);
      } else {
        throw new Error('Retrieved registration record was empty or unparseable.');
      }
    } catch (err: any) {
      console.error('Error retrieving registration record:', err);
      setFinalResultError(err.message || 'Failed to retrieve final registration from Data Table.');
    } finally {
      setIsFetchingFinalResult(false);
    }
  };

  const submitApprovalAction = async (
    backgroundConsent: boolean,
    requirementsAck: boolean
  ) => {
    if (!selectedOpportunityId) return;
    // Prevent accidental duplicate submission
    if (isSubmittingApproval || isFetchingFinalResult) return;

    setIsSubmittingApproval(true);
    setApprovalError(null);
    setIsApprovalExpired(false);
    setIsApprovalMissingUrl(false);
    setFinalResultError(null);
    setFinalResult(null);

    // Verify presence of dynamic approve_url
    if (!approveUrl) {
      setIsSubmittingApproval(false);
      setIsApprovalMissingUrl(true);
      setApprovalError(
        'Missing approval URL for this session. The matching agent response did not provide an approve_url, or the session was interrupted. Please start a fresh matching session.'
      );
      return;
    }

    const payload: ApprovalPayload = {
      selected_ids: [selectedOpportunityId],
      background_check_consent: backgroundConsent,
      unverified_requirements_ack: requirementsAck,
    };

    try {
      // 1. POST to the dynamic approve_url to resume the Wait node
      const response = await apiSubmitApproval(approveUrl, payload);
      setApprovalResponse(response);

      // Transition to approval_success view immediately so user sees the progress
      setCurrentView('approval_success');
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // 2. Check if the response already contained the completed final result
      if (response.has_final_result && response.raw) {
        const directResult = normalizeFinalRegistrationResult(response.raw, opportunities, studentData);
        if (directResult) {
          setFinalResult(directResult);
          return;
        }
      }

      // 3. If response was an intermediate resumption (e.g. 'Workflow resumed')
      // and final result was not synchronously returned in the HTTP response:
      const { getWebhookConfig } = await import('../services/webhookService');
      const config = getWebhookConfig();
      if (!config.registrationResultUrl && !config.simulationMode) {
        // Do not poll an unconfigured or guessed endpoint
        setFinalResultError(
          'Workflow resumed successfully, but the Wait node returned an intermediate acknowledgement ("Workflow resumed") rather than the final registration payload. In this n8n workflow, if final results are not delivered synchronously, please configure a valid registration-result webhook endpoint in Webhook Settings.'
        );
        return;
      }

      const effectiveRunId = runId || response.raw?.run_id || response.approval_id;
      if (effectiveRunId) {
        await fetchFinalRegistrationData(effectiveRunId);
      } else {
        setFinalResultError('No Run ID associated with this execution to query the Data Table.');
      }
    } catch (err: any) {
      console.error('Approval submission error:', err);
      setApprovalError(err.message || 'Failed to submit approval.');
      if (err.isExpired) {
        setIsApprovalExpired(true);
      }
      if (err.isMissingUrl) {
        setIsApprovalMissingUrl(true);
      }
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  const retryFetchFinalResult = async () => {
    const effectiveRunId = runId || approvalResponse?.raw?.run_id;
    if (effectiveRunId) {
      await fetchFinalRegistrationData(effectiveRunId);
    }
  };

  const resetToStart = () => {
    setRunId(null);
    setApproveUrl(null);
    setSessionResultUrl(null);
    setStudentData(null);
    setSelectedOpportunityId(null);
    setApprovalResponse(null);
    setFinalResult(null);
    setIsFetchingFinalResult(false);
    setFinalResultError(null);
    setFinalResultPollAttempt(0);
    setApprovalError(null);
    setIsApprovalExpired(false);
    setIsApprovalMissingUrl(false);
    setMatchingError(null);
    setCurrentView('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AppContext.Provider
      value={{
        currentView,
        setCurrentView,
        profile,
        setProfile,
        updateProfile,
        runId,
        approveUrl,
        sessionResultUrl,
        studentData,
        isSubmittingProfile,
        matchingError,
        rawResponse,
        opportunities,
        relaxedFiltersMessage,
        selectedOpportunityId,
        selectedOpportunity,
        selectOpportunity,
        isSubmittingApproval,
        approvalError,
        isApprovalExpired,
        isApprovalMissingUrl,
        approvalResponse,
        finalResult,
        isFetchingFinalResult,
        finalResultError,
        finalResultPollAttempt,
        startMatchingFlow,
        submitProfileForm,
        retryMatching,
        proceedToApproval,
        backToResults,
        submitApprovalAction,
        retryFetchFinalResult,
        resetToStart,
        isWebhookModalOpen,
        setIsWebhookModalOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
