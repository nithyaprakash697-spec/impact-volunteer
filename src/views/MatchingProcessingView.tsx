import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { NetworkVisualizer } from '../components/NetworkVisualizer';
import { Sparkles, Server, ArrowLeft } from 'lucide-react';
import { getWebhookConfig } from '../services/webhookService';

const STATUS_MESSAGES = [
  { step: 1, text: 'Understanding your profile', desc: 'Analyzing skills, cause alignment, and availability window' },
  { step: 2, text: 'Evaluating available opportunities', desc: 'Querying partner database via connected n8n agent workflow' },
  { step: 3, text: 'Checking your preferences', desc: 'Assessing location proximity, remote eligibility, and age requirements' },
  { step: 4, text: 'Preparing your recommendations', desc: 'Structuring match rationale and scoring compatibility' },
];

export const MatchingProcessingView: React.FC = () => {
  const { profile, setCurrentView } = useApp();
  const [activeMessageIndex, setActiveMessageIndex] = useState(0);
  const config = getWebhookConfig();

  // Gentle cycle through visual progress messages while live HTTP request completes
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveMessageIndex((prev) => (prev < STATUS_MESSAGES.length - 1 ? prev + 1 : prev));
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full min-h-[80vh] flex flex-col items-center justify-center px-4 sm:px-6 py-12 relative overflow-hidden bg-organic-grid">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#C6FF5E]/8 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-xl w-full bg-[#10251D] border border-[rgba(198,255,94,0.2)] rounded-3xl p-8 sm:p-10 shadow-2xl relative z-10 text-center space-y-8">
        {/* Network Graphic */}
        <div className="relative w-full h-44 sm:h-52 rounded-2xl bg-[#071C16] border border-[rgba(198,255,94,0.15)] overflow-hidden flex items-center justify-center">
          <NetworkVisualizer className="w-full h-full scale-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#071C16]/90 via-transparent to-[#071C16]/40 pointer-events-none" />

          {/* Center glowing indicator */}
          <div className="absolute flex flex-col items-center gap-2">
            <div className="relative flex items-center justify-center">
              <span className="w-12 h-12 rounded-full bg-[#C6FF5E]/20 animate-ping absolute" />
              <div className="w-10 h-10 rounded-full bg-[#071C16] border-2 border-[#C6FF5E] flex items-center justify-center shadow-lg glow-accent">
                <Sparkles className="w-5 h-5 text-[#C6FF5E] animate-pulse" />
              </div>
            </div>
            <span className="text-[11px] font-mono text-[#C6FF5E] font-semibold tracking-wider">
              AGENT EVALUATION
            </span>
          </div>
        </div>

        {/* Status Messages */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <h2 className="font-display text-2xl font-bold text-[#F5F4EC]">
              {STATUS_MESSAGES[activeMessageIndex].text}...
            </h2>
            <p className="text-xs text-[#A7B7A9]">
              {STATUS_MESSAGES[activeMessageIndex].desc}
            </p>
          </div>

          {/* Stepper Dots */}
          <div className="flex items-center justify-center gap-2 pt-2">
            {STATUS_MESSAGES.map((msg, i) => (
              <div
                key={msg.step}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i === activeMessageIndex
                    ? 'w-8 bg-[#C6FF5E]'
                    : i < activeMessageIndex
                    ? 'w-3 bg-[#C6FF5E]/60'
                    : 'w-2 bg-[rgba(198,255,94,0.2)]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Profile baseline summary */}
        <div className="p-3.5 bg-[#071C16] border border-[rgba(198,255,94,0.12)] rounded-xl text-left space-y-2 text-xs">
          <div className="flex items-center justify-between text-[#A7B7A9]">
            <span>Candidate: <strong className="text-[#F5F4EC]">{profile.name || 'Student'}</strong></span>
            <span>Focus: <strong className="text-[#C6FF5E]">{profile.cause}</strong></span>
          </div>
          <div className="flex items-center justify-between text-[#A7B7A9]">
            <span>Location: <strong className="text-[#F5F4EC]">{profile.city}</strong></span>
            <span>Mode: <strong className="text-[#F5F4EC]">{profile.workmode}</strong></span>
          </div>
        </div>

        {/* Honest Progress Indicator Disclosure */}
        <div className="pt-2 border-t border-[rgba(198,255,94,0.1)] text-[11px] text-[#A7B7A9]/70 space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-[#A7B7A9]">
            <Server className="w-3.5 h-3.5 text-[#C6FF5E]" />
            <span>
              Connected to:{' '}
              <span className="font-mono text-[#F5F4EC]">
                {config.profileMatchUrl ? 'External n8n Webhook' : config.simulationMode ? 'Test Simulator' : 'Awaiting Endpoint'}
              </span>
            </span>
          </div>
          <p>
            Visual progress indicator. Actual response is delivered once the n8n agent workflow finishes evaluating opportunities.
          </p>
        </div>

        <div>
          <button
            onClick={() => setCurrentView('profile')}
            className="inline-flex items-center gap-1.5 text-xs text-[#A7B7A9] hover:text-[#F5F4EC] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Cancel and edit profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};
