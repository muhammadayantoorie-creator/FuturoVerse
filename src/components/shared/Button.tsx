/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outlined' | 'ghost' | 'ai-action' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-label-md rounded-xl font-bold transition-all duration-200 outline-none select-none disabled:opacity-50 disabled:pointer-events-none active:scale-95 cursor-pointer';
  
  const variantStyles = {
    primary: 'bg-primary-container text-on-primary-container hover:bg-surface-tint hover:text-on-primary shadow-sm hover:-translate-y-px',
    secondary: 'bg-secondary-container text-on-secondary-container hover:brightness-95 border border-outline-variant/30',
    outlined: 'bg-surface border border-outline-variant text-on-surface hover:bg-surface-container',
    ghost: 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface',
    'ai-action': 'bg-gradient-to-r from-primary to-secondary text-on-primary shadow-md hover:shadow-lg hover:-translate-y-px transition-all',
    danger: 'bg-error-container text-on-error-container hover:bg-error hover:text-on-error',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs rounded-lg',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3.5 text-base rounded-2xl',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
