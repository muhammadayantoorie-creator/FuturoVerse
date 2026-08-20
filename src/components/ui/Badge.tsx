/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'error';
  styleType?: 'filled' | 'tonal' | 'outlined';
  pill?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'primary',
  styleType = 'tonal',
  pill = false,
  className = '',
  children,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center px-2.5 py-1 text-xs font-semibold select-none';
  
  const shapeClass = pill ? 'rounded-full' : 'rounded-lg';

  const styleClasses = {
    primary: {
      filled: 'bg-primary-container text-white',
      tonal: 'bg-[#e5eeff] text-primary dark:bg-blue-950/40 dark:text-blue-300',
      outlined: 'border border-primary text-primary dark:border-blue-400 dark:text-blue-400 bg-transparent',
    },
    secondary: {
      filled: 'bg-secondary text-white',
      tonal: 'bg-[#6df5e1]/10 text-on-secondary-container dark:bg-teal-950/40 dark:text-teal-300',
      outlined: 'border border-secondary text-secondary dark:border-teal-400 dark:text-teal-400 bg-transparent',
    },
    tertiary: {
      filled: 'bg-tertiary text-white',
      tonal: 'bg-[#ffb95f]/15 text-tertiary dark:bg-amber-950/40 dark:text-amber-300',
      outlined: 'border border-tertiary text-tertiary dark:border-amber-400 dark:text-amber-400 bg-transparent',
    },
    success: {
      filled: 'bg-emerald-600 text-white',
      tonal: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
      outlined: 'border border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400 bg-transparent',
    },
    danger: {
      filled: 'bg-error text-white',
      tonal: 'bg-error-container text-on-error-container dark:bg-red-950/40 dark:text-red-300',
      outlined: 'border border-error text-error dark:border-red-400 dark:text-red-400 bg-transparent',
    },
    warning: {
      filled: 'bg-amber-500 text-slate-900',
      tonal: 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
      outlined: 'border border-amber-500 text-amber-500 dark:border-amber-400 dark:text-amber-400 bg-transparent',
    },
    info: {
      filled: 'bg-cyan-500 text-white',
      tonal: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300',
      outlined: 'border border-cyan-500 text-cyan-500 dark:border-cyan-400 dark:text-cyan-400 bg-transparent',
    },
    neutral: {
      filled: 'bg-slate-600 text-white',
      tonal: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      outlined: 'border border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300 bg-transparent',
    },
    error: {
      filled: 'bg-error text-white',
      tonal: 'bg-error-container text-on-error-container dark:bg-red-950/40 dark:text-red-300',
      outlined: 'border border-error text-error dark:border-red-400 dark:text-red-400 bg-transparent',
    },
  };

  const selectedVariant = (styleClasses[variant as keyof typeof styleClasses] ? variant : 'primary') as keyof typeof styleClasses;
  const styleClass = styleClasses[selectedVariant][styleType] || styleClasses[selectedVariant]['tonal'];

  return (
    <span
      className={`${baseStyles} ${shapeClass} ${styleClass} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
