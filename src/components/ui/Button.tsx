/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Spinner } from './Spinner';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outlined' | 'ghost' | 'ai-action' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  className = '',
  children,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-sans font-semibold rounded-xl transition-all duration-200 outline-none select-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary dark:focus-visible:ring-primary-fixed-dim disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] cursor-pointer';
  
  const variantStyles = {
    primary: 'bg-primary-container text-on-primary-container hover:bg-primary hover:text-white dark:bg-emerald-600 dark:text-white dark:hover:bg-emerald-700 shadow-xs',
    secondary: 'bg-secondary-container text-on-secondary-container hover:brightness-95 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 border border-outline-variant/30',
    outlined: 'bg-transparent border border-outline-variant text-on-surface hover:bg-slate-100 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-800',
    ghost: 'text-on-surface-variant hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
    'ai-action': 'bg-gradient-to-r from-primary to-secondary text-white shadow-md hover:shadow-lg dark:from-emerald-600 dark:to-teal-600',
    danger: 'bg-error-container text-on-error-container hover:bg-error hover:text-white dark:bg-red-950 dark:text-red-200 dark:hover:bg-red-900',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3.5 text-base rounded-2xl gap-2.5',
  };

  return (
    <button
      disabled={disabled || loading}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {loading && (
        <Spinner 
          size="xs" 
          variant={variant === 'primary' || variant === 'ai-action' ? 'white' : 'primary'} 
          className="mr-1"
        />
      )}
      {!loading && leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
      <span>{children}</span>
      {!loading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
    </button>
  );
};
