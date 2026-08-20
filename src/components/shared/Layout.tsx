import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  GraduationCap, 
  Sparkles, 
  HelpCircle, 
  BarChart2, 
  ClipboardList, 
  BookOpen, 
  Settings, 
  LogOut, 
  Menu, 
  Search, 
  Moon, 
  Sun, 
  Languages, 
  Bell, 
  ChevronDown, 
  Plus,
  Home,
  ShieldCheck,
  UserCheck,
  User
} from 'lucide-react';
import { useAppStore } from '@/src/store/useAppStore';
import { getTranslation } from '@/src/config/i18n';
import { Button } from '@/src/components/shared/Button';
import { useLogoutMutation } from '@/src/features/auth/authHooks';
import { NotificationPopover } from '@/src/components/shared/NotificationPopover';
import { Role, Locale } from '@/src/types';

interface LayoutProps {
  children: React.ReactNode;
  onNavigateToLanding?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, onNavigateToLanding }) => {
  const {
    locale,
    theme,
    currentRole,
    activeTab,
    currentUser,
    notificationCount,
    setLocale,
    toggleTheme,
    setRole,
    setActiveTab,
    fetchNotifications,
    clearNotifications,
    setCreateClassModalOpen
  } = useAppStore();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const isRtl = locale === 'ur';

  // Periodically fetch notifications on mount & every 30s
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Synchronize theme with document element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Synchronize language and text direction with document element
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ur' ? 'rtl' : 'ltr';
  }, [locale]);

  const menuItems = [
    { id: 'dashboard', label: 'dashboard', icon: LayoutDashboard },
    { id: 'classes', label: 'classes', icon: GraduationCap },
    { id: 'ai-tools', label: 'aiTools', icon: Sparkles },
    { id: 'quizzes', label: 'quizzes', icon: HelpCircle },
    { id: 'resources', label: 'resources', icon: BookOpen },
    { id: 'gradebook', label: 'gradebook', icon: ClipboardList },
    { id: 'analytics', label: 'analytics', icon: BarChart2 },
  ];

  const logoutMutation = useLogoutMutation();

  const handleRealLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      if (onNavigateToLanding) {
        onNavigateToLanding();
      }
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleRoleChange = (role: Role) => {
    setRole(role);
    setIsRoleDropdownOpen(false);
  };

  const currentRoleLabel = () => {
    if (currentRole === 'admin') return '🛡️ Admin (All Access)';
    if (currentRole === 'teacher') return `👨‍🏫 ${getTranslation(locale, 'roleTeacher')}`;
    if (currentRole === 'student') return `🎓 ${getTranslation(locale, 'roleStudent')}`;
    return getTranslation(locale, 'roleGuest');
  };

  // Filter items strictly based on role
  const filteredMenuItems = menuItems.filter(item => {
    if (currentRole === 'student') {
      // Student only sees dashboard, classes, quizzes, resources, ai-tools
      return ['dashboard', 'classes', 'quizzes', 'resources', 'ai-tools'].includes(item.id);
    }
    if (currentRole === 'teacher') {
      // Teacher only sees dashboard, classes, ai-tools, quizzes, resources, gradebook (No admin analytics)
      return ['dashboard', 'classes', 'ai-tools', 'quizzes', 'resources', 'gradebook'].includes(item.id);
    }
    // Admin sees all items
    return true;
  });

  return (
    <div 
      className={`min-h-screen flex font-sans ${theme === 'dark' ? 'dark bg-slate-950 text-slate-100' : 'bg-[#f4fbf9] text-[#0a2924]'}`} 
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Desktop Sidebar */}
      <aside 
        className={`hidden md:flex flex-col h-screen fixed top-0 w-[280px] bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-40 p-6 gap-2 ${
          isRtl ? 'right-0' : 'left-0'
        }`}
      >
        <div className="mb-4 select-none flex items-center justify-between">
          <div>
            <h1 className="font-headline-md text-headline-md font-bold text-primary dark:text-teal-400">
              {getTranslation(locale, 'appName')}
            </h1>
            <p className="font-label-sm text-label-sm text-slate-500 dark:text-slate-400">
              {getTranslation(locale, 'aiPlatform')}
            </p>
          </div>
          {onNavigateToLanding && (
            <button
              onClick={onNavigateToLanding}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="View Landing Page"
            >
              <Home className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Role Badge Indicator */}
        <div className="mb-3 px-3 py-2 rounded-xl bg-slate-200/60 dark:bg-slate-800/80 border border-slate-300/40 dark:border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {currentRole === 'teacher' && <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
            {currentRole === 'student' && <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
            {currentRole === 'admin' && <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {currentRole === 'teacher' ? 'Teacher Workspace' : currentRole === 'student' ? 'Student Portal' : 'Admin All-Access'}
            </span>
          </div>
        </div>

        {/* Create Class CTA Button (Only show for Teachers) */}
        {currentRole === 'teacher' && (
          <Button 
            variant="primary" 
            className="w-full py-2.5 gap-2 mb-3 text-xs font-bold cursor-pointer"
            onClick={() => {
              setActiveTab('classes');
              setCreateClassModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4" />
            <span>{getTranslation(locale, 'createNewClass')}</span>
          </Button>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 flex flex-col gap-1 overflow-y-auto">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl transition-all duration-200 font-label-md text-xs sm:text-sm font-semibold select-none cursor-pointer ${
                  isActive 
                    ? 'bg-primary text-white font-bold shadow-xs' 
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                } ${isRtl ? 'text-right' : 'text-left'}`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
                <span>{getTranslation(locale, item.label as any)}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer/Bottom Actions */}
        <div className="mt-auto pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-1">
          <button
            onClick={() => setActiveTab('help-center')}
            className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold select-none cursor-pointer transition-all duration-200 ${
              activeTab === 'help-center'
                ? 'bg-primary text-white font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
            } ${isRtl ? 'text-right' : 'text-left'}`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>{getTranslation(locale, 'helpCenter')}</span>
          </button>

          {/* Settings button - ONLY visible for Admin */}
          {currentRole === 'admin' && (
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold select-none cursor-pointer transition-all duration-200 ${
                activeTab === 'settings'
                  ? 'bg-primary text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
              } ${isRtl ? 'text-right' : 'text-left'}`}
            >
              <Settings className="w-4 h-4" />
              <span>{getTranslation(locale, 'settings')}</span>
            </button>
          )}
          
          <button
            onClick={handleRealLogout}
            className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 dark:hover:text-rose-400 text-xs sm:text-sm font-semibold select-none cursor-pointer transition-colors ${isRtl ? 'text-right' : 'text-left'}`}
          >
            <LogOut className="w-4 h-4" />
            <span>{getTranslation(locale, 'logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div 
        className={`flex-1 flex flex-col min-h-screen ${
          isRtl ? 'md:mr-[280px]' : 'md:ml-[280px]'
        }`}
      >
        {/* Top AppBar */}
        <header className="sticky top-0 z-30 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between shadow-sm">
          {/* Mobile menu trigger */}
          <div className="flex items-center gap-4 md:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="font-headline-md text-lg font-bold text-primary dark:text-teal-400">
              {getTranslation(locale, 'appName')}
            </span>
          </div>

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 max-w-md relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder={getTranslation(locale, 'searchPlaceholder')}
              className="w-full bg-[#e5eeff]/40 dark:bg-slate-800/40 border border-transparent focus:border-slate-300 dark:focus:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-primary rounded-full py-2 pl-10 pr-4 text-xs font-sans text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none transition-all"
            />
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Landing Home Link */}
            {onNavigateToLanding && (
              <button
                onClick={onNavigateToLanding}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                title="Landing Page Overview"
              >
                <Home className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Landing Page</span>
              </button>
            )}

            {/* Quick Role Switch Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold font-sans text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                <span>{currentRoleLabel()}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {isRoleDropdownOpen && (
                <div className={`absolute top-10 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-1.5 flex flex-col gap-1 z-50 ${isRtl ? 'left-0' : 'right-0'}`}>
                  <div className="px-2 py-1 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100 dark:border-slate-700/60">
                    Switch Active View:
                  </div>
                  <button 
                    onClick={() => handleRoleChange('teacher')}
                    className={`px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 text-left select-none cursor-pointer flex items-center gap-2 ${isRtl ? 'text-right' : 'text-left'}`}
                  >
                    <span>👨‍🏫</span>
                    <span>Teacher Section</span>
                  </button>
                  <button 
                    onClick={() => handleRoleChange('student')}
                    className={`px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 text-left select-none cursor-pointer flex items-center gap-2 ${isRtl ? 'text-right' : 'text-left'}`}
                  >
                    <span>🎓</span>
                    <span>Student Section</span>
                  </button>
                  <button 
                    onClick={() => handleRoleChange('admin')}
                    className={`px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 text-left select-none cursor-pointer flex items-center gap-2 ${isRtl ? 'text-right' : 'text-left'}`}
                  >
                    <span>🛡️</span>
                    <span>Admin (All Access)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Language Switch */}
            <button 
              onClick={() => setLocale(locale === 'en' ? 'ur' : 'en')}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full cursor-pointer relative"
              title="Toggle Language"
            >
              <Languages className="w-4 h-4" />
            </button>

            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full cursor-pointer"
              title="Toggle Theme"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className={`p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full cursor-pointer relative transition-colors ${
                  isNotificationOpen ? 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400' : ''
                }`}
                title="Notifications"
                aria-label="View notifications"
                aria-expanded={isNotificationOpen}
              >
                <Bell className="w-4 h-4" />
                {notificationCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 bg-rose-500 text-white rounded-full text-[9px] font-extrabold flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-xs animate-pulse">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </button>

              <NotificationPopover 
                isOpen={isNotificationOpen} 
                onClose={() => setIsNotificationOpen(false)} 
              />
            </div>

            {/* Avatar Profile */}
            <div className="w-8 h-8 rounded-full overflow-hidden bg-primary-container border border-slate-200 dark:border-slate-700">
              <img 
                src={currentUser.avatarUrl} 
                alt={currentUser.name} 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </header>

        {/* Main Workspace Screen */}
        <main className="flex-grow p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Mobile Drawer (Overlay and Menu) */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
          />
          {/* Menu Panel */}
          <aside className={`relative w-[280px] bg-white dark:bg-slate-900 h-full p-6 flex flex-col gap-2 border-r border-slate-200 dark:border-slate-800 ${isRtl ? 'mr-auto' : 'mr-0'}`}>
            <div className="mb-4 select-none">
              <h1 className="font-headline-md text-headline-md font-bold text-primary dark:text-teal-400">
                {getTranslation(locale, 'appName')}
              </h1>
              <p className="font-label-sm text-label-sm text-slate-500 dark:text-slate-400">
                {getTranslation(locale, 'aiPlatform')}
              </p>
            </div>

            {currentRole === 'teacher' && (
              <Button 
                variant="primary" 
                className="w-full py-2.5 gap-2 mb-3 text-xs font-bold cursor-pointer"
                onClick={() => {
                  setActiveTab('classes');
                  setCreateClassModalOpen(true);
                  setIsMobileMenuOpen(false);
                }}
              >
                <Plus className="w-4 h-4" />
                <span>{getTranslation(locale, 'createNewClass')}</span>
              </Button>
            )}

            <nav className="flex-grow flex flex-col gap-1 overflow-y-auto">
              {filteredMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-left font-label-md text-xs sm:text-sm select-none cursor-pointer ${
                      isActive 
                        ? 'bg-primary text-white font-bold shadow-xs' 
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                    } ${isRtl ? 'text-right' : 'text-left'}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{getTranslation(locale, item.label as any)}</span>
                  </button>
                );
              })}
            </nav>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-1">
              <button
                onClick={() => {
                  setActiveTab('help-center');
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold select-none cursor-pointer transition-all duration-200 ${
                  activeTab === 'help-center'
                    ? 'bg-primary text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                } ${isRtl ? 'text-right' : 'text-left'}`}
              >
                <HelpCircle className="w-4 h-4" />
                <span>{getTranslation(locale, 'helpCenter')}</span>
              </button>

              {currentRole === 'admin' && (
                <button
                  onClick={() => {
                    setActiveTab('settings');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold select-none cursor-pointer transition-all duration-200 ${
                    activeTab === 'settings'
                      ? 'bg-primary text-white font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                  } ${isRtl ? 'text-right' : 'text-left'}`}
                >
                  <Settings className="w-4 h-4" />
                  <span>{getTranslation(locale, 'settings')}</span>
                </button>
              )}
              
              <button
                onClick={() => {
                  handleRealLogout();
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 text-xs sm:text-sm font-semibold select-none cursor-pointer ${isRtl ? 'text-right' : 'text-left'}`}
              >
                <LogOut className="w-4 h-4" />
                <span>{getTranslation(locale, 'logout')}</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};
