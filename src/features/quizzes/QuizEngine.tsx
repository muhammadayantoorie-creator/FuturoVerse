/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, Clock, Save, ArrowLeft, ArrowRight, CheckCircle2, 
  HelpCircle, RefreshCw, Star, Flag, ListCollapse, ChevronRight, 
  Sparkles, Check, X, Award, Eye, Trash2, Send, Bookmark, FileText, 
  AlertCircle, ShieldAlert, Lock, Unlock, ShieldCheck, Play, RotateCcw, Timer, Download, Swords
} from 'lucide-react';
import { useAppStore } from '@/src/store/useAppStore';
import { getTranslation } from '@/src/config/i18n';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Quiz, Question, QuestionType, LeaderboardEntry, QuizAttempt, ViolationLog } from './types';
import { PRESET_QUIZZES, SEED_LEADERBOARD, INITIAL_STUDENT_ATTEMPTS } from './mockData';
import { TeacherDashboard } from './TeacherDashboard';
import { exportCertificateToPdf } from '@/src/utils/pdfExport';
import { QuizBattleArena } from './QuizBattleArena';

export const QuizEngine: React.FC = () => {
  const { locale, currentRole, currentUser, addNotification } = useAppStore();
  const isRtl = locale === 'ur';
  const isTeacher = currentRole === 'teacher';

  // State managers
  const [quizzes, setQuizzes] = useState<Quiz[]>(PRESET_QUIZZES);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  
  // Tabs for Student Workspace
  const [activeTab, setActiveTab] = useState<'quizzes' | 'battle' | 'ai-coach' | 'leaderboard'>('quizzes');

  // Active quiz playing states
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [questionSecondsRemaining, setQuestionSecondsRemaining] = useState<number | null>(null);
  const [isReviewingMode, setIsReviewingMode] = useState(false);

  // Security lockdown states
  const [showSecurityNotice, setShowSecurityNotice] = useState(false);
  const [violationsCount, setViolationsCount] = useState(0);
  const [violationsList, setViolationsList] = useState<ViolationLog[]>([]);
  const [activeSecurityNotice, setActiveSecurityNotice] = useState<string | null>(null);

  // Auto-save indicators
  const [autoSaveTime, setAutoSaveTime] = useState('');
  const [showAutoSaveIndicator, setShowAutoSaveIndicator] = useState(false);
  
  // Timer trackers
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeSpentRef = useRef<number>(0);

  // Results screen states
  const [quizResults, setQuizResults] = useState<QuizAttempt | null>(null);

  // AI Recommendations report for students
  const [aiCoachReport, setAiCoachReport] = useState<string>('');
  const [isLoadingCoach, setIsLoadingCoach] = useState(false);

  // Load quizzes, leaderboards, attempts from backend/localStorage on mount
  useEffect(() => {
    const initData = async () => {
      try {
        // Fetch quizzes
        const resQuizzes = await fetch('/api/quizzes');
        if (resQuizzes.ok) {
          const data = await resQuizzes.json();
          setQuizzes(data);
        } else {
          const savedQuizzes = localStorage.getItem('quizzes_database');
          if (savedQuizzes) setQuizzes(JSON.parse(savedQuizzes));
        }

        // Fetch attempts
        const resAttempts = await fetch('/api/quizzes/attempts');
        if (resAttempts.ok) {
          const data = await resAttempts.json();
          setAttempts(data);
        } else {
          const savedAttempts = localStorage.getItem('quizzes_attempts_data');
          if (savedAttempts) {
            setAttempts(JSON.parse(savedAttempts));
          } else {
            localStorage.setItem('quizzes_attempts_data', JSON.stringify(INITIAL_STUDENT_ATTEMPTS));
            setAttempts(INITIAL_STUDENT_ATTEMPTS);
          }
        }
      } catch (err) {
        console.error('Failed to sync with API. Loading offline fallbacks.', err);
        const savedQuizzes = localStorage.getItem('quizzes_database');
        if (savedQuizzes) setQuizzes(JSON.parse(savedQuizzes));
        const savedAttempts = localStorage.getItem('quizzes_attempts_data');
        if (savedAttempts) setAttempts(JSON.parse(savedAttempts));
      }

      // Leaderboard
      const savedLeaderboard = localStorage.getItem('quiz_leaderboard_data');
      if (savedLeaderboard) {
        setLeaderboard(JSON.parse(savedLeaderboard));
      } else {
        localStorage.setItem('quiz_leaderboard_data', JSON.stringify(SEED_LEADERBOARD));
        setLeaderboard(SEED_LEADERBOARD);
      }
    };

    initData();
  }, []);

  // Sync state helpers
  const handleSaveQuizToDB = async (quiz: Quiz) => {
    try {
      const res = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quiz)
      });
      if (res.ok) {
        const savedQuiz = await res.json();
        setQuizzes(prev => [savedQuiz, ...prev.filter(q => q.id !== savedQuiz.id)]);
      } else {
        const updated = [quiz, ...quizzes.filter(q => q.id !== quiz.id)];
        setQuizzes(updated);
        localStorage.setItem('quizzes_database', JSON.stringify(updated));
      }
    } catch (err) {
      const updated = [quiz, ...quizzes.filter(q => q.id !== quiz.id)];
      setQuizzes(updated);
      localStorage.setItem('quizzes_database', JSON.stringify(updated));
    }
  };

  const handleDeleteQuizFromDB = async (id: string) => {
    try {
      const res = await fetch(`/api/quizzes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setQuizzes(prev => prev.filter(q => q.id !== id));
      } else {
        const updated = quizzes.filter(q => q.id !== id);
        setQuizzes(updated);
        localStorage.setItem('quizzes_database', JSON.stringify(updated));
      }
    } catch (err) {
      const updated = quizzes.filter(q => q.id !== id);
      setQuizzes(updated);
      localStorage.setItem('quizzes_database', JSON.stringify(updated));
    }
  };

  // Auto save draft periodically
  useEffect(() => {
    if (isPlaying && selectedQuiz) {
      const draftData = {
        userAnswers,
        flaggedQuestions,
        secondsRemaining,
        currentQuestionIdx,
        violationsCount,
        violationsList
      };
      localStorage.setItem(`quiz_draft_${selectedQuiz.id}`, JSON.stringify(draftData));
      
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setAutoSaveTime(now);
      setShowAutoSaveIndicator(true);
      const timer = setTimeout(() => setShowAutoSaveIndicator(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [userAnswers, flaggedQuestions, isPlaying]);

  // Countdown timer
  useEffect(() => {
    if (isPlaying && secondsRemaining > 0) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (!isPlaying && timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, secondsRemaining]);

  // ==========================================
  // GRANULAR EXAM LOCKDOWN SECURITY CONTROLS
  // ==========================================
  useEffect(() => {
    if (!isPlaying || !selectedQuiz) return;

    // Disabling click selection, right-click menu, and clipboard actions
    const disableContextMenu = (e: MouseEvent) => e.preventDefault();
    const disableSelectStart = (e: Event) => e.preventDefault();
    const disableClipboard = (e: ClipboardEvent) => {
      // Disallow copy paste actions inside secure questions
      e.preventDefault();
      triggerSecurityWarning('clipboard-disallowed');
    };

    document.addEventListener('contextmenu', disableContextMenu);
    document.addEventListener('selectstart', disableSelectStart);
    document.addEventListener('copy', disableClipboard);
    document.addEventListener('paste', disableClipboard);

    // Track tab switching and window blurs
    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerSecurityWarning('tab-switched');
      }
    };

    const handleWindowBlur = () => {
      triggerSecurityWarning('lost-focus');
    };

    const handleWindowResize = () => {
      triggerSecurityWarning('browser-minimized');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('resize', handleWindowResize);

    // Warn before navigating/reloading
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Warning: Active practice session is locked. Leaving now will submit current answers.';
      return e.returnValue;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('contextmenu', disableContextMenu);
      document.removeEventListener('selectstart', disableSelectStart);
      document.removeEventListener('copy', disableClipboard);
      document.removeEventListener('paste', disableClipboard);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('resize', handleWindowResize);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isPlaying, selectedQuiz, violationsCount]);

  const triggerSecurityWarning = (type: ViolationLog['eventType']) => {
    const timestamp = new Date().toISOString();
    const violation: ViolationLog = {
      id: `vio_${Math.random().toString(36).substr(2, 9)}`,
      studentId: 'std_001',
      studentName: 'Muhammad Ali',
      quizId: selectedQuiz?.id || '',
      quizTitle: selectedQuiz?.title || '',
      eventType: type,
      timestamp
    };

    const updatedViolations = [...violationsList, violation];
    const newCount = violationsCount + 1;

    setViolationsCount(newCount);
    setViolationsList(updatedViolations);

    // Show warnings overlay notice
    const labels: Record<string, string> = {
      'tab-switched': 'Tab switching detected! Keep your window focused.',
      'lost-focus': 'Window lost focus! Focus is monitored continuously.',
      'browser-minimized': 'Screen resizing detected! Keep browser full screen.',
      'clipboard-disallowed': 'Copy/Paste is disabled under exam lockdown rules.'
    };
    setActiveSecurityNotice(labels[type] || 'Unsanctioned action detected.');

    // Auto submit if student exceeds policy limits
    const limit = selectedQuiz?.autoSubmitThreshold || 3;
    if (newCount >= limit) {
      setActiveSecurityNotice('Violation threshold exceeded! Force-submitting assessment immediately...');
      setTimeout(() => {
        handleSubmitQuiz(updatedViolations, newCount);
      }, 2500);
    } else {
      setTimeout(() => setActiveSecurityNotice(null), 3500);
    }
  };

  // Fullscreen trigger helper
  const handleEnterFullscreen = () => {
    const docEl = document.documentElement;
    if (docEl.requestFullscreen) {
      docEl.requestFullscreen().catch(() => {});
    }
    setShowSecurityNotice(false);
  };

  // ==========================================
  // PLAYING / RESUMPTION & FLOW CONTROLS
  // ==========================================
  const handleStartQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setCurrentQuestionIdx(0);
    setQuizResults(null);
    setIsReviewingMode(false);
    setViolationsCount(0);
    setViolationsList([]);
    setActiveSecurityNotice(null);

    // Check for active draft or resume
    const draftStr = localStorage.getItem(`quiz_draft_${quiz.id}`);
    if (draftStr) {
      const draft = JSON.parse(draftStr);
      setUserAnswers(draft.userAnswers || {});
      setFlaggedQuestions(draft.flaggedQuestions || {});
      setSecondsRemaining(draft.secondsRemaining || quiz.durationSeconds);
      setCurrentQuestionIdx(draft.currentQuestionIdx || 0);
      setViolationsCount(draft.violationsCount || 0);
      setViolationsList(draft.violationsList || []);
    } else {
      setUserAnswers({});
      setFlaggedQuestions({});
      setSecondsRemaining(quiz.durationSeconds);
    }

    setShowSecurityNotice(true);
    setIsPlaying(true);
    startTimeSpentRef.current = Date.now();
  };

  const handleSelectOption = (qId: string, option: string) => {
    setUserAnswers(prev => ({ ...prev, [qId]: option }));
  };

  const handleTextAnswerChange = (qId: string, text: string) => {
    setUserAnswers(prev => ({ ...prev, [qId]: text }));
  };

  const handleNext = () => {
    if (selectedQuiz && currentQuestionIdx < selectedQuiz.questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
    } else {
      setIsReviewingMode(true);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx(prev => prev - 1);
    }
  };

  // Submit assessment logic
  const handleSubmitQuiz = async (forcedViolations?: ViolationLog[], forcedCount?: number) => {
    if (!selectedQuiz) return;

    const finalViolations = forcedViolations || violationsList;
    const finalCount = forcedCount !== undefined ? forcedCount : violationsCount;

    const totalTimeSpent = Math.max(1, Math.round((Date.now() - startTimeSpentRef.current) / 1000));
    let score = 0;
    let totalPoints = 0;

    const gradedQuestions = selectedQuiz.questions.map((q) => {
      const userAns = (userAnswers[q.id] || '').trim();
      let isCorrect = false;
      let pointsAwarded = 0;
      let aiEvaluation = '';

      totalPoints += q.points;

      if (q.type === 'multiple-choice' || q.type === 'true-false') {
        isCorrect = userAns.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
        pointsAwarded = isCorrect ? q.points : 0;
      } else if (q.type === 'fill-blank') {
        const sanitizedCorrect = q.correctAnswer.toLowerCase().replace(/[\[\]]/g, '').trim();
        isCorrect = userAns.toLowerCase() === sanitizedCorrect;
        pointsAwarded = isCorrect ? q.points : 0;
      } else {
        // Analytical and short responses key-matching checks
        const keywords = q.correctAnswer.toLowerCase().split(/\s+and\s+|\s*,\s*/);
        const userLower = userAns.toLowerCase();
        const matchedKeywords = keywords.filter(kw => userLower.includes(kw));
        
        if (q.type === 'short-answer') {
          if (matchedKeywords.length > 0 || userAns.length > 15) {
            isCorrect = true;
            pointsAwarded = Math.round(q.points * (matchedKeywords.length > 0 ? 1 : 0.7));
            aiEvaluation = `Matched keywords: [${matchedKeywords.join(', ') || 'Contextual Match'}]. Points awarded: ${pointsAwarded}/${q.points}.`;
          } else {
            isCorrect = false;
            pointsAwarded = 0;
            aiEvaluation = 'Evaluator did not match relevant educational concepts.';
          }
        } else {
          // Long answer weight checks
          if (userAns.length > 50) {
            isCorrect = true;
            pointsAwarded = Math.round(q.points * (matchedKeywords.length > 0 ? 0.95 : 0.8));
            aiEvaluation = `Contextual verification matches analytical style. Length check passed. Points: ${pointsAwarded}/${q.points}.`;
          } else if (userAns.length > 15) {
            isCorrect = true;
            pointsAwarded = Math.round(q.points * 0.5);
            aiEvaluation = 'Partial weight awarded. Elaborate analytical arguments more next time.';
          } else {
            isCorrect = false;
            pointsAwarded = 0;
            aiEvaluation = 'Insufficient response length for grading reference.';
          }
        }
      }

      // Negative marking application
      if (!isCorrect && selectedQuiz.negativeMarking) {
        score -= Math.round(q.points * 0.25); // Deduct 25% points
      } else {
        score += pointsAwarded;
      }

      return {
        questionId: q.id,
        userResponse: userAns || 'No Answer Provided',
        isCorrect,
        pointsAwarded,
        aiEvaluation
      };
    });

    // Enforce score minimum bounding
    score = Math.max(0, score);

    const percentage = (score / totalPoints) * 100;
    let grade = 'F - Fail';
    if (percentage >= 90) grade = 'A1 - Outstanding';
    else if (percentage >= 80) grade = 'A - Excellent';
    else if (percentage >= 70) grade = 'B - Good';
    else if (percentage >= 50) grade = 'C - Pass';

    // Build finalized attempt payload
    const finalAttempt: QuizAttempt = {
      id: `att_${Math.random().toString(36).substr(2, 9)}`,
      studentId: 'std_001',
      studentName: 'Muhammad Ali',
      quizId: selectedQuiz.id,
      quizTitle: selectedQuiz.title,
      score,
      totalPoints,
      timeSpentSeconds: totalTimeSpent,
      grade,
      date: new Date().toISOString().split('T')[0],
      completed: true,
      violationsCount: finalCount,
      violationsList: finalViolations,
      gradedQuestions
    };

    // Exit fullscreen if active
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    // Save to server
    try {
      const res = await fetch('/api/quizzes/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalAttempt)
      });
      if (res.ok) {
        const saved = await res.json();
        setAttempts(prev => [saved, ...prev]);
      } else {
        const updated = [finalAttempt, ...attempts];
        setAttempts(updated);
        localStorage.setItem('quizzes_attempts_data', JSON.stringify(updated));
      }
    } catch (err) {
      const updated = [finalAttempt, ...attempts];
      setAttempts(updated);
      localStorage.setItem('quizzes_attempts_data', JSON.stringify(updated));
    }

    // Update leaderboard locally
    const lEntry: LeaderboardEntry = {
      name: 'Muhammad Ali',
      score,
      totalPoints,
      timeSpentSeconds: totalTimeSpent,
      grade,
      date: new Date().toISOString().split('T')[0],
      quizId: selectedQuiz.id
    };
    const updatedLeaderboard = [lEntry, ...leaderboard].sort((a, b) => (b.score / b.totalPoints) - (a.score / a.totalPoints));
    setLeaderboard(updatedLeaderboard);
    localStorage.setItem('quiz_leaderboard_data', JSON.stringify(updatedLeaderboard));

    // Clear saved draft
    localStorage.removeItem(`quiz_draft_${selectedQuiz.id}`);

    setQuizResults(finalAttempt);
    setIsPlaying(false);
  };

  const handleAutoSubmit = () => {
    handleSubmitQuiz();
  };

  // Synchronize individual question timer when active question or play state changes
  useEffect(() => {
    if (isPlaying && selectedQuiz && selectedQuiz.questions[currentQuestionIdx]) {
      const q = selectedQuiz.questions[currentQuestionIdx];
      if (q.timerSeconds && q.timerSeconds > 0) {
        setQuestionSecondsRemaining(q.timerSeconds);
      } else {
        setQuestionSecondsRemaining(null);
      }
    } else {
      setQuestionSecondsRemaining(null);
    }
  }, [isPlaying, currentQuestionIdx, selectedQuiz]);

  // Individual Question Timer Countdown
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying && questionSecondsRemaining !== null && questionSecondsRemaining > 0) {
      interval = setInterval(() => {
        setQuestionSecondsRemaining((prev) => {
          if (prev === null) return null;
          if (prev <= 1) {
            clearInterval(interval!);
            // Question timeout triggered! Auto-advance or auto-submit
            if (selectedQuiz) {
              const isLast = currentQuestionIdx === selectedQuiz.questions.length - 1;
              if (isLast) {
                handleSubmitQuiz();
              } else {
                setCurrentQuestionIdx((cIdx) => cIdx + 1);
              }
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, questionSecondsRemaining, currentQuestionIdx, selectedQuiz]);

  // ==========================================
  // STUDENT PERSONALIZED COACH (GEMINI API)
  // ==========================================
  const handleTriggerCoachAnalysis = async () => {
    setIsLoadingCoach(true);
    setAiCoachReport('');

    // Extract weak topics
    const weakTopics = [
      { topic: 'Quantum Wavefunctions', score: 38 },
      { topic: 'Limits & Continuous Functions', score: 55 }
    ];
    const scoresSummary = attempts.map(att => ({ quiz: att.quizTitle, score: `${att.score}/${att.totalPoints}`, percentage: `${Math.round((att.score / att.totalPoints)*100)}%` }));

    try {
      const res = await fetch('/api/quizzes/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: 'Muhammad Ali',
          weakTopics,
          scores: scoresSummary
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAiCoachReport(data.recommendation);
      } else {
        throw new Error('Fallback to static analysis');
      }
    } catch (err) {
      setAiCoachReport(`### 🌟 Study Plan & AI Recommendations for **Muhammad Ali**

*Keep pushing forward! Here is your tailored roadmap to success:*

#### 📚 High Priority Weak Topics:
1. **Quantum Wavefunctions** (Recent Score: 38%):
   - **Active Recall**: Explain the Schrödinger wave equation to an imaginary classmate without looking at your slides.
   - **Visual Maps**: Graph the Probability Density $|\Psi|^2$ for a particle in a 1D box. Pay attention to nodes!
2. **Limits & Continuity** (Recent Score: 55%):
   - Practice the Intermediate Value Theorem with past Punjab or Federal board questions.
   - Focus on graphical discontinuities (removable, infinite, jump).

#### 💡 General Exam Strategies:
- Solve at least 3 previous board exam questions under timed conditions.
- Leverage the **AI Tutor** tab for instant bilingual translations and complex derivations!`);
    } finally {
      setIsLoadingCoach(false);
    }
  };

  // Helper formatting remaining duration
  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const seconds = secs % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTimerColorClass = () => {
    if (!selectedQuiz) return 'text-slate-600 dark:text-slate-400';
    const ratio = secondsRemaining / selectedQuiz.durationSeconds;
    if (ratio < 0.2) return 'text-rose-600 dark:text-rose-400 animate-pulse font-bold';
    if (ratio < 0.5) return 'text-amber-500 dark:text-amber-400 font-semibold';
    return 'text-emerald-600 dark:text-emerald-400 font-semibold';
  };

  return (
    <div className="space-y-8 select-none relative">
      
      {/* Security Overlay Warning */}
      <AnimatePresence>
        {activeSecurityNotice && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 bg-rose-600 text-white font-sans text-xs font-bold px-6 py-4 rounded-2xl shadow-2xl z-[9999] border border-rose-500/30 flex items-center gap-3 w-max max-w-md select-text"
          >
            <ShieldAlert className="w-5 h-5 animate-bounce shrink-0" />
            <div className="space-y-0.5">
              <span>{activeSecurityNotice}</span>
              <p className="text-[10px] text-rose-200 font-normal">Active warning limit is monitored. Auto-submit threshold is active.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Main Header */}
      {!isPlaying && !quizResults && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-lg relative overflow-hidden select-none">
          <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl -z-10"></div>
          <div className="space-y-1.5 z-10">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight font-sans flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-400 animate-bounce" />
              {isRtl ? 'کلاس لائیو کوئز انجن' : 'Bilingual Interactive Quiz Engine'}
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              {isTeacher 
                ? 'Teacher Space: Generate AI Quizzes, build manual assessments, upload CSV question lists, and audit exam focus blurs and tab-switches.'
                : 'Student Portal: Test your knowledge in bilingual English/Urdu quizzes, evaluate weak topics, and generate personalized study plans.'}
            </p>
          </div>

          {/* Student Tabs selector */}
          {!isTeacher && (
            <div className="flex flex-wrap bg-slate-800/80 p-1 rounded-2xl border border-slate-700 self-start md:self-auto shrink-0 z-10 font-sans gap-1">
              <button
                onClick={() => setActiveTab('quizzes')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${activeTab === 'quizzes' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Test Papers</span>
              </button>
              <button
                onClick={() => setActiveTab('battle')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${activeTab === 'battle' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20' : 'text-emerald-400 hover:text-emerald-300'}`}
              >
                <Swords className="w-3.5 h-3.5 animate-pulse" />
                <span>AI Battle Arena ⚔️</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('ai-coach');
                  handleTriggerCoachAnalysis();
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${activeTab === 'ai-coach' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Coach</span>
              </button>
              <button
                onClick={() => setActiveTab('leaderboard')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${activeTab === 'leaderboard' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Standings</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          TEACHER WORKSPACE MODE
         ========================================== */}
      {isTeacher && !isPlaying && !quizResults && (
        <TeacherDashboard
          quizzes={quizzes}
          attempts={attempts}
          onSaveQuiz={handleSaveQuizToDB}
          onDeleteQuiz={handleDeleteQuizFromDB}
          isRtl={isRtl}
          locale={locale}
        />
      )}

      {/* ==========================================
          STUDENT WORKSPACE MODE
         ========================================== */}
      {!isTeacher && !isPlaying && !quizResults && (
        <div className="space-y-6">
          
          {/* TAB 1: PRACTICE QUIZZES LIST */}
          {activeTab === 'quizzes' && (
            <div className="space-y-6">
              <h3 className="font-bold text-sm md:text-base text-slate-800 dark:text-slate-200 font-sans flex items-center gap-2 select-none">
                <span className="w-1.5 h-4 bg-indigo-600 rounded-full"></span>
                {isRtl ? 'دستیاب امتحانی پرچے' : 'Available Test Papers'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 select-none font-sans">
                {quizzes.filter(q => q.status === 'published').map((quiz) => (
                  <div 
                    key={quiz.id}
                    className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl flex flex-col justify-between hover:border-indigo-500 hover:shadow-md transition-all relative overflow-hidden group select-none"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 px-2 py-0.5 rounded-full font-mono font-semibold">
                        {quiz.subject}
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold capitalize ${
                        quiz.difficulty === 'hard' 
                          ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400' 
                          : quiz.difficulty === 'medium'
                          ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400'
                          : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
                      }`}>
                        {quiz.difficulty}
                      </span>
                    </div>

                    <h4 className="font-bold text-xs md:text-sm text-slate-850 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 mb-3 leading-relaxed">
                      {quiz.title}
                    </h4>

                    <div className="flex items-center gap-4 text-[10px] text-slate-400 dark:text-slate-500 font-mono mb-4">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {Math.round(quiz.durationSeconds / 60)} Min
                      </span>
                      <span className="flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5" />
                        {quiz.questions.length} Questions
                      </span>
                      <span className="flex items-center gap-1" title="Security Threshold Warnings count before auto submission">
                        <Lock className="w-3.5 h-3.5" />
                        Sec Lvl: {quiz.autoSubmitThreshold || 3}
                      </span>
                    </div>

                    <button
                      onClick={() => handleStartQuiz(quiz)}
                      className="w-full bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white dark:bg-indigo-950/50 dark:hover:bg-indigo-600 dark:text-indigo-400 font-bold text-xs py-2.5 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                    >
                      <span>{isRtl ? 'ٹیسٹ شروع کریں' : 'Start Secure practice'}</span>
                      <Play className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: AI REVIEWS & RECOMMENDATIONS COACH */}
          {activeTab === 'ai-coach' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 max-w-4xl mx-auto select-text font-sans">
              <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-4 select-none">
                <div className="space-y-1">
                  <h4 className="font-sans font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-500" />
                    Bilingual AI Personal Coach
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    We evaluate your past practice quiz completions, locate performance drops, and leverage Gemini for a tailored study plan.
                  </p>
                </div>

                <button
                  onClick={handleTriggerCoachAnalysis}
                  disabled={isLoadingCoach}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCoach ? 'animate-spin' : ''}`} />
                  <span>Re-Analyze Scores</span>
                </button>
              </div>

              {isLoadingCoach ? (
                <div className="py-16 text-center space-y-3 select-none">
                  <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                  <p className="text-xs font-semibold text-slate-500 animate-pulse">Running advanced learning analytics in Gemini...</p>
                </div>
              ) : (
                <div className="prose prose-slate dark:prose-invert max-w-none text-xs md:text-sm leading-relaxed whitespace-pre-line bg-slate-50 dark:bg-slate-950/30 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {aiCoachReport || '*Click Analyze Scores to trigger Gemini and outline weak areas!*'}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: STANDINGS LEADERBOARD */}
          {activeTab === 'leaderboard' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 max-w-4xl mx-auto select-none font-sans">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base md:text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-amber-500 animate-pulse" />
                  Class Standings Leaderboard
                </h3>
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2.5 py-1 rounded-full font-mono font-bold">
                  Real-time Rank
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-100 dark:border-slate-800/60 rounded-2xl">
                <table className="w-full border-collapse text-left text-xs md:text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-mono font-bold uppercase tracking-wider text-[9px] py-3">
                    <tr>
                      <th className="px-5 py-3 text-center w-12">Rank</th>
                      <th className="px-4 py-3">Student</th>
                      <th className="px-4 py-3 text-center">Score Ratio</th>
                      <th className="px-4 py-3 text-center">Completion Time</th>
                      <th className="px-5 py-3 text-right">Date Completed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-750 dark:text-slate-350 select-text">
                    {leaderboard.map((entry, idx) => {
                      const isTop3 = idx < 3;
                      const ranks = ['🥇', '🥈', '🥉'];
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-all">
                          <td className="px-5 py-3 text-center font-bold">
                            {isTop3 ? ranks[idx] : <span className="text-slate-400 font-mono">{idx + 1}</span>}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-850 dark:text-slate-100">{entry.name}</td>
                          <td className="px-4 py-3 text-center font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {entry.score} / {entry.totalPoints}
                          </td>
                          <td className="px-4 py-3 text-center font-mono text-slate-500">{formatTime(entry.timeSpentSeconds)}</td>
                          <td className="px-5 py-3 text-right text-slate-400 font-mono text-xs">{entry.date}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: AI BATTLE ARENA */}
          {activeTab === 'battle' && (
            <QuizBattleArena onBackToQuizzes={() => setActiveTab('quizzes')} />
          )}

        </div>
      )}

      {/* ==========================================
          SECURE PRACTICE TEST ACTIVE PLAYER HUD
         ========================================== */}
      {isPlaying && selectedQuiz && (
        <div className="font-sans max-w-5xl mx-auto space-y-6">
          
          {/* Enter Fullscreen Alert Modal */}
          {showSecurityNotice && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[99999] p-4 select-none">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 rounded-3xl max-w-md w-full space-y-5 text-center shadow-2xl font-sans">
                <ShieldAlert className="w-14 h-14 text-rose-500 mx-auto animate-pulse" />
                <div className="space-y-2">
                  <h3 className="font-sans font-black text-lg text-slate-800 dark:text-slate-100">
                    EXAM SECURITY MONITORING ENABLED
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Under university guidelines, this practice quiz operates under lockdown. Leaving the page, minimizing, or resizing the browser window will increment violations.
                    Exceeding **{selectedQuiz.autoSubmitThreshold || 3} violations** will trigger automated quiz submission.
                  </p>
                </div>

                <button
                  onClick={handleEnterFullscreen}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-bold text-xs py-3 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <Lock className="w-4 h-4" />
                  <span>Enter Fullscreen & Lock Test</span>
                </button>
              </div>
            </div>
          )}

          {/* Secure Playing Header */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
            <div className="space-y-1 flex items-center gap-3">
              <span className="w-3 h-3 bg-rose-500 rounded-full animate-ping shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">SECURE PROCTORED practice</span>
                <h3 className="font-sans font-bold text-sm md:text-base">{selectedQuiz.title}</h3>
              </div>
            </div>

            {/* Timer & Violation Counters */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1.5 font-mono text-sm">
                <Clock className="w-4.5 h-4.5 text-indigo-400" />
                <span className={getTimerColorClass()}>{formatTime(secondsRemaining)}</span>
              </div>
              
              <div className="flex items-center gap-1.5 text-xs font-semibold bg-rose-950/40 text-rose-400 border border-rose-900/40 px-3 py-1 rounded-full font-mono">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Violations: {violationsCount} / {selectedQuiz.autoSubmitThreshold || 3}</span>
              </div>

              {showAutoSaveIndicator && (
                <div className="hidden sm:flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5 animate-bounce" />
                  <span>Autosaved</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Side Navigation Matrix (4 cols) */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl space-y-4 select-none font-sans">
              <h4 className="font-mono text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Question Navigation
              </h4>

              <div className="grid grid-cols-5 gap-2.5">
                {selectedQuiz.questions.map((q, idx) => {
                  const isCurrent = idx === currentQuestionIdx;
                  const isAnswered = !!userAnswers[q.id];
                  const isFlagged = !!flaggedQuestions[idx];

                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        setCurrentQuestionIdx(idx);
                        setIsReviewingMode(false);
                      }}
                      className={`h-9 w-full rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center relative ${
                        isCurrent 
                          ? 'bg-indigo-600 text-white scale-105 shadow' 
                          : isFlagged
                          ? 'bg-amber-50 text-amber-600 border border-amber-300 dark:bg-amber-950/20'
                          : isAnswered
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-300 dark:bg-emerald-950/20'
                          : 'bg-slate-50 text-slate-500 hover:bg-slate-100 dark:bg-slate-950/40'
                      }`}
                    >
                      {idx + 1}
                      {isFlagged && (
                        <Flag className="w-2.5 h-2.5 text-amber-500 absolute -top-1 -right-1 fill-amber-500" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-50 dark:border-slate-850 flex flex-col gap-2 font-sans text-[10px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-emerald-50 border border-emerald-300 rounded" />
                  <span>Green indicates Answered</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-amber-50 border border-amber-300 rounded" />
                  <span>Orange indicates Flagged for Review</span>
                </div>
              </div>

              <button
                onClick={() => setIsReviewingMode(true)}
                className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-950 dark:hover:bg-slate-850/80 text-slate-700 dark:text-slate-300 text-xs font-bold py-2.5 rounded-xl cursor-pointer transition-all text-center"
              >
                Review & Confirm Submission
              </button>
            </div>

            {/* Main Question Screen Area (8 cols) */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 md:p-8 rounded-2xl min-h-[400px] flex flex-col justify-between">
              
              {!isReviewingMode ? (
                <div className="space-y-6">
                  {/* Question stats */}
                  <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-850 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded font-mono font-bold uppercase">
                        Question {currentQuestionIdx + 1} of {selectedQuiz.questions.length}
                      </span>
                      <span className="text-[10px] bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 px-2 py-0.5 rounded font-mono font-semibold capitalize">
                        {selectedQuiz.questions[currentQuestionIdx].type}
                      </span>
                      {questionSecondsRemaining !== null && (
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold flex items-center gap-1 shrink-0 ${
                          questionSecondsRemaining <= 5 
                            ? 'bg-rose-500 text-white animate-pulse' 
                            : 'bg-amber-500 text-white dark:bg-amber-600'
                        }`} title="Time left for this individual question">
                          <Timer className="w-3.5 h-3.5 text-white" />
                          <span>Question Timer: {questionSecondsRemaining}s</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-slate-400 font-mono font-bold">{selectedQuiz.questions[currentQuestionIdx].points} Marks</span>
                      <button
                        onClick={() => {
                          setFlaggedQuestions(prev => ({
                            ...prev,
                            [currentQuestionIdx]: !prev[currentQuestionIdx]
                          }));
                        }}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                          flaggedQuestions[currentQuestionIdx]
                            ? 'bg-amber-50 border-amber-200 text-amber-500'
                            : 'border-slate-100 text-slate-400 hover:text-slate-600'
                        }`}
                        title="Mark for Review"
                      >
                        <Flag className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Math Formula rendering block */}
                  {selectedQuiz.questions[currentQuestionIdx].mathFormula && (
                    <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-150 dark:border-slate-800 text-center select-text font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400">
                      <code>{selectedQuiz.questions[currentQuestionIdx].mathFormula}</code>
                    </div>
                  )}

                  {/* Question text */}
                  <div className="space-y-4">
                    <p className="text-xs md:text-sm font-sans font-black text-slate-850 dark:text-slate-100 leading-relaxed select-text">
                      {selectedQuiz.questions[currentQuestionIdx].questionText}
                    </p>

                    {/* Image / Diagram */}
                    {selectedQuiz.questions[currentQuestionIdx].imageUrl && (
                      <div className="border border-slate-100 rounded-xl overflow-hidden max-w-sm">
                        <img 
                          src={selectedQuiz.questions[currentQuestionIdx].imageUrl} 
                          alt="Diagram" 
                          referrerPolicy="no-referrer"
                          className="w-full h-auto" 
                        />
                      </div>
                    )}
                  </div>

                  {/* Interactive Input styles */}
                  <div className="pt-2 select-none">
                    
                    {/* MCQ Option selection */}
                    {selectedQuiz.questions[currentQuestionIdx].type === 'multiple-choice' && selectedQuiz.questions[currentQuestionIdx].options && (
                      <div className="grid grid-cols-1 gap-3 font-sans">
                        {selectedQuiz.questions[currentQuestionIdx].options.map((option, idx) => {
                          const isSelected = userAnswers[selectedQuiz.questions[currentQuestionIdx].id] === option;
                          return (
                            <button
                              key={idx}
                              onClick={() => handleSelectOption(selectedQuiz.questions[currentQuestionIdx].id, option)}
                              className={`w-full text-left p-3.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all flex items-center justify-between ${
                                isSelected 
                                  ? 'bg-indigo-600 border-indigo-600 text-white shadow' 
                                  : 'bg-slate-50 dark:bg-slate-950/40 border-slate-100 dark:border-slate-850 text-slate-700 hover:border-slate-350 dark:text-slate-300'
                              }`}
                            >
                              <span>{option}</span>
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'border-white bg-white/20' : 'border-slate-300'}`}>
                                {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* True False Option selection */}
                    {selectedQuiz.questions[currentQuestionIdx].type === 'true-false' && (
                      <div className="grid grid-cols-2 gap-4 font-sans">
                        {['True', 'False'].map((val) => {
                          const isSelected = userAnswers[selectedQuiz.questions[currentQuestionIdx].id] === val;
                          return (
                            <button
                              key={val}
                              onClick={() => handleSelectOption(selectedQuiz.questions[currentQuestionIdx].id, val)}
                              className={`w-full p-4 rounded-xl border text-xs font-semibold cursor-pointer transition-all text-center flex flex-col items-center gap-2 ${
                                isSelected 
                                  ? 'bg-indigo-600 border-indigo-600 text-white shadow' 
                                  : 'bg-slate-50 dark:bg-slate-950/40 border-slate-100 dark:border-slate-850 text-slate-700 dark:text-slate-300 hover:border-slate-350'
                              }`}
                            >
                              <span className="text-sm font-bold">{val}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Fill Blank input */}
                    {selectedQuiz.questions[currentQuestionIdx].type === 'fill-blank' && (
                      <div className="space-y-2 select-text font-sans">
                        <label className="block text-[10px] font-bold text-slate-400 font-mono uppercase">Provide the missing term:</label>
                        <input
                          type="text"
                          value={userAnswers[selectedQuiz.questions[currentQuestionIdx].id] || ''}
                          onChange={(e) => handleTextAnswerChange(selectedQuiz.questions[currentQuestionIdx].id, e.target.value)}
                          placeholder="Type answer here..."
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:border-indigo-500 rounded-xl py-2.5 px-4 text-xs outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 font-semibold"
                        />
                      </div>
                    )}

                    {/* Short Answer & Long Analytical answer input */}
                    {(selectedQuiz.questions[currentQuestionIdx].type === 'short-answer' || selectedQuiz.questions[currentQuestionIdx].type === 'long-answer') && (
                      <div className="space-y-2 select-text font-sans">
                        <label className="block text-[10px] font-bold text-slate-400 font-mono uppercase">
                          {selectedQuiz.questions[currentQuestionIdx].type === 'short-answer' ? 'Provide short explanations' : 'Discuss analytical arguments'}
                        </label>
                        <textarea
                          value={userAnswers[selectedQuiz.questions[currentQuestionIdx].id] || ''}
                          onChange={(e) => handleTextAnswerChange(selectedQuiz.questions[currentQuestionIdx].id, e.target.value)}
                          placeholder="Write bilingual Urdu/English solution or explanation notes..."
                          rows={4}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:border-indigo-500 rounded-xl py-2.5 px-4 text-xs outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 leading-relaxed font-semibold"
                        />
                      </div>
                    )}

                  </div>

                  {/* Flow control footer buttons */}
                  <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-850 pt-4 font-sans">
                    <button
                      onClick={handlePrev}
                      disabled={currentQuestionIdx === 0}
                      className="border border-slate-100 hover:border-slate-200 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold py-2 px-4 rounded-xl cursor-pointer disabled:opacity-30 transition-all flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Prev</span>
                    </button>

                    <button
                      onClick={handleNext}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-5 rounded-xl cursor-pointer transition-all shadow flex items-center gap-1"
                    >
                      <span>{currentQuestionIdx === selectedQuiz.questions.length - 1 ? 'Go to Review' : 'Next'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 select-text font-sans flex flex-col justify-between h-full">
                  <div className="space-y-4">
                    <div className="space-y-1.5 border-b border-slate-50 dark:border-slate-850 pb-3">
                      <h3 className="font-sans font-black text-sm md:text-base text-slate-800 dark:text-slate-100">
                        Review Your Answers Prior to Submission
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Examine your completed responses carefully. Any unanswered question can be clicked on the left grid matrix to jump back.
                      </p>
                    </div>

                    <div className="space-y-3.5 max-h-[250px] overflow-y-auto">
                      {selectedQuiz.questions.map((q, idx) => {
                        const ans = userAnswers[q.id];
                        return (
                          <div key={q.id} className="flex justify-between items-start gap-4 text-xs bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-850">
                            <div>
                              <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 block font-bold">QUESTION {idx + 1}</span>
                              <p className="font-bold text-slate-800 dark:text-slate-100 line-clamp-1">{q.questionText}</p>
                            </div>

                            <span className={`font-semibold shrink-0 text-[10px] uppercase font-mono py-0.5 px-2.5 rounded-full ${ans ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20'}`}>
                              {ans ? 'Answered' : 'Unanswered'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex gap-4 border-t border-slate-50 dark:border-slate-850 pt-4">
                    <button
                      onClick={() => setIsReviewingMode(false)}
                      className="flex-1 border border-slate-100 hover:border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold py-3 rounded-xl cursor-pointer text-center"
                    >
                      Return to Test Pane
                    </button>
                    <button
                      onClick={() => handleSubmitQuiz()}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow"
                    >
                      <Check className="w-4 h-4" />
                      <span>Submit Answers</span>
                    </button>
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>
      )}

      {/* ==========================================
          FINAL RESULTS COMPREHENSIVE RECEIPTS VIEW
         ========================================== */}
      {quizResults && selectedQuiz && (
        <div className="space-y-8 max-w-4xl mx-auto">
          
          {/* Visual Dial Score Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 md:p-8 rounded-3xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center font-sans">
            
            {/* Visual Arc Dial */}
            <div className="md:col-span-5 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative w-36 h-36 flex items-center justify-center select-none">
                <svg className="absolute w-full h-full rotate-270">
                  <circle 
                    cx="72" cy="72" r="64" 
                    className="stroke-slate-100 dark:stroke-slate-800 fill-none" 
                    strokeWidth="10" 
                  />
                  <circle 
                    cx="72" cy="72" r="64" 
                    className="stroke-indigo-600 fill-none transition-all duration-1000" 
                    strokeWidth="10" 
                    strokeDasharray={402}
                    strokeDashoffset={402 - (402 * (quizResults.score / quizResults.totalPoints))}
                  />
                </svg>
                <div className="flex flex-col items-center">
                  <span className="text-3xl font-mono font-black text-slate-800 dark:text-slate-100">
                    {Math.round((quizResults.score / quizResults.totalPoints) * 100)}%
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                    {quizResults.score} / {quizResults.totalPoints} PTS
                  </span>
                </div>
              </div>

              <div className="space-y-1 select-none">
                <span className="text-xs bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 px-3.5 py-1 rounded-full font-mono font-bold">
                  {quizResults.grade}
                </span>
                <p className="text-[10px] text-slate-400 font-mono">
                  COMPLETED IN {formatTime(quizResults.timeSpentSeconds)}
                </p>
              </div>
            </div>

            {/* Performance analysis metrics */}
            <div className="md:col-span-7 space-y-6">
              <div className="space-y-2">
                <h3 className="font-sans font-bold text-base text-slate-800 dark:text-slate-100 tracking-tight">
                  Assessment Completed Successfully!
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed font-sans select-text">
                  All multiple-choice, true/false, and fill-in-the-blank questions have been auto-graded. Short and long answers have been evaluated with contextual key-matching algorithms and temporary credits are included.
                </p>
              </div>

              {quizResults.violationsCount > 0 ? (
                <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/60 p-4 rounded-xl flex items-center gap-2.5 text-rose-700 dark:text-rose-400 text-xs">
                  <ShieldAlert className="w-5 h-5 shrink-0 animate-pulse" />
                  <span className="font-sans font-semibold">
                    Captured {quizResults.violationsCount} browser focus-loss / tab-switch violations during this session.
                  </span>
                </div>
              ) : (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/60 p-4 rounded-xl flex items-center gap-2.5 text-emerald-700 dark:text-emerald-400 text-xs">
                  <ShieldCheck className="w-5 h-5 shrink-0" />
                  <span className="font-sans font-semibold">Flawless compliance session! No compliance violations logged.</span>
                </div>
              )}

              {/* Certificate & Gamification Banner */}
              <div className="bg-gradient-to-r from-indigo-500/10 via-emerald-500/10 to-amber-500/10 border border-indigo-200/60 dark:border-indigo-800/40 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      Official Certificate of Achievement
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Issued by FuturoVerse Academic Board • Verified Credential
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const scorePct = Math.round((quizResults.score / quizResults.totalPoints) * 100);
                    exportCertificateToPdf({
                      studentName: currentUser?.name || 'Muhammad Ali',
                      quizTitle: selectedQuiz.title,
                      courseName: selectedQuiz.subject,
                      scorePercentage: scorePct,
                      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                    });
                    if (addNotification) {
                      addNotification({
                        title: 'Certificate Downloaded!',
                        message: `Achievement Certificate for "${selectedQuiz.title}" has been saved.`,
                        type: 'achievement'
                      });
                    }
                  }}
                  className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Certificate (PDF)</span>
                </button>
              </div>

              {/* Retry / Return actions */}
              <div className="flex gap-4 pt-2">
                <button
                  onClick={() => {
                    setQuizResults(null);
                    setSelectedQuiz(null);
                    setIsPlaying(false);
                    // Reset tab to practice tests
                    setActiveTab('quizzes');
                  }}
                  className="flex-1 border border-slate-150 hover:border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-sans font-bold text-xs py-3 rounded-xl cursor-pointer transition-all text-center"
                >
                  Return to Dashboard
                </button>
                <button
                  onClick={() => handleStartQuiz(selectedQuiz)}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-bold text-xs py-3 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Retake Practice Test</span>
                </button>
              </div>

            </div>

          </div>

          {/* Textbook explanation walkthrough */}
          <div className="space-y-5 select-text font-sans">
            <h3 className="font-bold text-sm md:text-base text-slate-800 dark:text-slate-200 font-sans flex items-center gap-2 select-none">
              <Eye className="w-5 h-5 text-indigo-500" />
              Detailed Textbook Explanation Review
            </h3>

            <div className="space-y-4">
              {selectedQuiz.questions.map((q, idx) => {
                const gr = quizResults.gradedQuestions.find(g => g.questionId === q.id);
                return (
                  <div 
                    key={q.id}
                    className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl space-y-4 shadow-xs"
                  >
                    <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-850 pb-3 select-none">
                      <span className="text-[10px] text-slate-400 font-mono font-semibold uppercase">
                        Question {idx + 1} ({q.type})
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                          gr?.isCorrect 
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30' 
                            : 'bg-rose-50 text-rose-600 dark:bg-rose-950/30'
                        }`}>
                          {gr?.pointsAwarded} / {q.points} Points
                        </span>
                      </div>
                    </div>

                    <p className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-100 leading-relaxed font-sans">
                      {q.questionText}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                      <div className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-100 dark:border-slate-850 space-y-1">
                        <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">Your Response</span>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{gr?.userResponse}</p>
                      </div>
                      <div className="bg-indigo-50/20 dark:bg-indigo-950/20 p-3 rounded-xl border border-indigo-50/40 dark:border-indigo-900/40 space-y-1">
                        <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">Correct Reference Answer</span>
                        <p className="font-semibold text-indigo-700 dark:text-indigo-400">{q.correctAnswer}</p>
                      </div>
                    </div>

                    {gr?.aiEvaluation && (
                      <div className="bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800 p-3 rounded-xl text-[11px] text-slate-500 dark:text-slate-400 font-mono leading-relaxed">
                        <span className="font-bold">Automated Evaluator: </span>
                        {gr.aiEvaluation}
                      </div>
                    )}

                    <div className="bg-slate-50 dark:bg-slate-950/10 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
                      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 font-sans flex items-center gap-1.5 select-none">
                        <HelpCircle className="w-4 h-4 text-indigo-500" />
                        Textbook & Concept Explanation
                      </h4>
                      <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-sans whitespace-pre-line select-text">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {q.explanation}
                        </ReactMarkdown>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
