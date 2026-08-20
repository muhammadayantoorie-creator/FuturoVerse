/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '@/src/store/useAppStore';
import { getTranslation } from '@/src/config/i18n';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  BookOpen, HelpCircle, FileText, Layers, Flame, GitBranch, PenTool,
  Copy, Check, Download, RefreshCw, Save, Loader2, Sparkles, AlertCircle,
  Globe, BarChart2, ShieldAlert, Trash2, ArrowUpRight, CheckCircle2, FileUp, X, Plus
} from 'lucide-react';
import { ChatAssistant } from './ChatAssistant';

interface Material {
  id: string;
  fileName: string;
  courseName: string;
}

interface SavedItem {
  id: string;
  title: string;
  task: string;
  topic: string;
  difficulty: string;
  language: string;
  content: string;
  savedAt: string;
}

const taskOptions = [
  { id: 'summary', name: 'Executive Summary', icon: BookOpen, desc: 'Detailed educational overview and takeaways', color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/50' },
  { id: 'quiz', name: 'Practice Quiz', icon: HelpCircle, desc: 'MCQs, True/False and structured exercises', color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400 border-rose-100 dark:border-rose-900/50' },
  { id: 'homework', name: 'Homework Creator', icon: FileText, desc: 'Rigorous assignments with analytic rubrics', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 border-amber-100 dark:border-amber-900/50' },
  { id: 'flashcards', name: 'Active Flashcards', icon: Layers, desc: 'Memorable front/back bite-sized concepts', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50' },
  { id: 'practice', name: 'Solved Practice', icon: Flame, desc: 'Step-by-step solved drills & math guides', color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/40 dark:text-sky-400 border-sky-100 dark:border-sky-900/50' },
  { id: 'mind_map', name: 'Mind Map Tree', icon: GitBranch, desc: 'Hierarchical conceptual relationship map', color: 'text-fuchsia-600 bg-fuchsia-50 dark:bg-fuchsia-950/40 dark:text-fuchsia-400 border-fuchsia-100 dark:border-fuchsia-900/50' },
  { id: 'notes', name: 'Comprehensive Notes', icon: PenTool, desc: 'In-depth analytical summaries & charts', color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/40 dark:text-violet-400 border-violet-100 dark:border-violet-900/50' },
];

export const AiTools: React.FC = () => {
  const { locale } = useAppStore();
  
  // App States
  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'workspace' | 'saved'>('chat');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
  const [customTopic, setCustomTopic] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('medium');
  const [language, setLanguage] = useState<string>('en');
  const [activeTask, setActiveTask] = useState<string>('summary');
  
  // Content Generation States
  const [content, setContent] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [loadingStage, setLoadingStage] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  
  // Action Feedback States
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');
  
  // Saved library states
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [activeSavedItem, setActiveSavedItem] = useState<SavedItem | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Fetch materials and saved items on load
  useEffect(() => {
    fetchMaterials();
    fetchSavedItems();
  }, []);

  const fetchMaterials = async () => {
    try {
      const res = await fetch('/api/teacher/materials');
      if (res.ok) {
        const data = await res.json();
        setMaterials(data || []);
        if (data && data.length > 0) {
          setSelectedMaterialId(data[0].id);
        } else {
          setSelectedMaterialId('custom');
        }
      }
    } catch (err) {
      console.error('Failed to load materials', err);
    }
  };

  const fetchSavedItems = async () => {
    try {
      const res = await fetch('/api/ai-workspace/saved');
      if (res.ok) {
        const data = await res.json();
        setSavedItems(data || []);
      }
    } catch (err) {
      console.error('Failed to load saved items', err);
    }
  };

  // Scroll to bottom during streaming
  useEffect(() => {
    if (isStreaming && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [content, isStreaming]);

  // Handle generation cancellation
  const cancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      setLoadingStage('Generation cancelled.');
    }
  };

  // Execute Gemini streaming API
  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Validate inputs
    if (selectedMaterialId === 'custom' && !customTopic.trim()) {
      setErrorMsg('Please enter a custom topic or select a lecture material.');
      return;
    }

    setErrorMsg('');
    setContent('');
    setIsStreaming(true);
    setLoadingStage('Connecting with FuturoVerse AI...');
    setActiveSavedItem(null);

    // Setup abort controller
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const stages = [
      'Drafting workspace outline...',
      'Analyzing curriculum expectations...',
      'Retrieving course context...',
      'Streaming material in real-time...'
    ];

    let stageIdx = 0;
    const stageTimer = setInterval(() => {
      if (stageIdx < stages.length - 1) {
        setLoadingStage(stages[stageIdx]);
        stageIdx++;
      }
    }, 1200);

    try {
      const res = await fetch('/api/ai-workspace/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: activeTask,
          customTopic: selectedMaterialId === 'custom' ? customTopic : '',
          materialId: selectedMaterialId !== 'custom' ? selectedMaterialId : null,
          difficulty,
          language
        }),
        signal: abortControllerRef.current.signal
      });

      clearInterval(stageTimer);

      if (!res.ok) {
        let errMsg = `API error (${res.status}): Failed to generate material.`;
        try {
          const errData = await res.json();
          if (errData && errData.error) {
            errMsg = errData.error;
          }
        } catch (e) {
          // fallback to default
        }
        throw new Error(errMsg);
      }

      setLoadingStage('Streaming response...');

      if (!res.body) {
        throw new Error('Readable stream not supported or empty body.');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        setContent(accumulated);
      }

      setIsStreaming(false);
      setLoadingStage('');
    } catch (err: any) {
      clearInterval(stageTimer);
      if (err.name === 'AbortError') {
        console.log('Stream aborted.');
      } else {
        console.error('Error during streaming:', err);
        setErrorMsg(err.message || 'An unexpected error occurred. Please try again.');
        setIsStreaming(false);
        setLoadingStage('');
      }
    }
  };

  // Copy material to clipboard
  const handleCopy = () => {
    const textToCopy = activeSavedItem ? activeSavedItem.content : content;
    if (!textToCopy) return;

    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch((err) => console.error('Failed to copy text', err));
  };

  // Download material as markdown file
  const handleDownload = () => {
    const text = activeSavedItem ? activeSavedItem.content : content;
    if (!text) return;

    const topicName = activeSavedItem 
      ? activeSavedItem.topic 
      : (selectedMaterialId === 'custom' 
          ? customTopic 
          : (materials.find(m => m.id === selectedMaterialId)?.fileName || 'AI_Material'));
    
    const taskName = activeSavedItem ? activeSavedItem.task : activeTask;

    const sanitizedTopic = topicName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `${sanitizedTopic}_${taskName}.md`;

    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Save generated material to DB
  const handleSave = async () => {
    if (!content) return;

    setIsSaving(true);
    setSaveSuccessMsg('');

    const topicName = selectedMaterialId === 'custom' 
      ? customTopic 
      : (materials.find(m => m.id === selectedMaterialId)?.fileName || 'Selected Material');

    const formattedTitle = `${taskOptions.find(t => t.id === activeTask)?.name || 'Material'} - ${topicName}`;

    try {
      const res = await fetch('/api/ai-workspace/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formattedTitle,
          task: activeTask,
          topic: topicName,
          difficulty,
          language,
          content
        })
      });

      if (res.ok) {
        setSaveSuccessMsg('Material saved securely to Library!');
        fetchSavedItems();
        setTimeout(() => setSaveSuccessMsg(''), 3000);
      } else {
        setErrorMsg('Failed to save workspace item on database.');
      }
    } catch (err) {
      console.error('Error saving item', err);
      setErrorMsg('Network error. Failed to save item.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete saved item
  const handleDeleteSaved = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this saved material?')) return;

    try {
      const res = await fetch(`/api/ai-workspace/saved/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        if (activeSavedItem?.id === id) {
          setActiveSavedItem(null);
        }
        fetchSavedItems();
      }
    } catch (err) {
      console.error('Failed to delete saved item', err);
    }
  };

  // Helper to load a saved item into workspace viewer
  const handleLoadSavedItem = (item: SavedItem) => {
    setActiveSavedItem(item);
    setActiveSubTab('workspace');
  };

  const isRtl = language === 'ur';

  // Stable onChange handler — prevents new function reference on every render (fixes input lag)
  const handleCustomTopicChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomTopic(e.target.value);
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-1">
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute left-1/3 bottom-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div>
          <div className="flex items-center gap-2 mb-2 text-indigo-400 font-medium text-sm tracking-wider uppercase font-mono">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>FuturoVerse AI Workspace</span>
          </div>
          <h2 className="text-3xl font-bold font-sans tracking-tight">
            AI Co-Pilot Workspace
          </h2>
          <p className="text-slate-400 text-sm mt-1.5 max-w-xl">
            Empowering Pakistani educators with premium, dual-language materials. Streamline summaries, quizzes, flashcards, mind maps, and analytic homework rubrics.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-800/80 p-1 rounded-2xl border border-slate-700/80 self-stretch md:self-auto overflow-x-auto shrink-0 gap-1">
          <button
            onClick={() => { setActiveSubTab('chat'); }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 flex items-center gap-2 cursor-pointer ${activeSubTab === 'chat' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Chatbot
          </button>
          <button
            onClick={() => { setActiveSubTab('workspace'); }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 flex items-center gap-2 cursor-pointer ${activeSubTab === 'workspace' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}
          >
            <PenTool className="w-3.5 h-3.5" />
            AI Studio Workspace
          </button>
          <button
            onClick={() => { setActiveSubTab('saved'); }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 flex items-center gap-2 relative cursor-pointer ${activeSubTab === 'saved' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}
          >
            <Save className="w-3.5 h-3.5" />
            Saved Library
            {savedItems.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {savedItems.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeSubTab === 'chat' ? (
        <ChatAssistant />
      ) : activeSubTab === 'workspace' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: Generation Setup controls (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
              
              <div className="border-b border-slate-100 dark:border-slate-800/60 pb-4">
                <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <span className="w-2 h-5 bg-indigo-600 rounded-full inline-block"></span>
                  Workspace Settings
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Configure sources and language profiles</p>
              </div>

              {/* Material or Topic Source selection */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Select Context Material or Custom Topic
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMaterialId(materials.length > 0 ? materials[0].id : 'custom')}
                    className={`p-3 rounded-2xl border text-xs font-medium text-left transition-all ${selectedMaterialId !== 'custom' ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 font-semibold' : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 text-xs">
                      <FileUp className="w-3.5 h-3.5" />
                      Uploaded Materials
                    </div>
                    <span className="text-[10px] opacity-80 block truncate">Use lecture context</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMaterialId('custom');
                      if (!customTopic) setCustomTopic('Limits & Continuity');
                    }}
                    className={`p-3 rounded-2xl border text-xs font-medium text-left transition-all ${selectedMaterialId === 'custom' ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 font-semibold' : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 text-xs">
                      <Plus className="w-3.5 h-3.5" />
                      Custom Topic
                    </div>
                    <span className="text-[10px] opacity-80 block">Type any subject</span>
                  </button>
                </div>

                {selectedMaterialId !== 'custom' ? (
                  <div className="space-y-1.5">
                    <select
                      value={selectedMaterialId}
                      onChange={(e) => setSelectedMaterialId(e.target.value)}
                      className="w-full text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200"
                    >
                      {materials.map((mat) => (
                        <option key={mat.id} value={mat.id}>
                          {mat.fileName} ({mat.courseName})
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 pl-1">
                      Gemini will reference key takeaways and insights of this material.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      placeholder="e.g., Quantum Wavefunctions or Urdu Poetry analysis"
                      value={customTopic}
                      onChange={handleCustomTopicChange}
                      className="w-full text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200"
                    />
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 pl-1">
                      Type any custom academic subject, topic, or question.
                    </p>
                  </div>
                )}
              </div>

              {/* Tuning Configurations */}
              <div className="grid grid-cols-2 gap-4">
                
                {/* Language Profiler */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-indigo-500" />
                    Target Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200"
                  >
                    <option value="en">English Only</option>
                    <option value="ur">Urdu (اردو)</option>
                    <option value="bilingual">Bilingual (English / Urdu)</option>
                  </select>
                </div>

                {/* Difficulty Tuning */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <BarChart2 className="w-3.5 h-3.5 text-rose-500" />
                    Cognitive Rigor
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200"
                  >
                    <option value="easy">Beginner / Foundational</option>
                    <option value="medium">Intermediate / Analytical</option>
                    <option value="hard">Advanced / Complex</option>
                  </select>
                </div>

              </div>

              {/* Task option selector */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Select AI Material Task
                </label>
                <div className="space-y-2">
                  {taskOptions.map((opt) => {
                    const Icon = opt.icon;
                    const isActive = activeTask === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => {
                          setActiveTask(opt.id);
                          setActiveSavedItem(null);
                        }}
                        className={`w-full flex items-start gap-3 p-3 rounded-2xl border text-left transition-all ${isActive ? 'border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/20 shadow-sm ring-1 ring-indigo-600' : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850/80 bg-white dark:bg-slate-900/40'}`}
                      >
                        <div className={`p-2.5 rounded-xl shrink-0 ${opt.color} border`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className={`text-xs font-bold ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'}`}>
                            {opt.name}
                          </h4>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                            {opt.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Main Submit action */}
              <div className="pt-2">
                {isStreaming ? (
                  <button
                    type="button"
                    onClick={cancelGeneration}
                    className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg hover:shadow-rose-500/20 transition-all cursor-pointer"
                  >
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Stop AI Generation
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleGenerate()}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg hover:shadow-indigo-500/25 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-5 h-5 text-indigo-200" />
                    Generate {taskOptions.find(t => t.id === activeTask)?.name}
                  </button>
                )}
              </div>

            </div>
          </div>

          {/* RIGHT: Output viewer container (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[760px] relative">
              
              {/* Output Header */}
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isStreaming ? 'bg-indigo-400' : 'bg-slate-300'}`}></span>
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${isStreaming ? 'bg-indigo-600' : 'bg-slate-400'}`}></span>
                    </span>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      {activeSavedItem 
                        ? 'Viewing Saved Library Material' 
                        : (isStreaming ? 'AI Assistant Streaming Live...' : 'Workspace Material Viewer')}
                    </h3>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    {activeSavedItem 
                      ? `${activeSavedItem.title}` 
                      : (content ? `Generated with ${difficulty} cognitive rigor in ${language === 'en' ? 'English' : language === 'ur' ? 'Urdu' : 'Bilingual'}` : 'Generate workspace tools to see outputs')}
                  </p>
                </div>

                {/* Header Action Buttons (Only show when content exists) */}
                {(content || activeSavedItem) && (
                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    {/* Copy Button */}
                    <button
                      onClick={handleCopy}
                      title="Copy content to clipboard"
                      className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all text-xs flex items-center gap-1 font-medium cursor-pointer"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? 'Copied' : 'Copy'}</span>
                    </button>

                    {/* Download Button */}
                    <button
                      onClick={handleDownload}
                      title="Download Markdown file"
                      className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all text-xs flex items-center gap-1 font-medium cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>

                    {/* Save Button (Hide if viewing previously saved) */}
                    {!activeSavedItem && content && (
                      <button
                        onClick={handleSave}
                        disabled={isSaving || isStreaming}
                        title="Save to library"
                        className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white shadow-sm text-xs flex items-center gap-1.5 font-semibold transition-all cursor-pointer"
                      >
                        {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-indigo-200" />}
                        <span>Save</span>
                      </button>
                    )}

                    {/* Reset view back to Workspace Stream */}
                    {activeSavedItem && (
                      <button
                        onClick={() => {
                          setActiveSavedItem(null);
                          setContent('');
                        }}
                        title="Close saved item"
                        className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Status Alert / Success Banner */}
              {saveSuccessMsg && (
                <div className="absolute top-16 left-6 right-6 z-10 bg-emerald-500 text-white py-2 px-4 rounded-xl shadow-lg flex items-center gap-2 animate-bounce">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-semibold">{saveSuccessMsg}</span>
                </div>
              )}

              {/* Content Body */}
              <div 
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto p-6 md:p-8 dark:bg-slate-900/20"
              >
                {errorMsg && (
                  <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 p-4 rounded-2xl flex items-start gap-3 text-rose-700 dark:text-rose-400">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-xs">Generation Error</h4>
                      <p className="text-xs mt-1 leading-relaxed">{errorMsg}</p>
                    </div>
                  </div>
                )}

                {/* Loading State & stages */}
                {isStreaming && !content && (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"></div>
                      <Sparkles className="w-6 h-6 text-indigo-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-slate-700 dark:text-slate-200 animate-pulse">
                        FuturoVerse AI is working...
                      </h4>
                      <p className="text-xs text-slate-400 font-mono">
                        {loadingStage}
                      </p>
                    </div>
                  </div>
                )}

                {/* Markdown content container */}
                {(content || (activeSavedItem && activeSavedItem.content)) ? (
                  <div 
                    className={`prose prose-slate dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 select-text leading-relaxed pb-12 ${isRtl ? 'rtl text-right font-sans' : 'ltr text-left'}`}
                    dir={isRtl ? 'rtl' : 'ltr'}
                  >
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        // Custom table renderer
                        table: ({node, ...props}) => (
                          <div className="overflow-x-auto my-6 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                            <table className="w-full border-collapse text-xs text-left" {...props} />
                          </div>
                        ),
                        thead: ({node, ...props}) => <thead className="bg-slate-50 dark:bg-slate-950/40 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-semibold" {...props} />,
                        tbody: ({node, ...props}) => <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50" {...props} />,
                        tr: ({node, ...props}) => <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all" {...props} />,
                        th: ({node, ...props}) => <th className="px-4 py-3.5 font-bold" {...props} />,
                        td: ({node, ...props}) => <td className="px-4 py-3.5" {...props} />,
                        
                        // Custom headings
                        h1: ({node, ...props}) => <h1 className="text-xl md:text-2xl font-bold font-sans tracking-tight text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800/80 pb-2 mt-8 mb-4 first:mt-0" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-base md:text-lg font-bold font-sans tracking-tight text-slate-800 dark:text-slate-100 mt-6 mb-3" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-4 mb-2" {...props} />,
                        
                        // Paragraphs & Lists
                        p: ({node, ...props}) => <p className="text-xs md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed my-3" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-5 my-3 space-y-1 text-xs md:text-sm" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-5 my-3 space-y-1 text-xs md:text-sm" {...props} />,
                        li: ({node, ...props}) => <li className="text-slate-700 dark:text-slate-300" {...props} />,
                        
                        // Custom code/pre formatting
                        code: ({node, className, children, ...props}: any) => {
                          const match = /language-(\w+)/.exec(className || '');
                          const codeText = String(children).replace(/\n$/, '');
                          
                          if (match) {
                            return (
                              <div className="relative my-4 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm bg-slate-950 text-slate-200 font-mono text-xs">
                                <div className="bg-slate-900/90 px-4 py-2 border-b border-slate-800 flex justify-between items-center text-[10px] text-slate-400">
                                  <span>{match[1].toUpperCase()}</span>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(codeText);
                                    }}
                                    className="hover:text-white flex items-center gap-1 focus:text-indigo-400 transition"
                                  >
                                    <Copy className="w-3 h-3" />
                                    Copy Code
                                  </button>
                                </div>
                                <pre className="p-4 overflow-x-auto select-text leading-relaxed">
                                  <code className={className} {...props}>
                                    {children}
                                  </code>
                                </pre>
                              </div>
                            );
                          }
                          return (
                            <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-indigo-600 dark:text-indigo-400 text-xs font-mono font-semibold" {...props}>
                              {children}
                            </code>
                          );
                        }
                      }}
                    >
                      {activeSavedItem ? activeSavedItem.content : content}
                    </ReactMarkdown>
                    
                    {/* Streaming flashing typing cursor */}
                    {isStreaming && (
                      <span className="inline-block w-2.5 h-4 ml-1 bg-indigo-500 animate-pulse align-middle"></span>
                    )}
                  </div>
                ) : (
                  // Empty State inside output container
                  !isStreaming && (
                    <div className="flex flex-col items-center justify-center py-24 text-center select-none">
                      <div className="w-16 h-16 rounded-2xl bg-indigo-50/50 dark:bg-slate-900 border border-indigo-100/30 dark:border-slate-800/80 mb-4 flex items-center justify-center text-indigo-500 dark:text-indigo-400">
                        <Sparkles className="w-7 h-7" />
                      </div>
                      <h3 className="font-sans font-bold text-base text-slate-800 dark:text-slate-100 mb-1.5">
                        Interactive AI Workspace Ready
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400 text-xs max-w-sm leading-relaxed mb-6">
                        Configure the settings in the sidebar panel, pick your required material type, and witness streaming creations in seconds.
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4 max-w-md bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/40">
                        <div className="text-left space-y-1">
                          <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                            <Globe className="w-3.5 h-3.5" />
                            Multi-language
                          </h4>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal">
                            Fully supports custom Urdu text generation & hybrid bilingual prompts.
                          </p>
                        </div>
                        <div className="text-left space-y-1">
                          <h4 className="text-xs font-bold text-rose-500 flex items-center gap-1">
                            <BarChart2 className="w-3.5 h-3.5" />
                            Dynamic Scaling
                          </h4>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal">
                            Vary cognitive difficulty to align with Pakistani curricula.
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>

            </div>
          </div>

        </div>
      ) : (
        /* SAVED LIBRARY TAB (Browsing saved workspace items) */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
            <div>
              <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Save className="w-5 h-5 text-indigo-600" />
                Your Saved AI Creations
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Browse, download, or edit previously generated tools</p>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Total Saved: {savedItems.length}
            </div>
          </div>

          {savedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 mb-4 flex items-center justify-center text-slate-400 dark:text-slate-500">
                <Save className="w-7 h-7" />
              </div>
              <h3 className="font-sans font-bold text-base text-slate-800 dark:text-slate-100 mb-1.5">
                Saved library is empty
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs max-w-sm mb-4">
                You haven't saved any generated materials yet. Go back to AI Studio Workspace to create some!
              </p>
              <button
                onClick={() => setActiveSubTab('workspace')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition"
              >
                Go to Workspace
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedItems.map((item) => {
                const opt = taskOptions.find(t => t.id === item.task);
                const IconComponent = opt?.icon || FileText;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleLoadSavedItem(item)}
                    className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 hover:border-indigo-200 dark:hover:border-indigo-900/60 transition shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-4 mb-3">
                        <div className={`p-2 rounded-xl border shrink-0 ${opt?.color || 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400'}`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <button
                          onClick={(e) => handleDeleteSaved(item.id, e)}
                          title="Delete saved item"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition line-clamp-1">
                        {item.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        Topic: {item.topic}
                      </p>
                    </div>

                    <div className="border-t border-slate-50 dark:border-slate-800/60 mt-4 pt-3 flex justify-between items-center text-[10px] text-slate-400">
                      <span className="font-mono bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md text-slate-600 dark:text-slate-400">
                        {item.difficulty.toUpperCase()}
                      </span>
                      <span>
                        {new Date(item.savedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
