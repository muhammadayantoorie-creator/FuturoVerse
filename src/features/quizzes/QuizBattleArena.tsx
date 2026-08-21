/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Swords, Flame, Trophy, Zap, Clock, ShieldCheck, RefreshCw, Star, CheckCircle, XCircle, ArrowRight, Award } from 'lucide-react';
import { MathRenderer } from '@/src/components/shared/MathRenderer';

interface BattleQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const BATTLE_QUESTIONS: BattleQuestion[] = [
  {
    id: 1,
    question: 'What is the de Broglie wavelength formula for a particle of mass $m$ and velocity $v$?',
    options: ['$\\lambda = \\frac{h}{mv}$', '$\\lambda = \\frac{mv}{h}$', '$\\lambda = \\frac{h^2}{mv}$', '$\\lambda = \\frac{m}{hv}$'],
    correctIndex: 0,
    explanation: 'De Broglie stated that wavelength is inversely proportional to momentum: $\\lambda = \\frac{h}{p} = \\frac{h}{mv}$.',
  },
  {
    id: 2,
    question: 'According to Heisenberg Uncertainty Principle, $\\Delta x \\cdot \\Delta p$ must be greater than or equal to:',
    options: ['$\\frac{\\hbar}{4}$', '$\\frac{\\hbar}{2}$', '$\\hbar$', '$2\\hbar$'],
    correctIndex: 1,
    explanation: 'The fundamental lower bound is $\\Delta x \\cdot \\Delta p \\ge \\frac{\\hbar}{2}$.',
  },
  {
    id: 3,
    question: 'What is the derivative $\\frac{d}{dx}[e^{3x} \\cdot \\sin(x)]$?',
    options: [
      '$3e^{3x} \\sin(x)$',
      '$e^{3x}[3\\sin(x) + \\cos(x)]$',
      '$e^{3x}[\\sin(x) + 3\\cos(x)]$',
      '$3e^{3x}\\cos(x)$',
    ],
    correctIndex: 1,
    explanation: 'Using Product Rule: $(u v) = u v + u v = 3e^{3x}\\sin(x) + e^{3x}\\cos(x) = e^{3x}[3\\sin(x) + \\cos(x)]$.',
  },
  {
    id: 4,
    question: 'Which organelle is responsible for generating ATP through oxidative phosphorylation?',
    options: ['Golgi Apparatus', 'Endoplasmic Reticulum', 'Mitochondria', 'Lysosome'],
    correctIndex: 2,
    explanation: 'Mitochondria are the powerhouses of the eukaryotic cell where the electron transport chain occurs.',
  },
  {
    id: 5,
    question: 'In 2D projectile motion, at what launch angle is the horizontal range maximized on flat ground?',
    options: ['30°', '45°', '60°', '90°'],
    correctIndex: 1,
    explanation: 'Since $R = \\frac{v_0^2 \\sin(2\\theta)}{g}$, $\\sin(2\\theta)$ reaches maximum value 1 when $2\\theta = 90^\\circ \\implies \\theta = 45^\\circ$.',
  },
];

