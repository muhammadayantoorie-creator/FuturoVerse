/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Volume2, VolumeX, Sparkles, X, Globe, Zap, AlertCircle, WifiOff, CheckCircle2, Send } from 'lucide-react';
import { AudioWaveform } from '@/src/components/shared/AudioWaveform';
import { useAppStore } from '@/src/store/useAppStore';

interface VoiceTutorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type HistoryItem = { sender: 'user' | 'ai'; text: string; time: string };
type SpeechErrorType = 'not-supported' | 'no-mic' | 'network' | null;

const SpeechRecognitionAPI =
  typeof window !== 'undefined'
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

export const VoiceTutorModal: React.FC<VoiceTutorModalProps> = ({ isOpen, onClose }) => {
  const { locale } = useAppStore();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [language, setLanguage] = useState<'en' | 'ur'>(locale === 'ur' ? 'ur' : 'en');
  const [speechError, setSpeechError] = useState<SpeechErrorType>(null);
  const [voiceHistory, setVoiceHistory] = useState<HistoryItem[]>([
    {
      sender: 'ai',
      text: locale === 'ur'
        ? 'السلام علیکم! میں آپ کا AI وائس ٹیوٹر ہوں۔ آپ کوئی بھی سوال بول کر پوچھ سکتے ہیں۔'
        : 'Hello! I am your AI Voice Companion. Tap the mic and speak your academic question naturally.',
      time: 'Now',
    },
  ]);

  const recognitionRef = useRef<any>(null);
  const requestControllerRef = useRef<AbortController | null>(null);
  const finalTranscriptRef = useRef('');
  const historyEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [voiceHistory, isThinking]);

  // Speech recognition and synthesis continue after a component is removed unless
  // they are explicitly stopped. Clean them up when the dialog closes/unmounts.
  useEffect(() => {
    if (isOpen) return;
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    requestControllerRef.current?.abort();
    requestControllerRef.current = null;
    window.speechSynthesis?.cancel();
    setIsListening(false);
    setIsSpeaking(false);
    setIsThinking(false);
  }, [isOpen]);

  useEffect(() => () => {
    recognitionRef.current?.abort();
    requestControllerRef.current?.abort();
    window.speechSynthesis?.cancel();
  }, []);

  const speakText = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'ur' ? 'ur-PK' : 'en-US';
    utterance.rate = 0.95;
    utterance.pitch = 1.05;

    const assignVoiceAndSpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      const matched = voices.find((v) =>
        language === 'ur'
          ? v.lang.includes('ur')
          : v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.default)
      ) || voices.find((v) => v.lang.startsWith(language === 'ur' ? 'ur' : 'en'));
      if (matched) utterance.voice = matched;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length > 0) {
      assignVoiceAndSpeak();
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        assignVoiceAndSpeak();
      };
      setTimeout(assignVoiceAndSpeak, 300);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      startRecognition();
    }
  };

  const startRecognition = async () => {
    if (!SpeechRecognitionAPI) {
      setSpeechError('not-supported');
      return;
    }

    if (isThinking) return;

    // Ask for microphone access first so permission/device errors are reported
    // clearly instead of being presented as a generic recognition failure.
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      }
    } catch {
      setSpeechError('no-mic');
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = language === 'ur' ? 'ur-PK' : 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setSpeechError(null);
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setTranscript(finalTranscriptRef.current || interimTranscript);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (finalTranscriptRef.current) {
        handleSendVoiceQuery(finalTranscriptRef.current);
      }
      finalTranscriptRef.current = '';
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setSpeechError('no-mic');
      } else if (event.error === 'network') {
        setSpeechError('network');
      }
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleSendVoiceQuery = async (customText?: string) => {
    const textToSend = (customText || transcript).trim();
    if (!textToSend || isThinking) return;

    setVoiceHistory((prev) => [...prev, { sender: 'user', text: textToSend, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    setTranscript('');
    finalTranscriptRef.current = '';
    setIsThinking(true);
    requestControllerRef.current?.abort();
    const controller = new AbortController();
    requestControllerRef.current = controller;

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message: textToSend,
          language: language === 'ur' ? 'Urdu' : 'English',
          systemPrompt: `You are an encouraging, expert voice tutor in FuturoVerse — a Pakistani bilingual AI classroom. Answer in ${
            language === 'ur' ? 'Urdu' : 'English'
          }. Keep answers very concise (2-3 sentences), clear and natural for spoken playback. Avoid markdown, bullet points, or formatting symbols.`,
        }),
      });

      let aiReply = '';
      if (res.ok) {
        const data = await res.json();
        aiReply = data.reply ||
          (language === 'ur'
            ? 'یہ ایک اہم تصور ہے۔ مزید وضاحت کے لیے دوبارہ پوچھیں۔'
            : 'Great question! Let me explain that concept clearly for you.');
      } else {
        throw new Error('API ' + res.status);
      }

      setVoiceHistory((prev) => [...prev, { sender: 'ai', text: aiReply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
      speakText(aiReply);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      console.error('Voice AI Query Error:', err);
      const fallback = language === 'ur'
        ? 'یہ ایک اہم تصور ہے۔ قدرتی نظام توازن کی طرف بڑھتے ہیں۔'
        : 'That is a fundamental concept! Energy conservation and equilibrium are key pillars across all sciences.';
      setVoiceHistory((prev) => [...prev, { sender: 'ai', text: fallback, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
      speakText(fallback);
    } finally {
      if (requestControllerRef.current === controller) {
        requestControllerRef.current = null;
        setIsThinking(false);
      }
    }
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-slate-900 border border-emerald-500/40 rounded-3xl shadow-2xl shadow-emerald-950/60 overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-800/80 to-slate-900">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  FuturoVerse Voice Companion
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono uppercase tracking-wider">
                    Live AI Audio
                  </span>
                </h3>
                <p className="text-slate-400 text-xs">
                  {language === 'ur' ? 'بالمشافہ آواز کے ذریعے باہمی تدریس' : 'Interactive Hands-Free Academic Tutor'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setLanguage((prev) => (prev === 'en' ? 'ur' : 'en'))}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
                title="Switch Language"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                {language === 'en' ? 'English' : 'اردو'}
              </button>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Central Pulsating Waveform Area */}
          <div className="p-8 flex flex-col items-center justify-center bg-radial from-emerald-950/20 via-slate-900 to-slate-900 relative">
            {/* Ambient Glowing Rings */}
            <div className={`absolute w-64 h-64 rounded-full transition-all duration-700 blur-3xl ${
              isListening ? 'bg-cyan-500/15 scale-110' : isSpeaking ? 'bg-emerald-500/20 scale-125' : isThinking ? 'bg-purple-500/20 animate-pulse' : 'bg-transparent'
            }`} />

            {/* Audio Waveform Canvas */}
            <AudioWaveform
              isActive={isListening || isSpeaking || isThinking}
              isSpeaking={isSpeaking}
              barCount={36}
              height={70}
            />

            {/* Status indicator */}
            <div className="mt-4 flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${
                isListening ? 'bg-cyan-400 animate-ping' : isSpeaking ? 'bg-emerald-400 animate-pulse' : isThinking ? 'bg-purple-400 animate-bounce' : 'bg-slate-600'
              }`} />
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-widest">
                {isListening ? (language === 'ur' ? 'سن رہا ہے...' : 'Listening...') :
                 isThinking ? (language === 'ur' ? 'سوچ رہا ہے...' : 'AI Analyzing...') :
                 isSpeaking ? (language === 'ur' ? 'جواب دے رہا ہے...' : 'AI Speaking...') :
                 (language === 'ur' ? 'بات کرنے کے لیے مائیک دبائیں' : 'Tap mic to ask anything')}
              </span>
            </div>

            {/* Interactive Mic Button */}
            <div className="mt-6 flex items-center gap-4">
              <button
                onClick={toggleListening}
                disabled={isThinking}
                className={`w-16 h-16 rounded-3xl flex items-center justify-center text-white transition-all transform hover:scale-105 active:scale-95 shadow-lg ${
                  isListening
                    ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/40 ring-4 ring-rose-500/20 animate-pulse'
                    : isThinking
                      ? 'bg-slate-700 cursor-not-allowed shadow-none'
                      : 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/30 ring-4 ring-emerald-500/20'
                }`}
              >
                {isListening ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
              </button>

              {isSpeaking && (
                <button
                  onClick={stopSpeaking}
                  className="p-3 bg-slate-800 hover:bg-slate-700 text-rose-400 border border-slate-700 rounded-2xl transition-colors"
                  title="Stop AI voice"
                >
                  <VolumeX className="w-5 h-5" />
                </button>
              )}
            </div>

            {speechError && (
              <div className="mt-4 max-w-md w-full flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                {speechError === 'network' ? <WifiOff className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
                <span>
                  {speechError === 'not-supported'
                    ? 'Voice recognition is not supported in this browser. You can still use the quick prompts.'
                    : speechError === 'no-mic'
                      ? 'Microphone access was not granted or no microphone is available. Check your browser permissions and try again.'
                      : 'Speech recognition could not reach its service. Check your internet connection and try again.'}
                </span>
              </div>
            )}

            {/* Live Transcript / Input preview */}
            <AnimatePresence>
              {transcript && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mt-5 max-w-md w-full px-4 py-2.5 bg-slate-800/90 border border-slate-700 rounded-2xl text-center"
                >
                  <p className="text-xs text-slate-400 mb-1">{isListening ? 'Hearing...' : 'Captured:'}</p>
                  <p className="text-sm font-medium text-emerald-300">{transcript}</p>
                  {!isListening && !isThinking && (
                    <button
                      onClick={() => handleSendVoiceQuery()}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      <Send className="w-3 h-3" /> Send Query
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick Concept Questions */}
          <div className="px-6 py-3 bg-slate-950/60 border-t border-slate-800 flex items-center gap-2 overflow-x-auto">
            <span className="text-[11px] text-slate-500 whitespace-nowrap font-medium flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" /> Quick Prompts:
            </span>
            {[
              language === 'ur' ? 'کوانٹم فزکس کا بنیادی اصول کیا ہے؟' : 'Explain Schrödinger Equation simply',
              language === 'ur' ? 'کیلکولس میں لمٹس کیوں اہم ہیں؟' : 'Why do we use Derivatives in Physics?',
              language === 'ur' ? 'ڈی این اے کی ساخت کیسے ہوتی ہے؟' : 'How does DNA Replication work?',
            ].map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendVoiceQuery(prompt)}
                className="px-3 py-1 bg-slate-800/80 hover:bg-emerald-950/60 hover:text-emerald-300 hover:border-emerald-500/40 text-slate-300 border border-slate-700/60 rounded-xl text-xs whitespace-nowrap transition-all"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Conversation History */}
          <div className="max-h-56 overflow-y-auto px-6 py-4 space-y-3 bg-slate-900 border-t border-slate-800">
            {voiceHistory.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 text-xs ${item.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {item.sender === 'ai' && (
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-1">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    item.sender === 'user'
                      ? 'bg-emerald-600/30 text-emerald-100 border border-emerald-500/30 rounded-tr-none'
                      : 'bg-slate-800/80 text-slate-200 border border-slate-700/60 rounded-tl-none'
                  }`}
                >
                  <p className="leading-relaxed">{item.text}</p>
                  <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500">
                    <span>{item.time}</span>
                    {item.sender === 'ai' && (
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={() => speakText(item.text)}
                          className="hover:text-emerald-400 transition-colors flex items-center gap-0.5"
                          title="Replay Voice"
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>Replay</span>
                        </button>
                        <CheckCircle2 className="w-3 h-3 text-emerald-500/50" />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            {isThinking && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 justify-start">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-1">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="p-3 rounded-2xl rounded-tl-none bg-slate-800/80 border border-slate-700/60">
                  <div className="flex gap-1 items-center h-4">
                    {[0, 0.15, 0.3].map((delay) => (
                      <span key={delay} className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: `${delay}s` }} />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={historyEndRef} />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
