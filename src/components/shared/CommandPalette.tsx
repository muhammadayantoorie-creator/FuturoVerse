/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Sparkles, 
  GraduationCap, 
  HelpCircle, 
  BookOpen, 
  ClipboardList, 
  BarChart2, 
  Settings, 
  Moon, 
  Sun, 
  Languages, 
  Layers, 
  FileText, 
  Command, 
  ArrowRight,
  X
} from 'lucide-react';
import { useAppStore } from '@/src/store/useAppStore';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PaletteAction {
  id: string;
  title: string;
  category: 'Navigation' | 'AI Tools' | 'Preferences' | 'Roles';
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  run: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const { 
    setActiveTab, 
    toggleTheme, 
    setLocale, 
    locale, 
    theme, 
    setRole 
  } = useAppStore();

  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const actions: PaletteAction[] = [
    // Navigation
    {
      id: 'nav-dashboard',
      title: 'Go to Dashboard',
      category: 'Navigation',
      icon: GraduationCap,
      run: () => { setActiveTab('dashboard'); onClose(); }
    },
    {
      id: 'nav-classes',
      title: 'Go to Classes & Curriculum',
      category: 'Navigation',
      icon: GraduationCap,
      run: () => { setActiveTab('classes'); onClose(); }
    },
    {
      id: 'nav-ai-tools',
      title: 'Go to AI Studio & Generator',
      category: 'Navigation',
      icon: Sparkles,
      shortcut: 'AI',
      run: () => { setActiveTab('ai-tools'); onClose(); }
    },
    {
      id: 'nav-quizzes',
      title: 'Go to Bilingual Quiz Engine',
      category: 'Navigation',
      icon: HelpCircle,
      run: () => { setActiveTab('quizzes'); onClose(); }
    },
    {
      id: 'nav-gradebook',
      title: 'Go to Gradebook & Marksheet',
      category: 'Navigation',
      icon: ClipboardList,
      run: () => { setActiveTab('gradebook'); onClose(); }
    },
    {
      id: 'nav-analytics',
      title: 'Go to Academic Analytics',
      category: 'Navigation',
      icon: BarChart2,
      run: () => { setActiveTab('analytics'); onClose(); }
    },
    {
      id: 'nav-resources',
      title: 'Go to Library & Resources',
      category: 'Navigation',
      icon: BookOpen,
      run: () => { setActiveTab('resources'); onClose(); }
    },
    {
      id: 'nav-settings',
      title: 'Go to Settings',
      category: 'Navigation',
      icon: Settings,
      run: () => { setActiveTab('settings'); onClose(); }
    },

    // AI Tools Quick Tasks
    {
      id: 'ai-summary',
      title: 'Generate Executive Study Summary with AI',
      category: 'AI Tools',
      icon: Sparkles,
      run: () => { setActiveTab('ai-tools'); onClose(); }
    },
    {
      id: 'ai-flashcards',
      title: 'Practice 3D Interactive Flashcards (SRS)',
      category: 'AI Tools',
      icon: Layers,
      run: () => { setActiveTab('ai-tools'); onClose(); }
    },
    {
      id: 'ai-homework',
      title: 'Create Graded Homework Assignment with AI',
      category: 'AI Tools',
      icon: FileText,
      run: () => { setActiveTab('ai-tools'); onClose(); }
    },
    {
      id: 'ai-quiz',
      title: 'Generate Practice Quiz from Uploaded PDF',
      category: 'AI Tools',
      icon: HelpCircle,
      run: () => { setActiveTab('ai-tools'); onClose(); }
    },

    // Preferences
    {
      id: 'pref-theme',
      title: `Toggle Color Theme (Currently: ${theme === 'dark' ? 'Dark' : 'Light'})`,
      category: 'Preferences',
      icon: theme === 'dark' ? Sun : Moon,
      run: () => { toggleTheme(); onClose(); }
    },
    {
      id: 'pref-locale',
      title: `Switch Language (Currently: ${locale === 'ur' ? 'اردو (Urdu)' : 'English'})`,
      category: 'Preferences',
      icon: Languages,
      run: () => { setLocale(locale === 'en' ? 'ur' : 'en'); onClose(); }
    },

    // Role Switching
    {
      id: 'role-student',
      title: 'Switch Role to Student View',
      category: 'Roles',
      icon: GraduationCap,
      run: () => { setRole('student'); onClose(); }
    },
    {
      id: 'role-teacher',
      title: 'Switch Role to Teacher Workspace',
      category: 'Roles',
      icon: GraduationCap,
      run: () => { setRole('teacher'); onClose(); }
    },
    {
      id: 'role-admin',
      title: 'Switch Role to Administrator (All Access)',
      category: 'Roles',
      icon: Settings,
      run: () => { setRole('admin'); onClose(); }
    },
  ];

  const filteredActions = actions.filter((act) =>
    act.title.toLowerCase().includes(search.toLowerCase()) ||
    act.category.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Handle keyboard arrow keys and enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filteredActions.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredActions.length) % (filteredActions.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredActions[selectedIndex]) {
          filteredActions[selectedIndex].run();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredActions, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-20 px-4 bg-slate-950/60 backdrop-blur-sm select-none font-sans">
      
      {/* Backdrop click to close */}
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[500px]">
        
        {/* Search input bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command, tool, or search keyword (e.g. quiz, flashcard, theme)..."
            className="w-full bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none font-sans"
          />
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredActions.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-sans">
              No matching commands or actions found.
            </div>
          ) : (
            filteredActions.map((action, idx) => {
              const Icon = action.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={action.id}
                  onClick={() => action.run()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-left transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-indigo-600 text-white font-semibold shadow-sm' 
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-1.5 rounded-xl ${isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">
                        {action.title}
                      </div>
                      <div className={`text-[10px] ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                        {action.category}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {action.shortcut && (
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                        {action.shortcut}
                      </span>
                    )}
                    <ArrowRight className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-300 dark:text-slate-600'}`} />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span>FuturoVerse Command Palette</span>
        </div>

      </div>

    </div>
  );
};
