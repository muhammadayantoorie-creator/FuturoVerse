/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ChevronDown } from 'lucide-react';
import { Spinner } from './Spinner';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options?: SelectOption[];
  error?: string;
  isRtl?: boolean;
  loading?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options = [],
  error,
  isRtl = false,
  loading = false,
  disabled = false,
  className = '',
  id,
  children,
  ...props
}) => {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`w-full flex flex-col gap-1.5 ${isRtl ? 'rtl' : 'ltr'}`}>
      {label && (
        <label 
          htmlFor={selectId}
          className={`font-sans font-semibold text-xs text-on-surface select-none dark:text-slate-300 ${isRtl ? 'text-right' : 'text-left'}`}
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        <select
          id={selectId}
          disabled={disabled || loading}
          className={`w-full appearance-none bg-surface-container-low dark:bg-slate-900 border border-outline-variant dark:border-slate-800 rounded-xl py-2.5 px-4 focus:outline-none focus:border-primary dark:focus:border-primary-fixed-dim focus:ring-1 focus:ring-primary dark:focus:ring-primary-fixed-dim font-sans text-sm text-slate-900 dark:text-slate-100 transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${
            isRtl ? 'pl-10 text-right' : 'pr-10 text-left'
          } ${error ? 'border-error focus:ring-error focus:border-error' : ''} ${className}`}
          {...props}
        >
          {children || options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
              {opt.label}
            </option>
          ))}
        </select>
        <div className={`absolute ${isRtl ? 'left-3' : 'right-3'} pointer-events-none z-10 flex items-center`}>
          {loading ? (
            <Spinner size="xs" variant="primary" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </div>
      {error && (
        <span className={`text-xs text-error dark:text-red-400 font-semibold ${isRtl ? 'text-right' : 'text-left'}`}>
          {error}
        </span>
      )}
    </div>
  );
};
