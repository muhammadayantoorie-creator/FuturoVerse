/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  active?: boolean;
}

export interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  showHome?: boolean;
  onHomeClick?: () => void;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  separator = <ChevronRight className="w-4 h-4 text-slate-400" />,
  showHome = true,
  onHomeClick,
  className = '',
  ...props
}) => {
  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center text-sm font-sans select-none ${className}`}
      {...props}
    >
      <ol className="inline-flex items-center space-x-1.5 md:space-x-2">
        {showHome && (
          <li className="inline-flex items-center">
            <button
              onClick={onHomeClick}
              className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors font-medium cursor-pointer"
            >
              <Home className="w-4 h-4" />
            </button>
          </li>
        )}

        {items.map((item, idx) => (
          <li key={idx} className="inline-flex items-center gap-1.5 md:gap-2">
            {(showHome || idx > 0) && (
              <span className="rtl-flip flex items-center">{separator}</span>
            )}
            {item.active ? (
              <span
                aria-current="page"
                className="font-semibold text-slate-800 dark:text-slate-100"
              >
                {item.label}
              </span>
            ) : (
              <button
                onClick={item.onClick}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors font-medium cursor-pointer"
              >
                {item.label}
              </button>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};
