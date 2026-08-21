/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Sparkles, Plus, Send, Trash2, Edit2, Check, X, ArrowUpRight, 
  MessageSquare, Menu, Copy, CheckCircle2, Loader2, HelpCircle, AlertCircle,
  Mic, MicOff, Volume2, VolumeX
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  messages: ChatMessage[];
}

const CodeBlock: React.FC<{ language: string; value: string }> = ({ language, value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlightCode = (code: string, lang: string) => {
    if (!code) return '';
    const escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const jsKeywords = /\b(const|let|var|function|return|import|export|from|class|extends|if|else|for|while|async|await|try|catch|new|this|default|export)\b/g;
    const pythonKeywords = /\b(def|class|return|import|from|as|if|elif|else|for|while|try|except|with|print|in|is|not|and|or|lambda|None|True|False)\b/g;
    const genericKeywords = /\b(public|private|protected|class|struct|interface|func|fn|let|mut|impl|use|import|return|if|else|for|in|while|match|switch|case|break)\b/g;

    let highlighted = escaped;
    const lowerLang = (lang || '').toLowerCase();

    if (lowerLang === 'js' || lowerLang === 'javascript' || lowerLang === 'ts' || lowerLang === 'typescript' || lowerLang === 'json') {
      highlighted = highlighted
        .replace(jsKeywords, '<span class="text-indigo-400 font-semibold">$1</span>')
        .replace(/(["'`])(.*?)\1/g, '<span class="text-emerald-400">"$2"</span>')
        .replace(/(\/\/.*)/g, '<span class="text-slate-500 italic">$1</span>')
        .replace(/\b(\d+)\b/g, '<span class="text-amber-400">$1</span>')
        .replace(/\b(\w+)(?=\()/g, '<span class="text-sky-300">$1</span>');
    } else if (lowerLang === 'python' || lowerLang === 'py') {
      highlighted = highlighted
        .replace(pythonKeywords, '<span class="text-indigo-400 font-semibold">$1</span>')
        .replace(/(["'])(.*?)\1/g, '<span class="text-emerald-400">"$2"</span>')
        .replace(/(#.*)/g, '<span class="text-slate-500 italic">$1</span>')
        .replace(/\b(\d+)\b/g, '<span class="text-amber-400">$1</span>')
        .replace(/\b(\w+)(?=\()/g, '<span class="text-sky-300">$1</span>');
    } else {
      highlighted = highlighted
        .replace(genericKeywords, '<span class="text-indigo-400 font-semibold">$1</span>')
        .replace(/(["'])(.*?)\1/g, '<span class="text-emerald-400">"$2"</span>')
        .replace(/\b(\d+)\b/g, '<span class="text-amber-400">$1</span>');
    }

    return (
      <code 
        className="font-mono text-xs md:text-sm text-slate-100 block whitespace-pre overflow-x-auto leading-relaxed" 
        dangerouslySetInnerHTML={{ __html: highlighted }} 
      />
    );
  };

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-slate-800 bg-[#0f141c] shadow-lg max-w-full">
      <div className="flex justify-between items-center px-4 py-2 bg-[#181f2a] border-b border-slate-800 text-slate-400 text-[10px] font-mono select-none">
        <div className="flex items-center gap-1.5 font-semibold text-slate-300">
          <div className="w-2 h-2 rounded-full bg-rose-500"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
          <span className="ml-2 uppercase tracking-wider">{language || 'code'}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 py-1 px-2 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 text-xs">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span className="text-xs">Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="p-4 overflow-x-auto">
        {highlightCode(value, language)}
      </div>
    </div>
  );
};

const suggestedQuestions = [
  { text: 'Create a syllabus for Physics 101: Mechanics.', label: 'Syllabus Builder' },
  { text: 'Suggest 5 interesting practice quiz topics on Cell Cycle & Mitosis.', label: 'Quiz Suggester' },
  { text: 'Explain Heisenberg\'s Uncertainty Principle in simple language.', label: 'Explain Concepts' },
  { text: 'Write a dual-language (Urdu-English) homework assignment for Calculus.', label: 'Homework Creator' }
];

class ChatErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ChatErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto my-12 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-3xl space-y-4 shadow-lg">
          <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/50 rounded-full flex items-center justify-center text-rose-600">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Something went wrong with the Chat Assistant</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            The Chat Assistant component encountered a rendering issue. This can happen if some chat data is formatted unexpectedly.
          </p>
          <div className="bg-slate-950 text-rose-400 p-4 rounded-xl text-left overflow-x-auto text-[10px] font-mono leading-normal max-h-40 w-full">
            {this.state.error?.toString()}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition cursor-pointer"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const ChatAssistantComponent: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChatId, setActiveChatId] = useState<string>('');
  const [inputText, setInputText] = useState<string>('');
  
  // Streaming & Loading state
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [streamedText, setStreamedText] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  
  // Sidebar responsive mobile state
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  
  // Inline rename state
  const [editingChatId, setEditingChatId] = useState<string>('');
  const [renameTitle, setRenameTitle] = useState<string>('');
  
  // Voice STT / TTS state
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const streamAbortControllerRef = useRef<AbortController | null>(null);

  // Speech Recognition handler
  const toggleSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition', err);
      setIsListening(false);
    }
  };

  // Text-to-speech handler
  const toggleSpeak = (id: string, text: string) => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in this browser.');
      return;
    }

    if (speakingMessageId === id) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const clean = text.replace(/<[^>]*>/g, '').replace(/[*#`_~]/g, '');
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);

    setSpeakingMessageId(id);
    window.speechSynthesis.speak(utterance);
  };

  // Load conversations on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  // Scroll to bottom when messages or stream changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, activeChatId, streamedText, isStreaming]);

  const fetchConversations = async (selectId?: string) => {
    try {
      const res = await fetch('/api/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data || []);
        if (data && data.length > 0) {
          // If custom id to select is supplied, select it; otherwise choose first
          if (selectId && data.some((c: Conversation) => c.id === selectId)) {
            setActiveChatId(selectId);
          } else if (!activeChatId || !data.some((c: Conversation) => c.id === activeChatId)) {
            setActiveChatId(data[0].id);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load conversations', err);
    }
  };

  const handleNewChat = async () => {
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Conversation' })
      });
      if (res.ok) {
        const newChat = await res.json();
        await fetchConversations(newChat.id);
        setIsSidebarOpen(false); // Close drawer on mobile
      }
    } catch (err) {
      console.error('Failed to start new chat', err);
    }
  };

  const handleRenameChat = async (id: string) => {
    if (!renameTitle.trim()) {
      setEditingChatId('');
      return;
    }
    try {
      const res = await fetch(`/api/conversations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: renameTitle })
      });
      if (res.ok) {
        setEditingChatId('');
        fetchConversations(id);
      }
    } catch (err) {
      console.error('Failed to rename chat', err);
    }
  };

  const handleDeleteChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this conversation?')) return;
    try {
      const res = await fetch(`/api/conversations/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        // If deleted current active chat, reset selection
        if (activeChatId === id) {
          const remaining = conversations.filter(c => c.id !== id);
          if (remaining.length > 0) {
            setActiveChatId(remaining[0].id);
          } else {
            setActiveChatId('');
          }
        }
        fetchConversations();
      }
    } catch (err) {
      console.error('Failed to delete chat', err);
    }
  };

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;

    setErrorMsg('');
    setInputText('');

    // Ensure we have an active chat ID
    let currentId = activeChatId;
    if (!currentId) {
      // Auto-create chat if none exists
      try {
        const res = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: trimmed.substring(0, 24) || 'New Conversation' })
        });
        if (res.ok) {
          const newChat = await res.json();
          currentId = newChat.id;
          setActiveChatId(newChat.id);
          // Wait for state write, then proceed
          setConversations(prev => [newChat, ...prev]);
        } else {
          setErrorMsg('Failed to initialize a new conversation.');
          return;
        }
      } catch (err) {
        setErrorMsg('Network error starting conversation.');
        return;
      }
    }

    const currentChat = conversations.find(c => c.id === currentId);
    if (!currentChat) return;

    // Append user message immediately on local state
    const userMsg: ChatMessage = {
      id: `msg_user_${Math.random().toString(36).substr(2, 9)}`,
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...(currentChat.messages || []), userMsg];

    // Optimistic update
    setConversations(prev => prev.map(c => c.id === currentId ? { ...c, messages: updatedMessages } : c));

    // Rename chat title if it was named "New Conversation" to match first user query
    if (currentChat.title === 'New Conversation') {
      const generatedTitle = trimmed.substring(0, 28) + (trimmed.length > 28 ? '...' : '');
      fetch(`/api/conversations/${currentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: generatedTitle })
      }).then(() => fetchConversations(currentId));
    }

    // Trigger Stream API call
    setIsStreaming(true);
    setStreamedText('');
    streamAbortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`/api/conversations/${currentId}/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
        signal: streamAbortControllerRef.current.signal
      });

      if (!response.ok) {
        let errMsg = 'Server responded with an error during response generation.';
        try {
          const errData = await response.json();
          if (errData && errData.error) {
            errMsg = errData.error;
          }
        } catch (e) {
          // fallback to default
        }
        throw new Error(errMsg);
      }

      if (!response.body) {
        throw new Error('Readable stream empty or unsupported in current environment.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        setStreamedText(accumulated);
      }

      // Finalize and reload fresh persisted state from DB (which now includes user and bot messages)
      setIsStreaming(false);
      setStreamedText('');
      await fetchConversations(currentId);

    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Stream generation aborted.');
      } else {
        console.error('Error during chat stream:', err);
        setErrorMsg(err.message || 'An unexpected error occurred. Please try again.');
      }
      setIsStreaming(false);
      setStreamedText('');
    }
  };

  const handleStopGeneration = () => {
    if (streamAbortControllerRef.current) {
      streamAbortControllerRef.current.abort();
      setIsStreaming(false);
      setStreamedText('');
      fetchConversations(activeChatId);
    }
  };

  const activeChat = conversations.find(c => c.id === activeChatId);

  // Stable handler to avoid re-creating on every render (prevents input lag)
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
  }, []);

  return (
    <div className="h-[640px] md:h-[700px] border border-slate-200 dark:border-slate-800/80 rounded-3xl overflow-hidden bg-white dark:bg-slate-900 shadow-xl grid grid-cols-1 md:grid-cols-12 relative">
      
      {/* 1. SIDEBAR (Conversation List) - Desktop: 4 cols, Mobile: Floating Drawer */}
      <div 
        className={`md:col-span-4 bg-slate-50 dark:bg-slate-950/40 border-r border-slate-200 dark:border-slate-800/80 flex flex-col h-full z-40 transition-transform duration-300 absolute md:static inset-y-0 left-0 w-[280px] md:w-auto ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-indigo-600 rounded-full inline-block"></span>
            Chat Assistant
          </h3>
          <button 
            onClick={handleNewChat}
            title="New Chat"
            className="p-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:text-indigo-600 text-slate-600 dark:text-slate-300 flex items-center gap-1.5 font-bold text-xs select-none cursor-pointer shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New</span>
          </button>
        </div>

        {/* Conversation list area */}
        <div className="flex-grow overflow-y-auto p-3 space-y-1.5">
          {conversations.length === 0 ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <span>No chat sessions yet.</span>
            </div>
          ) : (
            conversations.map((chat) => {
              const isActive = chat.id === activeChatId;
              const isEditing = chat.id === editingChatId;

              return (
                <div
                  key={chat.id}
                  onClick={() => {
                    if (!isEditing) {
                      setActiveChatId(chat.id);
                      setIsSidebarOpen(false); // Auto close drawer on mobile
                    }
                  }}
                  className={`group w-full flex items-center justify-between p-3 rounded-2xl text-left select-none cursor-pointer transition-all ${
                    isActive 
                      ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 font-semibold border-l-4 border-indigo-600 pl-2' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/30 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-grow">
                    <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                    {isEditing ? (
                      <input
                        type="text"
                        value={renameTitle}
                        onChange={(e) => setRenameTitle(e.target.value)}
                        onBlur={() => handleRenameChat(chat.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRenameChat(chat.id);
                          if (e.key === 'Escape') setEditingChatId('');
                        }}
                        autoFocus
                        className="bg-white dark:bg-slate-900 border border-indigo-500 rounded-lg px-2 py-0.5 text-xs outline-none w-full font-normal text-slate-800 dark:text-slate-200"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="text-xs truncate font-sans tracking-wide">
                        {chat.title}
                      </span>
                    )}
                  </div>

                  {/* Actions (Rename / Delete) */}
                  {!isEditing && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingChatId(chat.id);
                          setRenameTitle(chat.title);
                        }}
                        title="Rename Chat"
                        className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteChat(chat.id, e)}
                        title="Delete Chat"
                        className="p-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/30 text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer info */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
          <span>Powered by Gemini 3.5</span>
          <Sparkles className="w-3 h-3 text-indigo-500 animate-pulse" />
        </div>
      </div>

      {/* Mobile Drawer Overlay Backdrop */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="md:hidden fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-xs"
        />
      )}

      {/* 2. MAIN CHAT CONTAINER (8 cols on desktop, full screen on mobile) */}
      <div className="md:col-span-8 flex flex-col h-full bg-white dark:bg-slate-900">
        
        {/* Main Header bar */}
        <div className="h-14 px-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Hamburger for mobile toggle */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 md:hidden rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex flex-col">
              <h4 className="font-bold text-xs md:text-sm text-slate-800 dark:text-slate-200 font-sans truncate max-w-[200px] md:max-w-none">
                {activeChat ? activeChat.title : 'Chat Assistant'}
              </h4>
              <p className="text-[10px] text-slate-400 font-mono tracking-wider">
                {activeChat && activeChat.createdAt ? `CREATED: ${new Date(activeChat.createdAt).toLocaleDateString()}` : 'ACTIVE CONVERSATION'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 px-2 py-0.5 rounded-full font-mono font-semibold">
              Live Stream
            </span>
          </div>
        </div>

        {/* Scrollable messages list */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 select-text dark:bg-slate-950/10">
          
          {errorMsg && (
            <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 p-3.5 rounded-2xl flex items-start gap-2.5 text-rose-700 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold">Chat Error: </span>
                {errorMsg}
              </div>
            </div>
          )}

          {/* Empty Conversation Welcome Area */}
          {(!activeChat || !activeChat.messages || activeChat.messages.length <= 1) && !isStreaming && (
            <div className="flex flex-col items-center justify-center text-center py-10 max-w-lg mx-auto space-y-6">
              <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/40 rounded-3xl flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50 shadow-xs">
                <Sparkles className="w-7 h-7 text-indigo-600 dark:text-indigo-400 animate-bounce" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100 font-sans tracking-tight">
                  Assalam-o-Alaikum, how can I assist you?
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Start typing a question or click one of the suggested prompts below to generate a curriculum, quiz, lecture note, or check coding examples.
                </p>
              </div>

              {/* Suggested Questions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full pt-4">
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(q.text)}
                    className="p-3 text-left bg-slate-50 hover:bg-indigo-50/50 dark:bg-slate-950/40 dark:hover:bg-indigo-950/20 border border-slate-100 dark:border-slate-800 rounded-2xl transition-all cursor-pointer select-none"
                  >
                    <span className="block text-[10px] text-indigo-600 dark:text-indigo-400 font-mono tracking-wider uppercase font-semibold mb-1">
                      {q.label}
                    </span>
                    <span className="text-xs text-slate-600 dark:text-slate-300 block line-clamp-2 leading-relaxed">
                      {q.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Render Actual Chat Messages */}
          {activeChat && activeChat.messages && activeChat.messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div 
                key={msg.id}
                className={`flex gap-3.5 max-w-full ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {/* Bot Icon */}
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl shrink-0 bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white shadow-sm border border-indigo-700">
                    <Sparkles className="w-4.5 h-4.5" />
                  </div>
                )}

                {/* Message Bubble */}
                <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 leading-relaxed ${
                  isUser 
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200' 
                    : 'text-slate-800 dark:text-slate-200'
                }`}>
                  <div className="prose prose-slate dark:prose-invert max-w-none text-xs md:text-sm">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code: ({node, className, children, ...props}: any) => {
                          const match = /language-(\w+)/.exec(className || '');
                          const lang = match ? match[1] : '';
                          const isInline = !className || !className.includes('language-');
                          const codeText = String(children).replace(/\n$/, '');
                          
                          if (isInline) {
                            return <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs font-mono text-rose-500 font-semibold" {...props}>{children}</code>;
                          }
                          return <CodeBlock language={lang} value={codeText} />;
                        },
                        // Styled tags inside Markdown
                        p: ({node, ...props}) => <p className="leading-relaxed my-2 first:mt-0 last:mb-0" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-5 my-2 space-y-1" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-5 my-2 space-y-1" {...props} />,
                        h1: ({node, ...props}) => <h1 className="text-sm md:text-base font-bold font-sans text-indigo-600 dark:text-indigo-400 mt-4 mb-2 pb-1 border-b border-slate-100 dark:border-slate-800" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-xs md:text-sm font-bold font-sans mt-3 mb-1.5" {...props} />,
                        table: ({node, ...props}) => <div className="overflow-x-auto my-3 border border-slate-100 dark:border-slate-800 rounded-xl"><table className="w-full border-collapse text-xs text-left" {...props} /></div>,
                        thead: ({node, ...props}) => <thead className="bg-slate-50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800" {...props} />,
                        tr: ({node, ...props}) => <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors" {...props} />,
                        th: ({node, ...props}) => <th className="px-3 py-2 font-bold" {...props} />,
                        td: ({node, ...props}) => <td className="px-3 py-2" {...props} />
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                  <div className={`text-[9px] text-slate-400 font-mono mt-1.5 flex items-center gap-2 ${isUser ? 'justify-end' : 'justify-between'}`}>
                    <span>{msg.timestamp}</span>
                    {!isUser && (
                      <button
                        onClick={() => toggleSpeak(msg.id, msg.text)}
                        title={speakingMessageId === msg.id ? "Stop voice narration" : "Listen to AI voice"}
                        className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        {speakingMessageId === msg.id ? (
                          <>
                            <VolumeX className="w-3 h-3 text-rose-500 animate-pulse" />
                            <span className="text-[9px] text-rose-500 font-sans">Stop Audio</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3 h-3" />
                            <span className="text-[9px] font-sans">Listen</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Active Live Stream Chunk */}
          {isStreaming && streamedText && (
            <div className="flex gap-3.5 max-w-full justify-start">
              <div className="w-8 h-8 rounded-xl shrink-0 bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white shadow-sm border border-indigo-700">
                <Sparkles className="w-4.5 h-4.5" />
              </div>
              <div className="max-w-[85%] md:max-w-[75%] rounded-2xl p-4 leading-relaxed text-slate-800 dark:text-slate-200">
                <div className="prose prose-slate dark:prose-invert max-w-none text-xs md:text-sm">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code: ({node, className, children, ...props}: any) => {
                        const match = /language-(\w+)/.exec(className || '');
                        const lang = match ? match[1] : '';
                        const isInline = !className || !className.includes('language-');
                        const codeText = String(children).replace(/\n$/, '');
                        
                        if (isInline) {
                          return <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs font-mono text-rose-500 font-semibold" {...props}>{children}</code>;
                        }
                        return <CodeBlock language={lang} value={codeText} />;
                      },
                      p: ({node, ...props}) => <p className="leading-relaxed my-2 first:mt-0 last:mb-0" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc pl-5 my-2 space-y-1" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal pl-5 my-2 space-y-1" {...props} />
                    }}
                  >
                    {streamedText}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          )}

          {/* Typing Indicator dots */}
          {isStreaming && !streamedText && (
            <div className="flex gap-3.5 max-w-full justify-start">
              <div className="w-8 h-8 rounded-xl shrink-0 bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white shadow-sm border border-indigo-700 animate-pulse">
                <Sparkles className="w-4.5 h-4.5" />
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 flex items-center gap-1.5">
                <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="text-xs text-slate-400 font-mono pl-1.5">AI is typing...</span>
              </div>
            </div>
          )}

          {/* Dummy element for scroll anchoring */}
          <div ref={messagesEndRef} />
        </div>

        {/* Input box bottom panel */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 space-y-2">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(inputText);
            }}
            className="flex items-center gap-2 relative"
          >
            <input
              type="text"
              value={inputText}
              onChange={handleInputChange}
              placeholder={isListening ? "Listening to your voice..." : "Ask anything (e.g. Write a quiz, explain calculus, outline syllabus)..."}
              disabled={isStreaming}
              className={`flex-grow bg-slate-50 focus:bg-white dark:bg-slate-950 dark:focus:bg-slate-950 border ${isListening ? 'border-rose-500 ring-2 ring-rose-500/20 animate-pulse' : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500'} rounded-2xl py-3.5 px-4 text-xs md:text-sm outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 transition-all pr-24`}
            />

            {/* Voice STT Button */}
            <button
              type="button"
              onClick={toggleSpeechRecognition}
              title={isListening ? "Stop listening" : "Speak to AI"}
              className={`absolute right-12 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all cursor-pointer ${
                isListening 
                  ? 'bg-rose-500 text-white animate-pulse shadow-md' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {isStreaming ? (
              <button
                type="button"
                onClick={handleStopGeneration}
                title="Stop generation"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-all cursor-pointer shadow-xs"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!inputText.trim()}
                title="Send query"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white transition-all cursor-pointer shadow-xs"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </form>
          <div className="text-[10px] text-slate-400 font-sans text-center flex items-center justify-center gap-3">
            <span>🎙️ Click Mic to speak</span>
            <span>•</span>
            <span>🔊 Click Listen to hear AI responses</span>
          </div>
        </div>

      </div>

    </div>
  );
};

export const ChatAssistant: React.FC = () => {
  return (
    <ChatErrorBoundary>
      <ChatAssistantComponent />
    </ChatErrorBoundary>
  );
};
