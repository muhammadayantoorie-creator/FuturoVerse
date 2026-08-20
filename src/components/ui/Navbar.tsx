/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export interface NavbarProps extends React.HTMLAttributes<HTMLElement> {
  logo?: React.ReactNode;
  navItems?: React.ReactNode;
  actions?: React.ReactNode;
  isSticky?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  logo,
  navItems,
  actions,
  isSticky = true,
  className = '',
  ...props
}) => {
  return (
    <header
      className={`h-16 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between shadow-xs z-30 transition-all ${
        isSticky ? 'sticky top-0' : ''
      } ${className}`}
      {...props}
    >
      {/* Brand logo section */}
      <div className="flex items-center gap-3 shrink-0">
        {logo}
      </div>

      {/* Navigation center links (desktop) */}
      {navItems && (
        <nav className="hidden md:flex items-center gap-1">
          {navItems}
        </nav>
      )}

      {/* User profile & controls section */}
      <div className="flex items-center gap-3">
        {actions}
      </div>
    </header>
  );
};
