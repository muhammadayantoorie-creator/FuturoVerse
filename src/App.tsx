/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from '@/src/components/shared/Layout';
import { useAppStore } from '@/src/store/useAppStore';
import { ToastProvider } from '@/src/components/shared/Toast';
import { Confetti } from '@/src/components/shared/Confetti';
import { Role } from '@/src/types';
import { useCurrentUserQuery } from '@/src/features/auth/authHooks';

// ⚡ Lazy-load heavy feature modules for faster initial load
const Dashboard = lazy(() => import('@/src/features/dashboard/Dashboard').then(m => ({ default: m.Dashboard })));
const Classes = lazy(() => import('@/src/features/classes/Classes').then(m => ({ default: m.Classes })));
const AiTools = lazy(() => import('@/src/features/ai-tools/AiTools').then(m => ({ default: m.AiTools })));
const QuizEngine = lazy(() => import('@/src/features/quizzes/QuizEngine').then(m => ({ default: m.QuizEngine })));
const AnalyticsDashboard = lazy(() => import('@/src/features/analytics/AnalyticsDashboard').then(m => ({ default: m.AnalyticsDashboard })));
const Gradebook = lazy(() => import('@/src/features/gradebook/Gradebook').then(m => ({ default: m.Gradebook })));
const Resources = lazy(() => import('@/src/features/resources/Resources').then(m => ({ default: m.Resources })));
const Settings = lazy(() => import('@/src/features/settings/Settings').then(m => ({ default: m.Settings })));
const HelpCenter = lazy(() => import('@/src/features/help/HelpCenter').then(m => ({ default: m.HelpCenter })));
const AuthPage = lazy(() => import('@/src/features/auth/AuthPage').then(m => ({ default: m.AuthPage })));
const LandingPage = lazy(() => import('@/src/features/landing/LandingPage').then(m => ({ default: m.LandingPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

// Loading skeleton shown while lazy modules are loading
const PageLoader = () => (
  <div className="flex-1 flex flex-col items-center justify-center min-h-[40vh] gap-4">
    <div className="relative w-12 h-12">
      <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20" />
      <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
    </div>
    <p className="text-xs text-slate-400 font-semibold animate-pulse">Loading...</p>
  </div>
);

function AppContent() {
  const { activeTab, currentRole, setRole } = useAppStore();
  const { data: user, isLoading } = useCurrentUserQuery();

  const [viewState, setViewState] = useState<'landing' | 'auth' | 'app'>('landing');
  const [authInitialView, setAuthInitialView] = useState<'login' | 'register'>('login');
  const [authInitialRole, setAuthInitialRole] = useState<Role>('teacher');
  const [showConfetti, setShowConfetti] = useState(false);

  // Expose global confetti trigger for quiz victories etc.
  useEffect(() => {
    (window as any).__triggerConfetti = () => {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4500);
    };
    return () => { delete (window as any).__triggerConfetti; };
  }, []);

  // Listen to global unauthorized event
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
      teacher: { id: 'demo-teacher', name: 'Prof. Kamran Tariq', email: 'kamran@fast.edu.pk', role: 'teacher' },
      student: { id: 'demo-student', name: 'Ahmed Ali', email: 'ahmed@student.edu.pk', role: 'student' },
      admin: { id: 'demo-admin', name: 'Dean Tariq Mehmood', email: 'admin@college.edu.pk', role: 'admin' },
      guest: { id: 'demo-guest', name: 'Guest Observer', email: 'guest@example.com', role: 'guest' },
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
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center font-sans" role="status" aria-label="Loading application">
        <div className="relative w-12 h-12 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20" />
          <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
        </div>
        <p className="text-slate-400 text-sm font-semibold">Verifying secure curriculum session...</p>
      </div>
    );
  }

  if (viewState === 'landing' && !user) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><PageLoader /></div>}>
        <LandingPage onNavigateToAuth={handleNavigateToAuth} onExploreDemo={handleExploreDemo} />
      </Suspense>
    );
  }

  if ((viewState === 'auth' || !user) && viewState !== 'landing') {
    return (
      <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><PageLoader /></div>}>
        <AuthPage initialView={authInitialView} initialRole={authInitialRole} onBackToLanding={() => setViewState('landing')} />
      </Suspense>
    );
  }

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
        <Suspense fallback={<PageLoader />}>
          <LandingPage onNavigateToAuth={handleNavigateToAuth} onExploreDemo={handleExploreDemo} />
        </Suspense>
      </div>
    );
  }

  // Role-Based Screen Router with Strict RBAC guards
  const renderActiveTab = () => {
    if (currentRole === 'student' && (activeTab === 'analytics' || activeTab === 'gradebook' || activeTab === 'settings')) {
      return <Dashboard />;
    }
    if (currentRole === 'teacher' && (activeTab === 'analytics' || activeTab === 'settings')) {
      return <Dashboard />;
    }

    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'classes': return <Classes />;
      case 'ai-tools': return <AiTools />;
      case 'quizzes': return <QuizEngine />;
      case 'analytics': return <AnalyticsDashboard />;
      case 'gradebook': return <Gradebook />;
      case 'resources': return <Resources />;
      case 'settings': return <Settings />;
      case 'help-center': return <HelpCenter />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout onNavigateToLanding={() => setViewState('landing')}>
      <Suspense fallback={<PageLoader />}>
        {renderActiveTab()}
      </Suspense>
      {/* Global confetti overlay for victories */}
      <Confetti active={showConfetti} />
    </Layout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </QueryClientProvider>
  );
}
