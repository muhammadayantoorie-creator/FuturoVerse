/**
 * Global Toast Notification System
 * Lightweight, zero-dependency toast with animations, icons, and auto-dismiss.
 */
import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastType, React.FC<{ className?: string }>> = {
  success: ({ className }) => <CheckCircle2 className={className} />,
  error: ({ className }) => <XCircle className={className} />,
  info: ({ className }) => <Info className={className} />,
  warning: ({ className }) => <AlertTriangle className={className} />,
};

const COLORS: Record<ToastType, { bg: string; border: string; icon: string; bar: string }> = {
  success: {
    bg: 'bg-emerald-950/95 dark:bg-emerald-950/95',
    border: 'border-emerald-500/40',
    icon: 'text-emerald-400',
    bar: 'bg-emerald-500',
  },
  error: {
    bg: 'bg-rose-950/95 dark:bg-rose-950/95',
    border: 'border-rose-500/40',
    icon: 'text-rose-400',
    bar: 'bg-rose-500',
  },
  info: {
    bg: 'bg-slate-900/95 dark:bg-slate-950/95',
    border: 'border-teal-500/40',
    icon: 'text-teal-400',
    bar: 'bg-teal-500',
  },
  warning: {
    bg: 'bg-amber-950/95 dark:bg-amber-950/95',
    border: 'border-amber-500/40',
    icon: 'text-amber-400',
    bar: 'bg-amber-500',
  },
};

const ToastItem: React.FC<{ toast: Toast; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(100);
  const duration = toast.duration ?? 4000;
  const colors = COLORS[toast.type];
  const Icon = ICONS[toast.type];

  useEffect(() => {
    // Trigger enter animation
    const enterTimer = setTimeout(() => setVisible(true), 10);
    // Progress bar countdown
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining === 0) clearInterval(interval);
    }, 50);
    // Auto-dismiss
    const exitTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(toast.id), 300);
    }, duration);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
      clearInterval(interval);
    };
  }, [toast.id, duration, onRemove]);

  return (
    <div
      className={`relative overflow-hidden flex items-start gap-3 px-4 py-3 rounded-2xl border backdrop-blur-xl shadow-2xl min-w-[300px] max-w-[380px] transition-all duration-300 ease-out ${colors.bg} ${colors.border} ${
        visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'
      }`}
      role="alert"
      aria-live="assertive"
    >
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 h-0.5 transition-all duration-75 ease-linear rounded-full" style={{ width: `${progress}%`, backgroundColor: COLORS[toast.type].bar.replace('bg-', '') }} />
      <div className={`absolute bottom-0 left-0 h-0.5 rounded-full ${colors.bar}`} style={{ width: `${progress}%`, transition: 'width 50ms linear' }} />

      {/* Icon */}
      <div className={`mt-0.5 shrink-0 ${colors.icon}`}>
        <Icon className="w-5 h-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white leading-tight">{toast.title}</p>
        {toast.message && (
          <p className="text-xs text-slate-300 mt-0.5 leading-snug">{toast.message}</p>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(() => onRemove(toast.id), 300);
        }}
        className="shrink-0 p-0.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts(prev => [...prev.slice(-4), { ...toast, id }]); // max 5 toasts
  }, []);

  const success = useCallback((title: string, message?: string) => addToast({ type: 'success', title, message }), [addToast]);
  const error = useCallback((title: string, message?: string) => addToast({ type: 'error', title, message }), [addToast]);
  const info = useCallback((title: string, message?: string) => addToast({ type: 'info', title, message }), [addToast]);
  const warning = useCallback((title: string, message?: string) => addToast({ type: 'warning', title, message }), [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, info, warning }}>
      {children}
      {/* Toast Container - bottom right */}
      <div
        className="fixed bottom-24 right-4 z-[9999] flex flex-col gap-2 items-end pointer-events-none"
        aria-label="Notifications"
      >
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
};
