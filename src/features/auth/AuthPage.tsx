import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, 
  Lock, 
  User, 
  UserCheck, 
  ShieldCheck, 
  ArrowRight, 
  KeyRound, 
  Sparkles, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertCircle,
  GraduationCap,
  Building,
  School,
  ArrowLeft,
  Info
} from 'lucide-react';
import { 
  useLoginMutation, 
  useRegisterMutation, 
  useForgotPasswordMutation, 
  useResetPasswordMutation,
  useGoogleLoginMutation
} from './authHooks';
import { Role } from '@/src/types';

// Form Validation Schemas
const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean(),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'teacher', 'student']),
  departmentOrClass: z.string().optional(),
  rememberMe: z.boolean(),
});

const forgotSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
});

const resetSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFields = z.infer<typeof loginSchema>;
type RegisterFields = z.infer<typeof registerSchema>;
type ForgotFields = z.infer<typeof forgotSchema>;
type ResetFields = z.infer<typeof resetSchema>;

interface AuthPageProps {
  initialView?: 'login' | 'register';
  initialRole?: Role;
  onBackToLanding?: () => void;
}

export function AuthPage({ initialView = 'login', initialRole = 'teacher', onBackToLanding }: AuthPageProps) {
  const [view, setView] = useState<'login' | 'register' | 'forgot' | 'reset'>(initialView);
  const [selectedRole, setSelectedRole] = useState<'teacher' | 'student' | 'admin'>(
    initialRole === 'admin' ? 'admin' : initialRole === 'student' ? 'student' : 'teacher'
  );
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [simulationLink, setSimulationLink] = useState<string | null>(null);

  // Mutations
  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();
  const forgotMutation = useForgotPasswordMutation();
  const resetMutation = useResetPasswordMutation();
  const googleLoginMutation = useGoogleLoginMutation();

  // Detect Reset Password Token in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setResetToken(token);
      setView('reset');
    }
  }, []);

  // Form setups
  const loginForm = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: false }
  });

  const registerForm = useForm<RegisterFields>({
    resolver: zodResolver(registerSchema),
    defaultValues: { 
      name: '', 
      email: '', 
      password: '', 
      role: selectedRole, 
      departmentOrClass: '',
      rememberMe: false 
    }
  });

  const forgotForm = useForm<ForgotFields>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' }
  });

  const resetForm = useForm<ResetFields>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '', confirmPassword: '' }
  });

  // Keep registerForm role synced with selectedRole
  useEffect(() => {
    registerForm.setValue('role', selectedRole);
  }, [selectedRole, registerForm]);

  // Set default demo values on initial load or role switch if form is empty
  const applyDemoCredentialsForRole = (role: 'teacher' | 'student' | 'admin') => {
    setSelectedRole(role);
    if (role === 'teacher') {
      loginForm.setValue('email', 'teacher@example.com');
      loginForm.setValue('password', 'teacher123');
    } else if (role === 'student') {
      loginForm.setValue('email', 'student@example.com');
      loginForm.setValue('password', 'student123');
    } else if (role === 'admin') {
      loginForm.setValue('email', 'admin@example.com');
      loginForm.setValue('password', 'admin123');
    }
  };

  // Reset errors and successes when view changes
  useEffect(() => {
    setSuccessMessage(null);
    setErrorMessage(null);
    setSimulationLink(null);
  }, [view]);

  const getFriendlyErrorMessage = (err: any) => {
    const code = err?.code || (typeof err?.message === 'string' && err.message.includes('popup-blocked') ? 'auth/popup-blocked' : '');
    if (code === 'auth/popup-blocked' || err?.message?.includes('popup-blocked')) {
      return 'Popup was blocked by your browser settings. Please allow popups for this site in your address bar, or sign in using Email & Password below.';
    }
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      return 'Google sign-in window was closed before completion. Please try again.';
    }
    if (code === 'auth/unauthorized-domain') {
      return 'This domain is not in your Firebase authorized domains list. Please sign in with Email & Password or use the 1-Click Demo.';
    }
    if (code === 'auth/invalid-email') return 'Invalid email address format.';
    if (code === 'auth/user-not-found') return 'No account found with this email.';
    if (code === 'auth/wrong-password') return 'Incorrect password. Please try again.';
    if (code === 'auth/email-already-in-use') return 'The email address is already registered.';
    if (code === 'auth/weak-password') return 'The password is too weak. Please use at least 6 characters.';
    if (code === 'auth/invalid-credential') return 'Invalid email or password. Please try again.';
    return err?.message || 'An unexpected error occurred. Please try again.';
  };

  // Handlers
  const onGoogleLogin = async () => {
    setErrorMessage(null);
    try {
      await googleLoginMutation.mutateAsync(selectedRole);
    } catch (err: any) {
      setErrorMessage(getFriendlyErrorMessage(err));
    }
  };

  const onLoginSubmit = async (data: LoginFields) => {
    setErrorMessage(null);
    try {
      await loginMutation.mutateAsync(data);
    } catch (err: any) {
      setErrorMessage(getFriendlyErrorMessage(err));
    }
  };

  const onRegisterSubmit = async (data: RegisterFields) => {
    setErrorMessage(null);
    try {
      await registerMutation.mutateAsync({
        name: data.name,
        email: data.email,
        password: data.password,
        role: selectedRole,
        rememberMe: data.rememberMe
      });
    } catch (err: any) {
      setErrorMessage(getFriendlyErrorMessage(err));
    }
  };

  const onForgotSubmit = async (data: ForgotFields) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setSimulationLink(null);
    try {
      const res = await forgotMutation.mutateAsync(data);
      setSuccessMessage(res.message);
      if (res.resetToken) {
        setResetToken(res.resetToken);
        setSimulationLink(`/reset-password?token=${res.resetToken}`);
      }
    } catch (err: any) {
      setErrorMessage(getFriendlyErrorMessage(err));
    }
  };

  const onResetSubmit = async (data: ResetFields) => {
    if (!resetToken) {
      setErrorMessage('Reset token is missing.');
      return;
    }
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await resetMutation.mutateAsync({ token: resetToken, password: data.password });
      setSuccessMessage(res.message);
      // Clean query parameter
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => {
        setView('login');
      }, 3000);
    } catch (err: any) {
      setErrorMessage(getFriendlyErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Decorative Gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container Card */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-slate-800/80 border border-slate-700/60 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 my-6"
      >
        {/* Top Bar with Home Link */}
        <div className="flex items-center justify-between mb-6">
          {onBackToLanding ? (
            <button
              onClick={onBackToLanding}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-slate-700/40"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </button>
          ) : <div />}

          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
            Pakistan 🇵🇰
          </span>
        </div>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-blue-500 text-white mb-3 shadow-lg shadow-emerald-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            FuturoVerse Pakistan
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Bilingual Smart Classroom & Curriculum Platform
          </p>
        </div>

        {/* Global Notifications */}
        <AnimatePresence mode="wait">
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-start gap-2 overflow-hidden"
            >
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{successMessage}</p>
                {simulationLink && (
                  <button
                    onClick={() => {
                      setView('reset');
                      window.history.pushState({}, '', `?token=${resetToken}`);
                    }}
                    className="mt-2 text-blue-400 font-bold hover:underline block cursor-pointer"
                  >
                    🚀 Click to Simulate Password Reset Immediately
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2 overflow-hidden"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p className="font-semibold">{errorMessage}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab View Switcher (Sign In vs Register) */}
        {(view === 'login' || view === 'register') && (
          <div className="grid grid-cols-2 p-1 bg-slate-900/60 rounded-xl border border-slate-700/50 mb-6">
            <button
              type="button"
              onClick={() => setView('login')}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                view === 'login'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setView('register')}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                view === 'register'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Authentication Views */}
        <AnimatePresence mode="wait">
          {view === 'login' && (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              {/* Role Selection & Quick Demo Switcher */}
              <div className="mb-5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-slate-300 flex items-center gap-1.5">
                    <span>Choose Entry Role:</span>
                  </label>
                  <span className="text-[10px] text-emerald-400 font-semibold">1-Click Demo Fill</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => applyDemoCredentialsForRole('teacher')}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      selectedRole === 'teacher'
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-sm shadow-emerald-500/10'
                        : 'bg-slate-900/40 border-slate-700/50 text-slate-400 hover:text-slate-200 hover:bg-slate-900/70'
                    }`}
                  >
                    <UserCheck className="w-4 h-4 mb-1 text-emerald-400" />
                    <span className="text-xs font-bold">👨‍🏫 Teacher</span>
                    <span className="text-[9px] text-slate-400 mt-0.5">Classes & Quizzes</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyDemoCredentialsForRole('student')}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      selectedRole === 'student'
                        ? 'bg-blue-500/15 border-blue-500 text-blue-300 shadow-sm shadow-blue-500/10'
                        : 'bg-slate-900/40 border-slate-700/50 text-slate-400 hover:text-slate-200 hover:bg-slate-900/70'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4 mb-1 text-blue-400" />
                    <span className="text-xs font-bold">🎓 Student</span>
                    <span className="text-[9px] text-slate-400 mt-0.5">Practice & Notes</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyDemoCredentialsForRole('admin')}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      selectedRole === 'admin'
                        ? 'bg-purple-500/15 border-purple-500 text-purple-300 shadow-sm shadow-purple-500/10'
                        : 'bg-slate-900/40 border-slate-700/50 text-slate-400 hover:text-slate-200 hover:bg-slate-900/70'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 mb-1 text-purple-400" />
                    <span className="text-xs font-bold">🛡️ Admin</span>
                    <span className="text-[9px] text-slate-400 mt-0.5">All Access</span>
                  </button>
                </div>

                {/* Role Description Notice */}
                <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    {selectedRole === 'teacher' && (
                      <strong className="text-slate-200">Teacher Workspace:</strong>
                    )}
                    {selectedRole === 'student' && (
                      <strong className="text-slate-200">Student Portal:</strong>
                    )}
                    {selectedRole === 'admin' && (
                      <strong className="text-slate-200">Executive Admin:</strong>
                    )}
                    {' '}
                    {selectedRole === 'teacher' && 'Access class management, AI quiz creation, PDF parser, and gradebook.'}
                    {selectedRole === 'student' && 'Access enrolled classes, diagnostic practice tests, handouts, and AI study tutor.'}
                    {selectedRole === 'admin' && 'Access campus-wide analytics, all classrooms, user admin, and complete audit gradebooks.'}
                  </span>
                </div>
              </div>

              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      placeholder="user@example.com"
                      {...loginForm.register('email')}
                      className="w-full bg-slate-900/50 border border-slate-700/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  {loginForm.formState.errors.email && (
                    <p className="text-[11px] text-red-400 mt-1">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setView('forgot')}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      {...loginForm.register('password')}
                      className="w-full bg-slate-900/50 border border-slate-700/60 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="text-[11px] text-red-400 mt-1">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>

                {/* Remember Me */}
                <div className="flex items-center">
                  <input
                    id="login-remember"
                    type="checkbox"
                    {...loginForm.register('rememberMe')}
                    className="w-4 h-4 accent-emerald-500 text-emerald-600 bg-slate-900 border-slate-700 rounded focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="login-remember" className="ml-2 text-xs text-slate-300 font-medium select-none cursor-pointer">
                    Remember Me
                  </label>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-400 hover:to-blue-400 text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 text-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {loginMutation.isPending ? 'Signing In...' : `Sign In as ${selectedRole === 'teacher' ? 'Teacher' : selectedRole === 'student' ? 'Student' : 'Admin'}`}
                  {!loginMutation.isPending && <ArrowRight className="w-4 h-4" />}
                </button>

                {/* Divider */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-700/60"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-slate-800 px-3 text-slate-400 font-medium">Or continue with</span>
                  </div>
                </div>

                {/* Google Sign In */}
                <button
                  type="button"
                  disabled={googleLoginMutation.isPending}
                  onClick={onGoogleLogin}
                  className="w-full bg-slate-900/60 hover:bg-slate-900 border border-slate-700/60 hover:border-slate-600 text-white font-medium py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2.5 text-sm transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4 mr-1 shrink-0" viewBox="0 0 24 24" width="16" height="16">
                    <path
                      fill="#EA4335"
                      d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z"
                    />
                    <path
                      fill="#4285F4"
                      d="M16.04 15.345c-1.077.732-2.436 1.173-4.04 1.173a7.07 7.07 0 0 1-6.734-4.856L1.24 14.777C3.198 18.73 7.27 21.428 12 21.428c3.11 0 5.928-1.03 7.91-2.822l-3.87-3.261Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M1.24 6.65A12.025 12.025 0 0 0 0 12c0 1.912.446 3.722 1.24 5.35l4.026-3.115A7.014 7.014 0 0 1 4.91 12c0-1.127.268-2.19.733-3.132L1.24 6.65Z"
                    />
                    <path
                      fill="#34A853"
                      d="M23.52 12.273c0-.818-.073-1.605-.21-2.364H12v4.51h6.47c-.28 1.477-1.114 2.731-2.368 3.572l3.87 3.262c2.264-2.09 3.548-5.177 3.548-8.98Z"
                    />
                  </svg>
                  {googleLoginMutation.isPending ? 'Connecting...' : `Continue with Google (${selectedRole.toUpperCase()})`}
                </button>
              </form>
            </motion.div>
          )}

          {view === 'register' && (
            <motion.div
              key="register"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              {/* Role Selection Cards */}
              <div className="mb-4 space-y-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Select Your Account Role:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 'teacher', label: 'Teacher', desc: 'Faculty & Classes', icon: UserCheck, color: 'text-emerald-400', activeBg: 'bg-emerald-500/15 border-emerald-500' },
                    { val: 'student', label: 'Student', desc: 'Study & Practice', icon: GraduationCap, color: 'text-blue-400', activeBg: 'bg-blue-500/15 border-blue-500' },
                    { val: 'admin', label: 'Admin', desc: 'Dean & Oversight', icon: ShieldCheck, color: 'text-purple-400', activeBg: 'bg-purple-500/15 border-purple-500' },
                  ].map((roleOption) => {
                    const isSelected = selectedRole === roleOption.val;
                    return (
                      <button
                        key={roleOption.val}
                        type="button"
                        onClick={() => setSelectedRole(roleOption.val as any)}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? `${roleOption.activeBg} text-white shadow-sm`
                            : 'bg-slate-900/40 border-slate-700/50 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <roleOption.icon className={`w-4 h-4 mb-1 ${roleOption.color}`} />
                        <span className="text-xs font-bold">{roleOption.label}</span>
                        <span className="text-[9px] text-slate-400">{roleOption.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-3.5">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      id="register-name"
                      type="text"
                      placeholder="Enter your full name"
                      {...registerForm.register('name')}
                      className="w-full bg-slate-900/50 border border-slate-700/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  {registerForm.formState.errors.name && (
                    <p className="text-[11px] text-red-400 mt-1">{registerForm.formState.errors.name.message}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Official / Academic Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      id="register-email"
                      type="email"
                      placeholder="yourname@institution.edu.pk"
                      {...registerForm.register('email')}
                      className="w-full bg-slate-900/50 border border-slate-700/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  {registerForm.formState.errors.email && (
                    <p className="text-[11px] text-red-400 mt-1">{registerForm.formState.errors.email.message}</p>
                  )}
                </div>

                {/* Role Specific Additional Field */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {selectedRole === 'teacher' ? 'Department / Subject Specialization' : selectedRole === 'student' ? 'Roll Number / Class' : 'Campus / Administrative Designation'}
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      id="register-extra"
                      type="text"
                      placeholder={selectedRole === 'teacher' ? 'e.g. Department of Physics' : selectedRole === 'student' ? 'e.g. Roll No. 2026-CS-042' : 'e.g. Office of the Dean'}
                      {...registerForm.register('departmentOrClass')}
                      className="w-full bg-slate-900/50 border border-slate-700/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      id="register-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      {...registerForm.register('password')}
                      className="w-full bg-slate-900/50 border border-slate-700/60 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {registerForm.formState.errors.password && (
                    <p className="text-[11px] text-red-400 mt-1">{registerForm.formState.errors.password.message}</p>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={registerMutation.isPending}
                  className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-400 hover:to-blue-400 text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 text-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {registerMutation.isPending ? 'Registering...' : `Create ${selectedRole.toUpperCase()} Account`}
                  {!registerMutation.isPending && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>
            </motion.div>
          )}

          {view === 'forgot' && (
            <motion.div
              key="forgot"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              <div className="mb-4">
                <p className="text-xs text-slate-400 leading-relaxed text-center">
                  Enter your email address below and we will search the user directory. A simulated reset link will be generated for verification.
                </p>
              </div>

              <form onSubmit={forgotForm.handleSubmit(onForgotSubmit)} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      id="forgot-email"
                      type="email"
                      placeholder="teacher@example.com"
                      {...forgotForm.register('email')}
                      className="w-full bg-slate-900/50 border border-slate-700/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  {forgotForm.formState.errors.email && (
                    <p className="text-[11px] text-red-400 mt-1">{forgotForm.formState.errors.email.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={forgotMutation.isPending}
                  className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-400 hover:to-blue-400 text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 text-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {forgotMutation.isPending ? 'Requesting link...' : 'Generate Reset Link'}
                  {!forgotMutation.isPending && <KeyRound className="w-4 h-4" />}
                </button>
              </form>

              <div className="text-center mt-6 text-xs text-slate-400">
                Remember your password?{' '}
                <button
                  onClick={() => setView('login')}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
                >
                  Go Back to Login
                </button>
              </div>
            </motion.div>
          )}

          {view === 'reset' && (
            <motion.div
              key="reset"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              <div className="mb-4">
                <p className="text-xs text-slate-400 leading-relaxed text-center">
                  You are resetting your password using a verified token. Enter your new password below.
                </p>
              </div>

              <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      id="reset-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      {...resetForm.register('password')}
                      className="w-full bg-slate-900/50 border border-slate-700/60 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      id="reset-confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      {...resetForm.register('confirmPassword')}
                      className="w-full bg-slate-900/50 border border-slate-700/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={resetMutation.isPending}
                  className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-400 hover:to-blue-400 text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 text-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {resetMutation.isPending ? 'Resetting password...' : 'Update Password'}
                  {!resetMutation.isPending && <CheckCircle className="w-4 h-4" />}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