export const QuizBattleArena: React.FC<{ onBackToQuizzes: () => void }> = ({ onBackToQuizzes }) => {
  const [gameState, setGameState] = useState<'lobby' | 'countdown' | 'battle' | 'results'>('lobby');
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(12);
  const [countdownTimer, setCountdownTimer] = useState(3);
  const [aiThinkingState, setAiThinkingState] = useState<'thinking' | 'answered'>('thinking');

  const currentQ = BATTLE_QUESTIONS[currentQIndex];

  // Lobby to Countdown
  const startBattle = () => {
    setPlayerScore(0);
    setAiScore(0);
    setStreak(0);
    setMultiplier(1);
    setCurrentQIndex(0);
    setSelectedOption(null);
    setAnswered(false);
    setCountdownTimer(3);
    setGameState('countdown');
  };

  // Countdown handler
  useEffect(() => {
    if (gameState === 'countdown') {
      const interval = setInterval(() => {
        setCountdownTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setGameState('battle');
            setTimeLeft(12);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [gameState]);

  // Battle Question Timer
  useEffect(() => {
    if (gameState === 'battle' && !answered) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Time out for this question
            handleAnswer(-1);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameState, answered, currentQIndex]);

  // AI Opponent simulation per question
  useEffect(() => {
    if (gameState === 'battle' && !answered) {
      setAiThinkingState('thinking');
      // AI responds after 2.5 to 6.5 seconds with 80% accuracy
      const aiResponseDelay = 2500 + Math.random() * 3500;
      const timer = setTimeout(() => {
        setAiThinkingState('answered');
        const isAiCorrect = Math.random() < 0.85;
        if (isAiCorrect) {
          setAiScore((s) => s + 100 + Math.floor(Math.random() * 40));
        }
      }, aiResponseDelay);
      return () => clearTimeout(timer);
    }
  }, [gameState, currentQIndex, answered]);

  const handleAnswer = (optionIdx: number) => {
    if (answered) return;
    setSelectedOption(optionIdx);
    setAnswered(true);

    const isCorrect = optionIdx === currentQ.correctIndex;

    if (isCorrect) {
      const speedBonus = timeLeft * 10;
      const basePoints = 100;
      const earned = (basePoints + speedBonus) * multiplier;
      setPlayerScore((s) => s + earned);
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak >= 3) setMultiplier(3);
      else if (newStreak >= 2) setMultiplier(2);
    } else {
      setStreak(0);
      setMultiplier(1);
    }

    // Advance to next after 2.2s
    setTimeout(() => {
      if (currentQIndex + 1 < BATTLE_QUESTIONS.length) {
        setCurrentQIndex((i) => i + 1);
        setSelectedOption(null);
        setAnswered(false);
        setTimeLeft(12);
      } else {
        setGameState('results');
      }
    }, 2200);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 1. LOBBY VIEW */}
      {gameState === 'lobby' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-8 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-emerald-500/40 rounded-3xl shadow-2xl text-center relative overflow-hidden"
        >
          <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-5 shadow-lg shadow-emerald-500/20">
            <Swords className="w-10 h-10 animate-pulse" />
          </div>

          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            Real-Time Speed Duel
          </span>
          <h2 className="text-3xl font-extrabold text-white mt-3 mb-2">
            FuturoVerse AI Battle Arena
          </h2>
          <p className="text-slate-300 text-sm max-w-lg mx-auto mb-8">
            Challenge our adaptive grandmaster AI model in a fast-paced 5-round speed quiz duel. Chain consecutive answers for streak multipliers and earn mastery rank XP!
          </p>

          {/* Matchup Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-xl mx-auto mb-8 items-center">
            {/* Player Card */}
            <div className="p-4 bg-slate-800/80 border border-emerald-500/30 rounded-2xl">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-lg mb-2">
                YOU
              </div>
              <p className="text-white font-bold text-sm">Challenger</p>
              <p className="text-emerald-400 text-xs font-mono">Rank: Diamond I</p>
            </div>

            {/* VS Badge */}
            <div className="text-center font-black text-2xl text-amber-400 tracking-wider">
              VS
            </div>

            {/* AI Opponent Card */}
            <div className="p-4 bg-slate-800/80 border border-purple-500/30 rounded-2xl">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-lg mb-2">
                ⚡ AI
              </div>
              <p className="text-white font-bold text-sm">Dr. CyberNova</p>
              <p className="text-purple-400 text-xs font-mono">Adaptive Gemini 2.5</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={onBackToQuizzes}
              className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl text-xs transition-colors"
            >
              ← Back to Quizzes
            </button>
            <button
              onClick={startBattle}
              className="px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black rounded-2xl text-sm transition-all shadow-xl shadow-emerald-500/30 hover:scale-105"
            >
              Enter Battle Arena ⚔️
            </button>
          </div>
        </motion.div>
      )}

      {/* 2. COUNTDOWN VIEW */}
      {gameState === 'countdown' && (
        <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-slate-900 border border-emerald-500/30 rounded-3xl">
          <motion.div
            key={countdownTimer}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            className="text-7xl font-black text-emerald-400 font-mono mb-4"
          >
            {countdownTimer > 0 ? countdownTimer : 'DUEL!'}
          </motion.div>
          <p className="text-slate-400 text-sm font-semibold uppercase tracking-widest">
            Preparing Arena Match...
          </p>
        </div>
      )}

      {/* 3. ACTIVE BATTLE VIEW */}
      {gameState === 'battle' && (
        <div className="space-y-4">
          {/* Live Match Scoreboard Bar */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-between shadow-xl">
            {/* Player Side */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-sm">
                YOU
              </div>
              <div>
                <p className="text-white font-bold text-sm flex items-center gap-1.5">
                  {playerScore} <span className="text-[10px] text-slate-400 font-normal">PTS</span>
                  {streak > 1 && (
                    <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] rounded-full font-black flex items-center gap-1">
                      <Flame className="w-3 h-3 text-amber-400" /> {multiplier}x COMBO
                    </span>
                  )}
                </p>
                <div className="w-28 h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${Math.min(100, (playerScore / 1000) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Timer Pulse */}
            <div className="flex flex-col items-center">
              <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-mono font-black text-base shadow-lg ${
                timeLeft <= 4 ? 'border-rose-500 text-rose-400 animate-ping' : 'border-emerald-500/60 text-emerald-300'
              }`}>
                {timeLeft}s
              </div>
              <span className="text-[10px] text-slate-400 font-semibold mt-1">
                Round {currentQIndex + 1}/{BATTLE_QUESTIONS.length}
              </span>
            </div>

            {/* AI Side */}
            <div className="flex items-center gap-3 text-right">
              <div>
                <p className="text-white font-bold text-sm flex items-center justify-end gap-1.5">
                  <span className="text-[10px] text-slate-400 font-normal">PTS</span> {aiScore}
                </p>
                <div className="w-28 h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden ml-auto">
                  <div
                    className="h-full bg-purple-500 transition-all duration-300"
                    style={{ width: `${Math.min(100, (aiScore / 1000) * 100)}%` }}
                  />
                </div>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center font-bold text-sm">
                AI
              </div>
            </div>
          </div>

          {/* Question Card */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-6 shadow-2xl">
            <div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                Speed Question {currentQ.id}
              </span>
              <MathRenderer content={currentQ.question} className="text-lg font-bold text-white leading-relaxed" />
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentQ.options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === currentQ.correctIndex;

                let cardStyle = 'bg-slate-950/60 text-slate-200 border-slate-800 hover:border-emerald-500/40 hover:bg-slate-800/80';

                if (answered) {
                  if (isCorrect) {
                    cardStyle = 'bg-emerald-600/30 text-emerald-100 border-emerald-500 ring-2 ring-emerald-500/40';
                  } else if (isSelected && !isCorrect) {
                    cardStyle = 'bg-rose-950/40 text-rose-200 border-rose-500 ring-2 ring-rose-500/40';
                  } else {
                    cardStyle = 'bg-slate-950/30 text-slate-500 border-slate-900 opacity-40';
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={answered}
                    onClick={() => handleAnswer(idx)}
                    className={`p-4 rounded-2xl border text-sm font-semibold transition-all text-left flex items-center justify-between ${cardStyle} cursor-pointer`}
                  >
                    <MathRenderer content={opt} />
                    {answered && isCorrect && <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 ml-2" />}
                    {answered && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-400 shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>

            {/* AI Status Banner */}
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${aiThinkingState === 'thinking' ? 'bg-purple-400 animate-ping' : 'bg-emerald-400'}`} />
                AI Opponent: {aiThinkingState === 'thinking' ? 'Computing response...' : 'Locked in answer!'}
              </span>
              <span className="text-slate-500 font-mono">Streak Bonus: {streak} in a row</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. RESULTS VIEW */}
      {gameState === 'results' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-8 bg-gradient-to-b from-slate-900 to-slate-950 border border-emerald-500/40 rounded-3xl shadow-2xl text-center space-y-6"
        >
          {playerScore >= aiScore ? (
            <div className="space-y-2">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Trophy className="w-10 h-10 animate-bounce" />
              </div>
              <h2 className="text-3xl font-black text-emerald-400">VICTORY ACHIEVED! 🏆</h2>
              <p className="text-slate-300 text-sm">You outperformed the adaptive AI model in speed & accuracy!</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-purple-500/20 text-purple-400 border border-purple-500/40 flex items-center justify-center">
                <Award className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-black text-purple-400">AI WON THIS ROUND</h2>
              <p className="text-slate-300 text-sm">Great effort! Review the topics below to level up your speed.</p>
            </div>
          )}

          {/* Final Match Stats */}
          <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Your Score</span>
              <span className="text-xl font-black text-emerald-400">{playerScore}</span>
            </div>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">AI Score</span>
              <span className="text-xl font-black text-purple-400">{aiScore}</span>
            </div>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Mastery XP</span>
              <span className="text-xl font-black text-amber-400">+350 XP</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 pt-4">
            <button
              onClick={startBattle}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl text-xs transition-all shadow-lg flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Rematch AI
            </button>
            <button
              onClick={onBackToQuizzes}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl text-xs transition-colors"
            >
              Return to Quizzes →
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
