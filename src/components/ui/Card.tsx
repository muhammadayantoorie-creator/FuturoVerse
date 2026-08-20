/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hoverable?: boolean;
  variant?: 'elevated' | 'outlined' | 'flat';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverable = false,
  variant = 'elevated',
  ...props
}) => {
  const variantStyles = {
    elevated: 'bg-white dark:bg-slate-900 border border-outline-variant/30 dark:border-slate-800 shadow-sm',
    outlined: 'bg-transparent border border-outline-variant dark:border-slate-800',
    flat: 'bg-surface-container-low dark:bg-slate-900 border border-transparent',
  };

  return (
    <div
      className={`rounded-xl p-6 transition-all duration-300 ${variantStyles[variant]} ${
        hoverable ? 'hover:shadow-md hover:border-primary/20 dark:hover:border-blue-500/30 hover:-translate-y-0.5' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
