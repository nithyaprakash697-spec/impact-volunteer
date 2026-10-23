import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Menu, X, SlidersHorizontal, Sparkles } from 'lucide-react';
import { getWebhookConfig } from '../services/webhookService';

export const Navbar: React.FC = () => {
  const { currentView, setCurrentView, startMatchingFlow, setIsWebhookModalOpen } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const config = getWebhookConfig();
  const hasWebhook = Boolean(config.profileMatchUrl || config.simulationMode);

  const handleNav = (action: () => void) => {
    action();
    setMobileMenuOpen(false);
  };

  const scrollToSection = (id: string) => {
    if (currentView !== 'landing') {
      setCurrentView('landing');
      setTimeout(() => {
        const el = document.getElementById(id);
        el?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(id);
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#071C16]/90 backdrop-blur-md border-b border-[rgba(198,255,94,0.12)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-8">
        {/* Zone 1: Brand wordmark (single text element) */}
        <button
          onClick={() => setCurrentView('landing')}
          className="text-left group flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF5E] rounded-md"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#C6FF5E] inline-block group-hover:scale-125 transition-transform" />
          <span className="font-display text-xl font-bold tracking-tight text-[#F5F4EC] group-hover:text-[#C6FF5E] transition-colors">
            ImpactVolunteer
          </span>
        </button>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#A7B7A9]">
          <button
            onClick={() => handleNav(() => scrollToSection('how-it-works'))}
            className="hover:text-[#F5F4EC] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            How It Works
          </button>
          <button
            onClick={() => handleNav(() => scrollToSection('impact-pillars'))}
            className="hover:text-[#F5F4EC] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Explore Opportunities
          </button>
          <button
            onClick={() => handleNav(() => scrollToSection('about'))}
            className="hover:text-[#F5F4EC] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            About
          </button>
          <button
            onClick={() => setIsWebhookModalOpen(true)}
            className="flex items-center gap-1.5 text-xs text-[#A7B7A9] hover:text-[#C6FF5E] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title="Configure or test n8n webhooks"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Webhook {hasWebhook ? 'Active' : 'Setup'}</span>
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          <button
            onClick={startMatchingFlow}
            className="px-5 py-2.5 text-xs font-semibold text-[#14251B] bg-[#C6FF5E] hover:bg-[#d6ff85] active:scale-95 rounded-lg shadow-sm glow-accent-sm transition-all whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#C6FF5E]"
          >
            Find My Impact
          </button>
        </div>

        {/* Mobile menu toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={() => setIsWebhookModalOpen(true)}
            className="p-2 text-[#A7B7A9] hover:text-[#C6FF5E]"
            aria-label="Webhook Configuration"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#F5F4EC] hover:text-[#C6FF5E] focus-visible:outline-none"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#10251D] border-b border-[rgba(198,255,94,0.15)] px-6 py-6 space-y-4">
          <button
            onClick={() => handleNav(() => scrollToSection('how-it-works'))}
            className="block w-full text-left py-2 text-sm text-[#F5F4EC] font-medium"
          >
            How It Works
          </button>
          <button
            onClick={() => handleNav(() => scrollToSection('impact-pillars'))}
            className="block w-full text-left py-2 text-sm text-[#F5F4EC] font-medium"
          >
            Explore Opportunities
          </button>
          <button
            onClick={() => handleNav(() => scrollToSection('about'))}
            className="block w-full text-left py-2 text-sm text-[#F5F4EC] font-medium"
          >
            About
          </button>
          <button
            onClick={() => handleNav(() => setIsWebhookModalOpen(true))}
            className="block w-full text-left py-2 text-sm text-[#C6FF5E] font-medium"
          >
            Configure n8n Webhook
          </button>
          <div className="pt-2">
            <button
              onClick={() => handleNav(startMatchingFlow)}
              className="w-full py-3 text-center text-xs font-semibold text-[#14251B] bg-[#C6FF5E] rounded-lg"
            >
              Find My Impact
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
