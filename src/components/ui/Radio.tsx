/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  isRtl?: boolean;
}

export const Radio: React.FC<RadioProps> = ({
  label,
  isRtl = false,
  disabled = false,
  className = '',
  id,
  ...props
}) => {
  const radioId = id || `radio-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <label 
      htmlFor={radioId}
      className={`inline-flex items-center gap-3 cursor-pointer select-none ${isRtl ? 'flex-row-reverse' : ''} ${disabled ? 'opacity-50 pointer-events-none' : ''} ${className}`}
    >
      <div className="relative flex items-center justify-center">
        <input
          type="radio"
          id={radioId}
          disabled={disabled}
          className="peer sr-only"
          {...props}
        />
        <div className="w-5 h-5 bg-surface-container-low dark:bg-slate-900 border border-outline-variant dark:border-slate-800 rounded-full transition-all peer-checked:border-[6px] peer-checked:border-primary-container dark:peer-checked:border-blue-600 peer-focus-visible:ring-2 peer-focus-visible:ring-primary" />
      </div>
      {label && (
        <span className="font-sans text-sm font-medium text-on-surface dark:text-slate-200">
          {label}
        </span>
      )}
    </label>
  );
};
