import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  X, 
  Check, 
  HelpCircle, 
  GraduationCap, 
  BookOpen, 
  AlertTriangle, 
  Sparkles, 
  ChevronRight,
  Clock,
  UserPlus
} from 'lucide-react';
import { useAppStore } from '@/src/store/useAppStore';

interface NotificationPopoverProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationPopover: React.FC<NotificationPopoverProps> = ({ isOpen, onClose }) => {
  const {
    locale,
    notifications,
    notificationCount,
    fetchNotifications,
    clearNotification,
    markNotificationAsRead,
    markAllNotificationsRead,
    clearAllNotifications,
    setActiveTab,
  } = useAppStore();

  const isRtl = locale === 'ur';
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, onClose]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === 'unread') return !notif.read;
    return true;
  });

  const getNotificationIcon = (title: string, message: string, type?: string) => {
    const text = `${title} ${message} ${type || ''}`.toLowerCase();
    if (text.includes('quiz') || text.includes('test') || text.includes('assessment')) {
      return { icon: HelpCircle, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800' };
    }
    if (text.includes('invite') || text.includes('joined') || text.includes('enrolled') || text.includes('student')) {
      return { icon: UserPlus, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' };
    }
    if (text.includes('class') || text.includes('curriculum') || text.includes('course')) {
      return { icon: GraduationCap, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800' };
    }
    if (text.includes('material') || text.includes('pdf') || text.includes('resource') || text.includes('document')) {
      return { icon: BookOpen, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' };
    }
    if (text.includes('alert') || text.includes('warning') || text.includes('danger') || text.includes('dropped')) {
      return { icon: AlertTriangle, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800' };
    }
    if (text.includes('ai') || text.includes('generated') || text.includes('processed')) {
      return { icon: Sparkles, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800' };
    }
    return { icon: Bell, color: 'text-slate-500 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700' };
  };

  const getRelativeTime = (isoString?: string) => {
    if (!isoString) return isRtl ? 'ابھی' : 'Just now';
    try {
      const now = Date.now();
      const time = new Date(isoString).getTime();
      const diffSecs = Math.max(0, Math.floor((now - time) / 1000));
      if (diffSecs < 60) return isRtl ? 'ابھی' : 'Just now';
      const diffMins = Math.floor(diffSecs / 60);
      if (diffMins < 60) return isRtl ? `${diffMins} منٹ پہلے` : `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return isRtl ? `${diffHours} گھنٹے پہلے` : `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return isRtl ? `${diffDays} دن پہلے` : `${diffDays}d ago`;
    } catch {
      return isRtl ? 'حال ہی میں' : 'Recently';
    }
  };

  const handleNotificationClick = (notif: any) => {
    if (!notif.read) {
      markNotificationAsRead(notif.id);
    }
    const text = `${notif.title} ${notif.message}`.toLowerCase();
    if (text.includes('quiz')) {
      setActiveTab('quizzes');
    } else if (text.includes('class') || text.includes('student') || text.includes('invite')) {
      setActiveTab('classes');
    } else if (text.includes('material') || text.includes('resource') || text.includes('pdf')) {
      setActiveTab('resources');
    } else if (text.includes('score') || text.includes('grade')) {
      setActiveTab('gradebook');
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={popoverRef}
          initial={{ opacity: 0, y: -8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.96 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className={`absolute top-full mt-2.5 z-50 w-[360px] sm:w-[420px] max-w-[calc(100vw-24px)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden ${
            isRtl ? 'left-0 sm:left-auto sm:right-auto' : 'right-0'
          }`}
          style={{ maxHeight: '80vh' }}
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 rounded-lg text-blue-600 dark:text-blue-400">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <span>{isRtl ? 'اطلاعات و الرٹس' : 'Notifications'}</span>
                  {notificationCount > 0 && (
                    <span className="px-1.5 py-0.5 bg-rose-500 text-white rounded-full text-[10px] font-extrabold leading-none">
                      {notificationCount}
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {notificationCount === 0 
                    ? (isRtl ? 'تمام اطلاعات دیکھ لی گئی ہیں' : 'All caught up')
                    : (isRtl ? `${notificationCount} غیر پڑھی اطلاعات` : `${notificationCount} unread update${notificationCount > 1 ? 's' : ''}`)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {notificationCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllNotificationsRead()}
                  className="p-1.5 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title={isRtl ? 'سب کو پڑھا ہوا نشان زد کریں' : 'Mark all as read'}
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={() => clearAllNotifications()}
                  className="p-1.5 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title={isRtl ? 'تمام اطلاعات حذف کریں' : 'Clear all'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  filter === 'all'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {isRtl ? 'تمام' : 'All'} ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('unread')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  filter === 'unread'
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {isRtl ? 'غیر پڑھی' : 'Unread'} ({notificationCount})
              </button>
            </div>
          )}

          {/* Notifications List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 custom-scrollbar">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                  <Bell className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {filter === 'unread' 
                      ? (isRtl ? 'کوئی غیر پڑھی اطلاع نہیں ہے' : 'No unread notifications')
                      : (isRtl ? 'کوئی نئی اطلاع موجود نہیں ہے' : 'No notifications right now')}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isRtl ? 'جب کوئی سرگرمی ہوگی تو وہ یہاں نظر آئے گی۔' : 'Updates about quizzes, students, and curriculum will appear here.'}
                  </p>
                </div>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const { icon: IconComp, color: iconStyle } = getNotificationIcon(notif.title, notif.message, notif.type);
                const isUnread = !notif.read;

                return (
                  <div
                    key={notif.id}
                    className={`group relative p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                      isUnread 
                        ? 'bg-blue-50/40 hover:bg-blue-50/80 dark:bg-blue-950/20 dark:hover:bg-blue-950/40' 
                        : 'bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/50'
                    }`}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    {/* Unread indicator bar */}
                    {isUnread && (
                      <span className="absolute top-4 left-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full" />
                    )}

                    {/* Icon */}
                    <div className={`p-2 rounded-xl border shrink-0 mt-0.5 ${iconStyle}`}>
                      <IconComp className="w-4 h-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-grow min-w-0 pr-6">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <h4 className={`text-xs font-bold truncate ${isUnread ? 'text-slate-900 dark:text-slate-50' : 'text-slate-700 dark:text-slate-300'}`}>
                          {notif.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {getRelativeTime(notif.createdAt)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>

                    {/* Actions on Hover */}
                    <div 
                      className="absolute right-2.5 top-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs p-1 rounded-lg shadow-xs"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isUnread && (
                        <button
                          type="button"
                          onClick={() => markNotificationAsRead(notif.id)}
                          className="p-1 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                          title={isRtl ? 'پڑھا ہوا نشان لگائیں' : 'Mark as read'}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => clearNotification(notif.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                        title={isRtl ? 'حذف کریں' : 'Delete'}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">
              {isRtl ? 'کلاس روم نوٹیفکیشن سسٹم' : 'Live System Activity'}
            </span>
            <button
              type="button"
              onClick={() => {
                fetchNotifications();
              }}
              className="text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
            >
              {isRtl ? 'تازہ کریں' : 'Refresh'}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
