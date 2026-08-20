/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rect'
}) => {
  const baseStyles = 'bg-surface-container-high/40 animate-pulse';
  
  const variantStyles = {
    text: 'h-4 w-3/4 rounded',
    rect: 'h-12 w-full rounded-xl',
    circle: 'h-12 w-12 rounded-full',
  };

  return (
    <div className={`${baseStyles} ${variantStyles[variant]} ${className}`} />
  );
};
