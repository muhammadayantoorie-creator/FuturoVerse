/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAppStore } from '@/src/store/useAppStore';
import { getTranslation } from '@/src/config/i18n';
import { Card } from '@/src/components/shared/Card';
import { Button } from '@/src/components/shared/Button';
import { 
  Languages, 
  Moon, 
  Sun, 
  ShieldAlert, 
  User, 
  BookOpen, 
  Check, 
  Eye, 
  Settings as SettingsIcon 
} from 'lucide-react';
import { motion } from 'motion/react';

export const Settings: React.FC = () => {
  const { 
    locale, 
    theme, 
    currentRole, 
    currentUser, 
    setLocale, 
    toggleTheme, 
    setRole 
  } = useAppStore();

  const isRtl = locale === 'ur';

  // Localized string map for Settings page
  const content = {
    en: {
      profileTitle: 'User Profile & Viewport',
      profileSub: 'Manage your active session and academic role.',
      langTitle: 'Language Preference',
      langSub: 'Switch between English and Noto-optimized Urdu translations.',
      themeTitle: 'Interface Mode',
      themeSub: 'Toggle dark or light visual interface themes.',
      curriculumTitle: 'Board Curriculum (AI Target)',
      curriculumSub: 'Target board for AI quiz formulations and study materials.',
      roleSelector: 'Active View Mode',
      roleSub: 'Switch viewport to test experience as an instructor or student.',
      sysInfo: 'Educational System Status',
      sysInfoSub: 'FuturoVerse is connected securely to the academic database and pre-optimized with the National Curriculum of Pakistan.',
      active: 'Active',
      themeDark: 'Dark Mode',
      themeLight: 'Light Mode',
      switchTheme: 'Switch Theme',
      saveSuccess: 'Settings updated instantly!'
    },
    ur: {
      profileTitle: 'صارف کا پروفائل اور رول',
      profileSub: 'اپنے فعال سیشن اور تعلیمی کردار کو منظم کریں۔',
      langTitle: 'زبان کی ترجیح',
      langSub: 'انگریزی اور نوٹو لکھی ہوئی اردو کے درمیان زبان تبدیل کریں۔',
      themeTitle: 'انٹرفیس تھیم',
      themeSub: 'ڈارک یا لائٹ تھیم کا انتخاب کریں۔',
      curriculumTitle: 'بورڈ کا نصاب (اے آئی ہدف)',
      curriculumSub: 'اے آئی کوئزز اور خلاصوں کے لیے مطلوبہ تعلیمی بورڈ کا انتخاب کریں۔',
      roleSelector: 'فعال ویو موڈ',
      roleSub: 'استاد یا طالب علم کے طور پر سسٹم کو ٹیسٹ کرنے کے لیے رول تبدیل کریں۔',
      sysInfo: 'تعلیمی نظام کی حیثیت',
      sysInfoSub: 'فیوچروورس تعلیمی ڈیٹا بیس سے محفوظ طریقے سے منسلک ہے اور پاکستان کے قومی نصاب کے مطابق بہتر بنایا گیا ہے۔',
      active: 'فعال',
      themeDark: 'ڈارک موڈ',
      themeLight: 'لائٹ موڈ',
      switchTheme: 'تھیم تبدیل کریں',
      saveSuccess: 'ترتیبات فوری طور پر اپ ڈیٹ ہو گئیں!'
    }
  };

  const t = locale === 'ur' ? content.ur : content.en;

  const roles = [
    { id: 'teacher', label: locale === 'ur' ? 'استاد (Teacher)' : 'Instructor / Teacher' },
    { id: 'student', label: locale === 'ur' ? 'طالب علم (Student)' : 'Student View' },
    { id: 'guest', label: locale === 'ur' ? 'مہمان (Guest)' : 'Guest Landing' }
  ] as const;

  const boards = [
    { id: 'fbise', name: 'Federal Board (FBISE)', desc: 'Federal Board of Intermediate and Secondary Education' },
    { id: 'pctb', name: 'Punjab Board (PCTB)', desc: 'Punjab Curriculum and Textbook Board' },
    { id: 'sindh', name: 'Sindh Board', desc: 'Sindh Curriculum & Textbook Board' },
    { id: 'kpk', name: 'KPK Board', desc: 'Khyber Pakhtunkhwa Textbook Board' }
  ];

  return (
    <div className="space-y-8 max-w-5xl" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Page Title */}
      <div className="flex flex-col gap-2">
        <h2 className="font-display-lg text-3xl font-bold flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          <span>{getTranslation(locale, 'settings')}</span>
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-body-md">
          {isRtl 
            ? 'پلیٹ فارم کی زبان، تھیم، امتحانی نصاب اور صارف کے کردار کو یہاں سے اپنی مرضی کے مطابق ترتیب دیں۔'
            : 'Configure localization preferences, visual themes, curriculum targets, and user simulation parameters.'}
        </p>
      </div>

      {/* User Profile Card */}
      <Card className="p-6 border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 shadow-sm border border-emerald-100/50 dark:border-emerald-900/30">
              {currentUser?.avatarUrl ? (
                <img 
                  src={currentUser.avatarUrl} 
                  alt="Avatar" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full rounded-2xl object-cover" 
                />
              ) : (
                <User className="w-8 h-8" />
              )}
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-sans">
                {t.profileTitle}
              </span>
              <h3 className="font-headline-md text-xl font-bold text-slate-800 dark:text-slate-100">
                {currentUser?.name || 'Ahmed'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {currentUser?.email || 'ahmed.alipk@uol.edu.pk'}
              </p>
            </div>
          </div>

          <div className="bg-slate-100/80 dark:bg-slate-800/80 rounded-2xl p-4 border border-slate-200/30 dark:border-slate-700/30 max-w-sm">
            <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold mb-1">
              {t.profileSub}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
              {isRtl 
                ? 'کلاس کوپائلٹ ملٹی رول سیشنز کی سہولت فراہم کرتا ہے۔ آپ کسی بھی وقت کردار تبدیل کر کے دونوں طرف کا تجربہ دیکھ سکتے ہیں۔'
                : 'Role mutations allow deep sandbox inspection. Switch views to verify student onboarding and gradebook automation.'}
            </p>
          </div>
        </div>
      </Card>

      {/* Grid containing primary options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Language Preference Card */}
        <Card className="p-6 flex flex-col justify-between border border-slate-200 dark:border-slate-800">
          <div className="space-y-3">
            <h3 className="font-headline-md text-lg font-bold flex items-center gap-2.5">
              <Languages className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>{t.langTitle}</span>
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed font-body-md">
              {t.langSub}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <button
              onClick={() => setLocale('en')}
              className={`p-4 rounded-xl border text-center transition-all cursor-pointer relative ${
                locale === 'en'
                  ? 'border-emerald-600 bg-emerald-50/20 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-400'
              }`}
            >
              {locale === 'en' && (
                <span className="absolute top-2 right-2 p-0.5 bg-emerald-600 text-white rounded-full">
                  <Check className="w-3 h-3" />
                </span>
              )}
              <span className="text-sm font-sans block">English</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Latin Alphabets</span>
            </button>

            <button
              onClick={() => setLocale('ur')}
              className={`p-4 rounded-xl border text-center transition-all cursor-pointer relative ${
                locale === 'ur'
                  ? 'border-emerald-600 bg-emerald-50/20 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-400'
              }`}
            >
              {locale === 'ur' && (
                <span className="absolute top-2 left-2 p-0.5 bg-emerald-600 text-white rounded-full">
                  <Check className="w-3 h-3" />
                </span>
              )}
              <span className="text-sm font-urdu block">اردو (Urdu)</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Nastaliq Script</span>
            </button>
          </div>
        </Card>

        {/* Theme/Interface Mode Card */}
        <Card className="p-6 flex flex-col justify-between border border-slate-200 dark:border-slate-800">
          <div className="space-y-3">
            <h3 className="font-headline-md text-lg font-bold flex items-center gap-2.5">
              {theme === 'dark' ? (
                <Moon className="w-5 h-5 text-indigo-400" />
              ) : (
                <Sun className="w-5 h-5 text-amber-500" />
              )}
              <span>{t.themeTitle}</span>
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed font-body-md">
              {t.themeSub}
            </p>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => theme !== 'light' && toggleTheme()}
              className={`flex-1 p-3.5 rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                theme === 'light'
                  ? 'border-emerald-600 bg-emerald-50/20 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Sun className="w-4 h-4" />
              <span className="text-xs font-sans">{t.themeLight}</span>
            </button>

            <button
              onClick={() => theme !== 'dark' && toggleTheme()}
              className={`flex-1 p-3.5 rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'border-emerald-600 bg-emerald-50/20 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Moon className="w-4 h-4" />
              <span className="text-xs font-sans">{t.themeDark}</span>
            </button>
          </div>
        </Card>

        {/* Role Switching Simulator */}
        <Card className="p-6 flex flex-col justify-between border border-slate-200 dark:border-slate-800">
          <div className="space-y-3">
            <h3 className="font-headline-md text-lg font-bold flex items-center gap-2.5">
              <Eye className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>{t.roleSelector}</span>
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed font-body-md">
              {t.roleSub}
            </p>
          </div>

          <div className="flex flex-col gap-2 mt-6">
            {roles.map((r) => {
              const isSelected = currentRole === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setRole(r.id)}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/20 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-400'
                  } ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}
                >
                  <span className="text-xs font-sans">{r.label}</span>
                  {isSelected && (
                    <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-600 text-white font-bold py-0.5 px-2 rounded-full font-sans uppercase">
                      {t.active}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Board Syllabus Selector */}
        <Card className="p-6 flex flex-col justify-between border border-slate-200 dark:border-slate-800">
          <div className="space-y-3">
            <h3 className="font-headline-md text-lg font-bold flex items-center gap-2.5">
              <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>{t.curriculumTitle}</span>
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed font-body-md">
              {t.curriculumSub}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 mt-6">
            {boards.map((b, idx) => {
              const isSelected = idx === 0; // Simulate Federal Board as first/active choice
              return (
                <div
                  key={b.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between transition-all relative ${
                    isSelected
                      ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/10 dark:bg-emerald-950/10 text-slate-800 dark:text-slate-200'
                      : 'border-slate-200 dark:border-slate-800 opacity-60'
                  } ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold font-sans">{b.name}</p>
                    <p className="text-[10px] text-slate-400 max-w-xs">{b.desc}</p>
                  </div>
                  {isSelected && (
                    <span className="p-0.5 bg-emerald-500 text-white rounded-full">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

      </div>

      {/* System Status Banner */}
      <Card className="border-dashed border-rose-200 dark:border-rose-950/40 bg-rose-50/20 dark:bg-rose-950/10 p-6 flex items-start gap-4">
        <ShieldAlert className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
        <div className="space-y-1.5" dir={isRtl ? 'rtl' : 'ltr'}>
          <h3 className="font-headline-md text-base font-bold text-rose-900 dark:text-rose-300">
            {t.sysInfo}
          </h3>
          <p className="text-rose-600 dark:text-rose-400 text-xs leading-relaxed font-body-md">
            {t.sysInfoSub}
          </p>
        </div>
      </Card>
    </div>
  );
};
