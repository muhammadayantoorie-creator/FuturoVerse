/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from '@/src/components/shared/Layout';
import { useAppStore } from '@/src/store/useAppStore';
import { Dashboard } from '@/src/features/dashboard/Dashboard';
import { Classes } from '@/src/features/classes/Classes';
import { AiTools } from '@/src/features/ai-tools/AiTools';
import { QuizEngine } from '@/src/features/quizzes/QuizEngine';
import { AnalyticsDashboard } from '@/src/features/analytics/AnalyticsDashboard';
import { Gradebook } from '@/src/features/gradebook/Gradebook';
import { Resources } from '@/src/features/resources/Resources';
import { Settings } from '@/src/features/settings/Settings';
import { HelpCenter } from '@/src/features/help/HelpCenter';
import { AuthPage } from '@/src/features/auth/AuthPage';
import { LandingPage } from '@/src/features/landing/LandingPage';
import { useCurrentUserQuery } from '@/src/features/auth/authHooks';
import { Role } from '@/src/types';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

function AppContent() {
  const { activeTab, currentRole, setRole } = useAppStore();
  const { data: user, isLoading } = useCurrentUserQuery();

  // Navigation mode when not authenticated or exploring landing
  const [viewState, setViewState] = useState<'landing' | 'auth' | 'app'>('landing');
  const [authInitialView, setAuthInitialView] = useState<'login' | 'register'>('login');
  const [authInitialRole, setAuthInitialRole] = useState<Role>('teacher');

  // Listen to global unauthorized event (Token Refresh expired/failed)
  useEffect(() => {
    const handleUnauthorized = () => {
      queryClient.setQueryData(['currentUser'], null);
      setViewState('landing');
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  // Sync authenticated user info to Zustand
  useEffect(() => {
    if (user) {
      useAppStore.setState({
        currentUser: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC1jpDL0T17Nug1I73cKFaluo__r7LzQwxx6PsTUeiM0PfB0KlnSyBK5Gry5_OqPHSu2XUeiLHD0Pdgl8c-FK1Nh3ekz_yu2JDPjldCEwf2xom-BnUr3BRfYFoOKs-KxtJsF9Sn0_bmZZ3xkm_zpTa7yzbvyGvm8KxE63XBzDRXTGUNIFpriJG7TBj5SU4ituE492UPv8YljJ3pdhsSM98_2YKFMEOD68dkMEuppByzzUSEjWiE1ImHHA',
        },
        currentRole: user.role,
      });
      setViewState('app');
    }
  }, [user]);

  const handleNavigateToAuth = (view: 'login' | 'register' = 'login', role: Role = 'teacher') => {
    setAuthInitialView(view);
    setAuthInitialRole(role);
    setViewState('auth');
  };

  const handleExploreDemo = (role: Role = 'teacher') => {
    const mockUsers: Record<Role, { id: string; name: string; email: string; role: Role }> = {
      teacher: {
        id: 'demo-teacher',
        name: 'Prof. Kamran Tariq',
        email: 'kamran@fast.edu.pk',
        role: 'teacher',
      },
      student: {
        id: 'demo-student',
        name: 'Ahmed Ali',
        email: 'ahmed@student.edu.pk',
        role: 'student',
      },
      admin: {
        id: 'demo-admin',
        name: 'Dean Tariq Mehmood',
        email: 'admin@college.edu.pk',
        role: 'admin',
      },
      guest: {
        id: 'demo-guest',
        name: 'Guest Observer',
        email: 'guest@example.com',
        role: 'guest',
      },
    };

    const demoUser = mockUsers[role] || mockUsers.teacher;

    queryClient.setQueryData(['currentUser'], demoUser);
    setRole(role);
    useAppStore.setState({
      currentUser: {
        ...demoUser,
        avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC1jpDL0T17Nug1I73cKFaluo__r7LzQwxx6PsTUeiM0PfB0KlnSyBK5Gry5_OqPHSu2XUeiLHD0Pdgl8c-FK1Nh3ekz_yu2JDPjldCEwf2xom-BnUr3BRfYFoOKs-KxtJsF9Sn0_bmZZ3xkm_zpTa7yzbvyGvm8KxE63XBzDRXTGUNIFpriJG7TBj5SU4ituE492UPv8YljJ3pdhsSM98_2YKFMEOD68dkMEuppByzzUSEjWiE1ImHHA',
      },
      currentRole: role,
    });
    setViewState('app');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center font-sans">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 text-sm font-semibold">Verifying secure curriculum session...</p>
      </div>
    );
  }

  // If user is not authenticated or explicitly viewing landing page
  if (viewState === 'landing' && !user) {
    return (
      <LandingPage 
        onNavigateToAuth={handleNavigateToAuth}
        onExploreDemo={handleExploreDemo}
      />
    );
  }

  // If user navigated to Auth Page
  if ((viewState === 'auth' || !user) && viewState !== 'landing') {
    return (
      <AuthPage 
        initialView={authInitialView}
        initialRole={authInitialRole}
        onBackToLanding={() => setViewState('landing')}
      />
    );
  }

  // If authenticated user chose to view landing page
  if (viewState === 'landing' && user) {
    return (
      <div className="relative">
        <div className="sticky top-0 z-50 bg-emerald-900/90 backdrop-blur-md text-emerald-100 px-4 py-2 flex items-center justify-between text-xs border-b border-emerald-700/50">
          <span>You are currently signed in as <strong>{user.name}</strong> ({currentRole.toUpperCase()}).</span>
          <button
            onClick={() => setViewState('app')}
            className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition-colors cursor-pointer"
          >
            Return to App Workspace →
          </button>
        </div>
        <LandingPage 
          onNavigateToAuth={handleNavigateToAuth}
          onExploreDemo={handleExploreDemo}
        />
      </div>
    );
  }

  // Role-Based Screen Router with Strict RBAC guards
  const renderActiveTab = () => {
    // Strict Guard: Student cannot view Gradebook, Analytics, or Admin Settings
    if (currentRole === 'student' && (activeTab === 'analytics' || activeTab === 'gradebook' || activeTab === 'settings')) {
      return <Dashboard />;
    }

    // Strict Guard: Teacher cannot view Analytics or System Settings (Admin only)
    if (currentRole === 'teacher' && (activeTab === 'analytics' || activeTab === 'settings')) {
      return <Dashboard />;
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'classes':
        return <Classes />;
      case 'ai-tools':
        return <AiTools />;
      case 'quizzes':
        return <QuizEngine />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'gradebook':
        return <Gradebook />;
      case 'resources':
        return <Resources />;
      case 'settings':
        return <Settings />;
      case 'help-center':
        return <HelpCenter />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout onNavigateToLanding={() => setViewState('landing')}>
      {renderActiveTab()}
    </Layout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
