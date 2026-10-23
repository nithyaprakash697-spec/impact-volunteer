import React from 'react';
import { useApp } from '../context/AppContext';

export const Footer: React.FC = () => {
  const { setCurrentView, setIsWebhookModalOpen } = useApp();

  return (
    <footer className="w-full bg-[#051410] border-t border-[rgba(198,255,94,0.1)] py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start justify-between gap-10">
        <div className="max-w-md space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C6FF5E]" />
            <span className="font-display text-lg font-bold text-[#F5F4EC]">ImpactVolunteer</span>
          </div>
          <p className="text-sm text-[#A7B7A9] leading-relaxed">
            Connecting student skills and passion with verified community organizations through intelligent, human-centered opportunity matching.
          </p>
          <p className="text-xs text-[#A7B7A9]/70 pt-2">
            Your interests. Your choices. Your impact.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm">
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold tracking-wider text-[#F5F4EC] uppercase">Platform</h4>
            <ul className="space-y-2 text-[#A7B7A9]">
              <li>
                <button
                  onClick={() => setCurrentView('landing')}
                  className="hover:text-[#F5F4EC] transition-colors cursor-pointer text-left"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentView('profile')}
                  className="hover:text-[#F5F4EC] transition-colors cursor-pointer text-left"
                >
                  Student Profile
                </button>
              </li>
              <li>
                <button
                  onClick={() => setIsWebhookModalOpen(true)}
                  className="hover:text-[#C6FF5E] transition-colors cursor-pointer text-left"
                >
                  n8n Integration
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold tracking-wider text-[#F5F4EC] uppercase">Workflow</h4>
            <ul className="space-y-2 text-[#A7B7A9]">
              <li>01. Student Profile</li>
              <li>02. AI Evaluation</li>
              <li>03. Selected Approval</li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold tracking-wider text-[#F5F4EC] uppercase">Integrity</h4>
            <ul className="space-y-2 text-[#A7B7A9]">
              <li>Explicit Consent</li>
              <li>Verified IDs Only</li>
              <li>WCAG Accessible</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-[rgba(198,255,94,0.06)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#A7B7A9]/60">
        <p>© {new Date().getFullYear()} ImpactVolunteer. Built for community impact.</p>
        <div className="flex items-center gap-6">
          <span>Living Impact Design</span>
          <span>·</span>
          <span>n8n Webhook Architecture</span>
        </div>
      </div>
    </footer>
  );
};
