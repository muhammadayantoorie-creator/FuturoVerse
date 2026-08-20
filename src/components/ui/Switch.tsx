/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  isRtl?: boolean;
}

export const Switch: React.FC<SwitchProps> = ({
  label,
  isRtl = false,
  disabled = false,
  className = '',
  id,
  checked,
  onChange,
  ...props
}) => {
  const switchId = id || `switch-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <label 
      htmlFor={switchId}
      className={`inline-flex items-center gap-3 cursor-pointer select-none ${isRtl ? 'flex-row-reverse' : ''} ${disabled ? 'opacity-50 pointer-events-none' : ''} ${className}`}
    >
      <div className="relative">
        <input
          type="checkbox"
          id={switchId}
          disabled={disabled}
          checked={checked}
          onChange={onChange}
          role="switch"
          aria-checked={checked}
          className="peer sr-only"
          {...props}
        />
        <div className="w-10 h-6 bg-slate-200 dark:bg-slate-800 rounded-full transition-colors peer-checked:bg-primary-container dark:peer-checked:bg-blue-600 peer-focus-visible:ring-2 peer-focus-visible:ring-primary" />
        <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white dark:bg-slate-300 rounded-full shadow-sm transition-transform peer-checked:translate-x-4" />
      </div>
      {label && (
        <span className="font-sans text-sm font-medium text-on-surface dark:text-slate-200">
          {label}
        </span>
      )}
    </label>
  );
};
