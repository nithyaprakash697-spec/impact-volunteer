import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ArrowLeft,
  Building,
  MapPin,
  Laptop,
  Calendar,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Clock,
  Info,
  Code,
  User,
  Hash,
  SlidersHorizontal,
  Users,
  FileText,
  Ban,
  Check,
  Copy,
  ShieldAlert,
} from 'lucide-react';
import { getWebhookConfig } from '../services/webhookService';

/**
 * Sanitizes untrusted workflow summary HTML to permit only safe formatting tags
 * while strictly disarming scripts, styles, objects, iframes, and active event handlers.
 */
function sanitizeSummaryHtml(rawHtml: string): string {
  if (!rawHtml) return '';
  let clean = rawHtml.replace(/<(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\/\1>/gi, '');
  clean = clean.replace(/<\/?(script|style|iframe|object|embed)[^>]*>/gi, '');
  clean = clean.replace(/\son\w+\s*=\s*(['"]).*?\1/gi, '');
  clean = clean.replace(/\son\w+\s*=\s*[^>\s]+/gi, '');
  clean = clean.replace(/(href|src)\s*=\s*(['"])\s*(javascript|data):.*?\2/gi, '$1="#"');
  return clean;
}

export const ApprovalView: React.FC = () => {
  const {
    selectedOpportunity,
    selectedOpportunityId,
    approveUrl,
    runId,
    backToResults,
    submitApprovalAction,
    retryFetchFinalResult,
    isSubmittingApproval,
    approvalError,
    isApprovalExpired,
    isApprovalMissingUrl,
    approvalResponse,
    finalResult,
    isFetchingFinalResult,
    finalResultError,
    finalResultPollAttempt,
    currentView,
    resetToStart,
    startMatchingFlow,
    setIsWebhookModalOpen,
  } = useApp();

  // Separate UNCHECKED checkboxes - never auto-checked
  const [backgroundConsent, setBackgroundConsent] = useState(false);
  const [requirementsAck, setRequirementsAck] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);

  const config = getWebhookConfig();

  // Safety fallback if accessed without a selection
  if (!selectedOpportunity || !selectedOpportunityId) {
    return (
      <div className="w-full min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <p className="text-sm text-[#A7B7A9]">
          No opportunity selected. Please select an opportunity from the results first.
        </p>
        <button
          onClick={backToResults}
          className="px-5 py-2.5 bg-[#C6FF5E] text-[#14251B] font-semibold text-xs rounded-xl cursor-pointer"
        >
          Back to Opportunities
        </button>
      </div>
    );
  }

  const hasUnknownRequirements = selectedOpportunity.unknown_requirements.length > 0;

  // -------------------------------------------------------------
  // REGISTRATION RESULTS / SUCCESS VIEW
  // -------------------------------------------------------------
  if (currentView === 'approval_success') {
    // 1. LOADING STATE: Polling the n8n Data Table for the final registration record
    if (isFetchingFinalResult) {
      return (
        <div className="w-full min-h-[85vh] py-16 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto flex flex-col items-center justify-center text-center space-y-8 animate-fade-in">
          <div className="relative flex items-center justify-center">
            <span className="w-20 h-20 rounded-full bg-[#C6FF5E]/10 animate-ping absolute" />
            <div className="w-16 h-16 rounded-2xl bg-[#10251D] border-2 border-[#C6FF5E] flex items-center justify-center shadow-xl glow-accent">
              <Sparkles className="w-8 h-8 text-[#C6FF5E] animate-pulse" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10251D] border border-[rgba(198,255,94,0.2)] text-xs text-[#C6FF5E] font-mono">
              <Clock className="w-3.5 h-3.5" />
              <span>Querying n8n Data Table · Attempt {finalResultPollAttempt || 1} of 15</span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#F5F4EC]">
              Finalizing Registration & Verification...
            </h1>
            <p className="text-xs sm:text-sm text-[#A7B7A9] max-w-md leading-relaxed">
              The approval request resumed your n8n workflow. The workflow is saving the verified registration in the Data Table.
            </p>
          </div>

          <div className="w-full bg-[#10251D] border border-[rgba(198,255,94,0.18)] rounded-2xl p-5 text-left text-xs space-y-2.5">
            <div className="flex items-center justify-between text-[#A7B7A9]">
              <span>Workflow Run ID:</span>
              <span className="font-mono text-[#F5F4EC] font-bold">{runId || 'Pending'}</span>
            </div>
            <div className="flex items-center justify-between text-[#A7B7A9]">
              <span>Selected Opportunity:</span>
              <span className="text-[#F5F4EC] truncate max-w-xs">{selectedOpportunity.title}</span>
            </div>
            <div className="flex items-center justify-between text-[#A7B7A9]">
              <span>Target Partner:</span>
              <span className="text-[#C6FF5E] font-semibold">{selectedOpportunity.organization}</span>
            </div>
          </div>

          <div className="text-[11px] text-[#A7B7A9]/60">
            Automatically polling every 2s until the registration row is saved.
          </div>
        </div>
      );
    }

    // 2. TIMEOUT OR FETCH ERROR STATE
    if (finalResultError && !finalResult) {
      return (
        <div className="w-full min-h-[85vh] py-16 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto flex flex-col items-center justify-center text-center space-y-6 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="font-display text-2xl font-bold text-[#F5F4EC]">
              Registration Record Retrieval Timeout
            </h2>
            <p className="text-xs sm:text-sm text-[#A7B7A9] leading-relaxed max-w-md">
              {finalResultError}
            </p>
          </div>

          <div className="w-full bg-[#10251D] border border-[rgba(198,255,94,0.15)] rounded-2xl p-4 text-left text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[#A7B7A9]">Session Run ID:</span>
              <span className="font-mono text-[#C6FF5E]">{runId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#A7B7A9]">Result Endpoint:</span>
              <span className="font-mono text-[#F5F4EC] truncate max-w-xs">
                {config.registrationResultUrl || 'Derived from matching endpoint'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={retryFetchFinalResult}
              className="px-6 py-2.5 bg-[#C6FF5E] text-[#14251B] font-semibold text-xs rounded-xl hover:bg-[#d6ff85] transition-colors flex items-center gap-2 cursor-pointer shadow-md"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retry Fetching Result</span>
            </button>
            <button
              onClick={() => setIsWebhookModalOpen(true)}
              className="px-5 py-2.5 bg-[#10251D] border border-[rgba(198,255,94,0.2)] text-[#F5F4EC] text-xs font-medium rounded-xl hover:bg-[#163327] transition-colors flex items-center gap-2 cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4 text-[#C6FF5E]" />
              <span>Configure Endpoint</span>
            </button>
            <button
              onClick={resetToStart}
              className="px-4 py-2.5 text-xs text-[#A7B7A9] hover:text-[#F5F4EC] transition-colors cursor-pointer"
            >
              Start New Search
            </button>
          </div>
        </div>
      );
    }

    // 3. FINAL REGISTRATION DISPLAY STATE (Actual Data Table record loaded)
    if (finalResult) {
      const registeredItems = finalResult.registered || [];
      const notRegisteredItems = finalResult.not_registered || [];

      const waitlistedItems = notRegisteredItems.filter(
        (item) => item.status === 'waitlisted'
      );
      const alreadyRegisteredItems = notRegisteredItems.filter(
        (item) => item.status === 'already_registered'
      );
      const blockedOrExcludedItems = notRegisteredItems.filter(
        (item) => item.status === 'excluded' || item.status === 'blocked_unverified' || item.status === 'consent_required'
      );
      const rejectedByStudentItems = notRegisteredItems.filter(
        (item) => item.status === 'rejected_by_student'
      );
      const otherNotRegisteredItems = notRegisteredItems.filter(
        (item) =>
          item.status !== 'waitlisted' &&
          item.status !== 'already_registered' &&
          item.status !== 'excluded' &&
          item.status !== 'blocked_unverified' &&
          item.status !== 'consent_required' &&
          item.status !== 'rejected_by_student'
      );

      const hasRegistered = registeredItems.length > 0;

      let headerTitle = 'Registration Confirmed!';
      let headerDesc = 'Your volunteer placement has been processed and recorded in the partner registry.';
      if (!hasRegistered) {
        if (alreadyRegisteredItems.length > 0) {
          headerTitle = 'Duplicate Registration Detected — Already Registered';
          headerDesc = 'The workflow verified that you are already registered for this placement. No duplicate registration record was created.';
        } else if (waitlistedItems.length > 0) {
          headerTitle = 'Placement Waitlisted';
          headerDesc = 'You have been added to the official opportunity waitlist. This is not a confirmed registration.';
        } else if (blockedOrExcludedItems.length > 0) {
          headerTitle = 'Registration Blocked or Excluded';
          headerDesc = 'Eligibility requirements or consent restrictions prevented registration for this opportunity.';
        } else {
          headerTitle = `Placement Outcome: ${finalResult.outcome || 'Declined'}`;
          headerDesc = 'The workflow completed evaluation without creating a new registration.';
        }
      }

      return (
        <div className="w-full min-h-[85vh] py-14 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto flex flex-col justify-start space-y-8 animate-fade-in">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10251D] border border-[rgba(198,255,94,0.3)] text-xs font-mono font-bold text-[#C6FF5E] tracking-wider uppercase">
              {hasRegistered ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Workflow Outcome: {finalResult.outcome || 'Registered'}</span>
                </>
              ) : alreadyRegisteredItems.length > 0 ? (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-purple-300">Outcome: {finalResult.outcome || 'Declined'} · Duplicate Detected</span>
                </>
              ) : waitlistedItems.length > 0 ? (
                <>
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-amber-300">Outcome: {finalResult.outcome || 'Waitlisted'}</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-rose-300">Outcome: {finalResult.outcome || 'Unregistered'}</span>
                </>
              )}
            </div>

            <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#F5F4EC]">
              {headerTitle}
            </h1>
            <p className="text-sm text-[#A7B7A9] max-w-lg mx-auto leading-relaxed">
              {headerDesc}
            </p>
          </div>

          {/* Student & Session Overview Strip */}
          <div className="p-4 bg-[#10251D] border border-[rgba(198,255,94,0.2)] rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[#A7B7A9] block text-[11px]">Student Volunteer</span>
              <span className="font-bold text-[#F5F4EC] flex items-center gap-1.5 mt-0.5 truncate">
                <User className="w-3.5 h-3.5 text-[#C6FF5E] shrink-0" />
                <span className="truncate">{finalResult.student_name}</span>
              </span>
              {finalResult.student_id && (
                <span className="text-[10px] font-mono text-[#A7B7A9]/60 block mt-0.5">
                  ID: {finalResult.student_id}
                </span>
              )}
            </div>

            <div>
              <span className="text-[#A7B7A9] block text-[11px]">Workflow Run ID</span>
              <span className="font-mono text-[#C6FF5E] font-bold flex items-center gap-1 mt-0.5 truncate">
                <Hash className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{finalResult.run_id || runId}</span>
              </span>
            </div>

            <div>
              <span className="text-[#A7B7A9] block text-[11px]">Workflow Outcome</span>
              <span className={`font-bold capitalize mt-0.5 block ${
                hasRegistered ? 'text-emerald-300' : alreadyRegisteredItems.length > 0 ? 'text-purple-300' : 'text-amber-300'
              }`}>
                {finalResult.outcome || finalResult.status}
              </span>
            </div>

            <div>
              <span className="text-[#A7B7A9] block text-[11px]">Verification Status</span>
              <span className="text-[#F5F4EC] font-medium truncate mt-0.5 block">
                {finalResult.verification_status || 'Verified'}
              </span>
            </div>
          </div>

          {/* 1. SUCCESSFULLY REGISTERED SECTION */}
          {hasRegistered ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-display font-bold text-[#F5F4EC] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#C6FF5E]" />
                  <span>Confirmed Registration ({registeredItems.length})</span>
                </h2>
                {finalResult.confirmation_id && (
                  <span className="text-xs font-mono font-bold px-2.5 py-1 bg-[#071C16] border border-[#C6FF5E]/30 text-[#C6FF5E] rounded-md">
                    Ref: {finalResult.confirmation_id}
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {registeredItems.map((reg) => (
                  <div
                    key={reg.opportunity_id}
                    className="p-6 bg-[#122B22] border-2 border-[#C6FF5E] rounded-2xl shadow-xl space-y-4 glow-accent-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-mono text-[#C6FF5E] font-bold">
                            ID: {reg.opportunity_id}
                          </span>
                          <span className="px-2.5 py-0.5 bg-[#C6FF5E] text-[#14251B] font-bold text-[11px] rounded-md">
                            {reg.status || 'registered_sandbox'}
                          </span>
                        </div>
                        <h3 className="font-display text-lg font-bold text-[#F5F4EC]">
                          {reg.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-[#A7B7A9]">
                          <Building className="w-3.5 h-3.5 text-[#C6FF5E]" />
                          <span className="text-[#F5F4EC] font-semibold">{reg.organization}</span>
                        </div>
                      </div>

                      {(reg.confirmation_id || finalResult.confirmation_id) && (
                        <div className="p-3 bg-[#071C16] rounded-xl text-xs space-y-0.5 border border-[rgba(198,255,94,0.15)] shrink-0 sm:text-right">
                          <span className="text-[#A7B7A9] block text-[10px]">Confirmation ID</span>
                          <span className="font-mono text-sm font-bold text-[#C6FF5E]">
                            {reg.confirmation_id || finalResult.confirmation_id}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-[rgba(198,255,94,0.15)] flex flex-wrap items-center justify-between gap-3 text-xs text-[#A7B7A9]">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-[#C6FF5E]" />
                        <span>
                          Verification:{' '}
                          <strong className="text-[#F5F4EC]">
                            {reg.verification_status || finalResult.verification_status || 'Verified'}
                          </strong>
                        </span>
                      </div>

                      {reg.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#C6FF5E]" />
                          <span>{reg.location}</span>
                        </div>
                      )}

                      {reg.work_mode && (
                        <div className="flex items-center gap-1.5">
                          <Laptop className="w-3.5 h-3.5 text-[#C6FF5E]" />
                          <span>{reg.work_mode}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Explicit Notice When Registered Array is Empty */
            <div className="p-4 bg-[#10251D] border border-[rgba(198,255,94,0.15)] rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <Ban className="w-4 h-4 text-amber-400" />
                <span className="text-[#F5F4EC] font-semibold">
                  No New Registrations Created
                </span>
                <span className="text-[#A7B7A9]">
                  (Outcome: {finalResult.outcome || 'declined'})
                </span>
              </div>
              <span className="px-2 py-0.5 bg-[#071C16] border border-[rgba(198,255,94,0.2)] text-[11px] text-[#A7B7A9] rounded">
                0 Registered
              </span>
            </div>
          )}

          {/* 2. WAITLISTED OPPORTUNITIES SECTION */}
          {waitlistedItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-display font-bold text-amber-300 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Waitlisted Placements ({waitlistedItems.length})</span>
                </h2>
                <span className="text-xs text-amber-300/80 font-medium">
                  Not Confirmed · On Waiting List
                </span>
              </div>

              <div className="space-y-3">
                {waitlistedItems.map((item) => (
                  <div
                    key={item.opportunity_id}
                    className="p-5 bg-amber-950/20 border-2 border-amber-500/40 rounded-2xl space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-mono text-amber-300 font-bold">
                            ID: {item.opportunity_id}
                          </span>
                          <span className="px-2.5 py-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-[11px] rounded-md">
                            Waitlisted
                          </span>
                        </div>
                        <h3 className="font-display text-base font-bold text-[#F5F4EC]">
                          {item.title}
                        </h3>
                        {item.organization && (
                          <div className="flex items-center gap-2 text-xs text-[#A7B7A9]">
                            <Building className="w-3.5 h-3.5 text-amber-400" />
                            <span className="text-[#F5F4EC] font-medium">{item.organization}</span>
                          </div>
                        )}
                      </div>

                      {item.location && (
                        <div className="flex items-center gap-1.5 text-xs text-[#A7B7A9] shrink-0">
                          <MapPin className="w-3.5 h-3.5 text-amber-400" />
                          <span>{item.location}</span>
                        </div>
                      )}
                    </div>

                    {item.reason && (
                      <div className="p-3 bg-[#071C16] rounded-xl border border-amber-500/20 text-xs text-amber-200 flex items-start gap-2">
                        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-amber-300 block mb-0.5">Waitlist Reason:</strong>
                          <span>{item.reason}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. ALREADY REGISTERED / DUPLICATE PREVENTION SECTION */}
          {alreadyRegisteredItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-display font-bold text-purple-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-purple-400" />
                  <span>Existing / Duplicate Registrations Detected ({alreadyRegisteredItems.length})</span>
                </h2>
                <span className="text-xs text-purple-300/80 font-medium">
                  Duplicate Prevention Active
                </span>
              </div>

              <div className="space-y-3">
                {alreadyRegisteredItems.map((item) => (
                  <div
                    key={item.opportunity_id}
                    className="p-5 bg-purple-950/20 border-2 border-purple-500/40 rounded-2xl space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-mono text-purple-300 font-bold">
                            ID: {item.opportunity_id}
                          </span>
                          <span className="px-2.5 py-0.5 bg-purple-500/20 border border-purple-500/40 text-purple-300 font-bold text-[11px] rounded-md">
                            Already Registered
                          </span>
                        </div>
                        <h3 className="font-display text-base font-bold text-[#F5F4EC]">
                          {item.title}
                        </h3>
                        {item.organization && (
                          <div className="flex items-center gap-2 text-xs text-[#A7B7A9]">
                            <Building className="w-3.5 h-3.5 text-purple-400" />
                            <span className="text-[#F5F4EC] font-medium">{item.organization}</span>
                          </div>
                        )}
                      </div>

                      {item.confirmation_id && (
                        <div className="p-2.5 bg-[#071C16] rounded-xl border border-purple-500/30 text-xs shrink-0 sm:text-right">
                          <span className="text-[#A7B7A9] block text-[10px]">Previous Confirmation Ref</span>
                          <span className="font-mono text-xs font-bold text-purple-300">
                            {item.confirmation_id}
                          </span>
                        </div>
                      )}
                    </div>

                    {item.reason && (
                      <div className="p-3 bg-[#071C16] rounded-xl border border-purple-500/20 text-xs text-purple-200 flex items-start gap-2">
                        <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-purple-300 block mb-0.5">Workflow Reason:</strong>
                          <span>{item.reason}</span>
                        </div>
                      </div>
                    )}

                    {/* Workflow duplicate prevention clarification */}
                    <div className="p-3 bg-[#071C16] rounded-xl border border-purple-500/25 text-xs text-purple-200 space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold text-purple-300">
                        <ShieldCheck className="w-4 h-4 text-purple-400" />
                        <span>Workflow Duplicate Prevention Active</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-purple-200/90">
                        The n8n workflow checked previous registrations and returned <code>already_registered</code>. The website displays this outcome accurately; persistent identity and Data Table duplicate detection are governed by the backend workflow logic.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. BLOCKED OR EXCLUDED OPPORTUNITIES SECTION */}
          {blockedOrExcludedItems.length > 0 && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-display font-bold text-rose-300 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>Blocked or Excluded from Placement ({blockedOrExcludedItems.length})</span>
                </h2>
                <span className="text-xs text-rose-300/80 font-medium">
                  Eligibility / Consent Restriction
                </span>
              </div>

              <div className="space-y-3">
                {blockedOrExcludedItems.map((item) => (
                  <div
                    key={item.opportunity_id}
                    className="p-5 bg-rose-950/20 border-2 border-rose-500/30 rounded-2xl space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-mono text-rose-300 font-bold">
                            ID: {item.opportunity_id}
                          </span>
                          <span className="px-2.5 py-0.5 bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold text-[11px] rounded-md capitalize">
                            {item.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <h3 className="font-display text-base font-bold text-[#F5F4EC]">
                          {item.title}
                        </h3>
                        {item.organization && (
                          <div className="flex items-center gap-2 text-xs text-[#A7B7A9]">
                            <Building className="w-3.5 h-3.5 text-rose-400" />
                            <span className="text-[#F5F4EC] font-medium">{item.organization}</span>
                          </div>
                        )}
                      </div>

                      {item.location && (
                        <div className="flex items-center gap-1.5 text-xs text-[#A7B7A9] shrink-0">
                          <MapPin className="w-3.5 h-3.5 text-rose-400" />
                          <span>{item.location}</span>
                        </div>
                      )}
                    </div>

                    {item.reason && (
                      <div className="p-3 bg-[#071C16] rounded-xl border border-rose-500/20 text-xs text-rose-200 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-rose-300 block mb-0.5">Restriction Reason:</strong>
                          <span>{item.reason}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. CANDIDATE OPPORTUNITIES NOT SELECTED BY STUDENT */}
          {rejectedByStudentItems.length > 0 && (
            <div className="space-y-3 pt-1">
              <h2 className="text-sm font-display font-bold text-[#A7B7A9] uppercase tracking-wider flex items-center gap-2">
                <span>Other Evaluated Matches — Not Selected ({rejectedByStudentItems.length})</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {rejectedByStudentItems.map((unreg) => (
                  <div
                    key={unreg.opportunity_id}
                    className="p-4 bg-[#0B1A14] border border-[rgba(198,255,94,0.1)] rounded-xl space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono text-[#A7B7A9]/70">ID: {unreg.opportunity_id}</span>
                      <span className="px-2 py-0.5 bg-[#10251D] text-[#A7B7A9] rounded text-[10px]">
                        Not Selected
                      </span>
                    </div>
                    <div className="font-semibold text-[#F5F4EC] truncate">{unreg.title}</div>
                    {unreg.organization && (
                      <div className="text-[#A7B7A9] text-[11px] truncate">{unreg.organization}</div>
                    )}
                    {unreg.reason && (
                      <div className="text-[11px] text-[#A7B7A9]/70 italic pt-1 border-t border-[rgba(198,255,94,0.06)]">
                        {unreg.reason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. OTHER NON-REGISTRATION STATUSES SECTION */}
          {otherNotRegisteredItems.length > 0 && (
            <div className="space-y-3 pt-1">
              <h2 className="text-sm font-display font-bold text-[#A7B7A9] uppercase tracking-wider">
                Other Opportunities ({otherNotRegisteredItems.length})
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {otherNotRegisteredItems.map((unreg) => (
                  <div
                    key={unreg.opportunity_id}
                    className="p-4 bg-[#0B1A14] border border-[rgba(198,255,94,0.1)] rounded-xl space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono text-[#A7B7A9]/70">ID: {unreg.opportunity_id}</span>
                      <span className="px-2 py-0.5 bg-[#10251D] text-[#A7B7A9] rounded text-[10px] capitalize">
                        {unreg.status ? unreg.status.replace(/_/g, ' ') : 'Not Registered'}
                      </span>
                    </div>
                    <div className="font-semibold text-[#F5F4EC] truncate">{unreg.title}</div>
                    {unreg.organization && (
                      <div className="text-[#A7B7A9] text-[11px] truncate">{unreg.organization}</div>
                    )}
                    {unreg.reason && (
                      <div className="text-[11px] text-[#A7B7A9]/70 italic pt-1 border-t border-[rgba(198,255,94,0.06)]">
                        {unreg.reason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. WORKFLOW SUMMARY HTML (SAFE RENDERING) */}
          {finalResult.summary_html && (
            <div className="p-5 bg-[#10251D] border border-[rgba(198,255,94,0.25)] rounded-2xl text-xs space-y-2.5">
              <div className="flex items-center gap-2 font-display font-bold text-[#C6FF5E] text-sm">
                <FileText className="w-4 h-4" />
                <span>Workflow Registration Summary</span>
              </div>
              <div
                className="text-[#F5F4EC] leading-relaxed space-y-1.5 font-sans"
                dangerouslySetInnerHTML={{
                  __html: sanitizeSummaryHtml(finalResult.summary_html),
                }}
              />
            </div>
          )}

          {/* 6. NEXT STEPS CARD */}
          {finalResult.next_steps && (
            <div className="p-4 bg-[#142A1F] border border-[#C6FF5E]/30 rounded-2xl text-xs space-y-1.5 text-emerald-200">
              <div className="flex items-center gap-1.5 font-bold text-[#C6FF5E]">
                <Info className="w-4 h-4" />
                <span>Coordinator Next Steps</span>
              </div>
              <p className="leading-relaxed text-[11px] text-emerald-100/90">
                {finalResult.next_steps}
              </p>
            </div>
          )}

          {/* Raw JSON inspection toggle */}
          <div className="pt-2">
            <button
              onClick={() => setShowRawJson(!showRawJson)}
              className="inline-flex items-center gap-1.5 text-xs text-[#A7B7A9] hover:text-[#C6FF5E] transition-colors cursor-pointer"
            >
              <Code className="w-3.5 h-3.5 text-[#C6FF5E]" />
              <span>{showRawJson ? 'Hide Saved Data Table JSON' : 'Inspect Saved Data Table JSON'}</span>
            </button>

            {showRawJson && (
              <pre className="mt-3 p-4 bg-[#051410] rounded-xl border border-[rgba(198,255,94,0.15)] text-[11px] font-mono text-[#A7B7A9] overflow-x-auto max-h-64 overflow-y-auto">
                {JSON.stringify(finalResult.raw, null, 2)}
              </pre>
            )}
          </div>

          {/* Action buttons */}
          <div className="pt-4 flex items-center justify-center gap-4">
            <button
              onClick={resetToStart}
              className="px-8 py-3.5 bg-[#C6FF5E] text-[#14251B] font-semibold text-xs rounded-xl hover:bg-[#d6ff85] transition-all cursor-pointer shadow-lg glow-accent"
            >
              Start New Student Search
            </button>
          </div>
        </div>
      );
    }
  }

  // -------------------------------------------------------------
  // APPROVAL SUBMISSION FORM
  // -------------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (isSubmittingApproval || isFetchingFinalResult) return;

    if (hasUnknownRequirements && !requirementsAck) {
      setValidationError(
        'Please acknowledge the unverified listing requirements before submitting approval.'
      );
      return;
    }

    await submitApprovalAction(backgroundConsent, requirementsAck);
  };

  return (
    <div className="w-full min-h-[85vh] py-12 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto flex flex-col justify-start">
      {/* Header */}
      <div className="space-y-3 mb-8">
        <button
          onClick={backToResults}
          className="inline-flex items-center gap-1.5 text-xs text-[#A7B7A9] hover:text-[#C6FF5E] transition-colors cursor-pointer mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Opportunities</span>
        </button>

        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#F5F4EC] tracking-tight">
          One choice. Your next step.
        </h1>
        <p className="text-sm sm:text-base text-[#A7B7A9] leading-relaxed">
          Review your chosen volunteer opportunity, provide explicit consent, and submit your selection for final organization review.
        </p>
      </div>

      {/* Warning if approveUrl is missing or session expired */}
      {(!approveUrl || isApprovalMissingUrl || isApprovalExpired) && (
        <div className="p-4 bg-amber-950/40 border border-amber-500/30 rounded-2xl mb-8 space-y-3 text-xs text-amber-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-amber-300 block">
                {isApprovalExpired ? 'Approval Link Expired' : 'Missing Dynamic Approval Link'}
              </span>
              <p className="leading-relaxed">
                {isApprovalExpired
                  ? 'The temporary execution-specific approval URL returned by the n8n Wait node has expired or the workflow is no longer waiting.'
                  : 'This matching session does not have an active approve_url from the matching workflow.'}
              </p>
              <p className="text-[11px] text-amber-200/80">
                To continue, start a fresh matching session to generate an active n8n execution link.
              </p>
            </div>
          </div>
          <div className="pt-1 flex justify-end">
            <button
              onClick={startMatchingFlow}
              className="px-4 py-2 bg-[#C6FF5E] text-[#14251B] font-semibold text-xs rounded-xl hover:bg-[#d6ff85] transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Start Fresh Matching Session</span>
            </button>
          </div>
        </div>
      )}

      {/* Selected Opportunity Summary Card */}
      <div className="p-6 bg-[#10251D] border border-[rgba(198,255,94,0.2)] rounded-2xl shadow-xl space-y-4 mb-8">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold text-[#C6FF5E]">
                Opportunity ID: {selectedOpportunity.opportunity_id}
              </span>
              {runId && (
                <span className="text-xs font-mono text-[#A7B7A9]/70">
                  · Session: {runId}
                </span>
              )}
            </div>
            <h2 className="font-display text-xl font-bold text-[#F5F4EC]">
              {selectedOpportunity.title}
            </h2>
            <div className="flex items-center gap-2 text-xs text-[#A7B7A9]">
              <Building className="w-3.5 h-3.5 text-[#C6FF5E]" />
              <span className="text-[#F5F4EC] font-medium">{selectedOpportunity.organization}</span>
              {selectedOpportunity.source && (
                <>
                  <span>·</span>
                  <span>{selectedOpportunity.source}</span>
                </>
              )}
            </div>
          </div>

          {selectedOpportunity.listing_url && (
            <a
              href={selectedOpportunity.listing_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#071C16] border border-[rgba(198,255,94,0.2)] rounded-lg text-xs font-medium text-[#C6FF5E] hover:underline shrink-0"
            >
              <span>Original Listing</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {selectedOpportunity.explanation && (
          <div className="p-3.5 bg-[#071C16] rounded-xl text-xs text-[#A7B7A9] leading-relaxed border border-[rgba(198,255,94,0.1)]">
            <strong className="text-[#F5F4EC] block mb-1">Match Rationale:</strong>
            {selectedOpportunity.explanation}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-[#A7B7A9] pt-2 border-t border-[rgba(198,255,94,0.1)]">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#C6FF5E] shrink-0" />
            <span className="truncate">{selectedOpportunity.location || 'Location upon request'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Laptop className="w-3.5 h-3.5 text-[#C6FF5E] shrink-0" />
            <span className="truncate">{selectedOpportunity.work_mode || 'Flexible'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#C6FF5E] shrink-0" />
            <span className="truncate">{selectedOpportunity.event_dates || selectedOpportunity.start || 'Flexible Dates'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#C6FF5E] shrink-0" />
            <span className="truncate">{selectedOpportunity.eligibility_status}</span>
          </div>
        </div>

        {(selectedOpportunity.age_restriction || selectedOpportunity.capacity || selectedOpportunity.spots_remaining !== null || selectedOpportunity.schedule) && (
          <div className="pt-2 border-t border-[rgba(198,255,94,0.08)] flex flex-wrap items-center gap-3 text-xs text-[#A7B7A9]">
            {selectedOpportunity.age_restriction && (
              <span className="px-2 py-0.5 rounded bg-[#071C16] border border-[rgba(198,255,94,0.2)] text-[11px] font-medium text-[#C6FF5E]">
                {selectedOpportunity.age_restriction}
              </span>
            )}
            {selectedOpportunity.schedule && (
              <div className="flex items-center gap-1 text-[11px]">
                <Clock className="w-3 h-3 text-[#C6FF5E]" />
                <span>{selectedOpportunity.schedule}</span>
              </div>
            )}
            {(selectedOpportunity.capacity || selectedOpportunity.spots_remaining !== null) && (
              <div className="flex items-center gap-1 text-[11px]">
                <Users className="w-3 h-3 text-[#C6FF5E]" />
                <span>
                  {selectedOpportunity.spots_remaining !== null
                    ? `${selectedOpportunity.spots_remaining} spots remaining`
                    : selectedOpportunity.capacity}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Approval Form with Separate Unchecked Checkboxes */}
      <form onSubmit={handleSubmit} className="bg-[#10251D] border border-[rgba(198,255,94,0.18)] rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="border-b border-[rgba(198,255,94,0.12)] pb-4">
          <h3 className="text-base font-display font-bold text-[#F5F4EC]">
            Explicit Consents & Acknowledgements
          </h3>
          <p className="text-xs text-[#A7B7A9]">
            Submitting approval transmits your single selected ID to resume the matching workflow and query the final Data Table placement record.
          </p>
        </div>

        {/* Checkbox 1: background_check_consent */}
        <div className="p-4 bg-[#071C16] border border-[rgba(198,255,94,0.18)] rounded-xl space-y-3">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="bgCheckConsent"
              checked={backgroundConsent}
              onChange={(e) => setBackgroundConsent(e.target.checked)}
              className="mt-1 h-4 w-4 accent-[#C6FF5E] rounded cursor-pointer shrink-0"
            />
            <label htmlFor="bgCheckConsent" className="space-y-1 cursor-pointer">
              <span className="block text-xs font-bold text-[#F5F4EC]">
                Background Check Consent (Approval Stage)
              </span>
              <p className="text-xs text-[#A7B7A9] leading-relaxed">
                I hereby confirm my consent for ImpactVolunteer and{' '}
                <strong className="text-[#F5F4EC]">{selectedOpportunity.organization}</strong> to initiate standard volunteer background verification procedures for this opportunity.
              </p>
              <p className="text-[11px] text-[#A7B7A9]/60">
                This is a separate approval-stage consent and is not copied from prior profile screens.
              </p>
            </label>
          </div>
        </div>

        {/* Checkbox 2: unverified_requirements_ack */}
        <div className="p-4 bg-[#071C16] border border-[rgba(198,255,94,0.18)] rounded-xl space-y-3">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="unverifiedReqAck"
              checked={requirementsAck}
              onChange={(e) => {
                setRequirementsAck(e.target.checked);
                setValidationError(null);
              }}
              className="mt-1 h-4 w-4 accent-[#C6FF5E] rounded cursor-pointer shrink-0"
            />
            <label htmlFor="unverifiedReqAck" className="space-y-1.5 cursor-pointer">
              <span className="block text-xs font-bold text-[#F5F4EC]">
                Unverified Requirements Acknowledgement
                {hasUnknownRequirements && (
                  <span className="text-[#C6FF5E] text-[11px] ml-2 font-normal">(Required for this opportunity)</span>
                )}
              </span>
              <p className="text-xs text-[#A7B7A9] leading-relaxed">
                I acknowledge that certain eligibility requirements, such as minimum age thresholds or specific physical presence guidelines, have not been explicitly confirmed in this partner's listing and may require follow-up confirmation with the organization.
              </p>
              {hasUnknownRequirements && (
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-200">
                  <span className="font-semibold text-amber-300 block mb-0.5">Listing Caveats:</span>
                  <ul className="list-disc list-inside text-[11px]">
                    {selectedOpportunity.unknown_requirements.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* Validation Error Message */}
        {validationError && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Webhook Error Message */}
        {approvalError && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-rose-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Approval Submission Failed</span>
            </div>
            <p className="leading-relaxed">{approvalError}</p>
            {(isApprovalExpired || isApprovalMissingUrl) && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={startMatchingFlow}
                  className="px-4 py-2 bg-[#C6FF5E] text-[#14251B] font-semibold text-xs rounded-lg hover:bg-[#d6ff85] transition-colors cursor-pointer"
                >
                  Start Fresh Matching Session
                </button>
              </div>
            )}
          </div>
        )}

        {/* Transmitted Payload Preview */}
        <div className="p-3.5 bg-[#071C16] rounded-xl border border-[rgba(198,255,94,0.1)] text-xs text-[#A7B7A9] space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-mono text-[#C6FF5E]">
              Resume Request Payload:
            </span>
            <span className="text-[#A7B7A9]/60">POST to dynamic approve_url</span>
          </div>
          <pre className="font-mono text-[11px] text-[#A7B7A9]">
            {JSON.stringify(
              {
                selected_ids: [selectedOpportunity.opportunity_id],
                background_check_consent: backgroundConsent,
                unverified_requirements_ack: requirementsAck,
              },
              null,
              2
            )}
          </pre>
        </div>

        {/* Actions */}
        <div className="pt-2 flex items-center justify-between border-t border-[rgba(198,255,94,0.12)]">
          <button
            type="button"
            onClick={backToResults}
            className="px-5 py-2.5 text-xs font-medium text-[#A7B7A9] hover:text-[#F5F4EC] transition-colors cursor-pointer"
          >
            Back to Opportunities
          </button>

          <button
            type="submit"
            disabled={isSubmittingApproval || !approveUrl || isApprovalExpired}
            className={`px-8 py-3.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 shadow-lg ${
              isSubmittingApproval || !approveUrl || isApprovalExpired
                ? 'bg-[#C6FF5E]/40 text-[#14251B]/70 cursor-not-allowed'
                : 'bg-[#C6FF5E] text-[#14251B] hover:bg-[#d6ff85] active:scale-95 glow-accent cursor-pointer'
            }`}
          >
            {isSubmittingApproval ? (
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full border-2 border-[#14251B] border-t-transparent animate-spin" />
                Resuming Workflow...
              </span>
            ) : (
              <>
                <span>Submit Approval</span>
                <CheckCircle2 className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
