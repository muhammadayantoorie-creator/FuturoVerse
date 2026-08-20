/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Check } from 'lucide-react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  isRtl?: boolean;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  isRtl = false,
  disabled = false,
  className = '',
  id,
  checked,
  ...props
}) => {
  const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <label 
      htmlFor={checkboxId}
      className={`inline-flex items-center gap-3 cursor-pointer select-none disabled:opacity-50 ${isRtl ? 'flex-row-reverse' : ''} ${disabled ? 'opacity-50 pointer-events-none' : ''} ${className}`}
    >
      <div className="relative flex items-center justify-center">
        <input
          type="checkbox"
          id={checkboxId}
          disabled={disabled}
          checked={checked}
          className="peer sr-only"
          {...props}
        />
        <div className="w-5 h-5 bg-surface-container-low dark:bg-slate-900 border border-outline-variant dark:border-slate-800 rounded-md transition-all peer-checked:bg-primary-container peer-checked:border-primary-container dark:peer-checked:bg-blue-600 dark:peer-checked:border-blue-600 peer-focus-visible:ring-2 peer-focus-visible:ring-primary dark:peer-focus-visible:ring-primary-fixed-dim" />
        <Check className="absolute w-3.5 h-3.5 text-white scale-0 transition-transform peer-checked:scale-100" />
      </div>
      {label && (
        <span className="font-sans text-sm font-medium text-on-surface dark:text-slate-200">
          {label}
        </span>
      )}
    </label>
  );
};
