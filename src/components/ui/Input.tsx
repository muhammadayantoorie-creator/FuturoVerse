/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useId } from 'react';
import { Spinner } from './Spinner';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  isRtl?: boolean;
  loading?: boolean;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input: React.FC<InputProps> = React.memo(({
  label,
  error,
  isRtl = false,
  loading = false,
  disabled = false,
  leftElement,
  rightElement,
  className = '',
  id,
  ...props
}) => {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className={`w-full flex flex-col gap-1.5 ${isRtl ? 'rtl' : 'ltr'}`}>
      {label && (
        <label 
          htmlFor={inputId}
          className={`font-sans font-semibold text-xs text-on-surface select-none dark:text-slate-300 ${isRtl ? 'text-right' : 'text-left'}`}
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftElement && (
          <div className={`absolute ${isRtl ? 'right-3' : 'left-3'} z-10 flex items-center text-slate-400`}>
            {leftElement}
          </div>
        )}
        <input
          id={inputId}
          disabled={disabled || loading}
          className={`w-full bg-surface-container-low dark:bg-slate-900 border border-outline-variant dark:border-slate-800 rounded-xl py-2.5 focus:outline-none focus:border-primary dark:focus:border-primary-fixed-dim focus:ring-1 focus:ring-primary dark:focus:ring-primary-fixed-dim font-sans text-sm text-slate-900 dark:text-slate-100 transition-colors duration-150 placeholder:text-outline/70 disabled:opacity-50 disabled:pointer-events-none ${
            isRtl ? 'pr-4 pl-10 text-right' : 'pl-4 pr-10 text-left'
          } ${leftElement ? (isRtl ? 'pr-10' : 'pl-10') : ''} ${
            rightElement ? (isRtl ? 'pl-10' : 'pr-10') : ''
          } ${error ? 'border-error dark:border-red-800 focus:ring-error dark:focus:ring-red-800 focus:border-error dark:focus:border-red-800' : ''} ${className}`}
          {...props}
        />
        {(rightElement || loading) && (
          <div className={`absolute ${isRtl ? 'left-3' : 'right-3'} z-10 flex items-center`}>
            {loading ? (
              <Spinner size="xs" variant="primary" />
            ) : (
              <span className="text-slate-400">{rightElement}</span>
            )}
          </div>
        )}
      </div>
      {error && (
        <span className={`text-xs text-error dark:text-red-400 font-semibold ${isRtl ? 'text-right' : 'text-left'}`}>
          {error}
        </span>
      )}
    </div>
  );
});
