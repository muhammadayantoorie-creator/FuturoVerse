/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, PlusCircle, FileText, Trash2, Copy, ArrowUp, ArrowDown, 
  UploadCloud, CheckCircle2, HelpCircle, AlertCircle, Eye, Settings, 
  ListPlus, Edit3, Circle, Timer, Check, Save, X, Plus, FileCode, 
  EyeOff, FolderGit, FileUp, FileDown, Layers, BookOpen, AlertTriangle,
  Search, Filter, RotateCcw, RotateCw, Monitor, Tablet, Smartphone,
  MoreVertical, Sliders, ChevronDown, ChevronRight, GripVertical, Download,
  Upload, CheckSquare, ShieldCheck, Zap, SlidersHorizontal, ArrowLeft,
  Keyboard, Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Quiz, Question, QuestionType, McqOption } from './types';
import { exportQuizToPdf } from '@/src/utils/pdfExport';

interface ManualQuizCreatorProps {
  editingQuiz: Partial<Quiz>;
  setEditingQuiz: React.Dispatch<React.SetStateAction<Partial<Quiz>>>;
  bankQuestions: Question[];
  setBankQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  onBackToDashboard?: () => void;
}

export const ManualQuizCreator: React.FC<ManualQuizCreatorProps> = ({
  editingQuiz,
  setEditingQuiz,
  bankQuestions,
  setBankQuestions,
  onBackToDashboard,
}) => {
  // Active selected question index
  const [activeQIdx, setActiveQIdx] = useState<number>(0);
  
  // UI Panel Toggles
  const [livePreviewMode, setLivePreviewMode] = useState<boolean>(true);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showQuestionBankModal, setShowQuestionBankModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isListCollapsed, setIsListCollapsed] = useState<boolean>(false);

  // History for Undo / Redo
  const [history, setHistory] = useState<Array<Partial<Quiz>>>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const isUndoRedoAction = useRef<boolean>(false);

  // PDF Export and Shortcuts Modals
  const [showPdfMenu, setShowPdfMenu] = useState<boolean>(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);

  // Autosave Status
  const [autosaveTime, setAutosaveTime] = useState<string>('');
  const [showSaveToast, setShowSaveToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('Quiz saved successfully!');

  // Local active question state for smoother editing
  const [currentQ, setCurrentQ] = useState<Partial<Question> | null>(null);

  const quizQuestions = editingQuiz.questions || [];

  // Push to undo history stack when editingQuiz changes
  useEffect(() => {
    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false;
      return;
    }
    if (editingQuiz) {
      setHistory(prev => {
        const sliced = prev.slice(0, historyIdx + 1);
        return [...sliced, JSON.parse(JSON.stringify(editingQuiz))];
      });
      setHistoryIdx(prev => prev + 1);
    }
  }, [editingQuiz.title, editingQuiz.questions?.length, editingQuiz.durationSeconds, editingQuiz.passingMarks, editingQuiz.attemptsAllowed]);

  const handleUndo = () => {
    if (historyIdx > 0) {
      isUndoRedoAction.current = true;
      const targetState = history[historyIdx - 1];
      setHistoryIdx(prev => prev - 1);
      setEditingQuiz(JSON.parse(JSON.stringify(targetState)));
    }
  };

  const handleRedo = () => {
    if (historyIdx < history.length - 1) {
      isUndoRedoAction.current = true;
      const targetState = history[historyIdx + 1];
      setHistoryIdx(prev => prev + 1);
      setEditingQuiz(JSON.parse(JSON.stringify(targetState)));
    }
  };

  // Sync state when active index changes or questions change
  useEffect(() => {
    if (quizQuestions[activeQIdx]) {
      const q = JSON.parse(JSON.stringify(quizQuestions[activeQIdx])) as Question;
      
      // Ensure mcqOptions exists for MCQ
      if (q.type === 'multiple-choice' && (!q.mcqOptions || q.mcqOptions.length === 0)) {
        const fallbackOpts: McqOption[] = (q.options || ['Option A', 'Option B', 'Option C', 'Option D']).map((optText, i) => ({
          id: String.fromCharCode(65 + i),
          text: optText,
          correct: q.correctAnswer === optText || (i === 0 && !q.correctAnswer)
        }));
        q.mcqOptions = fallbackOpts;
      }
      
      setCurrentQ(q);
    } else if (quizQuestions.length > 0) {
      setActiveQIdx(0);
    } else {
      setCurrentQ(null);
    }
  }, [activeQIdx, quizQuestions.length]);

  // Sync changes to editingQuiz
  const syncToParent = (updatedQ: Partial<Question>) => {
    setCurrentQ(updatedQ);
    setEditingQuiz(prev => {
      const qs = [...(prev.questions || [])];
      if (qs[activeQIdx]) {
        const finalQ: Question = {
          ...qs[activeQIdx],
          ...updatedQ,
        } as Question;

        if (finalQ.type === 'multiple-choice' && finalQ.mcqOptions) {
          finalQ.options = finalQ.mcqOptions.map(o => o.text);
          finalQ.correctAnswer = finalQ.mcqOptions.find(o => o.correct)?.text || '';
        }

        qs[activeQIdx] = finalQ;
      }
      return { ...prev, questions: qs };
    });
  };

  // Auto-Save interval
  useEffect(() => {
    const interval = setInterval(() => {
      if (editingQuiz && (editingQuiz.questions || []).length > 0) {
        localStorage.setItem('classcopilot_quiz_draft', JSON.stringify(editingQuiz));
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setAutosaveTime(now);
      }
    }, 20000);

    return () => clearInterval(interval);
  }, [editingQuiz]);

  const handleManualSave = (silent = false) => {
    localStorage.setItem('classcopilot_quiz_draft', JSON.stringify(editingQuiz));
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setAutosaveTime(now);
    if (!silent) {
      setToastMessage('Quiz draft and questions saved successfully!');
      setShowSaveToast(true);
      setTimeout(() => setShowSaveToast(false), 3000);
    }
  };

  // Export Quiz to PDF (Student Exam, Teacher Key, or Both)
  const handleExportPDF = (mode: 'exam' | 'answer-key' | 'both') => {
    try {
      exportQuizToPdf(editingQuiz, { mode, institutionName: 'Class Copilot Academic Network' });
      setShowPdfMenu(false);
      setToastMessage(
        mode === 'exam' 
          ? 'Exam Paper PDF exported successfully!' 
          : mode === 'answer-key' 
          ? 'Teacher Master Key PDF exported!' 
          : 'Complete Exam & Answer Key PDF exported!'
      );
      setShowSaveToast(true);
      setTimeout(() => setShowSaveToast(false), 3500);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      alert('Could not export PDF. Please verify quiz data and try again.');
    }
  };

  // Keyboard Shortcuts Hook for Power Users
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const isInputFocused = targetTag === 'input' || targetTag === 'textarea' || (e.target as HTMLElement)?.isContentEditable;

      // 1. Ctrl/Cmd + S -> Save Draft
      if (cmdOrCtrl && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleManualSave(false);
        return;
      }

      // 2. Ctrl/Cmd + Enter -> Add New Question
      if (cmdOrCtrl && e.key === 'Enter') {
        e.preventDefault();
        handleAddNewQuestion();
        return;
      }

      // 3. Ctrl/Cmd + P -> Open PDF Export or Download Exam PDF
      if (cmdOrCtrl && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setShowPdfMenu(prev => !prev);
        return;
      }

      // 4. Ctrl/Cmd + D -> Duplicate current question
      if (cmdOrCtrl && e.key.toLowerCase() === 'd' && !isInputFocused) {
        e.preventDefault();
        handleDuplicateQuestionIdx(activeQIdx);
        return;
      }

      // 5. Ctrl/Cmd + Z -> Undo
      if (cmdOrCtrl && !e.shiftKey && e.key.toLowerCase() === 'z' && !isInputFocused) {
        e.preventDefault();
        handleUndo();
        return;
      }

      // 6. Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z -> Redo
      if ((cmdOrCtrl && e.key.toLowerCase() === 'y') || (cmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'z')) {
        if (!isInputFocused) {
          e.preventDefault();
          handleRedo();
          return;
        }
      }

      // 7. Alt + Up / Alt + Down or Ctrl + Up / Ctrl + Down -> Question Navigation
      if ((e.altKey || cmdOrCtrl) && (e.key === 'ArrowUp' || e.key === 'ArrowLeft')) {
        e.preventDefault();
        setActiveQIdx(prev => Math.max(0, prev - 1));
        return;
      }

      if ((e.altKey || cmdOrCtrl) && (e.key === 'ArrowDown' || e.key === 'ArrowRight')) {
        e.preventDefault();
        setActiveQIdx(prev => Math.min(quizQuestions.length - 1, prev + 1));
        return;
      }

      // 8. '?' key (Shift + /) to toggle shortcuts cheatsheet
      if (e.key === '?' && !isInputFocused) {
        e.preventDefault();
        setShowShortcutsModal(prev => !prev);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingQuiz, activeQIdx, historyIdx, quizQuestions.length]);

  // Add Question
  const handleAddNewQuestion = () => {
    const nextId = `manual_q_${Date.now()}`;
    const newQ: Question = {
      id: nextId,
      type: 'multiple-choice',
      questionText: 'Select the correct statement regarding object composition.',
      mcqOptions: [
        { id: 'A', text: 'Composition models a "has-a" relationship, enabling loose coupling.', correct: true },
        { id: 'B', text: 'Composition models an "is-a" relationship, causing strict inheritance structures.', correct: false },
        { id: 'C', text: 'Composition is only supported in functional programming paradigms.', correct: false },
        { id: 'D', text: 'Composition prevents class reuse and limits memory allocation.', correct: false }
      ],
      options: [
        'Composition models a "has-a" relationship, enabling loose coupling.',
        'Composition models an "is-a" relationship, causing strict inheritance structures.',
        'Composition is only supported in functional programming paradigms.',
        'Composition prevents class reuse and limits memory allocation.'
      ],
      correctAnswer: 'Composition models a "has-a" relationship, enabling loose coupling.',
      explanation: 'Composition is a design principle where a class references one or more objects of other classes as instances, representing a "has-a" structure which is highly flexible.',
      points: 10,
      timerSeconds: 60,
      difficulty: 'Medium',
      subject: editingQuiz.subject || 'Computer Science',
      bloomLevel: 'Understanding',
      tags: ['OOP', 'Design Patterns']
    };

    setEditingQuiz(prev => ({
      ...prev,
      questions: [...(prev.questions || []), newQ]
    }));
    setActiveQIdx(quizQuestions.length);
  };

  // Delete Question
  const handleDeleteQuestionIdx = (idx: number) => {
    if (quizQuestions.length <= 1) {
      alert('Your quiz must contain at least one question.');
      return;
    }
    setEditingQuiz(prev => {
      const qs = (prev.questions || []).filter((_, i) => i !== idx);
      return { ...prev, questions: qs };
    });
    setActiveQIdx(prev => Math.max(0, Math.min(prev, quizQuestions.length - 2)));
  };

  // Duplicate Question
  const handleDuplicateQuestionIdx = (idx: number) => {
    setEditingQuiz(prev => {
      const qs = [...(prev.questions || [])];
      const target = qs[idx];
      const copy: Question = JSON.parse(JSON.stringify(target));
      copy.id = `manual_q_copy_${Date.now()}`;
      copy.questionText = `${copy.questionText} (Copy)`;
      qs.splice(idx + 1, 0, copy);
      return { ...prev, questions: qs };
    });
    setActiveQIdx(idx + 1);
  };

  // Reorder Question
  const handleMoveQuestion = (idx: number, dir: 'up' | 'down') => {
    const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= quizQuestions.length) return;
    
    setEditingQuiz(prev => {
      const qs = [...(prev.questions || [])];
      const temp = qs[idx];
      qs[idx] = qs[targetIdx];
      qs[targetIdx] = temp;
      return { ...prev, questions: qs };
    });
    setActiveQIdx(targetIdx);
  };

  // Text formatting
  const injectTag = (tagStart: string, tagEnd: string) => {
    const textarea = document.getElementById('rich-question-textarea') as HTMLTextAreaElement;
    if (!textarea || !currentQ) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = currentQ.questionText || '';
    
    const before = text.substring(0, start);
    const selected = text.substring(start, end);
    const after = text.substring(end);

    const formatted = `${before}${tagStart}${selected || 'text'}${tagEnd}${after}`;
    syncToParent({ questionText: formatted });
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tagStart.length, start + tagStart.length + (selected || 'text').length);
    }, 50);
  };

  // Image Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'imageUrl' | 'diagramName') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        syncToParent({ [field]: result });
      }
    };
    reader.readAsDataURL(file);
  };

  // Option Operations
  const handleAddOption = () => {
    if (!currentQ || !currentQ.mcqOptions) return;
    if (currentQ.mcqOptions.length >= 8) {
      alert('Maximum limit of 8 options reached.');
      return;
    }

    const nextChar = String.fromCharCode(65 + currentQ.mcqOptions.length);
    const updatedOpts: McqOption[] = [
      ...currentQ.mcqOptions,
      { id: nextChar, text: `New Option ${nextChar}`, correct: false }
    ];

    syncToParent({ mcqOptions: updatedOpts });
  };

  const handleRemoveOption = (oIdx: number) => {
    if (!currentQ || !currentQ.mcqOptions) return;
    if (currentQ.mcqOptions.length <= 2) {
      alert('Minimum limit of 2 options is required.');
      return;
    }

    const wasCorrect = currentQ.mcqOptions[oIdx].correct;
    const filtered = currentQ.mcqOptions.filter((_, i) => i !== oIdx);
    
    const adjusted = filtered.map((o, idx) => ({
      ...o,
      id: String.fromCharCode(65 + idx),
      correct: wasCorrect && idx === 0 ? true : o.correct
    }));

    syncToParent({ mcqOptions: adjusted });
  };

  const handleSelectCorrectOption = (oIdx: number) => {
    if (!currentQ || !currentQ.mcqOptions) return;
    const updated = currentQ.mcqOptions.map((o, idx) => ({
      ...o,
      correct: idx === oIdx
    }));
    syncToParent({ mcqOptions: updated });
  };

  const handleOptionFieldChange = (oIdx: number, fields: Partial<McqOption>) => {
    if (!currentQ || !currentQ.mcqOptions) return;
    const updated = currentQ.mcqOptions.map((o, idx) => {
      if (idx === oIdx) {
        return { ...o, ...fields };
      }
      return o;
    });
    syncToParent({ mcqOptions: updated });
  };

  // JSON / CSV Export
  const handleExportQuizJSON = () => {
    const dataStr = JSON.stringify(editingQuiz, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(editingQuiz.title || 'quiz').toLowerCase().replace(/\s+/g, '_')}_export.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON / CSV
  const handleImportQuizJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && Array.isArray(parsed.questions)) {
          setEditingQuiz(parsed);
          setActiveQIdx(0);
          alert('Quiz successfully imported!');
        } else {
          alert('Invalid quiz JSON file. Must include a questions array.');
        }
      } catch (err) {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  // Validation
  const getQuestionValidation = (q: Question | Partial<Question>): string[] => {
    const errs: string[] = [];
    if (!q.questionText || q.questionText.trim() === '') errs.push('Missing question prompt text.');
    if (q.type === 'multiple-choice') {
      const opts = q.mcqOptions || [];
      if (opts.length < 2) errs.push('MCQ requires at least 2 options.');
      if (opts.some(o => !o.text || o.text.trim() === '')) errs.push('Option texts cannot be empty.');
      if (!opts.some(o => o.correct)) errs.push('No correct option selected.');
    } else if (!q.correctAnswer || q.correctAnswer.trim() === '') {
      errs.push('Missing correct answer reference.');
    }
    return errs;
  };

  const validationErrors = currentQ ? getQuestionValidation(currentQ) : [];

  // Filtered Question List
  const filteredQuestions = quizQuestions.filter((q, idx) => {
    const matchesSearch = !searchQuery || q.questionText.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || q.type === typeFilter;
    return matchesSearch && matchesType;
  });

  if (!currentQ && quizQuestions.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-center select-none space-y-4 max-w-xl mx-auto my-12 shadow-sm">
        <Layers className="w-12 h-12 text-indigo-500 mx-auto animate-pulse" />
        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">No Questions in this Quiz</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          Start crafting your exam by creating your first question or importing a question bank template.
        </p>
        <button
          onClick={handleAddNewQuestion}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-5 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 mx-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add First Question</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans -m-4 md:-m-6 overflow-hidden">
      
      {/* 1. STICKY TOP TOOLBAR */}
      <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between shrink-0 z-30 shadow-xs select-none">
        <div className="flex items-center gap-3">
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
              {editingQuiz.title || 'Untitled Quiz'}
            </span>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono px-2 py-0.5 rounded font-semibold uppercase">
              {editingQuiz.status || 'Draft'}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-3">
            <button
              onClick={handleUndo}
              disabled={historyIdx <= 0}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-30 rounded-lg transition-all"
              title="Undo"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIdx >= history.length - 1}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-30 rounded-lg transition-all"
              title="Redo"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Center Autosave Status */}
        <div className="hidden md:flex items-center gap-2 text-xs">
          {autosaveTime ? (
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-medium flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              <span>Autosaved at {autosaveTime}</span>
            </span>
          ) : (
            <span className="text-[11px] text-slate-400 font-mono">Drafting...</span>
          )}
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowShortcutsModal(true)}
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-all cursor-pointer"
            title="Keyboard Shortcuts (?)"
          >
            <Keyboard className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
          </button>

          <button
            onClick={() => setShowQuestionBankModal(true)}
            className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
          >
            <FolderGit className="w-3.5 h-3.5 text-indigo-500" />
            <span>Question Bank</span>
          </button>

          <button
            onClick={() => setLivePreviewMode(!livePreviewMode)}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              livePreviewMode
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {livePreviewMode ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Preview</span>
          </button>

          {/* Export PDF Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowPdfMenu(!showPdfMenu)}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 transition-all cursor-pointer shadow-xs"
              title="Export as Printable PDF (Ctrl+P)"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Export PDF</span>
              <ChevronDown className="w-3 h-3 ml-0.5 opacity-70" />
            </button>

            {showPdfMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowPdfMenu(false)} />
                <div className="absolute right-0 top-9 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1.5 flex flex-col gap-1 z-50 animate-in fade-in zoom-in-95 duration-100 select-none">
                  <button
                    onClick={() => handleExportPDF('exam')}
                    className="w-full text-left px-3 py-2 text-xs font-medium rounded-lg text-slate-800 dark:text-slate-100 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 transition-colors flex items-center gap-2.5"
                  >
                    <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-slate-100">Student Question Paper (PDF)</div>
                      <div className="text-[10px] text-slate-500">Worksheet with instructions & blanks</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleExportPDF('answer-key')}
                    className="w-full text-left px-3 py-2 text-xs font-medium rounded-lg text-slate-800 dark:text-slate-100 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 transition-colors flex items-center gap-2.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-slate-100">Teacher Master Answer Key (PDF)</div>
                      <div className="text-[10px] text-slate-500">Correct answers & explanations</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleExportPDF('both')}
                    className="w-full text-left px-3 py-2 text-xs font-medium rounded-lg text-slate-800 dark:text-slate-100 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 transition-colors flex items-center gap-2.5 border-t border-slate-100 dark:border-slate-800/80 pt-1.5"
                  >
                    <Download className="w-4 h-4 text-blue-500 shrink-0" />
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-slate-100">Full Exam & Key Package (PDF)</div>
                      <div className="text-[10px] text-slate-500">Complete bundle ready for print</div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>

          <label className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-pointer transition-all" title="Import Quiz JSON">
            <Upload className="w-3.5 h-3.5" />
            <input type="file" accept=".json" onChange={handleImportQuizJSON} className="hidden" />
          </label>

          <button
            onClick={handleExportQuizJSON}
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-lg transition-all cursor-pointer"
            title="Export Quiz JSON"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => handleManualSave(false)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
            title="Save Quiz Draft (Ctrl+S)"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>

          <button
            onClick={() => {
              setEditingQuiz(prev => ({
                ...prev,
                status: prev.status === 'published' ? 'draft' : 'published'
              }));
              alert(`Quiz status updated to ${editingQuiz.status === 'published' ? 'Draft' : 'Published'}!`);
            }}
            className={`text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              editingQuiz.status === 'published'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white'
            }`}
          >
            {editingQuiz.status === 'published' ? 'Published' : 'Publish Quiz'}
          </button>
        </div>
      </header>

      {/* Save Notification Toast */}
      <AnimatePresence>
        {showSaveToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 right-6 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-bold font-sans border border-slate-700/50"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard Shortcuts Reference Modal */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs select-none">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  Keyboard Shortcuts for Power Authors
                </h3>
              </div>
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs divide-y divide-slate-100 dark:divide-slate-800">
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-600 dark:text-slate-300">Save Quiz Draft</span>
                <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-mono font-bold text-[10px] border border-slate-200 dark:border-slate-700">Ctrl + S</kbd>
              </div>

              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-600 dark:text-slate-300">Add New Question</span>
                <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-mono font-bold text-[10px] border border-slate-200 dark:border-slate-700">Ctrl + Enter</kbd>
              </div>

              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-600 dark:text-slate-300">Export Printable PDF</span>
                <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-mono font-bold text-[10px] border border-slate-200 dark:border-slate-700">Ctrl + P</kbd>
              </div>

              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-600 dark:text-slate-300">Duplicate Active Question</span>
                <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-mono font-bold text-[10px] border border-slate-200 dark:border-slate-700">Ctrl + D</kbd>
              </div>

              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-600 dark:text-slate-300">Navigate Question Up / Down</span>
                <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-mono font-bold text-[10px] border border-slate-200 dark:border-slate-700">Alt + ↑ / ↓</kbd>
              </div>

              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-600 dark:text-slate-300">Undo / Redo Edit</span>
                <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-mono font-bold text-[10px] border border-slate-200 dark:border-slate-700">Ctrl + Z / Y</kbd>
              </div>

              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-600 dark:text-slate-300">Open Shortcuts Cheatsheet</span>
                <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-mono font-bold text-[10px] border border-slate-200 dark:border-slate-700">?</kbd>
              </div>
            </div>

            <button
              onClick={() => setShowShortcutsModal(false)}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* 2. THREE-COLUMN WORKSPACE AREA */}
      <div className="flex-grow flex overflow-hidden">
        
        {/* LEFT SIDEBAR: Quiz Configuration & Settings */}
        <aside className="w-72 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0 overflow-y-auto p-4 space-y-5 select-none">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-500" />
              Quiz Settings
            </h3>
            <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded font-mono font-bold">
              Config
            </span>
          </div>

          {/* Quiz Title & Subject */}
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Quiz Title</label>
              <input
                type="text"
                value={editingQuiz.title || ''}
                onChange={(e) => setEditingQuiz(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Midterm Mechanics Exam"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs font-medium focus:border-indigo-500 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Subject / Course</label>
              <input
                type="text"
                value={editingQuiz.subject || ''}
                onChange={(e) => setEditingQuiz(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="e.g. Physics 101"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs font-medium focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Timing & Scoring */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block">Timing & Scoring</span>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500">Duration (Min)</label>
                <input
                  type="number"
                  value={Math.round((editingQuiz.durationSeconds || 1800) / 60)}
                  onChange={(e) => setEditingQuiz(prev => ({ ...prev, durationSeconds: Number(e.target.value) * 60 }))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-xs font-mono font-bold"
                  min="1"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500">Passing (%)</label>
                <input
                  type="number"
                  value={editingQuiz.passingMarks || 60}
                  onChange={(e) => setEditingQuiz(prev => ({ ...prev, passingMarks: Number(e.target.value) }))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-xs font-mono font-bold"
                  min="0"
                  max="100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500">Max Attempts</label>
                <input
                  type="number"
                  value={editingQuiz.attemptsAllowed || 1}
                  onChange={(e) => setEditingQuiz(prev => ({ ...prev, attemptsAllowed: Number(e.target.value) }))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-xs font-mono font-bold"
                  min="1"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500">Difficulty</label>
                <select
                  value={editingQuiz.difficulty || 'medium'}
                  onChange={(e) => setEditingQuiz(prev => ({ ...prev, difficulty: e.target.value as any }))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 text-xs font-semibold capitalize"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>
          </div>

          {/* Randomization & Delivery Controls */}
          <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block">Behavior & Security</span>

            <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 cursor-pointer">
              <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">Shuffle Questions</span>
              <input
                type="checkbox"
                checked={editingQuiz.shuffleQuestions || false}
                onChange={(e) => setEditingQuiz(prev => ({ ...prev, shuffleQuestions: e.target.checked }))}
                className="rounded text-indigo-600 focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 cursor-pointer">
              <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">Shuffle MCQ Options</span>
              <input
                type="checkbox"
                checked={editingQuiz.shuffleOptions || false}
                onChange={(e) => setEditingQuiz(prev => ({ ...prev, shuffleOptions: e.target.checked }))}
                className="rounded text-indigo-600 focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 cursor-pointer">
              <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">Auto-Submit Timeout</span>
              <input
                type="checkbox"
                checked={editingQuiz.autoSubmitOnTimeout ?? true}
                onChange={(e) => setEditingQuiz(prev => ({ ...prev, autoSubmitOnTimeout: e.target.checked }))}
                className="rounded text-indigo-600 focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 cursor-pointer">
              <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">Show Results Instant</span>
              <input
                type="checkbox"
                checked={editingQuiz.showScoreAfterSubmission ?? true}
                onChange={(e) => setEditingQuiz(prev => ({ ...prev, showScoreAfterSubmission: e.target.checked }))}
                className="rounded text-indigo-600 focus:ring-0"
              />
            </label>
          </div>

          {/* Quick Metrics Summary */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-3 rounded-xl space-y-1 text-[10px] font-mono text-slate-500">
            <div className="flex justify-between">
              <span>Total Questions:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{quizQuestions.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Points:</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                {quizQuestions.reduce((acc, q) => acc + (q.points || 0), 0)} Marks
              </span>
            </div>
          </div>
        </aside>

        {/* CENTER PANEL: Question Navigation List */}
        <div className="w-80 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col shrink-0 overflow-hidden select-none">
          
          {/* Question List Header & Search/Filter */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase font-mono text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <ListPlus className="w-3.5 h-3.5 text-indigo-500" />
                Questions ({filteredQuestions.length})
              </h4>
              
              <button
                onClick={handleAddNewQuestion}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold py-1 px-2.5 rounded-lg transition-all cursor-pointer shadow-xs flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search questions..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-2 py-1.5 text-xs outline-none focus:border-indigo-500"
              />
            </div>

            {/* Filter Dropdown */}
            <div className="flex items-center justify-between text-[10px] font-mono">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-slate-100 dark:bg-slate-800 border-none rounded p-1 text-slate-600 dark:text-slate-300 font-semibold"
              >
                <option value="all">All Types</option>
                <option value="multiple-choice">MCQ</option>
                <option value="true-false">True/False</option>
                <option value="fill-blank">Fill Blank</option>
                <option value="short-answer">Short Ans</option>
                <option value="long-answer">Long Ans</option>
              </select>

              <button
                onClick={() => setIsListCollapsed(!isListCollapsed)}
                className="text-slate-400 hover:text-slate-600 font-sans"
              >
                {isListCollapsed ? 'Expand Cards' : 'Compact Cards'}
              </button>
            </div>
          </div>

          {/* Question List Cards Scrollable */}
          <div className="flex-grow overflow-y-auto p-2 space-y-2">
            {filteredQuestions.map((q, idx) => {
              const originalIdx = quizQuestions.findIndex(item => item.id === q.id);
              const isActive = originalIdx === activeQIdx;
              const qErrs = getQuestionValidation(q);
              const isValidQ = qErrs.length === 0;

              return (
                <div
                  key={q.id}
                  onClick={() => setActiveQIdx(originalIdx)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all relative group ${
                    isActive
                      ? 'bg-white dark:bg-slate-900 border-indigo-500 shadow-sm ring-1 ring-indigo-500/20'
                      : 'bg-white/60 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800/80 hover:bg-white dark:hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] font-bold ${
                        isActive ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        {originalIdx + 1}
                      </span>

                      <span className="text-[9px] font-mono uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded font-bold">
                        {q.type === 'multiple-choice' ? 'MCQ' : q.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {isValidQ ? (
                        <span title="Valid Question">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        </span>
                      ) : (
                        <span title="Requires Details">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        </span>
                      )}

                      <button
                        onClick={(e) => { e.stopPropagation(); handleDuplicateQuestionIdx(originalIdx); }}
                        className="p-1 text-slate-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Duplicate"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteQuestionIdx(originalIdx); }}
                        className="p-1 text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {!isListCollapsed && (
                    <p className="text-[11px] font-medium text-slate-800 dark:text-slate-200 line-clamp-2 mt-1.5 leading-snug">
                      {q.questionText || '(Empty Question Prompt)'}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 mt-2 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                    <span>{q.points || 10} Pts</span>
                    {q.timerSeconds && <span className="text-indigo-500 font-bold">{q.timerSeconds}s timer</span>}
                    <span>{q.difficulty || 'Med'}</span>
                  </div>
                </div>
              );
            })}

            {filteredQuestions.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-400">
                No matching questions found.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Large Main Question Workspace Editor & Option Cards */}
        <main className="flex-grow flex flex-col overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 space-y-6">
          
          {/* Question Details Header Toolbar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-mono font-bold px-2.5 py-1 rounded-md">
                  Question {activeQIdx + 1} of {quizQuestions.length}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {currentQ.type === 'multiple-choice' ? 'Multiple Choice' : currentQ.type} Editor
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleMoveQuestion(activeQIdx, 'up')}
                  disabled={activeQIdx === 0}
                  className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                  title="Move Up"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleMoveQuestion(activeQIdx, 'down')}
                  disabled={activeQIdx === quizQuestions.length - 1}
                  className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                  title="Move Down"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDuplicateQuestionIdx(activeQIdx)}
                  className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 hover:text-indigo-600 transition-all cursor-pointer"
                  title="Duplicate Question"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteQuestionIdx(activeQIdx)}
                  className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 hover:text-rose-600 transition-all cursor-pointer"
                  title="Delete Question"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Question Taxonomy Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 select-none">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 font-mono uppercase">Style</label>
                <select
                  value={currentQ.type}
                  onChange={(e) => syncToParent({ type: e.target.value as QuestionType })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  <option value="multiple-choice">MCQ</option>
                  <option value="true-false">True / False</option>
                  <option value="fill-blank">Fill Blank</option>
                  <option value="short-answer">Short Answer</option>
                  <option value="long-answer">Long Answer</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 font-mono uppercase">Difficulty</label>
                <select
                  value={currentQ.difficulty || 'Medium'}
                  onChange={(e) => syncToParent({ difficulty: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 font-mono uppercase">Bloom's Level</label>
                <select
                  value={currentQ.bloomLevel || 'Understanding'}
                  onChange={(e) => syncToParent({ bloomLevel: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  <option value="Remembering">Remembering</option>
                  <option value="Understanding">Understanding</option>
                  <option value="Applying">Applying</option>
                  <option value="Analyzing">Analyzing</option>
                  <option value="Evaluating">Evaluating</option>
                  <option value="Creating">Creating</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 font-mono uppercase">Marks</label>
                <input
                  type="number"
                  value={currentQ.points || 10}
                  onChange={(e) => syncToParent({ points: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 font-mono"
                  min="1"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 font-mono uppercase flex items-center gap-1">
                  <Timer className="w-3 h-3 text-indigo-500" />
                  Timer (Sec)
                </label>
                <input
                  type="number"
                  value={currentQ.timerSeconds || ''}
                  onChange={(e) => syncToParent({ timerSeconds: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="Unlimited"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 font-mono"
                  min="0"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 font-mono uppercase">Topic Tags</label>
                <input
                  type="text"
                  value={currentQ.tags?.join(', ') || ''}
                  onChange={(e) => syncToParent({ tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  placeholder="e.g. OOP, Java"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 rounded-xl text-xs text-slate-800 dark:text-slate-200 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section: Question Prompt & Content Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 select-none">
              <h4 className="font-bold text-xs uppercase font-mono text-slate-700 dark:text-slate-300">
                Question Content & Prompt
              </h4>

              {/* Rich Format Toolbar */}
              <div className="flex flex-wrap items-center gap-1 text-[10px] text-slate-500 font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded-lg">
                <button type="button" onClick={() => injectTag('**', '**')} className="p-1 hover:text-indigo-600 font-bold" title="Bold">B</button>
                <button type="button" onClick={() => injectTag('*', '*')} className="p-1 hover:text-indigo-600 italic" title="Italic">I</button>
                <button type="button" onClick={() => injectTag('`', '`')} className="p-1 hover:text-indigo-600" title="Code">Code</button>
                <button type="button" onClick={() => injectTag('<sub>', '</sub>')} className="p-1 hover:text-indigo-600" title="Subscript">X<sub>2</sub></button>
                <button type="button" onClick={() => injectTag('<sup>', '</sup>')} className="p-1 hover:text-indigo-600" title="Superscript">X<sup>2</sup></button>
                <button type="button" onClick={() => injectTag('<u>', '</u>')} className="p-1 hover:text-indigo-600 underline" title="Underline">U</button>
                <button type="button" onClick={() => injectTag('\\(', '\\)')} className="p-1 hover:text-indigo-600" title="LaTeX">LaTeX</button>
              </div>
            </div>

            <textarea
              id="rich-question-textarea"
              value={currentQ.questionText || ''}
              onChange={(e) => syncToParent({ questionText: e.target.value })}
              placeholder="Enter question prompt..."
              rows={3}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 leading-relaxed font-sans"
            />

            {/* Diagram Upload & Formula Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 font-mono uppercase">Diagram / Visual Asset</label>
                <div className="border border-dashed border-slate-200 dark:border-slate-800 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-950/30 flex items-center justify-between">
                  {currentQ.imageUrl ? (
                    <div className="flex items-center gap-3 w-full justify-between">
                      <img src={currentQ.imageUrl} alt="Diagram" className="w-10 h-10 object-cover rounded-lg border border-slate-200 dark:border-slate-800" />
                      <span className="text-[10px] font-mono text-emerald-600 font-bold">Image Uploaded</span>
                      <button onClick={() => syncToParent({ imageUrl: '' })} className="p-1 text-slate-400 hover:text-rose-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                      <UploadCloud className="w-4 h-4 text-indigo-500" />
                      <span>Upload Diagram Image</span>
                      <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'imageUrl')} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 font-mono uppercase">LaTeX Math Formula</label>
                <input
                  type="text"
                  value={currentQ.mathFormula || ''}
                  onChange={(e) => syncToParent({ mathFormula: e.target.value })}
                  placeholder="e.g. \lim_{x \to 0} \frac{\sin(x)}{x} = 1"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs font-mono text-indigo-600 dark:text-indigo-400 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section: Options Editor (For MCQ) */}
          {currentQ.type === 'multiple-choice' && currentQ.mcqOptions && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 select-none">
                <div>
                  <h4 className="font-bold text-xs uppercase font-mono text-slate-700 dark:text-slate-300">
                    Multiple Choice Answer Options ({currentQ.mcqOptions.length})
                  </h4>
                  <p className="text-[10px] text-slate-400">Click the circle to designate the correct answer option.</p>
                </div>

                <button
                  type="button"
                  onClick={handleAddOption}
                  disabled={currentQ.mcqOptions.length >= 8}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-1 px-3 rounded-lg flex items-center gap-1 transition-all disabled:opacity-30 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Option</span>
                </button>
              </div>

              {/* Option Cards */}
              <div className="space-y-3">
                {currentQ.mcqOptions.map((opt, oIdx) => {
                  const isCorrect = opt.correct;

                  return (
                    <div
                      key={opt.id}
                      className={`p-3.5 rounded-xl border transition-all space-y-2 ${
                        isCorrect
                          ? 'bg-emerald-50/40 border-emerald-400 dark:bg-emerald-950/20 dark:border-emerald-700'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleSelectCorrectOption(oIdx)}
                          className={`p-1 rounded-full cursor-pointer transition-all ${
                            isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-300 hover:text-slate-500'
                          }`}
                          title="Mark as correct answer"
                        >
                          {isCorrect ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                        </button>

                        <span className={`text-xs font-mono font-bold ${isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                          {opt.id}.
                        </span>

                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) => handleOptionFieldChange(oIdx, { text: e.target.value })}
                          className="flex-grow bg-transparent border-none text-xs font-medium text-slate-800 dark:text-slate-100 outline-none"
                          placeholder={`Option ${opt.id} text...`}
                        />

                        {isCorrect && (
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded font-mono font-bold uppercase">
                            Correct Answer
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemoveOption(oIdx)}
                          className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                          title="Remove option"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Advanced Option Attributes */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-dashed border-slate-200 dark:border-slate-800 text-[10px]">
                        <input
                          type="text"
                          value={opt.mathFormula || ''}
                          onChange={(e) => handleOptionFieldChange(oIdx, { mathFormula: e.target.value })}
                          placeholder="Option LaTeX math (optional)..."
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded font-mono"
                        />
                        <input
                          type="text"
                          value={opt.codeSnippet || ''}
                          onChange={(e) => handleOptionFieldChange(oIdx, { codeSnippet: e.target.value })}
                          placeholder="Option code snippet (optional)..."
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded font-mono"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Non-MCQ Correct Answer Reference */}
          {currentQ.type !== 'multiple-choice' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-2">
              <h4 className="font-bold text-xs uppercase font-mono text-slate-700 dark:text-slate-300">
                Correct Answer Key Reference
              </h4>
              <input
                type="text"
                value={currentQ.correctAnswer || ''}
                onChange={(e) => syncToParent({ correctAnswer: e.target.value })}
                placeholder="Enter target correct answer keywords..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs text-emerald-600 dark:text-emerald-400 font-bold outline-none"
              />
            </div>
          )}

          {/* Explanation Walkthrough */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-2">
            <h4 className="font-bold text-xs uppercase font-mono text-slate-700 dark:text-slate-300">
              Explanation & Solution Walkthrough
            </h4>
            <textarea
              value={currentQ.explanation || ''}
              onChange={(e) => syncToParent({ explanation: e.target.value })}
              placeholder="Explain why this answer is correct..."
              rows={2}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs text-slate-600 dark:text-slate-300 outline-none"
            />
          </div>

          {/* Validation Warnings */}
          {validationErrors.length > 0 ? (
            <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 p-3.5 rounded-2xl space-y-1 text-xs">
              <span className="font-bold text-rose-600 dark:text-rose-400 font-mono uppercase flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                Incomplete Question Details
              </span>
              <ul className="list-disc list-inside text-rose-500 dark:text-rose-400 space-y-0.5">
                {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          ) : (
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 p-3 rounded-2xl flex items-center gap-2 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Question validation complete and ready for students.</span>
            </div>
          )}

          {/* Collapsible Live Preview Panel */}
          {livePreviewMode && (
            <div className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 shadow-lg overflow-hidden space-y-0">
              <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-indigo-400 uppercase flex items-center gap-2">
                  <Monitor className="w-4 h-4" />
                  Student Live View Simulator
                </span>

                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setPreviewDevice('desktop')}
                    className={`p-1 rounded ${previewDevice === 'desktop' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                    title="Desktop View"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setPreviewDevice('tablet')}
                    className={`p-1 rounded ${previewDevice === 'tablet' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                    title="Tablet View"
                  >
                    <Tablet className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setPreviewDevice('mobile')}
                    className={`p-1 rounded ${previewDevice === 'mobile' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                    title="Mobile View"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Device Frame */}
              <div className={`p-6 mx-auto transition-all ${
                previewDevice === 'mobile' ? 'max-w-xs' : previewDevice === 'tablet' ? 'max-w-md' : 'w-full'
              }`}>
                <div className="space-y-4">
                  <h4 className="text-sm font-bold leading-relaxed">
                    {currentQ.questionText || '(Question text prompt)'}
                  </h4>

                  {currentQ.mathFormula && (
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-center font-mono text-xs text-indigo-400">
                      {currentQ.mathFormula}
                    </div>
                  )}

                  {currentQ.imageUrl && (
                    <img src={currentQ.imageUrl} alt="Diagram" className="max-h-48 mx-auto rounded-lg border border-slate-800" />
                  )}

                  {currentQ.type === 'multiple-choice' && currentQ.mcqOptions && (
                    <div className="space-y-2">
                      {currentQ.mcqOptions.map((opt) => (
                        <div
                          key={opt.id}
                          className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-between ${
                            opt.correct
                              ? 'bg-indigo-950/60 border-indigo-500/80 text-white'
                              : 'bg-slate-950 border-slate-800 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold bg-slate-800 px-2 py-0.5 rounded text-[10px]">
                              {opt.id}
                            </span>
                            <span>{opt.text || '(Empty option)'}</span>
                          </div>
                          {opt.correct && (
                            <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 rounded font-mono">
                              Correct Key
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* QUESTION BANK MODAL */}
      {showQuestionBankModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto font-sans flex items-center justify-center bg-slate-950/60 p-4 select-none">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-500" />
                Import from Reusable Question Bank
              </h4>
              <button onClick={() => setShowQuestionBankModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto space-y-3 p-1">
              {bankQuestions.map((q) => (
                <div key={q.id} className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex items-start justify-between gap-3">
                  <div className="space-y-1 text-xs">
                    <span className="text-[9px] font-mono bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded font-bold uppercase">
                      {q.type === 'multiple-choice' ? 'MCQ' : q.type}
                    </span>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{q.questionText}</p>
                  </div>
                  <button
                    onClick={() => {
                      const copy = JSON.parse(JSON.stringify(q));
                      copy.id = `bank_imported_${Date.now()}`;
                      setEditingQuiz(prev => ({ ...prev, questions: [...(prev.questions || []), copy] }));
                      setShowQuestionBankModal(false);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-1 px-3 rounded-lg shrink-0"
                  >
                    Import
                  </button>
                </div>
              ))}

              {bankQuestions.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-400">Question bank is empty.</div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
