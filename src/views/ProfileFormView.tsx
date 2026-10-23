import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Cause,
  Availability,
  WorkMode,
} from '../types';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Plus,
  X,
  AlertCircle,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react';
import { getWebhookConfig } from '../services/webhookService';

const CAUSE_OPTIONS: { label: Cause; description: string }[] = [
  { label: 'Environment', description: 'Conservation, tree planting, climate action, and flora mapping' },
  { label: 'Education', description: 'Youth mentoring, tutoring, reading clubs, and digital literacy' },
  { label: 'Healthcare', description: 'Public health awareness, clinic support, and community care' },
  { label: 'Animal Welfare', description: 'Shelter care, pet adoption drives, and wildlife protection' },
  { label: 'Community Development', description: 'Food banks, civic infrastructure, and neighborhood relief' },
  { label: 'Technology', description: 'Digital aid, software tools, open data, and senior tech labs' },
  { label: 'Other', description: 'Other community and grassroots initiatives' },
];

const SKILL_OPTIONS: string[] = [
  'Communication',
  'Teaching',
  'Basic Computer Skills',
  'Programming',
  'Design',
  'Writing',
  'Leadership',
  'Research',
  'Event Management',
];

const AVAILABILITY_OPTIONS: { label: Availability; sub: string }[] = [
  { label: 'Weekdays', sub: 'Monday to Friday slots' },
  { label: 'Weekends', sub: 'Saturday or Sunday sessions' },
  { label: 'Evenings', sub: 'After school / work hours' },
  { label: 'Flexible', sub: 'Adaptable to project needs' },
];

const WORKMODE_OPTIONS: { label: WorkMode; sub: string }[] = [
  { label: 'Remote', sub: '100% online / virtual tasks' },
  { label: 'Hybrid', sub: 'Mix of virtual & local meetups' },
  { label: 'In-person', sub: 'Direct on-site presence' },
  { label: 'Flexible', sub: 'Open to either mode' },
];

