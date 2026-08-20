/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'away' | 'none';
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = '',
  name = '',
  size = 'md',
  status = 'none',
  className = '',
  ...props
}) => {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-2xl',
  };

  const statusSizeClasses = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3.5 h-3.5 border-2',
    xl: 'w-5 h-5 border-2',
  };

  const statusColors = {
    online: 'bg-emerald-500',
    offline: 'bg-slate-400',
    away: 'bg-amber-500',
    none: '',
  };

  const getInitials = (fullName: string) => {
    if (!fullName) return '';
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const showFallback = hasError || !src;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full select-none ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {showFallback ? (
        <div className="w-full h-full rounded-full bg-primary-container text-on-primary-container dark:bg-blue-900 dark:text-blue-100 flex items-center justify-center font-bold">
          {getInitials(name || alt) || '?'}
        </div>
      ) : (
        <img
          src={src}
          alt={alt || name}
          onError={() => setHasError(true)}
          className="w-full h-full rounded-full object-cover"
          referrerPolicy="no-referrer"
        />
      )}
      {status !== 'none' && (
        <span
          className={`absolute bottom-0 right-0 rounded-full border border-white dark:border-slate-900 ${statusSizeClasses[size]} ${statusColors[status]}`}
        />
      )}
    </div>
  );
};
