/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Button } from '@/src/components/shared/Button';
import { translations } from '@/src/config/i18n';
import { Locale } from '@/src/types';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
  isRtl?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon = 'inbox',
  actionLabel,
  onAction,
  isRtl = false,
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-xl text-center select-none ${isRtl ? 'rtl' : 'ltr'}`}>
      <div className="w-16 h-16 rounded-full bg-surface-container mb-4 flex items-center justify-center text-outline/80">
        <span className="material-symbols-outlined text-3xl" data-icon={icon}>{icon}</span>
      </div>
      <h3 className="font-headline-md text-headline-md text-on-background mb-2">{title}</h3>
      <p className="font-body-md text-body-md text-on-surface-variant max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
