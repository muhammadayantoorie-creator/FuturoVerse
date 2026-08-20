/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'rect' | 'circle';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rect',
  ...props
}) => {
  const baseStyles = 'bg-slate-200/60 dark:bg-slate-800/60 animate-pulse';
  
  const variantStyles = {
    text: 'h-4 w-3/4 rounded-md',
    rect: 'h-12 w-full rounded-xl',
    circle: 'h-12 w-12 rounded-full',
  };

  return (
    <div 
      className={`${baseStyles} ${variantStyles[variant]} ${className}`} 
      {...props}
    />
  );
};
