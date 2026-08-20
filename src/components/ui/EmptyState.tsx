/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LucideIcon, HelpCircle, School, BookOpen, Inbox, Sparkles } from 'lucide-react';
import { Button } from './Button';

const iconMap: Record<string, LucideIcon> = {
  school: School,
  menu_book: BookOpen,
  inbox: Inbox,
  auto_awesome: Sparkles,
};

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon | string;
  actionLabel?: string;
  onAction?: () => void;
  isRtl?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  isRtl = false,
}) => {
  const RenderIcon = typeof icon === 'string' ? (iconMap[icon] || HelpCircle) : (icon || HelpCircle);

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-6 text-center select-none ${isRtl ? 'rtl' : 'ltr'}`}>
      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 mb-4 flex items-center justify-center text-slate-400 dark:text-slate-300">
        <RenderIcon className="w-7 h-7 text-primary dark:text-blue-400" />
      </div>
      <h3 className="font-sans font-bold text-base text-slate-800 dark:text-slate-100 mb-1.5">
        {title}
      </h3>
      <p className="font-sans text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-5 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
