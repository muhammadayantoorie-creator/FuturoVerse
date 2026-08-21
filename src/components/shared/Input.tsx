/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  isRtl?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  isRtl = false,
  className = '',
  ...props
}) => {
  return (
    <div className={`w-full flex flex-col gap-1.5 ${isRtl ? 'rtl' : 'ltr'}`}>
      {label && (
        <label className={`font-label-md text-label-md text-on-surface select-none font-medium ${isRtl ? 'text-right' : 'text-left'}`}>
          {label}
        </label>
      )}
      <input
        className={`w-full bg-surface-container-low border border-outline-variant rounded-xl py-2.5 px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md transition-colors duration-150 placeholder:text-outline/70 ${
          error ? 'border-error focus:ring-error focus:border-error' : ''
        } ${isRtl ? 'text-right' : 'text-left'} ${className}`}
        {...props}
      />
      {error && (
        <span className={`text-xs text-error font-medium ${isRtl ? 'text-right' : 'text-left'}`}>
          {error}
        </span>
      )}
    </div>
  );
};
