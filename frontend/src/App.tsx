import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './pages/LandingPage';
import { PublicSearchPage } from './pages/PublicSearchPage';
import { RequestTrackingPage } from './pages/RequestTrackingPage';
import { HospitalDashboardPage } from './pages/HospitalDashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { LoginPage } from './pages/LoginPage';
import { HospitalApplyPage } from './pages/HospitalApplyPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { BloodGroup, BloodComponent } from './types';

export const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<string>('landing');
  const [searchParams, setSearchParams] = useState<{ bg: BloodGroup; comp: BloodComponent }>({
    bg: 'O+',
    comp: 'Whole Blood',
  });
  const [trackingToken, setTrackingToken] = useState<string>('');

  const navigateTo = (view: string) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Dynamic Document Title and Meta Description Update
  useEffect(() => {
    const titlesAndDescriptions: Record<string, { title: string; desc: string }> = {
      landing: {
        title: 'BloodConnect — National Blood Transfusion Network',
        desc: "India's unified national blood transfusion grid. Locate verified cold-chain stock in nearby licensed blood centers and secure guaranteed atomic reservations.",
      },
      search: {
        title: 'Find Blood & Live Inventory | BloodConnect',
        desc: 'Search verified hospital blood banks in real time, compare live component availability, and place a 30-minute emergency hold.',
      },
      track: {
        title: 'Track Emergency Hold & Requisition | BloodConnect',
        desc: 'Real-time countdown timer, clinical cross-match tracking, and hospital pickup instructions for your blood request token.',
      },
      hospital: {
        title: 'Hospital Staff Portal & Stock Ledger | BloodConnect',
        desc: 'Accredited blood bank management center for receiving batches, recording adjustments, and issuing verified units.',
      },
      admin: {
        title: 'Super Admin Regulatory Center | BloodConnect',
        desc: 'Centralized oversight for hospital licensing verification, tamper-evident audit logs, and nationwide stock monitoring.',
      },
      login: {
        title: 'Sign In & Portal Access | BloodConnect',
        desc: 'Secure authentication for hospital staff, regulatory admins, and verified citizen requesters.',
      },
      apply: {
        title: 'Hospital Blood Bank Onboarding & Registration | BloodConnect',
        desc: 'Register your licensed hospital or blood center on the national digital grid to publish inventory and manage transfusions.',
      },
      notfound: {
        title: '404 - Page Not Found | BloodConnect',
        desc: 'The requested emergency route does not exist. Return to the blood search grid.',
      },
    };

    const currentInfo = titlesAndDescriptions[currentView] || titlesAndDescriptions.notfound;
    document.title = currentInfo.title;

    // Update meta description tag
    let metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', currentInfo.desc);
    } else {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      metaDesc.setAttribute('content', currentInfo.desc);
      document.head.appendChild(metaDesc);
    }
  }, [currentView]);

  const handleStartSearch = (bg: BloodGroup, comp: BloodComponent) => {
    setSearchParams({ bg, comp });
    navigateTo('search');
  };

  const handleNavigateToTrack = (token: string) => {
    setTrackingToken(token);
    navigateTo('track');
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'landing':
        return (
          <LandingPage
            onStartSearch={handleStartSearch}
            onNavigate={navigateTo}
          />
        );
      case 'search':
        return (
          <PublicSearchPage
            initialBloodGroup={searchParams.bg}
            initialComponent={searchParams.comp}
            onNavigateToTrack={handleNavigateToTrack}
            onNavigateToLogin={() => navigateTo('login')}
          />
        );
      case 'track':
        return (
          <RequestTrackingPage initialToken={trackingToken} />
        );
      case 'hospital':
        return <HospitalDashboardPage />;
      case 'admin':
        return <AdminDashboardPage />;
      case 'login':
        return (
          <LoginPage onSuccess={(view) => navigateTo(view)} />
        );
      case 'apply':
        return (
          <HospitalApplyPage onSuccess={() => navigateTo('landing')} />
        );
      default:
        return <NotFoundPage onNavigate={navigateTo} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-rose-500 selection:text-white">
      <Navbar currentView={currentView} onNavigate={navigateTo} />

      <main className="flex-1">
        {renderCurrentView()}
      </main>

      <Footer onNavigate={navigateTo} />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
