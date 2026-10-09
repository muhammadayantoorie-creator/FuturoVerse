/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Custom 404 Not Found page — displayed when users navigate to a non-existent route.
 */

import React from 'react';
import { motion } from 'motion/react';
import { MapPin, Home, ArrowLeft, Compass } from 'lucide-react';

interface NotFoundPageProps {
  onGoHome?: () => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onGoHome }) => {
  const handleGoHome = () => {
    if (onGoHome) {
      onGoHome();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/3 rounded-full blur-3xl" />
      </div>

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 max-w-lg w-full text-center space-y-8">
        {/* Animated 404 number */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, type: 'spring', bounce: 0.4 }}
          className="relative"
        >
          <div className="text-[8rem] sm:text-[12rem] font-black text-transparent bg-clip-text bg-gradient-to-br from-emerald-400 via-teal-400 to-indigo-500 leading-none select-none">
            404
          </div>
          {/* Floating icon */}
          <motion.div
            animate={{ y: [-8, 8, -8] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          >
            <div className="w-16 h-16 rounded-2xl bg-slate-900/90 border border-emerald-500/20 backdrop-blur-xl flex items-center justify-center shadow-xl shadow-emerald-500/10">
              <Compass className="w-8 h-8 text-emerald-400" />
            </div>
          </motion.div>
        </motion.div>

        {/* Text content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="space-y-3"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Page Not Found
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved. 
            Let's get you back to your classroom.
          </p>
        </motion.div>

        {/* Location hint */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900/80 border border-slate-800 rounded-full text-xs text-slate-500 font-mono"
        >
          <MapPin className="w-3.5 h-3.5 text-rose-400" />
          <span>{typeof window !== 'undefined' ? window.location.pathname : '/404'}</span>
          <span className="text-slate-700">→ not found</span>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <button
            onClick={handleGoHome}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-2xl text-sm transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-lg shadow-emerald-500/20 w-full sm:w-auto justify-center"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </button>
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold rounded-2xl text-sm transition-all hover:scale-105 active:scale-95 cursor-pointer border border-slate-800 hover:border-slate-700 w-full sm:w-auto justify-center"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </motion.div>

        {/* Brand footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="text-slate-700 text-xs"
        >
          FuturoVerse AI — Smart Classroom Platform
        </motion.p>
      </div>
    </div>
  );
};
