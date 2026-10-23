import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { WebhookConfigModal } from './components/WebhookConfigModal';
import { LandingView } from './views/LandingView';
import { ProfileFormView } from './views/ProfileFormView';
import { MatchingProcessingView } from './views/MatchingProcessingView';
import { ResultsView } from './views/ResultsView';
import { ApprovalView } from './views/ApprovalView';

const MainContent: React.FC = () => {
  const { currentView } = useApp();

  return (
    <main className="flex-1 flex flex-col justify-start">
      {currentView === 'landing' && <LandingView />}
      {currentView === 'profile' && <ProfileFormView />}
      {currentView === 'matching' && <MatchingProcessingView />}
      {currentView === 'results' && <ResultsView />}
      {(currentView === 'approval' || currentView === 'approval_success') && <ApprovalView />}
    </main>
  );
};

export default function App() {
  return (
    <AppProvider>
      <div className="min-h-screen flex flex-col bg-[#071C16] text-[#F5F4EC]">
        <Navbar />
        <MainContent />
        <Footer />
        <WebhookConfigModal />
      </div>
    </AppProvider>
  );
}
