import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { NormalizedOpportunity, MatchCategory } from '../types';
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Calendar,
  Clock,
  MapPin,
  Laptop,
  Building,
  RotateCcw,
  Code,
  SlidersHorizontal,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Users,
  Sparkles,
} from 'lucide-react';

export const ResultsView: React.FC = () => {
  const {
    opportunities,
    rawResponse,
    matchingError,
    relaxedFiltersMessage,
    selectedOpportunityId,
    selectOpportunity,
    proceedToApproval,
    retryMatching,
    setCurrentView,
    setIsWebhookModalOpen,
  } = useApp();

  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);

  const toggleExpand = (id: string) => {
    setExpandedMatchId((prev) => (prev === id ? null : id));
  };

  // Helper for match category styling and badges
  const renderCategoryBadge = (category: MatchCategory, isClosest: boolean) => {
    if (category === 'strong_match' || category === 'strong') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-[#C6FF5E] text-[#14251B]">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Strong Match</span>
        </span>
      );
    }
    if (category === 'excluded') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          <span>Excluded</span>
        </span>
      );
    }
    if (category === 'blocked_unverified') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>Blocked (Unverified)</span>
        </span>
      );
    }
    if (category === 'not_recommended') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          <span>Not Recommended</span>
        </span>
      );
    }
    if (isClosest || category === 'closest_available') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
          <span>Closest Available</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
        <span>Potential Match</span>
      </span>
    );
  };

  const selectedOpp = opportunities.find((o) => o.opportunity_id === selectedOpportunityId);
  const hasClosestAvailable = opportunities.some((o) => o.is_closest_available || o.match_category === 'closest_available');

  // ERROR STATE
  if (matchingError) {
    return (
      <div className="w-full min-h-[75vh] py-16 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-lg">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-2xl font-bold text-[#F5F4EC]">
            Matching Evaluation Failed
          </h2>
          <p className="text-sm text-[#A7B7A9] max-w-lg leading-relaxed">
            {matchingError}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          <button
            onClick={retryMatching}
            className="px-6 py-2.5 bg-[#C6FF5E] text-[#14251B] font-semibold text-xs rounded-xl hover:bg-[#d6ff85] transition-colors flex items-center gap-2 cursor-pointer shadow-md"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retry Matching</span>
          </button>
          <button
            onClick={() => setIsWebhookModalOpen(true)}
            className="px-5 py-2.5 bg-[#10251D] border border-[rgba(198,255,94,0.2)] text-[#F5F4EC] text-xs font-medium rounded-xl hover:bg-[#163327] transition-colors flex items-center gap-2 cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#C6FF5E]" />
            <span>Configure Webhook</span>
          </button>
          <button
            onClick={() => setCurrentView('profile')}
            className="px-4 py-2.5 text-xs text-[#A7B7A9] hover:text-[#F5F4EC] transition-colors cursor-pointer"
          >
            Edit Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[85vh] py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto flex flex-col justify-start pb-32">
      {/* Page Header */}
      <div className="space-y-3 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#F5F4EC] tracking-tight">
              Opportunities worth your time.
            </h1>
            <p className="text-sm sm:text-base text-[#A7B7A9] mt-1 leading-relaxed">
              Explore the opportunities returned by your AI matching workflow. Select exactly one to proceed.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setShowRawJson(!showRawJson)}
              className="px-3.5 py-2 bg-[#10251D] border border-[rgba(198,255,94,0.18)] hover:border-[#C6FF5E]/40 text-xs font-medium text-[#A7B7A9] hover:text-[#F5F4EC] rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Inspect raw agent response"
            >
              <Code className="w-3.5 h-3.5 text-[#C6FF5E]" />
              <span>{showRawJson ? 'Hide JSON' : 'Raw JSON'}</span>
            </button>
            <button
              onClick={() => setCurrentView('profile')}
              className="px-3.5 py-2 bg-[#10251D] border border-[rgba(198,255,94,0.18)] hover:border-[#C6FF5E]/40 text-xs font-medium text-[#A7B7A9] hover:text-[#F5F4EC] rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Edit Filters</span>
            </button>
          </div>
        </div>

        {/* Relaxed Filters or Closest Available Banner */}
        {(relaxedFiltersMessage || hasClosestAvailable) && (
          <div className="p-4 bg-[#142A1F] border border-amber-500/30 rounded-2xl flex items-start gap-3.5 mt-4 text-xs text-amber-200">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-amber-300 block">
                Relaxed Filter Advisory
              </span>
              <p className="leading-relaxed">
                {relaxedFiltersMessage ||
                  'Not enough strong or potential matches exist even after relaxing preferences. These are the closest currently available options and may not fully fit your profile.'}
              </p>
            </div>
          </div>
        )}

        {/* Developer / Raw JSON Drawer */}
        {showRawJson && (
          <div className="mt-4 p-4 bg-[#071C16] border border-[rgba(198,255,94,0.2)] rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs text-[#A7B7A9]">
              <span className="font-mono text-[#C6FF5E]">Live Agent Raw Response Payload:</span>
              <span>{opportunities.length} item(s) parsed</span>
            </div>
            <pre className="p-3 bg-[#051410] rounded-xl text-[11px] font-mono text-[#A7B7A9] overflow-x-auto max-h-64 overflow-y-auto">
              {JSON.stringify(rawResponse, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* EMPTY RESULTS STATE */}
      {opportunities.length === 0 ? (
        <div className="bg-[#10251D] border border-[rgba(198,255,94,0.18)] rounded-2xl p-12 text-center space-y-5 my-6">
          <div className="w-14 h-14 rounded-2xl bg-[#071C16] border border-[rgba(198,255,94,0.2)] flex items-center justify-center text-[#A7B7A9] mx-auto">
            <HelpCircle className="w-7 h-7" />
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="font-display text-xl font-bold text-[#F5F4EC]">
              No Opportunities Returned
            </h3>
            <p className="text-xs sm:text-sm text-[#A7B7A9] leading-relaxed">
              No matching volunteer opportunities were returned by the workflow for these criteria. Try broadening your cause, location, or workmode preferences.
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => setCurrentView('profile')}
              className="px-5 py-2.5 bg-[#C6FF5E] text-[#14251B] font-semibold text-xs rounded-xl hover:bg-[#d6ff85] transition-colors cursor-pointer"
            >
              Modify Profile
            </button>
            <button
              onClick={retryMatching}
              className="px-5 py-2.5 bg-[#071C16] border border-[rgba(198,255,94,0.2)] text-[#F5F4EC] font-semibold text-xs rounded-xl hover:bg-[#163327] transition-colors cursor-pointer"
            >
              Retry Webhook Call
            </button>
          </div>
        </div>
      ) : (
        /* OPPORTUNITIES LIST (SINGLE SELECTION RULE APPLIED) */
        <div className="space-y-4">
          <div className="text-xs text-[#A7B7A9] flex items-center justify-between pb-1">
            <span>Showing {opportunities.length} evaluated volunteer opportunity recommendation(s)</span>
            <span>Select 1 opportunity to continue</span>
          </div>

          <div className="space-y-4" role="radiogroup" aria-label="Volunteer opportunities">
            {opportunities.map((opp) => {
              const isSelected = selectedOpportunityId === opp.opportunity_id;
              const isNotRecommended = opp.match_category === 'not_recommended';
              const isSelectable = opp.selectable && !isNotRecommended;
              const isExpanded = expandedMatchId === opp.opportunity_id;

              return (
                <div
                  key={opp.opportunity_id}
                  onClick={() => {
                    if (isSelectable) {
                      selectOpportunity(opp.opportunity_id);
                    }
                  }}
                  role="radio"
                  aria-checked={isSelected}
                  aria-disabled={!isSelectable}
                  tabIndex={isSelectable ? 0 : -1}
                  onKeyDown={(e) => {
                    if (isSelectable && (e.key === ' ' || e.key === 'Enter')) {
                      e.preventDefault();
                      selectOpportunity(opp.opportunity_id);
                    }
                  }}
                  className={`p-6 rounded-2xl border transition-all duration-200 relative ${
                    isSelectable
                      ? isSelected
                        ? 'bg-[#122B22] border-[#C6FF5E] shadow-xl glow-accent-sm cursor-pointer'
                        : 'bg-[#10251D] border-[rgba(198,255,94,0.15)] hover:border-[rgba(198,255,94,0.35)] cursor-pointer'
                      : 'bg-[#0B1A14]/70 border-rose-900/30 opacity-70 cursor-not-allowed'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    {/* Left: Radio + Title + Org */}
                    <div className="flex items-start gap-4">
                      {/* Accessible single-selection radio button */}
                      <div className="pt-1 shrink-0">
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                            isSelected
                              ? 'border-[#C6FF5E] bg-[#C6FF5E]'
                              : isSelectable
                              ? 'border-[rgba(198,255,94,0.3)] bg-[#071C16]'
                              : 'border-slate-700 bg-slate-900/50'
                          }`}
                        >
                          {isSelected && <span className="w-2 h-2 rounded-full bg-[#14251B]" />}
                        </div>
                      </div>

                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {renderCategoryBadge(opp.match_category, opp.is_closest_available)}
                          {opp.relevance_score !== null && (
                            <span className="text-xs font-mono font-semibold text-[#A7B7A9]">
                              {opp.relevance_score}% Match
                            </span>
                          )}
                          <span className="text-xs text-[#A7B7A9]/60 font-mono">
                            ID: {opp.opportunity_id}
                          </span>
                          {opp.age_restriction && (
                            <span className="px-2 py-0.5 bg-[#071C16] border border-[rgba(198,255,94,0.2)] text-[11px] font-medium text-[#C6FF5E] rounded-md">
                              {opp.age_restriction}
                            </span>
                          )}
                          {opp.existing_registration_status === 'already_registered' && (
                            <span className="px-2 py-0.5 bg-purple-500/20 border border-purple-500/40 text-[11px] font-semibold text-purple-300 rounded-md">
                              Already Registered
                            </span>
                          )}
                        </div>

                        <h3 className="font-display text-lg sm:text-xl font-bold text-[#F5F4EC] leading-snug">
                          {opp.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#A7B7A9]">
                          <div className="flex items-center gap-1.5">
                            <Building className="w-3.5 h-3.5 text-[#C6FF5E]" />
                            <span className="font-medium text-[#F5F4EC]">{opp.organization}</span>
                          </div>
                          {opp.source && (
                            <span className="text-[#A7B7A9]/70">
                              · Via {opp.source}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: External listing link if available */}
                    {opp.listing_url && (
                      <a
                        href={opp.listing_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#071C16] border border-[rgba(198,255,94,0.2)] rounded-lg text-xs font-medium text-[#C6FF5E] hover:underline shrink-0"
                      >
                        <span>View Listing</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  {/* Metadata Grid (Location, Work mode, Event Dates / Schedule, Eligibility) */}
                  <div className="mt-5 pt-4 border-t border-[rgba(198,255,94,0.1)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-[#A7B7A9]">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#C6FF5E] shrink-0" />
                      <span className="truncate" title={opp.location || undefined}>
                        {opp.location || 'Location upon request'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Laptop className="w-3.5 h-3.5 text-[#C6FF5E] shrink-0" />
                      <span className="truncate">{opp.work_mode || 'Flexible Workmode'}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#C6FF5E] shrink-0" />
                      <span className="truncate" title={opp.event_dates || undefined}>
                        {opp.event_dates || (opp.start ? `${opp.start}${opp.end ? ` – ${opp.end}` : ''}` : 'Immediate / Flexible')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#C6FF5E] shrink-0" />
                      <span className="truncate">{opp.eligibility_status}</span>
                    </div>
                  </div>

                  {/* Secondary Details Strip (Capacity, Waitlist, Background Check, Schedule) */}
                  {(opp.capacity || opp.waitlist_info || opp.spots_remaining !== null || opp.schedule || opp.needs_background_consent) && (
                    <div className="mt-3 pt-3 border-t border-[rgba(198,255,94,0.08)] flex flex-wrap items-center gap-3 text-xs text-[#A7B7A9]">
                      {opp.schedule && (
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <Clock className="w-3 h-3 text-[#C6FF5E]" />
                          <span>{opp.schedule}</span>
                        </div>
                      )}

                      {(opp.capacity || opp.spots_remaining !== null) && (
                        <div className="flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded bg-[#071C16] border border-[rgba(198,255,94,0.12)]">
                          <Users className="w-3 h-3 text-[#C6FF5E]" />
                          <span>
                            {opp.spots_remaining !== null ? `${opp.spots_remaining} spots remaining` : opp.capacity}
                          </span>
                        </div>
                      )}

                      {opp.waitlist_info && (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-medium">
                          {opp.waitlist_info}
                        </span>
                      )}

                      {opp.needs_background_consent && (
                        <div className="flex items-center gap-1 text-[11px] text-[#C6FF5E]">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Background check required</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Skills Pills */}
                  {opp.skills.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] text-[#A7B7A9]/70 mr-1">Skills:</span>
                      {opp.skills.map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-[#071C16] border border-[rgba(198,255,94,0.15)] rounded text-[11px] text-[#F5F4EC]"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Unknown Requirements Warning if present */}
                  {opp.unknown_requirements.length > 0 && (
                    <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-200 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-amber-300">Unverified Requirements in Listing:</strong>
                        <ul className="list-disc list-inside mt-0.5 space-y-0.5 text-[11px] text-amber-200/90">
                          {opp.unknown_requirements.map((req, idx) => (
                            <li key={idx}>{req}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Required Confirmations if present */}
                  {opp.required_confirmations && opp.required_confirmations.length > 0 && (
                    <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-200 flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-blue-300">Required Confirmations for Placement:</strong>
                        <ul className="list-disc list-inside mt-0.5 space-y-0.5 text-[11px] text-blue-200/90">
                          {opp.required_confirmations.map((conf, idx) => (
                            <li key={idx}>{conf}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Expandable "Why this match?" section */}
                  {opp.explanation && (
                    <div className="mt-4 pt-3 border-t border-[rgba(198,255,94,0.08)]">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(opp.opportunity_id);
                        }}
                        className="flex items-center justify-between w-full text-xs font-semibold text-[#C6FF5E] hover:text-[#d6ff85] transition-colors cursor-pointer py-1"
                      >
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[#C6FF5E]" />
                          <span>Why this match?</span>
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="mt-2 p-3 bg-[#071C16] rounded-xl text-xs text-[#F5F4EC] leading-relaxed border border-[rgba(198,255,94,0.1)]">
                          {opp.explanation}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Non-selectable reason banner */}
                  {!isSelectable && (
                    <div className="mt-3 p-3 bg-rose-950/40 border border-rose-800/30 rounded-xl text-xs text-rose-300 flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-rose-200 block mb-0.5">
                          {opp.match_category === 'excluded'
                            ? 'Excluded Opportunity'
                            : opp.match_category === 'blocked_unverified'
                            ? 'Blocked (Unverified Requirements)'
                            : 'Not Selectable'}
                        </strong>
                        <span>
                          {opp.exclusion_reason ||
                            (opp.match_category === 'excluded'
                              ? 'This opportunity was excluded by workflow eligibility evaluation.'
                              : opp.match_category === 'blocked_unverified'
                              ? 'This placement is blocked due to unverified requirements that cannot be satisfied in this session.'
                              : 'This opportunity is not recommended or not selectable under current criteria.')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PERSISTENT BOTTOM SELECTION BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#071C16]/95 border-t border-[rgba(198,255,94,0.2)] backdrop-blur-lg px-4 sm:px-6 py-4 shadow-2xl">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-auto text-left">
            {selectedOpp ? (
              <div className="space-y-0.5">
                <div className="text-[11px] font-mono font-semibold text-[#C6FF5E] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#C6FF5E]" />
                  <span>Selected Choice (ID: {selectedOpp.opportunity_id})</span>
                </div>
                <div className="text-sm font-display font-bold text-[#F5F4EC] truncate max-w-lg">
                  {selectedOpp.title}
                </div>
                <div className="text-xs text-[#A7B7A9] truncate max-w-md">
                  {selectedOpp.organization}
                </div>
              </div>
            ) : (
              <div className="space-y-0.5">
                <span className="text-xs text-[#A7B7A9]">
                  Select exactly one opportunity above to continue to the approval workflow.
                </span>
                <p className="text-[11px] text-[#A7B7A9]/60">
                  Single-selection required by verification policy.
                </p>
              </div>
            )}
          </div>

          <div className="w-full sm:w-auto flex items-center justify-end gap-3 shrink-0">
            <button
              onClick={proceedToApproval}
              disabled={!selectedOpportunityId}
              className={`w-full sm:w-auto px-7 py-3 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                selectedOpportunityId
                  ? 'bg-[#C6FF5E] text-[#14251B] hover:bg-[#d6ff85] active:scale-95 glow-accent'
                  : 'bg-[#10251D] text-[#A7B7A9]/50 border border-[rgba(198,255,94,0.1)] cursor-not-allowed'
              }`}
            >
              <span>Continue to Approval</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
