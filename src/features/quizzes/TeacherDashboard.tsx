/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Sparkles, PlusCircle, FileText, ShieldCheck, History, Search, 
  Trash2, Copy, ArrowUp, ArrowDown, UploadCloud, CheckCircle2, 
  HelpCircle, RefreshCw, AlertCircle, Eye, Settings, Calendar, ListPlus, Edit3, Circle, Timer,
  Printer, Download, ChevronDown
} from 'lucide-react';
import { Quiz, Question, QuestionType, LeaderboardEntry, QuizAttempt, ViolationLog } from './types';
import { INITIAL_QUESTION_BANK } from './mockData';
import { ManualQuizCreator } from './ManualQuizCreator';
import { exportQuizToPdf } from '@/src/utils/pdfExport';

interface TeacherDashboardProps {
  quizzes: Quiz[];
  attempts: QuizAttempt[];
  onSaveQuiz: (quiz: Quiz) => void;
  onDeleteQuiz: (id: string) => void;
  isRtl: boolean;
  locale: string;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  quizzes,
  attempts,
  onSaveQuiz,
  onDeleteQuiz,
  isRtl,
  locale
}) => {
  // Tabs for Teacher Dashboard
  const [activeSubTab, setActiveSubTab] = useState<'ai-generate' | 'manual-create' | 'question-bank' | 'security-logs' | 'results'>('ai-generate');

  // Question Bank search
  const [bankSearch, setBankSearch] = useState('');
  const [bankTypeFilter, setBankTypeFilter] = useState<string>('all');
  const [bankQuestions, setBankQuestions] = useState<Question[]>(INITIAL_QUESTION_BANK);

  // CSV Import state
  const [importFeedback, setImportFeedback] = useState<string>('');

  // 1. AI Quiz states
  const [aiTopic, setAiTopic] = useState('');
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [aiCount, setAiCount] = useState(5);
  const [aiLanguage, setAiLanguage] = useState<'english' | 'urdu' | 'bilingual'>('bilingual');
  const [aiTypes, setAiTypes] = useState<QuestionType[]>(['multiple-choice', 'true-false', 'fill-blank']);
  const [aiDuration, setAiDuration] = useState(10); // minutes
  const [aiPassing, setAiPassing] = useState(50); // percentage
  const [aiNegativeMarking, setAiNegativeMarking] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState('');
  
  // AI Preview & Editing panel before saving
  const [aiPreviewQuiz, setAiPreviewQuiz] = useState<Quiz | null>(null);
  const [showAiPdfMenu, setShowAiPdfMenu] = useState<boolean>(false);

  // 2. Manual Quiz Editor states
  const [editingQuiz, setEditingQuiz] = useState<Partial<Quiz>>({
    title: '',
    subject: 'General Science',
    difficulty: 'medium',
    durationSeconds: 600,
    status: 'draft',
    attemptsAllowed: 3,
    passingMarks: 50,
    shuffleQuestions: false,
    shuffleOptions: true,
    autoSubmitOnTimeout: true,
    showScoreAfterSubmission: true,
    showCorrectAnswers: true,
    negativeMarking: false,
    autoSubmitThreshold: 3,
    questions: []
  });

  // Toggle selection for AI question styles
  const toggleAiType = (type: QuestionType) => {
    if (aiTypes.includes(type)) {
      if (aiTypes.length > 1) {
        setAiTypes(aiTypes.filter(t => t !== type));
      }
    } else {
      setAiTypes([...aiTypes, type]);
    }
  };

  // Generate AI Quiz handler
  const handleGenerateAiQuiz = async () => {
    if (!aiTopic.trim()) {
      setGenerationError('Please provide a lesson topic or lecture notes reference.');
      return;
    }
    setIsGenerating(true);
    setGenerationError('');
    setAiPreviewQuiz(null);

    try {
      const res = await fetch('/api/teacher/quizzes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          difficulty: aiDifficulty,
          questionCount: aiCount,
          language: aiLanguage,
          customTopic: aiTopic,
          questionTypes: aiTypes
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to generate quiz via Gemini API.');
      }

      const data = await res.json();
      
      // Map generated questions to ensure valid points allocation
      const mappedQuestions = data.questions.map((q: any, idx: number) => {
        const pts = q.type === 'long-answer' ? 25 : q.type === 'short-answer' ? 15 : 10;
        return {
          id: q.id || `ai_q_${idx}_${Date.now()}`,
          type: q.type || 'multiple-choice',
          questionText: q.questionText,
          options: q.options || (q.type === 'multiple-choice' ? ['Option A', 'Option B', 'Option C', 'Option D'] : undefined),
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || 'Detailed concept explanation.',
          points: q.points || pts,
          tags: [aiTopic.split(' ')[0]],
          timerSeconds: q.timerSeconds || 30 // Set default timer to 30s per question
        };
      });

      const fullQuiz: Quiz = {
        id: data.id || `quiz_${Math.random().toString(36).substr(2, 9)}`,
        title: data.title || `${aiTopic} AI Generated Quiz`,
        subject: aiTopic,
        difficulty: aiDifficulty,
        durationSeconds: aiDuration * 60,
        questions: mappedQuestions,
        status: 'draft',
        attemptsAllowed: 3,
        passingMarks: aiPassing,
        shuffleQuestions: false,
        shuffleOptions: true,
        autoSubmitOnTimeout: true,
        showScoreAfterSubmission: true,
        showCorrectAnswers: true,
        negativeMarking: aiNegativeMarking,
        autoSubmitThreshold: 3
      };

      setAiPreviewQuiz(fullQuiz);
    } catch (err: any) {
      console.error(err);
      setGenerationError(err.message || 'Error occurred. Please verify your Gemini API Key in Settings.');
      
      // Intelligent fallback offline generator
      const fallbackQuestions: Question[] = [
        {
          id: `fallback_mcq_${Date.now()}`,
          type: 'multiple-choice',
          questionText: `Core theory analysis for topic: "${aiTopic}" [English with Urdu glossary]`,
          options: ['Primary hypothesis validation', 'Iterative system expansion', 'Conceptual model integration', 'Bilateral optimization'],
          correctAnswer: 'Conceptual model integration',
          explanation: 'Textbooks outline model integration as the primary step to evaluating modern structures.',
          points: 10,
          tags: [aiTopic],
          timerSeconds: 30
        },
        {
          id: `fallback_tf_${Date.now()}`,
          type: 'true-false',
          questionText: `Under standard conditions, components within "${aiTopic}" remain entirely uniform.`,
          correctAnswer: 'True',
          explanation: 'Uniformity helps stabilize experimental control groups.',
          points: 10,
          tags: [aiTopic],
          timerSeconds: 30
        },
        {
          id: `fallback_blank_${Date.now()}`,
          type: 'fill-blank',
          questionText: `The process of adjusting internal states to achieve balance in this domain is known as [homeostasis].`,
          correctAnswer: 'homeostasis',
          explanation: 'Homeostasis acts as the primary feedback loop to stabilize complex conditions.',
          points: 10,
          tags: [aiTopic],
          timerSeconds: 30
        }
      ];

      const fallbackQuiz: Quiz = {
        id: `quiz_fallback_${Math.random().toString(36).substr(2, 9)}`,
        title: `${aiTopic} Revision Quiz`,
        subject: aiTopic,
        difficulty: aiDifficulty,
        durationSeconds: aiDuration * 60,
        questions: fallbackQuestions,
        status: 'draft',
        attemptsAllowed: 3,
        passingMarks: aiPassing,
        shuffleQuestions: false,
        shuffleOptions: true,
        autoSubmitOnTimeout: true,
        showScoreAfterSubmission: true,
        showCorrectAnswers: true,
        negativeMarking: aiNegativeMarking,
        autoSubmitThreshold: 3
      };
      setAiPreviewQuiz(fallbackQuiz);
    } finally {
      setIsGenerating(false);
    }
  };

  // Save AI Generated Quiz to teacher list
  const handleSaveAiQuiz = (publishedStatus: 'draft' | 'published') => {
    if (!aiPreviewQuiz) return;
    const finalQuiz: Quiz = {
      ...aiPreviewQuiz,
      status: publishedStatus
    };
    onSaveQuiz(finalQuiz);
    setAiPreviewQuiz(null);
    setAiTopic('');
    alert(publishedStatus === 'published' ? 'Quiz published successfully!' : 'Quiz saved as draft!');
  };

  // Modify AI question in preview panel before saving
  const handleEditAiQuestion = (qId: string, updatedField: Partial<Question>) => {
    if (!aiPreviewQuiz) return;
    const updatedQs = aiPreviewQuiz.questions.map(q => {
      if (q.id === qId) {
        return { ...q, ...updatedField };
      }
      return q;
    });
    setAiPreviewQuiz({ ...aiPreviewQuiz, questions: updatedQs });
  };

  // Delete question from AI preview panel
  const handleDeleteAiQuestion = (qId: string) => {
    if (!aiPreviewQuiz) return;
    const updatedQs = aiPreviewQuiz.questions.filter(q => q.id !== qId);
    setAiPreviewQuiz({ ...aiPreviewQuiz, questions: updatedQs });
  };

  // Reorder questions in AI preview panel
  const handleReorderAiQuestion = (idx: number, direction: 'up' | 'down') => {
    if (!aiPreviewQuiz) return;
    const qs = [...aiPreviewQuiz.questions];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= qs.length) return;
    
    // Swap
    const temp = qs[idx];
    qs[idx] = qs[targetIdx];
    qs[targetIdx] = temp;
    
    setAiPreviewQuiz({ ...aiPreviewQuiz, questions: qs });
  };

  // Duplicate question in AI preview panel
  const handleDuplicateAiQuestion = (idx: number) => {
    if (!aiPreviewQuiz) return;
    const qs = [...aiPreviewQuiz.questions];
    const original = qs[idx];
    const copy: Question = {
      ...original,
      id: `${original.id}_copy_${Date.now()}`,
      questionText: `${original.questionText} (Copy)`
    };
    qs.splice(idx + 1, 0, copy);
    setAiPreviewQuiz({ ...aiPreviewQuiz, questions: qs });
  };

  // 3. Manual Quiz Creator handlers
  const handleAddManualQuestion = () => {
    const newQ: Question = {
      id: `manual_q_${Date.now()}`,
      type: 'multiple-choice',
      questionText: 'New Question Text',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 'Option A',
      explanation: 'Explanation for correct answer.',
      points: 10,
      tags: ['Topic Tag']
    };
    setEditingQuiz(prev => ({
      ...prev,
      questions: [...(prev.questions || []), newQ]
    }));
  };

  const handleEditManualQuestion = (qId: string, fields: Partial<Question>) => {
    setEditingQuiz(prev => {
      const updatedQs = (prev.questions || []).map(q => {
        if (q.id === qId) {
          // Adjust options array if switching type to MC or others
          let options = q.options;
          if (fields.type === 'multiple-choice' && !options) {
            options = ['Option A', 'Option B', 'Option C', 'Option D'];
          }
          return { ...q, ...fields, options };
        }
        return q;
      });
      return { ...prev, questions: updatedQs };
    });
  };

  const handleDeleteManualQuestion = (qId: string) => {
    setEditingQuiz(prev => ({
      ...prev,
      questions: (prev.questions || []).filter(q => q.id !== qId)
    }));
  };

  const handleDuplicateManualQuestion = (idx: number) => {
    setEditingQuiz(prev => {
      const qs = [...(prev.questions || [])];
      const original = qs[idx];
      const copy: Question = {
        ...original,
        id: `manual_q_copy_${Date.now()}`,
        questionText: `${original.questionText} (Copy)`
      };
      qs.splice(idx + 1, 0, copy);
      return { ...prev, questions: qs };
    });
  };

  const handleReorderManualQuestion = (idx: number, direction: 'up' | 'down') => {
    setEditingQuiz(prev => {
      const qs = [...(prev.questions || [])];
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= qs.length) return prev;
      const temp = qs[idx];
      qs[idx] = qs[targetIdx];
      qs[targetIdx] = temp;
      return { ...prev, questions: qs };
    });
  };

  // Save manual quiz fully
  const handleSaveManualQuiz = (status: 'draft' | 'published') => {
    if (!editingQuiz.title?.trim()) {
      alert('Please provide a quiz title.');
      return;
    }
    const finalQuiz: Quiz = {
      id: editingQuiz.id || `quiz_manual_${Math.random().toString(36).substr(2, 9)}`,
      title: editingQuiz.title,
      subject: editingQuiz.subject || 'General',
      difficulty: editingQuiz.difficulty as any || 'medium',
      durationSeconds: editingQuiz.durationSeconds || 600,
      questions: editingQuiz.questions || [],
      status: status,
      attemptsAllowed: editingQuiz.attemptsAllowed || 3,
      passingMarks: editingQuiz.passingMarks || 50,
      shuffleQuestions: editingQuiz.shuffleQuestions || false,
      shuffleOptions: editingQuiz.shuffleOptions || true,
      autoSubmitOnTimeout: editingQuiz.autoSubmitOnTimeout || true,
      showScoreAfterSubmission: editingQuiz.showScoreAfterSubmission || true,
      showCorrectAnswers: editingQuiz.showCorrectAnswers || true,
      negativeMarking: editingQuiz.negativeMarking || false,
      autoSubmitThreshold: editingQuiz.autoSubmitThreshold || 3
    };

    onSaveQuiz(finalQuiz);
    alert(status === 'published' ? 'Quiz published successfully!' : 'Quiz saved as draft!');
    
    // Reset editor
    setEditingQuiz({
      title: '',
      subject: 'General Science',
      difficulty: 'medium',
      durationSeconds: 600,
      status: 'draft',
      attemptsAllowed: 3,
      passingMarks: 50,
      shuffleQuestions: false,
      shuffleOptions: true,
      autoSubmitOnTimeout: true,
      showScoreAfterSubmission: true,
      showCorrectAnswers: true,
      negativeMarking: false,
      autoSubmitThreshold: 3,
      questions: []
    });
  };

  // CSV Import handler
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      try {
        const lines = text.split('\n');
        const importedQs: Question[] = [];
        
        // Expected format: type,questionText,options,correctAnswer,explanation,points,tags
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          // Split by comma safely taking quotes into account
          const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
          const fields = matches.map(f => f.replace(/^"|"$/g, '').trim());
          if (fields.length < 2) continue;

          const type = (fields[0] || 'multiple-choice') as QuestionType;
          const questionText = fields[1] || '';
          const rawOptions = fields[2] || '';
          const options = rawOptions ? rawOptions.split('|') : undefined;
          const correctAnswer = fields[3] || '';
          const explanation = fields[4] || '';
          const points = Number(fields[5] || '10');
          const tags = fields[6] ? fields[6].split('|') : [];

          importedQs.push({
            id: `imported_q_${Math.random().toString(36).substr(2, 9)}`,
            type,
            questionText,
            options,
            correctAnswer,
            explanation,
            points,
            tags
          });
        }

        if (importedQs.length > 0) {
          // Add to Manual Quiz Creator questions list
          setEditingQuiz(prev => ({
            ...prev,
            questions: [...(prev.questions || []), ...importedQs]
          }));
          setImportFeedback(`Successfully imported ${importedQs.length} questions from CSV into your current quiz!`);
        } else {
          setImportFeedback('Could not find any valid questions in the uploaded CSV file. Please match the header structure.');
        }
      } catch (err) {
        console.error(err);
        setImportFeedback('Error parsing CSV. Please use double-quotes around fields with commas.');
      }
    };
    reader.readAsText(file);
  };

  // Filter question bank
  const filteredBank = bankQuestions.filter(q => {
    const matchSearch = q.questionText.toLowerCase().includes(bankSearch.toLowerCase()) || 
                        q.tags?.some(t => t.toLowerCase().includes(bankSearch.toLowerCase()));
    const matchType = bankTypeFilter === 'all' || q.type === bankTypeFilter;
    return matchSearch && matchType;
  });

  // Reuse question from bank to current manual quiz editor
  const handleReuseQuestion = (q: Question) => {
    const copy: Question = {
      ...q,
      id: `reused_q_${Math.random().toString(36).substr(2, 9)}`
    };
    setEditingQuiz(prev => ({
      ...prev,
      questions: [...(prev.questions || []), copy]
    }));
    alert('Question added to Manual Quiz Creator questions list!');
  };

  // Compile compliance violation logs list
  const complianceLogs: ViolationLog[] = attempts.flatMap(att => 
    (att.violationsList || []).map(vio => ({
      ...vio,
      quizTitle: att.quizTitle,
      studentName: att.studentName
    }))
  ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="space-y-6">
      
      {/* Teacher workspace secondary tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
        <button
          onClick={() => setActiveSubTab('ai-generate')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'ai-generate' 
              ? 'bg-indigo-600 text-white shadow' 
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Generator</span>
        </button>
        <button
          onClick={() => setActiveSubTab('manual-create')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'manual-create' 
              ? 'bg-indigo-600 text-white shadow' 
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'
          }`}
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Manual Creator {editingQuiz.questions?.length ? `(${editingQuiz.questions.length})` : ''}</span>
        </button>
        <button
          onClick={() => setActiveSubTab('question-bank')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'question-bank' 
              ? 'bg-indigo-600 text-white shadow' 
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Question Bank</span>
        </button>
        <button
          onClick={() => setActiveSubTab('security-logs')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'security-logs' 
              ? 'bg-indigo-600 text-white shadow' 
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Security Logs {complianceLogs.length ? `(${complianceLogs.length})` : ''}</span>
        </button>
        <button
          onClick={() => setActiveSubTab('results')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'results' 
              ? 'bg-indigo-600 text-white shadow' 
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Results Hub</span>
        </button>
      </div>

      {/* SUB TAB 1: AI GENERATOR */}
      {activeSubTab === 'ai-generate' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start select-none">
          
          {/* Settings Left Panel */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl space-y-5">
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 font-sans flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                Gemini AI Custom Quiz Specs
              </h4>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
                Provide custom curriculum chapters or paste notes, set question ratios, choose difficulty, and design secure bilingual quizzes instantly.
              </p>
            </div>

            {generationError && (
              <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/60 p-3 rounded-xl flex items-start gap-2.5 text-rose-700 dark:text-rose-400 select-text">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="text-[11px] leading-relaxed font-sans font-medium">{generationError}</span>
              </div>
            )}

            {/* Topic Input */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 font-mono uppercase">
                Curriculum Topic / Lecture Material Notes
              </label>
              <textarea
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="e.g., Punjab Board Physics Chapter 3: Fluid Dynamics, Bernoullis Principle with bilingual Urdu glossaries..."
                rows={3}
                disabled={isGenerating}
                className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl py-2 px-3 text-xs outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 leading-relaxed"
              />
            </div>

            {/* Params Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 font-mono uppercase">
                  Difficulty Level
                </label>
                <select
                  value={aiDifficulty}
                  onChange={(e) => setAiDifficulty(e.target.value as any)}
                  disabled={isGenerating}
                  className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl py-2 px-2.5 text-xs outline-none text-slate-700 dark:text-slate-300"
                >
                  <option value="easy">Easy (بنیادی)</option>
                  <option value="medium">Medium (درمیانہ)</option>
                  <option value="hard">Hard (مشکل)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 font-mono uppercase">
                  Total Questions
                </label>
                <select
                  value={aiCount}
                  onChange={(e) => setAiCount(Number(e.target.value))}
                  disabled={isGenerating}
                  className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl py-2 px-2.5 text-xs outline-none text-slate-700 dark:text-slate-300"
                >
                  <option value="3">3 Questions</option>
                  <option value="5">5 Questions</option>
                  <option value="8">8 Questions</option>
                  <option value="10">10 Questions</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 font-mono uppercase">
                  Language Target
                </label>
                <select
                  value={aiLanguage}
                  onChange={(e) => setAiLanguage(e.target.value as any)}
                  disabled={isGenerating}
                  className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl py-2 px-2.5 text-xs outline-none text-slate-700 dark:text-slate-300"
                >
                  <option value="bilingual">Bilingual (English/Urdu)</option>
                  <option value="english">English Only</option>
                  <option value="urdu">Urdu Only (اردو)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 font-mono uppercase">
                  Time Limit (Min)
                </label>
                <input
                  type="number"
                  value={aiDuration}
                  onChange={(e) => setAiDuration(Number(e.target.value))}
                  min={1}
                  disabled={isGenerating}
                  className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl py-2 px-3 text-xs outline-none text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Negative marking & Passing */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="aiNegative"
                  checked={aiNegativeMarking}
                  onChange={(e) => setAiNegativeMarking(e.target.checked)}
                  disabled={isGenerating}
                  className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <label htmlFor="aiNegative" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Negative Marking
                </label>
              </div>
              
              <div className="space-y-1">
                <span className="block text-[10px] text-slate-400 font-mono uppercase">Passing Grade (%)</span>
                <input
                  type="number"
                  value={aiPassing}
                  onChange={(e) => setAiPassing(Number(e.target.value))}
                  min={10}
                  max={100}
                  disabled={isGenerating}
                  className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl py-1 px-2 text-xs outline-none text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Question Styles Selector */}
            <div className="space-y-2 pt-1">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 font-mono uppercase">
                Question Styles to Distribute
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(['multiple-choice', 'true-false', 'fill-blank', 'short-answer', 'long-answer'] as QuestionType[]).map((type) => {
                  const isSelected = aiTypes.includes(type);
                  const labels: Record<string, string> = {
                    'multiple-choice': 'MCQ',
                    'true-false': 'True/False',
                    'fill-blank': 'Fill-Blank',
                    'short-answer': 'Short Ans',
                    'long-answer': 'Long Ans'
                  };
                  return (
                    <button
                      key={type}
                      type="button"
                      disabled={isGenerating}
                      onClick={() => toggleAiType(type)}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-sans font-semibold transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-indigo-600 text-white shadow-xs' 
                          : 'bg-slate-50 dark:bg-slate-950/40 text-slate-500 border border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {labels[type]}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleGenerateAiQuiz}
              disabled={isGenerating}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-sans font-bold py-3 rounded-xl transition-all cursor-pointer shadow flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Lecture Notes via Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate AI Assessment</span>
                </>
              )}
            </button>
          </div>

          {/* AI Generated Preview (Right Panel) */}
          <div className="lg:col-span-7 space-y-6 select-text">
            {aiPreviewQuiz ? (
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-5">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div className="space-y-1">
                    <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400 px-2 py-0.5 rounded-full font-mono font-bold">
                      AI GENERATION READY (DRAFT)
                    </span>
                    <h3 className="font-sans font-bold text-base text-slate-800 dark:text-slate-100">
                      {aiPreviewQuiz.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Export PDF */}
                    <div className="relative">
                      <button
                        onClick={() => setShowAiPdfMenu(!showAiPdfMenu)}
                        className="border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Export PDF</span>
                        <ChevronDown className="w-3 h-3 ml-0.5 opacity-60" />
                      </button>

                      {showAiPdfMenu && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowAiPdfMenu(false)} />
                          <div className="absolute right-0 top-9 w-60 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1.5 flex flex-col gap-1 z-50">
                            <button
                              onClick={() => {
                                exportQuizToPdf(aiPreviewQuiz, { mode: 'exam' });
                                setShowAiPdfMenu(false);
                              }}
                              className="w-full text-left px-3 py-2 text-xs font-medium rounded-lg text-slate-800 dark:text-slate-100 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 transition-colors flex items-center gap-2"
                            >
                              <FileText className="w-3.5 h-3.5 text-indigo-500" />
                              <span>Student Question Paper</span>
                            </button>
                            <button
                              onClick={() => {
                                exportQuizToPdf(aiPreviewQuiz, { mode: 'answer-key' });
                                setShowAiPdfMenu(false);
                              }}
                              className="w-full text-left px-3 py-2 text-xs font-medium rounded-lg text-slate-800 dark:text-slate-100 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 transition-colors flex items-center gap-2"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Teacher Master Key</span>
                            </button>
                            <button
                              onClick={() => {
                                exportQuizToPdf(aiPreviewQuiz, { mode: 'both' });
                                setShowAiPdfMenu(false);
                              }}
                              className="w-full text-left px-3 py-2 text-xs font-medium rounded-lg text-slate-800 dark:text-slate-100 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 transition-colors flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 pt-1.5"
                            >
                              <Download className="w-3.5 h-3.5 text-blue-500" />
                              <span>Full Exam & Solutions</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    <button
                      onClick={() => handleSaveAiQuiz('draft')}
                      className="border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                    >
                      Save Draft
                    </button>
                    <button
                      onClick={() => handleSaveAiQuiz('published')}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Publish Now</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-5 divide-y divide-slate-100 dark:divide-slate-800/80">
                  {aiPreviewQuiz.questions.map((q, idx) => (
                    <div key={q.id} className="pt-4 first:pt-0 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded font-mono uppercase font-semibold">
                          Q{idx + 1}: {q.type} ({q.points} Pts)
                        </span>
                        
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleReorderAiQuestion(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleReorderAiQuestion(idx, 'down')}
                            disabled={idx === aiPreviewQuiz.questions.length - 1}
                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDuplicateAiQuestion(idx)}
                            className="p-1 text-slate-400 hover:text-indigo-600 cursor-pointer"
                            title="Duplicate"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteAiQuestion(q.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {/* Interactive edit fields */}
                        <input
                          type="text"
                          value={q.questionText}
                          onChange={(e) => handleEditAiQuestion(q.id, { questionText: e.target.value })}
                          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg p-2 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500"
                        />

                        {q.options ? (
                          <div className="space-y-2 pt-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] text-slate-400 font-mono uppercase block font-bold text-indigo-600 dark:text-indigo-400">
                                Configure Options (Click option circle to set as correct answer)
                              </span>
                              <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded font-mono">
                                4 Options Mode
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {q.options.map((opt, oIdx) => {
                                const isCorrect = q.correctAnswer === opt;
                                return (
                                  <div key={oIdx} className={`flex items-center gap-2 border px-3 py-1.5 rounded-xl transition-all ${
                                    isCorrect 
                                      ? 'bg-emerald-50/50 border-emerald-400 dark:bg-emerald-950/20 dark:border-emerald-700/60' 
                                      : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-850 hover:border-slate-300'
                                  }`}>
                                    <button
                                      type="button"
                                      onClick={() => handleEditAiQuestion(q.id, { correctAnswer: opt })}
                                      className={`p-1 rounded-full transition-all cursor-pointer ${
                                        isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-300 hover:text-slate-500'
                                      }`}
                                      title="Mark this option as Correct Answer"
                                    >
                                      {isCorrect ? (
                                        <CheckCircle2 className="w-4 h-4" />
                                      ) : (
                                        <Circle className="w-4 h-4" />
                                      )}
                                    </button>
                                    <span className={`text-[11px] font-mono font-bold ${isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                                      {String.fromCharCode(65 + oIdx)}.
                                    </span>
                                    <input
                                      type="text"
                                      value={opt}
                                      onChange={(e) => {
                                        const opts = [...(q.options || [])];
                                        const oldOpt = opts[oIdx];
                                        opts[oIdx] = e.target.value;
                                        const updates: Partial<Question> = { options: opts };
                                        if (q.correctAnswer === oldOpt) {
                                          updates.correctAnswer = e.target.value;
                                        }
                                        handleEditAiQuestion(q.id, updates);
                                      }}
                                      className="w-full bg-transparent border-none text-xs text-slate-800 dark:text-slate-200 outline-none font-medium"
                                      placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                                    />
                                    {isCorrect && (
                                      <span className="text-[8px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 px-1.5 py-0.5 rounded font-bold font-sans uppercase tracking-wider shrink-0">
                                        Correct
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : null}

                        <div className="flex flex-col md:flex-row gap-4">
                          <div className="flex-1 space-y-1">
                            <span className="text-[9px] text-slate-400 font-mono uppercase font-bold text-indigo-600 dark:text-indigo-400">Correct Ref / Answer Key</span>
                            <input
                              type="text"
                              value={q.correctAnswer}
                              onChange={(e) => handleEditAiQuestion(q.id, { correctAnswer: e.target.value })}
                              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded p-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 outline-none font-medium"
                            />
                          </div>
                          
                          <div className="w-full md:w-40 space-y-1">
                            <span className="text-[9px] text-slate-400 font-mono uppercase flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold">
                              <Timer className="w-3 h-3" />
                              Timer (sec)
                            </span>
                            <input
                              type="number"
                              value={q.timerSeconds || ''}
                              onChange={(e) => handleEditAiQuestion(q.id, { timerSeconds: e.target.value ? Number(e.target.value) : undefined })}
                              placeholder="Unlimited"
                              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-1.5 rounded text-xs text-slate-800 dark:text-slate-250 font-mono font-semibold"
                              min="0"
                            />
                          </div>

                          <div className="flex-1 space-y-1">
                            <span className="text-[9px] text-slate-400 font-mono uppercase font-bold">Explanation Details</span>
                            <input
                              type="text"
                              value={q.explanation}
                              onChange={(e) => handleEditAiQuestion(q.id, { explanation: e.target.value })}
                              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded p-1.5 text-[11px] text-slate-500 outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-12 rounded-2xl text-center flex flex-col items-center justify-center space-y-3">
                <Sparkles className="w-12 h-12 text-slate-350 dark:text-slate-700 animate-pulse" />
                <h4 className="font-sans font-bold text-sm text-slate-600 dark:text-slate-300">
                  Awaiting Assessment Specification
                </h4>
                <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
                  Adjust topics, question styles, count, and trigger Gemini. You can review and surgically edit generated questions here prior to publishing!
                </p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* SUB TAB 2: MANUAL CREATOR */}
      {activeSubTab === 'manual-create' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Settings Left Panel */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl space-y-4">
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 font-sans flex items-center gap-1.5">
              <Settings className="w-4 h-4 text-indigo-500" />
              Quiz Config & Rules
            </h4>

            {/* Title */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 font-mono uppercase">
                Quiz Title
              </label>
              <input
                type="text"
                value={editingQuiz.title || ''}
                onChange={(e) => setEditingQuiz({ ...editingQuiz, title: e.target.value })}
                placeholder="e.g. Physics Mechanics Test 1"
                className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl py-2 px-3 text-xs outline-none text-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Subject */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 font-mono uppercase">
                Subject Course
              </label>
              <input
                type="text"
                value={editingQuiz.subject || ''}
                onChange={(e) => setEditingQuiz({ ...editingQuiz, subject: e.target.value })}
                placeholder="Physics, Biology, Urdu..."
                className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl py-2 px-3 text-xs outline-none text-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 font-mono uppercase">
                  Duration (Secs)
                </label>
                <input
                  type="number"
                  value={editingQuiz.durationSeconds || 600}
                  onChange={(e) => setEditingQuiz({ ...editingQuiz, durationSeconds: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl py-1.5 px-2 text-xs outline-none text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 font-mono uppercase">
                  Passing (%)
                </label>
                <input
                  type="number"
                  value={editingQuiz.passingMarks || 50}
                  onChange={(e) => setEditingQuiz({ ...editingQuiz, passingMarks: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl py-1.5 px-2 text-xs outline-none text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 font-mono uppercase">
                  Attempts Limit
                </label>
                <input
                  type="number"
                  value={editingQuiz.attemptsAllowed || 3}
                  onChange={(e) => setEditingQuiz({ ...editingQuiz, attemptsAllowed: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl py-1.5 px-2 text-xs outline-none text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 font-mono uppercase">
                  AutoSubmit Policy
                </label>
                <input
                  type="number"
                  value={editingQuiz.autoSubmitThreshold || 3}
                  onChange={(e) => setEditingQuiz({ ...editingQuiz, autoSubmitThreshold: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl py-1.5 px-2 text-xs outline-none text-slate-800 dark:text-slate-100"
                  title="Auto-submit test if student triggers focus loss / tab-switch violations more than N times"
                />
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-2 pt-1 font-sans text-xs">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="shufQs"
                  checked={editingQuiz.shuffleQuestions || false}
                  onChange={(e) => setEditingQuiz({ ...editingQuiz, shuffleQuestions: e.target.checked })}
                  className="rounded text-indigo-600 border-slate-300"
                />
                <label htmlFor="shufQs" className="font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Shuffle Question Order
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="shufOpts"
                  checked={editingQuiz.shuffleOptions || false}
                  onChange={(e) => setEditingQuiz({ ...editingQuiz, shuffleOptions: e.target.checked })}
                  className="rounded text-indigo-600 border-slate-300"
                />
                <label htmlFor="shufOpts" className="font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Shuffle MCQ Options
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="negMark"
                  checked={editingQuiz.negativeMarking || false}
                  onChange={(e) => setEditingQuiz({ ...editingQuiz, negativeMarking: e.target.checked })}
                  className="rounded text-indigo-600 border-slate-300"
                />
                <label htmlFor="negMark" className="font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Enable Negative Marking
                </label>
              </div>
            </div>

            {/* CSV Import button */}
            <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/85 p-3.5 rounded-xl space-y-2 select-none">
              <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 font-mono uppercase">
                Import from CSV/Excel
              </label>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-100 transition-all">
                  <UploadCloud className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Choose CSV</span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCSVUpload}
                    className="hidden"
                  />
                </label>
              </div>
              {importFeedback && (
                <p className="text-[9px] text-indigo-600 dark:text-indigo-400 leading-relaxed font-semibold">
                  {importFeedback}
                </p>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => handleSaveManualQuiz('draft')}
                className="flex-1 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850"
              >
                Save Draft
              </button>
              <button
                onClick={() => handleSaveManualQuiz('published')}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer shadow"
              >
                Publish Quiz
              </button>
            </div>
          </div>

          {/* Active Manual Questions List (Right Panel) */}
          <div className="lg:col-span-8">
            <ManualQuizCreator
              editingQuiz={editingQuiz}
              setEditingQuiz={setEditingQuiz}
              bankQuestions={bankQuestions}
              setBankQuestions={setBankQuestions}
            />
          </div>

        </div>
      )}

      {/* SUB TAB 3: QUESTION BANK */}
      {activeSubTab === 'question-bank' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
            <div className="space-y-1">
              <h4 className="font-sans font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <FileText className="w-5 h-5 text-indigo-500" />
                Reusable Question Bank
              </h4>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Search, reuse, archive, or duplicate questions across course modules.
              </p>
            </div>

            <div className="flex gap-2">
              <div className="relative bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-1.5 flex items-center gap-1.5 w-64">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={bankSearch}
                  onChange={(e) => setBankSearch(e.target.value)}
                  placeholder="Search questions or topics..."
                  className="bg-transparent border-none text-xs outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400 w-full"
                />
              </div>

              <select
                value={bankTypeFilter}
                onChange={(e) => setBankTypeFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 px-2.5 py-1 rounded-xl text-xs outline-none text-slate-700 dark:text-slate-300 font-sans"
              >
                <option value="all">All Styles</option>
                <option value="multiple-choice">MCQ</option>
                <option value="true-false">True/False</option>
                <option value="fill-blank">Fill Blank</option>
                <option value="short-answer">Short Answer</option>
                <option value="long-answer">Long Answer</option>
              </select>
            </div>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto select-text font-sans">
            {filteredBank.map((q) => (
              <div key={q.id} className="bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 p-4 rounded-xl flex items-start justify-between gap-4">
                <div className="space-y-2 flex-grow">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400 px-2 py-0.5 rounded font-semibold font-mono uppercase">
                      {q.type}
                    </span>
                    <span className="text-[9px] bg-slate-200/60 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded font-mono">
                      {q.points} Pts
                    </span>
                    {q.tags?.map(t => (
                      <span key={t} className="text-[9px] bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded font-mono">
                        #{t}
                      </span>
                    ))}
                  </div>

                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                    {q.questionText}
                  </p>

                  <div className="text-[11px] text-slate-400 font-mono leading-relaxed">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">Correct Answer: </span>
                    {q.correctAnswer}
                  </div>
                </div>

                <button
                  onClick={() => handleReuseQuestion(q)}
                  className="bg-white hover:bg-slate-150 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 py-1.5 px-3 rounded-lg flex items-center gap-1 transition-all shrink-0 select-none cursor-pointer"
                >
                  <ListPlus className="w-3.5 h-3.5" />
                  <span>Reuse Question</span>
                </button>
              </div>
            ))}

            {filteredBank.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-xs">
                No matching questions found in the Question Bank. Try searching different keywords.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB TAB 4: COMPLIANCE VIOLATION LOGS */}
      {activeSubTab === 'security-logs' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 select-none">
            <div className="space-y-1">
              <h4 className="font-sans font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-rose-500" />
                Exam Security Violation Auditing
              </h4>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Real-time event capture logs of student browser blurs, tab switching, and fullscreen bypass events.
              </p>
            </div>
            
            <span className="text-[10px] bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 font-mono font-bold px-3 py-1 rounded-full">
              {complianceLogs.length} Security Alerts
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-100 dark:border-slate-800/60 rounded-xl">
            <table className="w-full border-collapse text-left text-xs font-sans select-text">
              <thead className="bg-slate-50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold font-mono uppercase tracking-wider text-[9px]">
                <tr>
                  <th className="px-5 py-3">Student Name</th>
                  <th className="px-4 py-3">Quiz Title</th>
                  <th className="px-4 py-3">Violation Event</th>
                  <th className="px-5 py-3 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-750 dark:text-slate-350 font-sans">
                {complianceLogs.map((log, idx) => (
                  <tr key={`${log.id || 'vio'}_${idx}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-all">
                    <td className="px-5 py-3 font-semibold text-slate-800 dark:text-slate-100">{log.studentName}</td>
                    <td className="px-4 py-3 text-slate-500">{log.quizTitle}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 capitalize border border-rose-100/40 dark:border-rose-900/40">
                        <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping"></span>
                        {log.eventType.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-slate-400 text-[10px] font-mono">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}

                {complianceLogs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-10 text-slate-400 text-xs font-sans select-none">
                      Pristine session compliance! No browser tab-switch or window blur violations have occurred.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'results' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="space-y-1 border-b border-slate-100 dark:border-slate-800 pb-4 select-none">
            <h4 className="font-sans font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-500" />
              Student Performance & Grades Portal
            </h4>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Audit student marks, completion times, and contextual AI evaluations from the results gradebook.
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-100 dark:border-slate-800/60 rounded-xl">
            <table className="w-full border-collapse text-left text-xs font-sans select-text">
              <thead className="bg-slate-50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold font-mono uppercase tracking-wider text-[9px]">
                <tr>
                  <th className="px-5 py-3">Student</th>
                  <th className="px-4 py-3">Quiz Title</th>
                  <th className="px-4 py-3 text-center">Score</th>
                  <th className="px-4 py-3 text-center">Time Spent</th>
                  <th className="px-4 py-3 text-center">Violations</th>
                  <th className="px-5 py-3 text-right">Date Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-755 dark:text-slate-355 font-sans">
                {attempts.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-all">
                    <td className="px-5 py-3">
                      <div className="font-semibold text-slate-850 dark:text-slate-100">{att.studentName}</div>
                      <div className="text-[10px] text-slate-400 font-mono capitalize">{att.grade}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{att.quizTitle}</td>
                    <td className="px-4 py-3 text-center font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {att.score} / {att.totalPoints}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-500 font-mono text-[11px]">
                      {Math.floor(att.timeSpentSeconds / 60)}m {att.timeSpentSeconds % 60}s
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded-full font-bold ${
                        att.violationsCount > 0 
                          ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/30' 
                          : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30'
                      }`}>
                        {att.violationsCount}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-slate-450 font-mono text-[10px]">
                      {new Date(att.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}

                {attempts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-400 text-xs select-none">
                      No quiz submissions found yet. Practice test papers will log data here.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
