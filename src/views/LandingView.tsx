import React from 'react';
import { useApp } from '../context/AppContext';
import { NetworkVisualizer } from '../components/NetworkVisualizer';
import {
  ArrowRight,
  Sparkles,
  Compass,
  CheckCircle,
  Users,
  Shield,
  Layers,
  HeartHandshake,
} from 'lucide-react';

export const LandingView: React.FC = () => {
  const { startMatchingFlow, setCurrentView } = useApp();

  const scrollToHowItWorks = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="w-full flex flex-col">
      {/* HERO SECTION */}
      <section className="relative min-h-[85vh] flex items-center justify-center pt-8 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden bg-organic-grid">
        {/* Glow ambient spots */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#C6FF5E]/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center z-10">
          {/* Left Column: Headlines & Call to Actions */}
          <div className="lg:col-span-7 space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#10251D] border border-[rgba(198,255,94,0.2)] text-xs text-[#C6FF5E]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Living Impact · AI-Guided Opportunity Matching</span>
            </div>

            <div className="space-y-4">
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#F5F4EC] leading-[1.08] text-balance">
                Your skills.{' '}
                <span className="block text-[#C6FF5E] font-medium">Their next chapter.</span>
              </h1>
              <p className="text-base sm:text-lg text-[#A7B7A9] max-w-xl leading-relaxed">
                Discover meaningful volunteer opportunities matched to your skills, interests, availability, and location with the help of AI.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={startMatchingFlow}
                className="px-7 py-3.5 text-sm font-semibold text-[#14251B] bg-[#C6FF5E] hover:bg-[#d6ff85] active:scale-95 rounded-xl glow-accent transition-all duration-200 flex items-center gap-2.5 cursor-pointer shadow-lg"
              >
                <span>Find My Impact</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={scrollToHowItWorks}
                className="px-6 py-3.5 text-sm font-medium text-[#F5F4EC] bg-[#10251D] hover:bg-[#163327] border border-[rgba(198,255,94,0.18)] rounded-xl transition-colors cursor-pointer"
              >
                See How It Works
              </button>
            </div>

            {/* Compact Trust Indicator */}
            <div className="pt-4 border-t border-[rgba(198,255,94,0.12)] max-w-md">
              <p className="text-xs uppercase tracking-widest font-semibold text-[#A7B7A9]">
                Your interests. Your choices. Your impact.
              </p>
              <div className="flex items-center gap-6 pt-2 text-xs text-[#A7B7A9]/80">
                <span>· 100% Explicit Student Choice</span>
                <span>· Verified Partner Listings</span>
                <span>· Privacy-First Workflow</span>
              </div>
            </div>
          </div>

          {/* Right Column: Original Visual with Organic Connecting Lines */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            <div className="relative w-full max-w-lg aspect-square lg:aspect-[4/3] rounded-2xl overflow-hidden border border-[rgba(198,255,94,0.2)] bg-[#10251D]/80 shadow-2xl">
              {/* Photo backdrop with scrim */}
              <img
                src="/src/assets/images/hero_community_impact_1792653458495.jpg"
                alt="Student volunteers collaborating outdoors on a community environmental project"
                className="w-full h-full object-cover opacity-60 mix-blend-luminosity filter contrast-125"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#071C16] via-[#071C16]/40 to-transparent" />

              {/* Glowing Organic Network Overlay */}
              <NetworkVisualizer className="absolute inset-0" />

              {/* Floating Match Card Preview */}
              <div className="absolute bottom-4 left-4 right-4 p-3.5 bg-[#0B211A]/95 border border-[rgba(198,255,94,0.25)] rounded-xl shadow-xl backdrop-blur-md">
                <div className="flex items-center justify-between text-xs pb-1">
                  <span className="font-semibold text-[#C6FF5E] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#C6FF5E]" />
                    AI Workflow Evaluation
                  </span>
                  <span className="text-[11px] text-[#A7B7A9]">Student-Centric</span>
                </div>
                <p className="text-xs text-[#F5F4EC] font-medium truncate">
                  Matches your verified preferences against local & remote causes
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* THREE STEPS SECTION */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#10251D]/60 border-y border-[rgba(198,255,94,0.1)]">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="text-xs uppercase tracking-widest font-semibold text-[#C6FF5E]">
              Streamlined Architecture
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#F5F4EC]">
              How ImpactVolunteer Works
            </h2>
            <p className="text-sm text-[#A7B7A9]">
              Three purposeful steps from your initial skill intake to confirmed community placement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 01 */}
            <div className="p-8 bg-[#071C16] border border-[rgba(198,255,94,0.15)] rounded-2xl relative group hover:border-[#C6FF5E]/40 transition-colors">
              <div className="text-xs font-mono font-bold text-[#C6FF5E] tracking-wider mb-4">
                01 — TELL US ABOUT YOU
              </div>
              <h3 className="font-display text-xl font-bold text-[#F5F4EC] mb-2">
                Share Your Baseline
              </h3>
              <p className="text-sm text-[#A7B7A9] leading-relaxed">
                Share your skills, interests, availability, and preferred location. We capture your real strengths and scheduling constraints.
              </p>
            </div>

            {/* Step 02 */}
            <div className="p-8 bg-[#071C16] border border-[rgba(198,255,94,0.15)] rounded-2xl relative group hover:border-[#C6FF5E]/40 transition-colors">
              <div className="text-xs font-mono font-bold text-[#C6FF5E] tracking-wider mb-4">
                02 — DISCOVER YOUR MATCHES
              </div>
              <h3 className="font-display text-xl font-bold text-[#F5F4EC] mb-2">
                Intelligent Evaluation
              </h3>
              <p className="text-sm text-[#A7B7A9] leading-relaxed">
                Our connected AI workflow evaluates available opportunities against your profile, weighing alignment, eligibility, and logistics.
              </p>
            </div>

            {/* Step 03 */}
            <div className="p-8 bg-[#071C16] border border-[rgba(198,255,94,0.15)] rounded-2xl relative group hover:border-[#C6FF5E]/40 transition-colors">
              <div className="text-xs font-mono font-bold text-[#C6FF5E] tracking-wider mb-4">
                03 — CHOOSE YOUR IMPACT
              </div>
              <h3 className="font-display text-xl font-bold text-[#F5F4EC] mb-2">
                Single Choice Approval
              </h3>
              <p className="text-sm text-[#A7B7A9] leading-relaxed">
                Review the recommendations and select the opportunity that interests you most to complete the approval workflow.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CORE IMPACT AREAS / COMMUNITY STORIES */}
      <section id="impact-pillars" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-14">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <div className="text-xs uppercase tracking-widest font-semibold text-[#C6FF5E]">
                Living Impact Areas
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#F5F4EC]">
                Where Student Energy Meets Real Community Need
              </h2>
            </div>
            <button
              onClick={startMatchingFlow}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#C6FF5E] hover:underline cursor-pointer"
            >
              <span>Start your matching evaluation</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Story Card 1 */}
            <div className="bg-[#10251D] border border-[rgba(198,255,94,0.15)] rounded-2xl overflow-hidden flex flex-col sm:flex-row items-stretch">
              <div className="sm:w-1/2 relative h-56 sm:h-auto">
                <img
                  src="/src/assets/images/volunteer_story_education_1792653459405.jpg"
                  alt="Student volunteer mentoring a young learner in a library"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="sm:w-1/2 p-6 sm:p-8 flex flex-col justify-between space-y-4">
                <div>
                  <div className="text-xs font-mono text-[#C6FF5E] mb-1">EDUCATION & LITERACY</div>
                  <h3 className="font-display text-lg font-bold text-[#F5F4EC]">
                    Next-Gen Reading & Tech Mentors
                  </h3>
                  <p className="text-xs text-[#A7B7A9] mt-2 leading-relaxed">
                    High school and college students mentoring youth in reading, basic digital skills, and homework labs across regional school districts.
                  </p>
                </div>
                <div className="text-xs text-[#A7B7A9]/80 pt-2 border-t border-[rgba(198,255,94,0.1)] flex items-center justify-between">
                  <span>Flexible schedules</span>
                  <span>·</span>
                  <span>Remote or In-person</span>
                </div>
              </div>
            </div>

            {/* Story Card 2 */}
            <div className="bg-[#10251D] border border-[rgba(198,255,94,0.15)] rounded-2xl overflow-hidden flex flex-col sm:flex-row items-stretch">
              <div className="sm:w-1/2 relative h-56 sm:h-auto">
                <img
                  src="/src/assets/images/volunteer_story_environment_1792653460386.jpg"
                  alt="Young adult volunteers planting native trees"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="sm:w-1/2 p-6 sm:p-8 flex flex-col justify-between space-y-4">
                <div>
                  <div className="text-xs font-mono text-[#C6FF5E] mb-1">ENVIRONMENT & SUSTAINABILITY</div>
                  <h3 className="font-display text-lg font-bold text-[#F5F4EC]">
                    Urban Conservation & Canopy Renewal
                  </h3>
                  <p className="text-xs text-[#A7B7A9] mt-2 leading-relaxed">
                    Practical ecological restoration, tree mapping, biodiversity surveys, and community garden stewardship in local green spaces.
                  </p>
                </div>
                <div className="text-xs text-[#A7B7A9]/80 pt-2 border-t border-[rgba(198,255,94,0.1)] flex items-center justify-between">
                  <span>Weekend sprints</span>
                  <span>·</span>
                  <span>Hands-on fieldwork</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT & TRANSPARENCY SECTION */}
      <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#051410] border-t border-[rgba(198,255,94,0.1)]">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10251D] text-xs text-[#C6FF5E] font-medium border border-[rgba(198,255,94,0.2)]">
            <Shield className="w-3.5 h-3.5" />
            <span>Built on Ethical, Transparent AI</span>
          </div>

          <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#F5F4EC]">
            Why ImpactVolunteer Exists
          </h2>

          <p className="text-base text-[#A7B7A9] leading-relaxed">
            Volunteering should not be an endless search through outdated bulletin boards or generic databases. We combine student agency with an external n8n workflow that evaluates verified listings against your actual skills, availability, and travel parameters.
          </p>

          <div className="pt-6 flex justify-center">
            <button
              onClick={startMatchingFlow}
              className="px-8 py-3.5 text-sm font-semibold text-[#14251B] bg-[#C6FF5E] hover:bg-[#d6ff85] active:scale-95 rounded-xl glow-accent transition-all cursor-pointer"
            >
              Get Started Now
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
