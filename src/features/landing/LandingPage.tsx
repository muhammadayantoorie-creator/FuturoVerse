import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  GraduationCap, 
  BookOpen, 
  HelpCircle, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  UserCheck, 
  Users, 
  BarChart3, 
  Brain, 
  FileText, 
  Zap, 
  Languages, 
  School, 
  ChevronRight, 
  Award, 
  Lock, 
  Globe, 
  Moon, 
  Sun, 
  Play, 
  Check, 
  Mail, 
  Clock, 
  Sliders, 
  Layers, 
  ExternalLink,
  ChevronDown,
  Star,
  Building2,
  Flame
} from 'lucide-react';
import { useAppStore } from '@/src/store/useAppStore';
import { Role } from '@/src/types';

interface LandingPageProps {
  onNavigateToAuth: (initialView?: 'login' | 'register', role?: Role) => void;
  onExploreDemo: (role?: Role) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToAuth, onExploreDemo }) => {
  const { locale, setLocale, theme, toggleTheme } = useAppStore();
  const isRtl = locale === 'ur';

  // Interactive Persona Preview Tab
  const [activePersona, setActivePersona] = useState<'teacher' | 'student' | 'admin'>('teacher');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // Inline PricingToggle sub-component
  const PricingToggle = () => (
    <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 mt-2">
      <button
        onClick={() => setBillingPeriod('monthly')}
        className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
          billingPeriod === 'monthly'
            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
        }`}
      >
        Monthly
      </button>
      <button
        onClick={() => setBillingPeriod('yearly')}
        className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
          billingPeriod === 'yearly'
            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
        }`}
      >
        Yearly
        <span className="bg-emerald-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black">-17%</span>
      </button>
    </div>
  );

  return (
    <div 
      className={`min-h-screen font-sans ${
        theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* 1. TOP NAVBAR */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/85 dark:bg-slate-950/85 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <img
              src="/logo.jpg"
              alt="FuturoVerse Logo"
              className="h-12 w-auto object-contain rounded-xl shadow-md shadow-emerald-500/10"
            />
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-300/40 hidden sm:inline-flex">
              Pakistan 🇵🇰
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <a href="#features" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              {isRtl ? 'خصوصیات' : 'Features'}
            </a>
            <a href="#solutions" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              {isRtl ? 'رولز اور حل' : 'Solutions'}
            </a>
            <a href="#curriculum" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              {isRtl ? 'تعلیمی بورڈز' : 'Curriculum'}
            </a>
            <a href="#preview" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              {isRtl ? 'لائیو ڈیمو' : 'Interactive Demo'}
            </a>
            <a href="#faq" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              {isRtl ? 'عام سوالات' : 'FAQ'}
            </a>
            <a href="#pricing" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-black text-emerald-700 dark:text-emerald-400">
              {isRtl ? 'قیمتیں' : 'Pricing'}
            </a>
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Language Switcher */}
            <button
              onClick={() => setLocale(locale === 'en' ? 'ur' : 'en')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Toggle Language (English / اردو)"
            >
              <Languages className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{locale === 'en' ? 'اردو' : 'English'}</span>
            </button>

            {/* Theme Switcher */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Sign In Button */}
            <button
              onClick={() => onNavigateToAuth('login')}
              className="hidden sm:inline-flex items-center justify-center px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              {isRtl ? 'لاگ ان کریں' : 'Sign In'}
            </button>

            {/* Get Started CTA */}
            <button
              onClick={() => onNavigateToAuth('register')}
              className="inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <span>{isRtl ? 'مفت شروع کریں' : 'Get Started'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-slate-200/80 dark:border-slate-800/80">
        {/* Subtle background glow */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] lg:w-[900px] h-[400px] bg-gradient-to-b from-emerald-500/15 via-teal-500/10 to-transparent blur-3xl pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              <span>
                {isRtl 
                  ? 'پاکستانی تعلیمی اداروں کے لیے سر فہرست بائلنگول اے آئی پلیٹ فارم' 
                  : 'Tailored for Pakistani Schools, Colleges & Universities'}
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.15]">
              {isRtl ? (
                <>
                  اسمارٹ کلاس روم مینجمنٹ اور{' '}
                  <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-blue-600 bg-clip-text text-transparent">
                    اردو و انگریزی اے آئی
                  </span>{' '}
                  کی طاقت
                </>
              ) : (
                <>
                  Empowering Pakistani Classrooms with{' '}
                  <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-blue-600 bg-clip-text text-transparent">
                    Bilingual AI Intelligence
                  </span>
                </>
              )}
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg lg:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
              {isRtl ? (
                'اساتذہ کے لیے خودکار کوئز جنریٹر اور نصاب سمری، طلباء کے لیے 24/7 اے آئی ٹیوٹر، اور ایڈمنسٹریشن کے لیے شفاف تعلیمی تجزیات — تمام فیڈرل اور صوبائی بورڈز کے مطابق۔'
              ) : (
                'Automated bilingual quiz generation for Teachers, 24/7 AI-powered study assistance for Students, and institution-wide analytics for Administrators — aligned with FBISE, HEC, and Provincial Boards.'
              )}
            </p>

            {/* Action Buttons & Quick Role Choice */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => onNavigateToAuth('register')}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-base shadow-xl shadow-emerald-600/25 flex items-center justify-center gap-3 transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
              >
                <span>{isRtl ? 'ابھی مفت اکاؤنٹ بنائیں' : 'Create Free Account'}</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={() => onExploreDemo('teacher')}
                className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 text-slate-800 dark:text-slate-100 font-bold text-base shadow-md flex items-center justify-center gap-2.5 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 text-emerald-500 fill-emerald-500" />
                <span>{isRtl ? 'لائیو ڈیمو آزمائیں' : 'Explore Live Demo'}</span>
              </button>
            </div>

            {/* Quick Demo Access Bar */}
            <div className="pt-6">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3">
                {isRtl ? 'براہ راست مخصوص رول کے ساتھ لاگ ان کریں:' : 'Instant 1-Click Access as:'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                <button
                  onClick={() => onNavigateToAuth('login', 'teacher')}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                >
                  <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>👨‍🏫 {isRtl ? 'بطور استاد داخل ہوں' : 'Teacher View'}</span>
                </button>

                <button
                  onClick={() => onNavigateToAuth('login', 'student')}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                >
                  <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>🎓 {isRtl ? 'بطور طالب علم داخل ہوں' : 'Student View'}</span>
                </button>

                <button
                  onClick={() => onNavigateToAuth('login', 'admin')}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                >
                  <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>🛡️ {isRtl ? 'بطور ایڈمن داخل ہوں' : 'Admin View'}</span>
                </button>
              </div>
            </div>

            {/* Impact Metric Strip */}
            <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                <span className="block text-2xl lg:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                  15,000+
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {isRtl ? 'تیار کردہ کوئزز' : 'Bilingual Quizzes Generated'}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                <span className="block text-2xl lg:text-3xl font-black text-blue-600 dark:text-blue-400">
                  98%
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {isRtl ? 'اساتذہ کا وقت بچایا گیا' : 'Teacher Preparation Saved'}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                <span className="block text-2xl lg:text-3xl font-black text-purple-600 dark:text-purple-400">
                  45+
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {isRtl ? 'کیمپس اور کالجز' : 'Pakistani Campuses Onboarded'}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                <span className="block text-2xl lg:text-3xl font-black text-teal-600 dark:text-teal-400">
                  94.8%
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {isRtl ? 'طالب علم کامیابی کی شرح' : 'Student Retention Rate'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE PERSONA ROLE SHOWCASE (SOLUTIONS) */}
      <section id="solutions" className="py-20 lg:py-28 bg-slate-100/60 dark:bg-slate-900/40 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              {isRtl ? 'ہر کردار کے لیے مکمل سہولت' : 'Role-Based Access & Experience'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-2">
              {isRtl 
                ? 'اساتذہ، طلباء اور ایڈمنز کے لیے الگ الگ پرسنلائزڈ پورٹلز' 
                : 'Tailored Environments for Teachers, Students & Admins'}
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-3">
              {isRtl 
                ? 'ہر صارف صرف اپنے مخصوص کام دیکھتا ہے: استاد اپنے اسباق کا انتظام کرتا ہے، طالب علم سیکھتا ہے، اور ایڈمن پورے ادارے کی نگرانی کرتا ہے۔' 
                : 'Role-Based Access Control guarantees teachers see teaching tools, students see practice & lessons, and admins govern institutional metrics.'}
            </p>
          </div>

          {/* Persona Switcher Tabs */}
          <div className="flex justify-center mb-10">
            <div className="inline-flex p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <button
                onClick={() => setActivePersona('teacher')}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activePersona === 'teacher'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>👨‍🏫 {isRtl ? 'اساتذہ پورٹل' : 'Teacher Portal'}</span>
              </button>

              <button
                onClick={() => setActivePersona('student')}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activePersona === 'student'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>🎓 {isRtl ? 'طالب علم پورٹل' : 'Student Hub'}</span>
              </button>

              <button
                onClick={() => setActivePersona('admin')}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activePersona === 'admin'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>🛡️ {isRtl ? 'ایڈمن کنٹرول' : 'Admin & Dean Center'}</span>
              </button>
            </div>
          </div>

          {/* Persona Card Detail */}
          <div className="max-w-5xl mx-auto">
            <AnimatePresence mode="wait">
              {activePersona === 'teacher' && (
                <motion.div
                  key="teacher-persona"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    <div className="lg:col-span-6 space-y-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                        <Zap className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'اساتذہ کے لیے مخصوص خصوصیات' : 'Dedicated for Instructors & Faculty'}</span>
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                        {isRtl ? 'کلاس روم، کوئز جنریشن اور گریڈ بک' : 'Effortless Classroom, Quiz & Curriculum Control'}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        {isRtl 
                          ? 'استاد اپنے نصاب کی پی ڈی ایف یا نوٹس اپ لوڈ کرتے ہیں، اور پلیٹ فارم خود بخود اردو اور انگریزی میں کثیر الانتخابی سوالات تیار کرتا ہے۔' 
                          : 'Upload lecture slides or textbook PDFs to instantly produce bilingual MCQs, track assignment submissions, and broadcast email notifications with class join codes.'}
                      </p>

                      <ul className="space-y-2.5 pt-2">
                        {[
                          isRtl ? '1-کلک بائلنگول کوئز جنریٹر (انگریزی و اردو ترجمہ)' : '1-Click Bilingual Quiz Generator (FBISE / Board formats)',
                          isRtl ? 'کلاس روم کوڈ اور براہ راست ای میل نوٹیفکیشن سسٹم' : 'Instant Classroom Join Code & Broadcast Emailer',
                          isRtl ? 'طالب علم کی کمزوریوں اور حاضری کا خودکار تجزیہ' : 'At-risk Student Identification & Auto-Gradebook',
                          isRtl ? 'پی ڈی ایف اور پریزنٹیشن سلائیڈز سے سمری کی تیاری' : 'Automatic Lecture Slide & Handout Summarizer'
                        ].map((feat, idx) => (
                          <li key={idx} className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="pt-4">
                        <button
                          onClick={() => onNavigateToAuth('login', 'teacher')}
                          className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md flex items-center gap-2 transition-all cursor-pointer"
                        >
                          <span>{isRtl ? 'بطور استاد شروع کریں' : 'Enter as Teacher'}</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="lg:col-span-6 bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {isRtl ? 'استاد ورک اسپیس پیش نظارہ' : 'Teacher Workspace Active View'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono font-bold">
                          PHYS-101 Mechanics
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-100 block">
                              {isRtl ? 'ہفتہ وار کوئز نمبر 4 (بائلنگول)' : 'Weekly Quiz #4 (Bilingual)'}
                            </span>
                            <span className="text-[10px] text-slate-400">45 Students Enrolled • 88% Average</span>
                          </div>
                          <span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-bold rounded-lg text-[10px]">
                            Active
                          </span>
                        </div>

                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-100 block">
                              {isRtl ? 'کوانٹم مکینکس سمری پی ڈی ایف' : 'Quantum Mechanics Key Takeaways'}
                            </span>
                            <span className="text-[10px] text-slate-400">AI Extracted from Week4_Lecture.pdf</span>
                          </div>
                          <span className="px-2 py-1 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold rounded-lg text-[10px]">
                            Processed
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activePersona === 'student' && (
                <motion.div
                  key="student-persona"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    <div className="lg:col-span-6 space-y-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-xs">
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'طلباء کے لیے مخصوص پورٹل' : 'Dedicated for Students & Learners'}</span>
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                        {isRtl ? 'ذاتی اے آئی ٹیوٹر اور پریکٹس ٹیسٹ' : '24/7 AI Study Buddy & Diagnostic Quizzes'}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        {isRtl 
                          ? 'طلباء کلاس روم کوڈ درج کر کے شامل ہو سکتے ہیں، اردو یا انگریزی میں شکوک و شبہات حل کر سکتے ہیں، اور پریکٹس ٹیسٹ کے ذریعے امتحان کی تیاری کر سکتے ہیں۔' 
                          : 'Students easily join classes with unique codes, practice diagnostic tests with instant step-by-step Urdu/English explanations, and track weak topics.'}
                      </p>

                      <ul className="space-y-2.5 pt-2">
                        {[
                          isRtl ? '24/7 اردو اور انگریزی اے آئی ٹیوٹر چیٹ اسسٹنٹ' : '24/7 Bilingual AI Study Tutor (Urdu & English Voice/Text)',
                          isRtl ? 'کلاس روم جوائن کوڈ سے فوری شمولیت' : 'Simple Classroom Join Code System',
                          isRtl ? 'کمزور موضوعات (Weak Topics) کی نشاندہی' : 'Automated Weak Topic Diagnostic Reports',
                          isRtl ? 'اساتذہ کے نوٹس اور لیکچر سمریز تک آسان رسائی' : 'Lecture PDF Handout & Note Archive'
                        ].map((feat, idx) => (
                          <li key={idx} className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
                            <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="pt-4">
                        <button
                          onClick={() => onNavigateToAuth('login', 'student')}
                          className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-md flex items-center gap-2 transition-all cursor-pointer"
                        >
                          <span>{isRtl ? 'بطور طالب علم داخل ہوں' : 'Enter as Student'}</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="lg:col-span-6 bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {isRtl ? 'طالب علم ڈیش بورڈ' : 'Student Learning Hub'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-mono font-bold">
                          Semester 1 • Ahmed
                        </span>
                      </div>

                      <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-800 dark:text-slate-100">
                            {isRtl ? 'اے آئی ٹیوٹر سوال و جواب' : 'AI Study Assistant (Urdu/English)'}
                          </span>
                          <span className="text-[10px] text-emerald-500 font-bold">Online</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-2 rounded-lg">
                          💡 <em>&quot;ڈی بروگلی ویولینتھ فارمولا (λ = h/p) الیکٹران کی موجی خصوصیت کو ظاہر کرتا ہے۔&quot;</em>
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activePersona === 'admin' && (
                <motion.div
                  key="admin-persona"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    <div className="lg:col-span-6 space-y-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold text-xs">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'ادارے کے سربراہ اور ایڈمن کے لیے' : 'Full Institutional Oversight'}</span>
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                        {isRtl ? 'کیمپس مانیٹرنگ اور تعلیمی تجزیات' : 'Campus Analytics, Audit & User Management'}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        {isRtl 
                          ? 'پرنسپل اور ڈینز تمام شعبہ جات، کلاس رومز، اساتذہ کی کارکردگی اور طلباء کے نتائج کی نگرانی ایک مکمل ایڈمن پینل کے ذریعے کر سکتے ہیں۔' 
                          : 'Deans and Academic Heads view departmental performance, faculty course loads, early student drop-out warnings, and complete audit gradebooks across the institution.'}
                      </p>

                      <ul className="space-y-2.5 pt-2">
                        {[
                          isRtl ? 'تمام شعبہ جات (Departments) کی مرکزی نگرانی' : 'Cross-Department Performance & Pass-Rate Analytics',
                          isRtl ? 'طالب علم ڈراپ آؤٹ ارلی وارننگ سسٹم' : 'Automated Student Retention & Risk Early Warning',
                          isRtl ? 'مکمل رول بیسڈ سیکیورٹی اور رسائی کنٹرول' : 'Strict RBAC Security & Institutional Settings',
                          isRtl ? 'تمام امتحانات اور گریڈ بکس کی آڈٹ لاگز' : 'Centralized Curriculum & Gradebook Audits'
                        ].map((feat, idx) => (
                          <li key={idx} className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
                            <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="pt-4">
                        <button
                          onClick={() => onNavigateToAuth('login', 'admin')}
                          className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm shadow-md flex items-center gap-2 transition-all cursor-pointer"
                        >
                          <span>{isRtl ? 'بطور ایڈمن لاگ ان کریں' : 'Enter as Admin / Dean'}</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="lg:col-span-6 bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {isRtl ? 'ایڈمن ایگزیکٹو ڈیش بورڈ' : 'Institution Overview'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-mono font-bold">
                          All Access
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-center">
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                          <span className="text-xs text-slate-400 block">{isRtl ? 'فعال کلاس رومز' : 'Total Classrooms'}</span>
                          <span className="text-lg font-black text-purple-600 dark:text-purple-400">128</span>
                        </div>
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                          <span className="text-xs text-slate-400 block">{isRtl ? 'اوسط حاضری' : 'Avg Attendance'}</span>
                          <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">92.4%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* 4. KEY PLATFORM FEATURES (BENTO GRID) */}
      <section id="features" className="py-20 lg:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
            {isRtl ? 'جدید تکنیکی خصوصیات' : 'Core Capabilities'}
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-2">
            {isRtl ? 'پاکستانی تعلیم کے لیے مکمل اسمارٹ انفراسٹرکچر' : 'Built from the Ground Up for Pakistan'}
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-3">
            {isRtl 
              ? 'مقامی ضروریات اور بین الاقوامی معیارات کا امتزاج جو تدریسی عمل کو آسان اور موثر بناتا ہے۔' 
              : 'Combining Gemini AI with localized educational curricula to modernize how lectures, assessments, and gradebooks function.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Bilingual AI Engine */}
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-md hover:shadow-xl transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6">
              <Languages className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              {isRtl ? 'بائلنگول اے آئی انجن (اردو اور انگلش)' : 'Native Bilingual AI Engine'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {isRtl 
                ? 'سوالات اور حل انگریزی اور نستعلیق اردو میں خودکار طور پر تیار کریں تاکہ طلباء کے فہم میں آسانی ہو۔' 
                : 'Generate questions, explanations, and lecture notes in clear English paired side-by-side with localized Urdu Nastaliq.'}
            </p>
          </div>

          {/* Card 2: PDF & Slide Takeaway Parser */}
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-md hover:shadow-xl transition-all">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              {isRtl ? 'پی ڈی ایف اور لیکچر سلائیڈ پارسر' : 'PDF & Slide Handout Parser'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {isRtl 
                ? 'کتابوں اور پریزنٹیشنز کو اپ لوڈ کریں؛ اے آئی اہم نکات اور کلیدی فارمولے خود نکال دے گا۔' 
                : 'Drag and drop course syllabus chapters and slide decks. The engine extracts core formulas, principles, and summary bullet points in seconds.'}
            </p>
          </div>

          {/* Card 3: Automated Quiz Builder */}
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-md hover:shadow-xl transition-all">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-6">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              {isRtl ? 'خودکار کوئز و امتحانی پرچے' : 'Automated Quiz & Exam Builder'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {isRtl 
                ? 'فیڈرل بورڈ اور یونیورسٹی پیٹرن کے مطابق ایم سی کیوز، صحیح/غلط اور وضاحتی سوالات منٹوں میں بنائیں۔' 
                : 'Create balanced MCQs and True/False assessments calibrated for difficulty (Easy, Medium, Hard) matching board exams.'}
            </p>
          </div>

          {/* Card 4: Classroom Join Codes & Emailer */}
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-md hover:shadow-xl transition-all">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              {isRtl ? 'کلاس کوڈ اور ای میل نشریات' : 'Class Join Codes & Mail Broadcast'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {isRtl 
                ? 'ہر کلاس کے لیے منفرد جوائن کوڈ، اور تمام انرولڈ طلباء کو 1-کلک میں نوٹیفکیشن ای میل بھیجنے کی سہولت۔' 
                : 'Generate unique 6-character classroom join codes and dispatch 1-click broadcast email invitations directly to entire student batches.'}
            </p>
          </div>

          {/* Card 5: Real-time Gradebook */}
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-md hover:shadow-xl transition-all">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-600 dark:text-teal-400 mb-6">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              {isRtl ? 'لائیو گریڈ بک اور کارکردگی تجزیہ' : 'Continuous Assessment Gradebook'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {isRtl 
                ? 'اسائنمنٹس، مڈٹرم، فائنل اور کلاس پارٹیسیپیشن کے نمبرات خودکار ٹریک اور ایکسل شیٹ میں ایکسپورٹ کریں۔' 
                : 'Calculate weighted term marks, quiz results, and attendance with 1-click CSV export ready for university registrars.'}
            </p>
          </div>

          {/* Card 6: Student Weak Topic Diagnostics */}
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-md hover:shadow-xl transition-all">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-6">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              {isRtl ? 'کمزور موضوعات کی خودکار تشخیص' : 'Weak Topic AI Diagnostics'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {isRtl 
                ? 'طالب علم کن موضوعات میں مشکلات کا شکار ہیں، اے آئی فوری شناخت کر کے اصلاحی پریکٹس تجویز کرتا ہے۔' 
                : 'Instantly pinpoint struggling concepts across Physics, Math, and Biology and generate targeted practice tests.'}
            </p>
          </div>
        </div>
      </section>

      {/* 5. CURRICULUM BOARDS COMPATIBILITY */}
      <section id="curriculum" className="py-16 bg-slate-100/70 dark:bg-slate-900/60 border-y border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-6">
            {isRtl ? 'ہم آہنگ تعلیمی بورڈز اور یونیورسٹیاں' : 'Full Alignment with National & Provincial Standards'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 opacity-85">
            {[
              { name: 'FBISE Islamabad', badge: 'Federal Board' },
              { name: 'HEC Pakistan', badge: 'Higher Education Commission' },
              { name: 'BISE Lahore', badge: 'Punjab Curriculum' },
              { name: 'BISE Karachi', badge: 'Sindh Board' },
              { name: 'BISE Peshawar', badge: 'KPK Board' },
              { name: 'Cambridge O/A Levels', badge: 'International' },
            ].map((board, idx) => (
              <div 
                key={idx}
                className="px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-2.5"
              >
                <School className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <div className="text-left">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">{board.name}</span>
                  <span className="text-[9px] text-slate-400 font-medium">{board.badge}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. TESTIMONIALS */}
      <section className="py-20 lg:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
            {isRtl ? 'اساتذہ اور اداروں کی آراء' : 'Educator & Student Reviews'}
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-2">
            {isRtl ? 'پاکستان بھر کے اساتذہ کا بھروسہ' : 'Trusted by Leading Faculty Across Pakistan'}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex text-amber-400 gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i}>★</span>
                ))}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic">
                &quot;FuturoVerse has cut down my weekly quiz preparation from 4 hours to just 5 minutes. The bilingual English-Urdu question format is a blessing for students struggling with English terms.&quot;
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold text-sm">
                KT
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Prof. Dr. Kamran Tariq</h4>
                <p className="text-[11px] text-slate-400">Department of Physics, FAST-NUCES</p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex text-amber-400 gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i}>★</span>
                ))}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic">
                &quot;Having the AI Study Buddy explain difficult organic chemistry reactions in Urdu anytime at night helped me improve my test scores from 55% to 88% in just three weeks.&quot;
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-sm">
                ZF
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Zainab Fatima</h4>
                <p className="text-[11px] text-slate-400">Pre-Medical Student, FBISE Board</p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex text-amber-400 gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i}>★</span>
                ))}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic">
                &quot;The institutional analytics dashboard gives us early warning on students at risk of dropping out before midterms. The role-based permissions keep our gradebooks secure.&quot;
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-700 dark:text-purple-300 font-bold text-sm">
                TM
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Dean Tariq Mehmood</h4>
                <p className="text-[11px] text-slate-400">Academic Dean, Punjab College System</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FREQUENTLY ASKED QUESTIONS */}
      <section id="faq" className="py-20 lg:py-28 bg-slate-100/60 dark:bg-slate-900/40 border-t border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              {isRtl ? 'عام سوالات' : 'Frequently Asked Questions'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-2">
              {isRtl ? 'اکثر پوچھے جانے والے سوالات' : 'Everything You Need to Know'}
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: isRtl ? 'کیا کوئزز اور سوالات اردو اور انگریزی دونوں میں ہوتے ہیں؟' : 'Are quizzes and question banks supported in both English and Urdu?',
                a: isRtl ? 'جی ہاں! آپ انگریزی، اردو یا دونوں زبانوں (Bilingual) کا انتخاب کر سکتے ہیں۔ بائلنگول موڈ میں ہر انگریزی سوال کے ساتھ واضح اردو ترجمہ اور وضاحت بھی فراہم کی جاتی ہے۔' : 'Yes! You can choose English, Urdu, or Bilingual format. In Bilingual mode, questions include the standard English formulation accompanied by clean Urdu translation and explanations.'
              },
              {
                q: isRtl ? 'طلباء کلاس روم میں کیسے شامل ہو سکتے ہیں؟' : 'How do students join their designated classrooms?',
                a: isRtl ? 'استاد کلاس روم بنانے پر ایک منفرد 6 ہندسوں کا کوڈ (Join Code) حاصل کرتے ہیں۔ طلباء اپنے پورٹل میں جا کر "Join Class" پر کلک کر کے یہ کوڈ درج کر کے شامل ہو سکتے ہیں۔' : 'Teachers receive a unique 6-character Join Code when creating a class. Students simply click "Join Class" in their portal, type the code, and gain instant access to all lecture notes and quizzes.'
              },
              {
                q: isRtl ? 'استاد، طالب علم اور ایڈمن میں کیا فرق ہے؟' : 'What is the difference between Teacher, Student, and Admin roles?',
                a: isRtl ? 'استاد صرف کلاس روم بنانے، کوئز جنریشن، نوٹس اپ لوڈ اور گریڈ بک کے اختیارات رکھتے ہیں۔ طلباء صرف پڑھنے اور پریکٹس ٹیسٹ دینے کا پورٹل دیکھتے ہیں۔ جبکہ ایڈمنز پورے کیمپس، تمام کلاسز اور تجزیات تک مکمل رسائی رکھتے ہیں۔' : 'Teachers have creation controls for classes, quizzes, materials, and gradebooks. Students have a focused study portal with practice tests and an AI tutor. Admins have comprehensive access to all campus data and audit logs.'
              },
              {
                q: isRtl ? 'کیا ہم اپنے کیمپس کے لیے کسٹم سلیبس اور پی ڈی ایف اپ لوڈ کر سکتے ہیں؟' : 'Can we upload custom college textbooks and syllabus slide decks?',
                a: isRtl ? 'بالکل! آپ کسی بھی مضمون کی پی ڈی ایف، پاور پوائنٹ یا ورڈ فائل اپ لوڈ کر سکتے ہیں؛ ہمارا اے آئی انجن مواد کو فوری پراسیس کر کے اہم نکات نکال دیتا ہے۔' : 'Absolutely. You can upload custom course PDFs, PPTX slide decks, and Word files. Gemini AI parses the document and produces key takeaway bullet points and auto-aligned quiz questions.'
              }
            ].map((faqItem, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  <span>{faqItem.q}</span>
                  <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${openFaq === idx ? 'rotate-180 text-emerald-500' : 'text-slate-400'}`} />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800/60 pt-3 leading-relaxed">
                    {faqItem.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. PRICING SECTION */}
      <section id="pricing" className="py-20 border-t border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center space-y-4 mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
              <Flame className="w-3.5 h-3.5 animate-pulse" />
              <span>{isRtl ? '5 مفت ٹرائلز شامل ہیں' : '5 Free AI Uses Included — No Credit Card Required'}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              {isRtl ? 'سادہ اور شفاف قیمتیں' : 'Simple, Transparent Pricing'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
              {isRtl
                ? 'پہلے 5 بار مفت استعمال کریں۔ کوئی کریڈٹ کارڈ نہیں چاہیے۔ پھر اپنی ضرورت کے مطابق پلان منتخب کریں۔'
                : 'Start completely free — 5 AI-powered uses included on sign-up. No credit card needed. Upgrade when you are ready to unlock the full platform.'}
            </p>

            {/* Monthly / Yearly toggle */}
            <PricingToggle />
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-start">

            {/* FREE TRIAL CARD */}
            <div className="rounded-3xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-7 flex flex-col gap-6 relative overflow-hidden hover:shadow-xl transition-shadow">
              <div className="absolute top-0 right-0 w-40 h-40 bg-slate-100/50 dark:bg-slate-800/30 rounded-full blur-3xl pointer-events-none" />
              <div>
                <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 mb-4">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Free Trial</h3>
                <p className="text-xs text-slate-400 mt-1">Perfect to explore &amp; test the platform</p>
              </div>
              <div className="flex items-end gap-1">
                <span className="text-5xl font-black text-slate-900 dark:text-white">Rs 0</span>
                <span className="text-slate-400 text-sm mb-1.5">/forever</span>
              </div>
              <div className="space-y-2.5">
                {[
                  '5 free AI generations (quizzes, summaries, flashcards)',
                  '1 classroom creation',
                  'AI Chatbot (5 queries)',
                  'Vision Solver (5 uploads)',
                  'Mind Map Generator (5 maps)',
                  'Basic analytics dashboard',
                  'No credit card required',
                ].map((feat, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-xs text-slate-600 dark:text-slate-300">{feat}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => onNavigateToAuth('register')}
                className="mt-auto w-full py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                Start Free — No Card Needed
              </button>
              <p className="text-center text-[10px] text-slate-400">Trial resets once. Upgrade any time.</p>
            </div>

            {/* PRO CARD (highlighted) */}
            <div className="rounded-3xl border-2 border-emerald-500 bg-gradient-to-b from-emerald-600 via-teal-600 to-emerald-700 text-white p-7 flex flex-col gap-6 relative overflow-hidden shadow-2xl shadow-emerald-500/25 scale-[1.03]">
              {/* Most Popular Badge */}
              <div className="absolute top-5 right-5">
                <span className="flex items-center gap-1 px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-full text-[10px] font-black uppercase tracking-wider">
                  <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                  Most Popular
                </span>
              </div>
              <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
              <div>
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-black">Pro Educator</h3>
                <p className="text-xs text-emerald-100 mt-1">For individual teachers &amp; tutors</p>
              </div>
              <div className="flex items-end gap-1">
                <span className="text-5xl font-black">Rs 1,499</span>
                <span className="text-emerald-200 text-sm mb-1.5">/month</span>
              </div>
              <div className="text-xs text-emerald-200 -mt-4">Rs 14,990/year — save 2 months free</div>
              <div className="space-y-2.5">
                {[
                  'Unlimited AI quiz & material generation',
                  'Unlimited classrooms & students',
                  'AI Voice Tutor (unlimited sessions)',
                  'Vision Solver (unlimited uploads)',
                  'AI Gradebook with smart analytics',
                  'AI-powered feedback & rubric engine',
                  'PDF export & bulk download',
                  'Priority AI response speed',
                  'Bilingual Urdu + English support',
                ].map((feat, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0 mt-0.5" />
                    <span className="text-xs text-white/90">{feat}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => onNavigateToAuth('register')}
                className="mt-auto w-full py-3.5 rounded-2xl bg-white text-emerald-700 font-black text-sm hover:bg-emerald-50 transition-all shadow-lg active:scale-95 cursor-pointer"
              >
                Start 5-Day Free Trial → Upgrade
              </button>
              <p className="text-center text-[10px] text-emerald-200">Cancel anytime. No lock-in contracts.</p>
            </div>

            {/* INSTITUTION CARD */}
            <div className="rounded-3xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-7 flex flex-col gap-6 relative overflow-hidden hover:shadow-xl transition-shadow">
              <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-100/40 dark:bg-indigo-900/20 rounded-full blur-3xl pointer-events-none" />
              <div>
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Institution</h3>
                <p className="text-xs text-slate-400 mt-1">For schools, colleges &amp; universities</p>
              </div>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-black text-slate-900 dark:text-white">Custom</span>
              </div>
              <div className="text-xs text-indigo-600 dark:text-indigo-400 -mt-4 font-bold">Contact us for institutional pricing</div>
              <div className="space-y-2.5">
                {[
                  'Everything in Pro (all teachers)',
                  'Admin dashboard with full control',
                  'Multi-campus & department management',
                  'FBISE / HEC board curriculum templates',
                  'Dedicated onboarding & training session',
                  'Custom AI model fine-tuning on syllabus',
                  'SLA-backed uptime guarantee',
                  'Invoice & purchase order billing',
                ].map((feat, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                    <span className="text-xs text-slate-600 dark:text-slate-300">{feat}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => onNavigateToAuth('register')}
                className="mt-auto w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Contact for Quote
              </button>
              <p className="text-center text-[10px] text-slate-400">Flexible per-seat pricing available.</p>
            </div>
          </div>

          {/* Feature comparison table (key points) */}
          <div className="mt-14 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-900/60 px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h4 className="font-black text-sm text-slate-800 dark:text-slate-100">Feature Comparison</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <th className="text-left px-6 py-3 font-bold text-slate-500 dark:text-slate-400 w-1/2">Feature</th>
                    <th className="text-center px-4 py-3 font-bold text-slate-600 dark:text-slate-300">Free</th>
                    <th className="text-center px-4 py-3 font-black text-emerald-600 dark:text-emerald-400">Pro</th>
                    <th className="text-center px-4 py-3 font-bold text-indigo-600 dark:text-indigo-400">Institution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {[
                    ['AI Quiz Generation', '5 uses', 'Unlimited', 'Unlimited'],
                    ['Classrooms', '1', 'Unlimited', 'Unlimited'],
                    ['AI Voice Tutor', '5 sessions', 'Unlimited', 'Unlimited'],
                    ['Vision Solver (photo)', '5 uploads', 'Unlimited', 'Unlimited'],
                    ['Mind Map Generator', '5 maps', 'Unlimited', 'Unlimited'],
                    ['Gradebook Analytics', 'Basic', 'Advanced AI', 'Enterprise'],
                    ['PDF / Bulk Export', '✗', '✓', '✓'],
                    ['Admin Dashboard', '✗', '✗', '✓'],
                    ['Priority AI Speed', '✗', '✓', '✓'],
                    ['Custom Curriculum AI', '✗', '✗', '✓'],
                  ].map(([feature, free, pro, inst], i) => (
                    <tr key={i} className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-200">{feature}</td>
                      <td className="px-4 py-3 text-center text-slate-500 dark:text-slate-400">{free}</td>
                      <td className="px-4 py-3 text-center font-bold text-emerald-600 dark:text-emerald-400">{pro}</td>
                      <td className="px-4 py-3 text-center font-bold text-indigo-600 dark:text-indigo-400">{inst}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Trust indicators */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400">
            {[
              { icon: ShieldCheck, text: 'No credit card for free trial' },
              { icon: Lock, text: 'Cancel Pro anytime, no penalty' },
              { icon: Award, text: 'FBISE & HEC compliant platform' },
              { icon: Globe, text: 'Bilingual Urdu + English content' },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-emerald-500" />
                <span className="font-semibold">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. FINAL CALL TO ACTION */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="p-10 sm:p-16 rounded-3xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-blue-700 text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
              {isRtl ? 'آج ہی اپنے کلاس روم کو جدید اے آئی سے لیس کریں' : 'Ready to Transform Your Classroom Experience?'}
            </h2>
            <p className="text-sm sm:text-base text-emerald-50 max-w-2xl mx-auto leading-relaxed">
              {isRtl 
                ? 'مفت اکاؤنٹ بنائیں یا 1-کلک ڈیمو کے ذریعے اساتذہ، طلباء اور ایڈمنسٹریشن کی تمام صلاحیتیں آزمائیں۔' 
                : 'Join thousands of educators and students across Pakistan. Create a free account or test drive the live environment in seconds.'}
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => onNavigateToAuth('register')}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-black text-sm shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <span>{isRtl ? 'مفت اکاؤنٹ بنائیں' : 'Sign Up Free'}</span>
                <ArrowRight className="w-4 h-4 text-emerald-600" />
              </button>
              <button
                onClick={() => onNavigateToAuth('login')}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-emerald-800/80 hover:bg-emerald-800 border border-white/20 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
              >
                <span>{isRtl ? 'اکاؤنٹ میں لاگ ان کریں' : 'Sign In with Existing Account'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 9. FOOTER */}
      <footer className="py-12 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img
              src="/logo.jpg"
              alt="FuturoVerse Logo"
              className="h-9 w-auto object-contain rounded-lg"
            />
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200">FuturoVerse Pakistan</span>
              <p className="text-[10px] text-slate-400">© {new Date().getFullYear()} FuturoVerse. FBISE & HEC Compliant.</p>
            </div>
          </div>

          <div className="flex items-center gap-6 font-semibold">
            <a href="#features" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              {isRtl ? 'خصوصیات' : 'Features'}
            </a>
            <a href="#solutions" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              {isRtl ? 'رولز' : 'Roles'}
            </a>
            <a href="#curriculum" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              {isRtl ? 'بورڈز' : 'Boards'}
            </a>
            <button 
              onClick={() => onNavigateToAuth('login')}
              className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
            >
              {isRtl ? 'پورٹل لاگ ان' : 'Portal Login'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
