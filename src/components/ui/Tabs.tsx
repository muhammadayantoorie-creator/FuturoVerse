/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  variant?: 'line' | 'pill';
  fullWidth?: boolean;
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  activeId,
  onChange,
  variant = 'line',
  fullWidth = false,
}) => {
  return (
    <div
      role="tablist"
      aria-label="Content Tabs"
      className={`flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 ${
        variant === 'pill' ? 'bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl border-b-0' : ''
      }`}
    >
      {items.map((item) => {
        const isActive = activeId === item.id;
        return (
          <button
            key={item.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tab-panel-${item.id}`}
            id={`tab-trigger-${item.id}`}
            onClick={() => onChange(item.id)}
            className={`relative flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold select-none cursor-pointer focus:outline-none transition-all ${
              fullWidth ? 'flex-1' : ''
            } ${
              variant === 'pill'
                ? isActive
                  ? 'text-slate-900 dark:text-white'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                : isActive
                ? 'text-primary dark:text-blue-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {item.icon && <span className="shrink-0">{item.icon}</span>}
            <span>{item.label}</span>

            {/* Active Highlight sliding transitions */}
            {isActive && variant === 'pill' && (
              <motion.div
                layoutId="active-pill-tab"
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                className="absolute inset-0 bg-white dark:bg-slate-800 rounded-lg shadow-xs -z-10"
              />
            )}

            {isActive && variant === 'line' && (
              <motion.div
                layoutId="active-line-tab"
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary dark:bg-blue-500"
              />
            )}
          </button>
        );
      })}
    </div>
  );
};

export interface TabPanelProps {
  id: string;
  activeId: string;
  children: React.ReactNode;
}

export const TabPanel: React.FC<TabPanelProps> = ({ id, activeId, children }) => {
  if (activeId !== id) return null;

  return (
    <div
      role="tabpanel"
      id={`tab-panel-${id}`}
      aria-labelledby={`tab-trigger-${id}`}
      tabIndex={0}
      className="py-4 focus:outline-none"
    >
      {children}
    </div>
  );
};
