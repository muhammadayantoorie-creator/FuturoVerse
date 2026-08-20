/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect } from 'react';
import { Search as SearchIcon, X } from 'lucide-react';

export interface SearchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
  isRtl?: boolean;
}

export const Search: React.FC<SearchProps> = React.memo(({
  value,
  onClear,
  isRtl = false,
  className = '',
  onChange,
  placeholder = 'Search...',
  ...props
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle Ctrl+K / Cmd+K focus shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={`relative flex items-center w-full max-w-md ${isRtl ? 'rtl' : 'ltr'}`}>
      <SearchIcon className={`absolute ${isRtl ? 'right-3.5' : 'left-3.5'} w-4 h-4 text-slate-400`} />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full bg-[#e5eeff]/30 dark:bg-slate-800/40 border border-transparent focus:border-slate-300 dark:focus:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-primary dark:focus:ring-primary-fixed-dim rounded-full py-2 ${
          isRtl ? 'pr-10 pl-16 text-right' : 'pl-10 pr-16 text-left'
        } text-sm font-sans text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none transition-all ${className}`}
        {...props}
      />
      
      <div className={`absolute ${isRtl ? 'left-3' : 'right-3'} flex items-center gap-1.5`}>
        {value && onClear ? (
          <button
            onClick={() => {
              onClear();
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <kbd className="hidden sm:inline-flex select-none items-center gap-0.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-1.5 font-mono text-[10px] font-medium text-slate-400">
            <span>⌘</span>K
          </kbd>
        )}
      </div>
    </div>
  );
});
