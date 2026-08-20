/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

export interface AlertProps {
  title?: string;
  description: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  closable?: boolean;
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  title,
  description,
  type = 'info',
  closable = false,
  onClose,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const styleConfig = {
    info: {
      container: 'bg-[#e5eeff]/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/60 text-blue-800 dark:text-blue-300',
      icon: <Info className="w-5 h-5 text-blue-500" />,
    },
    success: {
      container: 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300',
      icon: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    },
    warning: {
      container: 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300',
      icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    },
    error: {
      container: 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-300',
      icon: <AlertCircle className="w-5 h-5 text-red-500" />,
    },
  };

  const currentStyle = styleConfig[type];

  const handleDismiss = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  return (
    <div
      role="alert"
      className={`flex gap-3 p-4 rounded-xl border text-sm font-sans transition-all duration-300 ${currentStyle.container} ${className}`}
    >
      <div className="shrink-0">{currentStyle.icon}</div>
      <div className="flex-grow space-y-1">
        {title && <h5 className="font-bold text-slate-900 dark:text-slate-100">{title}</h5>}
        <p className="text-xs font-semibold leading-relaxed opacity-90">{description}</p>
      </div>
      {closable && (
        <button
          onClick={handleDismiss}
          aria-label="Close alert"
          className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors cursor-pointer shrink-0 self-start"
        >
          <X className="w-4 h-4 text-current" />
        </button>
      )}
    </div>
  );
};
