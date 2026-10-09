/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Global Error Boundary — catches any unhandled React rendering errors
 * across the entire application and shows a user-friendly fallback UI
 * instead of a blank white screen.
 */

import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export class GlobalErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    // In production you could send this to an error reporting service like Sentry
    console.error('[FuturoVerse] Unhandled render error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 font-sans">
          {/* Glowing background orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 max-w-lg w-full text-center space-y-6">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-rose-400" />
              </div>
            </div>

            {/* Heading */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Something went wrong
              </h1>
              <p className="text-slate-400 text-sm leading-relaxed">
                FuturoVerse encountered an unexpected error. Your data is safe — this is a display issue.
                Please try refreshing the page.
              </p>
            </div>

            {/* Error detail (shown in development) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-slate-900 border border-rose-500/20 rounded-2xl p-4 text-left">
                <p className="text-xs font-mono text-rose-400 font-bold mb-1">
                  {this.state.error.name}: {this.state.error.message}
                </p>
                {this.state.errorInfo && (
                  <pre className="text-[10px] text-slate-500 overflow-auto max-h-32 whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={this.handleReload}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-sm transition-all hover:scale-105 active:scale-95 cursor-pointer border border-slate-700"
              >
                <Home className="w-4 h-4" />
                Go Home
              </button>
            </div>

            {/* Brand */}
            <p className="text-slate-600 text-xs">
              FuturoVerse AI — Smart Classroom Platform
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