export const ProfileFormView: React.FC = () => {
  const {
    profile,
    updateProfile,
    submitProfileForm,
    isSubmittingProfile,
    setCurrentView,
    setIsWebhookModalOpen,
  } = useApp();

  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const config = getWebhookConfig();
  const isWebhookConfigured = Boolean(config.profileMatchUrl || config.simulationMode);

  // Skill chip toggling
  const toggleSkill = (skill: string) => {
    const current = profile.skills || [];
    if (current.includes(skill)) {
      updateProfile({ skills: current.filter((s) => s !== skill) });
    } else {
      updateProfile({ skills: [...current, skill] });
    }
    clearError('skills');
  };

  const addCustomSkill = () => {
    const trimmed = customSkillInput.trim();
    if (!trimmed) return;
    const current = profile.skills || [];
    if (!current.includes(trimmed)) {
      updateProfile({ skills: [...current, trimmed] });
    }
    setCustomSkillInput('');
    clearError('skills');
  };

  const clearError = (field: string) => {
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Step validation
  const validateStep = (step: 1 | 2 | 3): boolean => {
    const errors: Record<string, string> = {};

    if (step === 1) {
      if (!profile.name || !profile.name.trim()) {
        errors.name = 'Please provide your name.';
      }
      if (
        profile.age === null ||
        profile.age === undefined ||
        isNaN(Number(profile.age)) ||
        Number(profile.age) < 12 ||
        Number(profile.age) > 100
      ) {
        errors.age = 'Please enter a valid age between 12 and 100.';
      }
      if (!profile.city || !profile.city.trim()) {
        errors.city = 'Please enter your current city or location.';
      }
    } else if (step === 2) {
      if (!profile.cause) {
        errors.cause = 'Please choose a primary cause focus.';
      }
      if (!profile.skills || profile.skills.length === 0) {
        errors.skills = 'Please select at least one skill or enter a custom skill.';
      }
    } else if (step === 3) {
      if (!profile.availability) {
        errors.availability = 'Please select your availability schedule.';
      }
      if (!profile.workmode) {
        errors.workmode = 'Please select your preferred work mode.';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      if (activeStep < 3) {
        setActiveStep((prev) => (prev + 1) as any);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleBack = () => {
    if (activeStep > 1) {
      setActiveStep((prev) => (prev - 1) as any);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setCurrentView('landing');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(3)) return;
    await submitProfileForm();
  };

  return (
    <div className="w-full min-h-[85vh] py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto flex flex-col justify-start">
      {/* Header section */}
      <div className="space-y-3 mb-8">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 text-xs text-[#A7B7A9] hover:text-[#C6FF5E] transition-colors cursor-pointer mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{activeStep === 1 ? 'Back to Home' : 'Previous Step'}</span>
        </button>

        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#F5F4EC] tracking-tight">
          Let's find where you belong.
        </h1>
        <p className="text-sm sm:text-base text-[#A7B7A9] max-w-2xl leading-relaxed">
          Tell us a little about yourself. We'll use your preferences to find relevant volunteer opportunities.
        </p>

        {/* Webhook Readiness Warning if neither URL nor Simulation is active */}
        {!isWebhookConfigured && (
          <div className="p-4 bg-[#10251D] border border-[rgba(198,255,94,0.3)] rounded-xl flex items-start justify-between gap-4 mt-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#C6FF5E] shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <p className="font-semibold text-[#F5F4EC]">
                  n8n Webhook Not Yet Configured
                </p>
                <p className="text-[#A7B7A9] leading-relaxed">
                  To receive real opportunities from your workflow, configure your n8n profile webhook endpoint or enable the test simulator in settings.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsWebhookModalOpen(true)}
              className="px-3 py-1.5 bg-[#071C16] border border-[rgba(198,255,94,0.25)] rounded-lg text-xs font-semibold text-[#C6FF5E] hover:border-[#C6FF5E] transition-colors whitespace-nowrap cursor-pointer"
            >
              Configure
            </button>
          </div>
        )}
      </div>

      {/* Progress Indicator */}
      <div className="mb-10 p-4 bg-[#10251D]/70 border border-[rgba(198,255,94,0.15)] rounded-2xl">
        <div className="grid grid-cols-3 gap-2 sm:gap-4 text-xs font-medium">
          {/* Step 1 */}
          <div
            className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
              activeStep === 1
                ? 'bg-[#071C16] text-[#C6FF5E] border border-[rgba(198,255,94,0.3)]'
                : activeStep > 1
                ? 'text-[#F5F4EC]'
                : 'text-[#A7B7A9]/60'
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                activeStep > 1
                  ? 'bg-[#C6FF5E] text-[#14251B]'
                  : activeStep === 1
                  ? 'border border-[#C6FF5E] text-[#C6FF5E]'
                  : 'border border-[rgba(198,255,94,0.2)] text-[#A7B7A9]'
              }`}
            >
              {activeStep > 1 ? <Check className="w-3.5 h-3.5" /> : '01'}
            </span>
            <span className="hidden sm:inline">About You</span>
            <span className="sm:hidden">About</span>
          </div>

          {/* Step 2 */}
          <div
            className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
              activeStep === 2
                ? 'bg-[#071C16] text-[#C6FF5E] border border-[rgba(198,255,94,0.3)]'
                : activeStep > 2
                ? 'text-[#F5F4EC]'
                : 'text-[#A7B7A9]/60'
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                activeStep > 2
                  ? 'bg-[#C6FF5E] text-[#14251B]'
                  : activeStep === 2
                  ? 'border border-[#C6FF5E] text-[#C6FF5E]'
                  : 'border border-[rgba(198,255,94,0.2)] text-[#A7B7A9]'
              }`}
            >
              {activeStep > 2 ? <Check className="w-3.5 h-3.5" /> : '02'}
            </span>
            <span className="hidden sm:inline">Your Interests</span>
            <span className="sm:hidden">Interests</span>
          </div>

          {/* Step 3 */}
          <div
            className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
              activeStep === 3
                ? 'bg-[#071C16] text-[#C6FF5E] border border-[rgba(198,255,94,0.3)]'
                : 'text-[#A7B7A9]/60'
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                activeStep === 3
                  ? 'border border-[#C6FF5E] text-[#C6FF5E]'
                  : 'border border-[rgba(198,255,94,0.2)] text-[#A7B7A9]'
              }`}
            >
              03
            </span>
            <span className="hidden sm:inline">Your Preferences</span>
            <span className="sm:hidden">Preferences</span>
          </div>
        </div>
      </div>

      {/* Multi-step Form Body */}
      <div className="bg-[#10251D] border border-[rgba(198,255,94,0.18)] rounded-2xl p-6 sm:p-8 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* STEP 1: ABOUT YOU */}
          {activeStep === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-[rgba(198,255,94,0.12)] pb-4">
                <h2 className="text-lg font-display font-bold text-[#F5F4EC]">
                  Step 01 — Personal Baseline
                </h2>
                <p className="text-xs text-[#A7B7A9]">
                  We use your name, age, and location to query relevant regional opportunities.
                </p>
              </div>

              {/* Field 1: name */}
              <div className="space-y-1.5">
                <label htmlFor="studentName" className="block text-xs font-semibold text-[#F5F4EC]">
                  Full Name <span className="text-[#C6FF5E]">*</span>
                </label>
                <input
                  id="studentName"
                  type="text"
                  required
                  value={profile.name}
                  onChange={(e) => {
                    updateProfile({ name: e.target.value });
                    clearError('name');
                  }}
                  placeholder="e.g. Maya Chen"
                  className="w-full px-4 py-3 bg-[#071C16] border border-[rgba(198,255,94,0.2)] rounded-xl text-sm text-[#F5F4EC] placeholder:text-[#A7B7A9]/40 focus:outline-none focus:border-[#C6FF5E] focus:ring-1 focus:ring-[#C6FF5E]"
                />
                {validationErrors.name && (
                  <p className="text-xs text-rose-400 mt-1">{validationErrors.name}</p>
                )}
              </div>

              {/* Field 5: age */}
              <div className="space-y-1.5">
                <label htmlFor="studentAge" className="block text-xs font-semibold text-[#F5F4EC]">
                  Age <span className="text-[#C6FF5E]">*</span>
                </label>
                <input
                  id="studentAge"
                  type="number"
                  min="12"
                  max="100"
                  required
                  value={profile.age ?? ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                    updateProfile({ age: val });
                    clearError('age');
                  }}
                  placeholder="e.g. 17"
                  className="w-full px-4 py-3 bg-[#071C16] border border-[rgba(198,255,94,0.2)] rounded-xl text-sm text-[#F5F4EC] placeholder:text-[#A7B7A9]/40 focus:outline-none focus:border-[#C6FF5E] focus:ring-1 focus:ring-[#C6FF5E]"
                />
                <p className="text-[11px] text-[#A7B7A9]">
                  Many opportunities have age eligibility criteria (e.g. 16+ or 18+).
                </p>
                {validationErrors.age && (
                  <p className="text-xs text-rose-400 mt-1">{validationErrors.age}</p>
                )}
              </div>

              {/* Field 7: city */}
              <div className="space-y-1.5">
                <label htmlFor="studentCity" className="block text-xs font-semibold text-[#F5F4EC]">
                  City / Location <span className="text-[#C6FF5E]">*</span>
                </label>
                <input
                  id="studentCity"
                  type="text"
                  required
                  value={profile.city}
                  onChange={(e) => {
                    updateProfile({ city: e.target.value });
                    clearError('city');
                  }}
                  placeholder="e.g. Coimbatore, India or Seattle, WA"
                  className="w-full px-4 py-3 bg-[#071C16] border border-[rgba(198,255,94,0.2)] rounded-xl text-sm text-[#F5F4EC] placeholder:text-[#A7B7A9]/40 focus:outline-none focus:border-[#C6FF5E] focus:ring-1 focus:ring-[#C6FF5E]"
                />
                <p className="text-[11px] text-[#A7B7A9]">
                  Used to calculate geographic proximity for hybrid or in-person activities.
                </p>
                {validationErrors.city && (
                  <p className="text-xs text-rose-400 mt-1">{validationErrors.city}</p>
                )}
              </div>

              {/* Step 1 Actions */}
              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-3 text-xs font-semibold text-[#14251B] bg-[#C6FF5E] hover:bg-[#d6ff85] active:scale-95 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <span>Continue to Interests</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: YOUR INTERESTS */}
          {activeStep === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-[rgba(198,255,94,0.12)] pb-4">
                <h2 className="text-lg font-display font-bold text-[#F5F4EC]">
                  Step 02 — Interests & Skills
                </h2>
                <p className="text-xs text-[#A7B7A9]">
                  Select the causes that inspire you and highlight the skills you want to bring or develop.
                </p>
              </div>

              {/* Field 2: cause */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#F5F4EC]">
                  Primary Cause Focus <span className="text-[#C6FF5E]">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {CAUSE_OPTIONS.map((c) => {
                    const isSelected = profile.cause === c.label;
                    return (
                      <div
                        key={c.label}
                        onClick={() => {
                          updateProfile({ cause: c.label });
                          clearError('cause');
                        }}
                        className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#071C16] border-[#C6FF5E] glow-accent-sm'
                            : 'bg-[#071C16]/50 border-[rgba(198,255,94,0.12)] hover:border-[rgba(198,255,94,0.3)]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${isSelected ? 'text-[#C6FF5E]' : 'text-[#F5F4EC]'}`}>
                            {c.label}
                          </span>
                          {isSelected && <Check className="w-4 h-4 text-[#C6FF5E]" />}
                        </div>
                        <p className="text-[11px] text-[#A7B7A9] mt-1 leading-snug">
                          {c.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
                {validationErrors.cause && (
                  <p className="text-xs text-rose-400 mt-1">{validationErrors.cause}</p>
                )}
              </div>

              {/* Field 3: skills */}
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-[#F5F4EC]">
                    Your Skills & Talents <span className="text-[#C6FF5E]">*</span>
                  </label>
                  <span className="text-[11px] text-[#A7B7A9]">
                    {profile.skills?.length || 0} selected
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {SKILL_OPTIONS.map((skill) => {
                    const isSelected = profile.skills?.includes(skill);
                    return (
                      <button
                        type="button"
                        key={skill}
                        onClick={() => toggleSkill(skill)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#C6FF5E] text-[#14251B] font-semibold shadow-sm'
                            : 'bg-[#071C16] text-[#A7B7A9] border border-[rgba(198,255,94,0.15)] hover:border-[#C6FF5E]/50 hover:text-[#F5F4EC]'
                        }`}
                      >
                        {skill}
                      </button>
                    );
                  })}

                  {/* Render custom skills added by user */}
                  {profile.skills
                    ?.filter((s) => !SKILL_OPTIONS.includes(s))
                    .map((custom) => (
                      <span
                        key={custom}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#C6FF5E] text-[#14251B]"
                      >
                        <span>{custom}</span>
                        <button
                          type="button"
                          onClick={() => toggleSkill(custom)}
                          className="hover:opacity-75 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                </div>

                {/* Add custom skill input */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    value={customSkillInput}
                    onChange={(e) => setCustomSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomSkill();
                      }
                    }}
                    placeholder="Add a custom skill (e.g. Spanish Translation, Photography)..."
                    className="flex-1 px-3 py-2 bg-[#071C16] border border-[rgba(198,255,94,0.18)] rounded-lg text-xs text-[#F5F4EC] placeholder:text-[#A7B7A9]/40 focus:outline-none focus:border-[#C6FF5E]"
                  />
                  <button
                    type="button"
                    onClick={addCustomSkill}
                    className="px-3 py-2 bg-[#163327] hover:bg-[#1f4736] text-[#C6FF5E] rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-[rgba(198,255,94,0.2)]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
                {validationErrors.skills && (
                  <p className="text-xs text-rose-400 mt-1">{validationErrors.skills}</p>
                )}
              </div>

              {/* Step 2 Actions */}
              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-5 py-2.5 text-xs font-medium text-[#A7B7A9] hover:text-[#F5F4EC] transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-3 text-xs font-semibold text-[#14251B] bg-[#C6FF5E] hover:bg-[#d6ff85] active:scale-95 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <span>Continue to Preferences</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: YOUR PREFERENCES */}
          {activeStep === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-[rgba(198,255,94,0.12)] pb-4">
                <h2 className="text-lg font-display font-bold text-[#F5F4EC]">
                  Step 03 — Logistics & Consent
                </h2>
                <p className="text-xs text-[#A7B7A9]">
                  Specify when and how you can volunteer, and review explicit background consent.
                </p>
              </div>

              {/* Field 4: availability */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#F5F4EC]">
                  Availability Schedule <span className="text-[#C6FF5E]">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {AVAILABILITY_OPTIONS.map((a) => {
                    const isSelected = profile.availability === a.label;
                    return (
                      <button
                        type="button"
                        key={a.label}
                        onClick={() => {
                          updateProfile({ availability: a.label });
                          clearError('availability');
                        }}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#071C16] border-[#C6FF5E] glow-accent-sm'
                            : 'bg-[#071C16]/50 border-[rgba(198,255,94,0.12)] hover:border-[rgba(198,255,94,0.3)]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${isSelected ? 'text-[#C6FF5E]' : 'text-[#F5F4EC]'}`}>
                            {a.label}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#C6FF5E]" />}
                        </div>
                        <p className="text-[10px] text-[#A7B7A9] mt-1">{a.sub}</p>
                      </button>
                    );
                  })}
                </div>
                {validationErrors.availability && (
                  <p className="text-xs text-rose-400 mt-1">{validationErrors.availability}</p>
                )}
              </div>

              {/* Field 8: workmode */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-semibold text-[#F5F4EC]">
                  Work Mode <span className="text-[#C6FF5E]">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {WORKMODE_OPTIONS.map((m) => {
                    const isSelected = profile.workmode === m.label;
                    return (
                      <button
                        type="button"
                        key={m.label}
                        onClick={() => {
                          updateProfile({ workmode: m.label });
                          clearError('workmode');
                        }}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#071C16] border-[#C6FF5E] glow-accent-sm'
                            : 'bg-[#071C16]/50 border-[rgba(198,255,94,0.12)] hover:border-[rgba(198,255,94,0.3)]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${isSelected ? 'text-[#C6FF5E]' : 'text-[#F5F4EC]'}`}>
                            {m.label}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#C6FF5E]" />}
                        </div>
                        <p className="text-[10px] text-[#A7B7A9] mt-1">{m.sub}</p>
                      </button>
                    );
                  })}
                </div>
                {validationErrors.workmode && (
                  <p className="text-xs text-rose-400 mt-1">{validationErrors.workmode}</p>
                )}
              </div>

              {/* Field 6: background_consent (EXPLICIT CONSENT CONTROL) */}
              <div className="p-4 bg-[#071C16] border border-[rgba(198,255,94,0.2)] rounded-xl space-y-3">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="profileConsent"
                    checked={profile.background_consent}
                    onChange={(e) => updateProfile({ background_consent: e.target.checked })}
                    className="mt-1 h-4 w-4 accent-[#C6FF5E] rounded cursor-pointer shrink-0"
                  />
                  <label htmlFor="profileConsent" className="space-y-1.5 cursor-pointer">
                    <span className="block text-xs font-bold text-[#F5F4EC]">
                      Initial Background Verification Consent (Optional)
                    </span>
                    <p className="text-xs text-[#A7B7A9] leading-relaxed">
                      Certain organizations (e.g. youth mentoring, hospitals, vulnerable groups) require volunteer background verifications. Checking this indicates you are open to opportunities that carry standard background-check requirements.
                    </p>
                    <p className="text-[11px] text-[#A7B7A9]/70 italic">
                      Note: This consent is never enabled automatically. Final formal background-check consent is collected separately during the approval stage.
                    </p>
                  </label>
                </div>
              </div>

              {/* Step 3 Actions */}
              <div className="pt-4 flex items-center justify-between border-t border-[rgba(198,255,94,0.12)]">
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-5 py-2.5 text-xs font-medium text-[#A7B7A9] hover:text-[#F5F4EC] transition-colors cursor-pointer"
                >
                  Back
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingProfile}
                  className={`px-8 py-3.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-lg ${
                    isSubmittingProfile
                      ? 'bg-[#C6FF5E]/50 text-[#14251B] cursor-not-allowed'
                      : 'bg-[#C6FF5E] text-[#14251B] hover:bg-[#d6ff85] active:scale-95 glow-accent'
                  }`}
                >
                  <span>Evaluate Matches with AI Agent</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Summary of Exact Profile Structure to be transmitted */}
      <div className="mt-8 p-4 bg-[#071C16]/60 border border-[rgba(198,255,94,0.1)] rounded-xl text-xs text-[#A7B7A9] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#C6FF5E]" />
          <span>Transmitting 8 exact profile fields to n8n webhook</span>
        </div>
        <button
          onClick={() => setIsWebhookModalOpen(true)}
          className="text-[#C6FF5E] hover:underline flex items-center gap-1 cursor-pointer"
        >
          <SlidersHorizontal className="w-3 h-3" />
          <span>Webhook Settings</span>
        </button>
      </div>
    </div>
  );
};
