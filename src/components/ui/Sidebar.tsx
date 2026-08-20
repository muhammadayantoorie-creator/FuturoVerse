/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface SidebarItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  badge?: string | number;
}

export interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  items: SidebarItem[];
  activeId: string;
  onActiveIdChange: (id: string) => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  isRtl?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  items,
  activeId,
  onActiveIdChange,
  header,
  footer,
  isRtl = false,
  className = '',
  ...props
}) => {
  return (
    <aside
      className={`flex flex-col h-full bg-slate-50 dark:bg-slate-900 border-r dark:border-slate-800 p-6 gap-4 select-none ${
        isRtl ? 'border-l border-r-0' : 'border-r'
      } ${className}`}
      dir={isRtl ? 'rtl' : 'ltr'}
      {...props}
    >
      {header && <div className="mb-2">{header}</div>}

      <nav className="flex-1 flex flex-col gap-1.5 overflow-y-auto custom-scrollbar">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onActiveIdChange(item.id)}
              className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 font-sans text-sm select-none cursor-pointer group ${
                isActive
                  ? 'bg-primary-container text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-4">
                {Icon && (
                  <Icon
                    className={`w-5 h-5 ${
                      isActive ? 'stroke-[2.5px]' : 'stroke-[1.8px] text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'
                    }`}
                  />
                )}
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-primary-container/10 text-primary dark:bg-blue-900/40 dark:text-blue-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {footer && <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-800">{footer}</div>}
    </aside>
  );
};
