/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export interface ToastProps {
  id: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({
  id,
  message,
  type = 'info',
  duration = 4000,
  onClose,
}) => {
  useEffect(() => {
    if (duration === 0) return;
    const timer = setTimeout(() => onClose(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const styleConfig = {
    info: {
      bg: 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100',
      icon: <Info className="w-5 h-5 text-blue-500" />,
    },
    success: {
      bg: 'bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-900 text-slate-800 dark:text-slate-100',
      icon: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    },
    warning: {
      bg: 'bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-900 text-slate-800 dark:text-slate-100',
      icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    },
    error: {
      bg: 'bg-white dark:bg-slate-900 border-rose-200 dark:border-rose-900 text-slate-800 dark:text-slate-100',
      icon: <AlertCircle className="w-5 h-5 text-rose-500" />,
    },
  };

  const currentStyle = styleConfig[type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -15, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`flex items-center gap-3 p-4 rounded-xl border shadow-lg max-w-sm w-full z-50 ${currentStyle.bg}`}
    >
      <div className="shrink-0">{currentStyle.icon}</div>
      <p className="flex-grow text-xs font-semibold leading-relaxed">{message}</p>
      <button
        onClick={() => onClose(id)}
        aria-label="Dismiss toast"
        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

// Simple container to hold multiple toasts
export interface ToastContainerProps {
  toasts: Omit<ToastProps, 'onClose'>[];
  onClose: (id: string) => void;
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onClose,
  position = 'bottom-right',
}) => {
  const positionClasses = {
    'top-right': 'top-6 right-6 flex-col-reverse',
    'bottom-right': 'bottom-6 right-6 flex-col',
    'top-left': 'top-6 left-6 flex-col-reverse',
    'bottom-left': 'bottom-6 left-6 flex-col',
  };

  return (
    <div className={`fixed z-50 flex gap-2 pointer-events-none ${positionClasses[position]}`}>
      <AnimatePresence>
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast {...toast} onClose={onClose} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};
