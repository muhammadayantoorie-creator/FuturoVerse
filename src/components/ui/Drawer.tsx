/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  side?: 'left' | 'right' | 'top' | 'bottom';
  size?: 'sm' | 'md' | 'lg' | 'full';
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  side = 'right',
  size = 'md',
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Style configurations based on side and size
  const sideConfig = {
    left: {
      initial: { x: '-100%' },
      animate: { x: 0 },
      exit: { x: '-100%' },
      positionClass: 'left-0 top-0 bottom-0 h-full border-r',
      sizeClass: {
        sm: 'w-72',
        md: 'w-[400px]',
        lg: 'w-[600px]',
        full: 'w-screen',
      },
    },
    right: {
      initial: { x: '100%' },
      animate: { x: 0 },
      exit: { x: '100%' },
      positionClass: 'right-0 top-0 bottom-0 h-full border-l',
      sizeClass: {
        sm: 'w-72',
        md: 'w-[400px]',
        lg: 'w-[600px]',
        full: 'w-screen',
      },
    },
    top: {
      initial: { y: '-100%' },
      animate: { y: 0 },
      exit: { y: '-100%' },
      positionClass: 'top-0 left-0 right-0 w-full border-b',
      sizeClass: {
        sm: 'h-64',
        md: 'h-[400px]',
        lg: 'h-[600px]',
        full: 'h-screen',
      },
    },
    bottom: {
      initial: { y: '100%' },
      animate: { y: 0 },
      exit: { y: '100%' },
      positionClass: 'bottom-0 left-0 right-0 w-full border-t',
      sizeClass: {
        sm: 'h-64',
        md: 'h-[400px]',
        lg: 'h-[600px]',
        full: 'h-screen',
      },
    },
  };

  const currentSide = sideConfig[side];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex overflow-hidden">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs cursor-pointer"
          />

          {/* Drawer body */}
          <motion.div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'drawer-title' : undefined}
            initial={currentSide.initial}
            animate={currentSide.animate}
            exit={currentSide.exit}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className={`fixed ${currentSide.positionClass} ${currentSide.sizeClass[size]} bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col z-10`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
              {title && (
                <h2 id="drawer-title" className="font-sans font-bold text-base text-slate-900 dark:text-slate-100">
                  {title}
                </h2>
              )}
              <button
                onClick={onClose}
                aria-label="Close drawer"
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable contents */}
            <div className="flex-grow overflow-y-auto px-6 py-6 text-sm font-sans text-slate-600 dark:text-slate-300 custom-scrollbar">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
