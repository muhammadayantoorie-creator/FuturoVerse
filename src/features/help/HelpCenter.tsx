/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/src/store/useAppStore';
import { getTranslation } from '@/src/config/i18n';
import { Card } from '@/src/components/shared/Card';
import { Button } from '@/src/components/shared/Button';
import { 
  Search, 
  HelpCircle, 
  MessageSquare, 
  ChevronDown, 
  ChevronUp, 
  Send, 
  CheckCircle, 
  Inbox, 
  Plus, 
  Clock, 
  User, 
  Folder, 
  Mail, 
  ExternalLink 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Ticket {
  id: string;
  name: string;
  email: string;
  subject: string;
  category: string;
  message: string;
  role: string;
  status: 'open' | 'in-progress' | 'resolved';
  createdAt: string;
  replies: { id: string; sender: string; text: string; timestamp: string }[];
}

export const HelpCenter: React.FC = () => {
  const { locale, theme, currentRole } = useAppStore();
  const isRtl = locale === 'ur';

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'general' | 'teacher' | 'student' | 'ai'>('all');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  
  // Ticket states
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  
  // Form fields
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCategory, setFormCategory] = useState('General');
  const [formSubject, setFormSubject] = useState('');
  const [formMessage, setFormMessage] = useState('');

  // Tab state (FAQ vs Tickets)
  const [currentSubTab, setCurrentSubTab] = useState<'faqs' | 'tickets'>('faqs');

  // FAQ Data - bilingual optimized
  const faqs = [
    {
      id: 1,
      category: 'general',
      questionEn: 'How do I toggle the Urdu bilingual interface?',
      questionUr: 'میں اردو بائلنگول انٹرفیس کو کیسے آن کروں؟',
      answerEn: 'You can switch the entire platform between English and Noto-optimized Urdu anytime by clicking the "Globe/Languages" icon in the top navigation bar, or toggling it inside the Settings tab.',
      answerUr: 'آپ ہوم پیج کے اوپر والے نیویگیشن بار میں موجود "زبان" (Languages) کے آئیکون پر کلک کر کے یا ترتیبات (Settings) میں جا کر پورے پلیٹ فارم کو انگریزی اور اردو میں تبدیل کر سکتے ہیں۔'
    },
    {
      id: 2,
      category: 'ai',
      questionEn: 'What Pakistani curricula boards are supported by the AI?',
      questionUr: 'اے آئی کن پاکستانی امتحانی بورڈز کے نصاب کو سپورٹ کرتا ہے؟',
      answerEn: 'FuturoVerse is pre-optimized for Pakistani education. The AI auto-adapts to Punjab Textbook Board (PCTB), Federal Board (FBISE), Sindh Board, and KPK Board syllabi based on the content of the books and lecture notes you upload.',
      answerUr: 'فیوچروورس خصوصی طور پر پاکستانی تعلیمی نظام کے لیے بنایا گیا ہے۔ آپ جو بھی لیکچر نوٹس یا کتاب کا باب اپ لوڈ کریں گے، اے آئی خود بخود پنجاب بورڈ (PCTB)، فیڈرل بورڈ (FBISE)، سندھ بورڈ، یا خیبر پختونخوا بورڈ کے نصاب کے مطابق خود کو ڈھال لے گا۔'
    },
    {
      id: 3,
      category: 'teacher',
      questionEn: 'How can I generate a bilingual English-Urdu classroom quiz?',
      questionUr: 'میں انگریزی اور اردو میں بائلنگول کوئز کیسے تیار کروں؟',
      answerEn: 'Go to "AI Tools" or the "Dashboard", and upload your reference textbook PDF or slide deck. Once processed, click "Generate Quiz". Under "Target Language", select "Bilingual" to generate questions containing clear English text paired with an Urdu helper translation.',
      answerUr: 'ڈیش بورڈ یا اے آئی ٹولز میں جائیں اور اپنی کتاب کی پی ڈی ایف (PDF) اپ لوڈ کریں۔ مواد پروسیس ہونے کے بعد "Generate Quiz" پر کلک کریں۔ ہدف زبان (Target Language) میں "Bilingual" کا انتخاب کریں، جس سے سوالات انگریزی اور اردو دونوں زبانوں میں تیار ہو جائیں گے۔'
    },
    {
      id: 4,
      category: 'student',
      questionEn: 'How can students join a teacher\'s classroom?',
      questionUr: 'طلباء کسی استاد کی کلاس روم میں کیسے شامل ہو سکتے ہیں؟',
      answerEn: 'Students can click the "Join Class" button on their dashboard and enter the unique 6-character Classroom Invite Code shared by their teacher. This immediately grants access to study materials, class calendars, and assigned quizzes.',
      answerUr: 'طلباء اپنے ڈیش بورڈ پر "Join Class" بٹن پر کلک کر کے اپنے استاد کی طرف سے شیئر کردہ 6 ہندسوں کا کلاس کوڈ درج کر سکتے ہیں۔ اس کے بعد وہ مطالعہ کے مواد اور کوئزز تک فوری رسائی حاصل کر سکتے ہیں۔'
    },
    {
      id: 5,
      category: 'ai',
      questionEn: 'Is my student data and gradebook secure?',
      questionUr: 'کیا میرا اور طلباء کا ڈیٹا اور گریڈ بک محفوظ ہے؟',
      answerEn: 'Absolutely. All student performance charts, diagnostic records, and material summaries are stored with secure, role-restricted database rules. Only the authenticated instructor has permission to view administrative gradebooks and class trends.',
      answerUr: 'جی بالکل۔ تمام طلباء کی کارکردگی کے چارٹس، گریڈ بک اور لیکچر نوٹس انتہائی محفوظ ڈیٹا بیس میں محفوظ کیے جاتے ہیں۔ گریڈ بک اور رپورٹس تک رسائی صرف مجاز اساتذہ کو ہی ہوتی ہے۔'
    },
    {
      id: 6,
      category: 'general',
      questionEn: 'How do I download processed lecture summaries?',
      questionUr: 'میں تیار شدہ لیکچر خلاصے کیسے ڈاؤن لوڈ کروں؟',
      answerEn: 'Navigate to "Resources", open any successfully processed material, and click on the "Download Study Key" button to export the AI summary as a formatted text file or print-friendly document.',
      answerUr: 'وسائل (Resources) کے سیکشن میں جائیں، کسی بھی فائل کو کھولیں اور اے آئی خلاصہ یا مطالعہ کی کیز (Study Keys) کو محفوظ کرنے کے لیے ڈاؤن لوڈ بٹن پر کلک کریں۔'
    }
  ];

  // Load support tickets
  const fetchTickets = async () => {
    try {
      setTicketsLoading(true);
      const res = await fetch('/api/support/tickets');
      if (res.ok) {
        const data = await res.json();
        setTickets;
        setTickets(data);
      }
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setTicketsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // Handle form submission
  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formEmail || !formSubject || !formMessage) return;

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          email: formEmail,
          category: formCategory,
          subject: formSubject,
          message: formMessage,
          role: currentRole
        })
      });

      if (res.ok) {
        setSubmitSuccess(true);
        setFormSubject('');
        setFormMessage('');
        // Reload ticket list
        await fetchTickets();
        // Clear success message after 5 seconds
        setTimeout(() => setSubmitSuccess(false), 5000);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to submit ticket');
      }
    } catch (error) {
      console.error('Error submitting ticket:', error);
      alert('Network error. Failed to submit ticket.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter FAQs based on query and tab
  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      faq.questionEn.toLowerCase().includes(query) ||
      faq.questionUr.toLowerCase().includes(query) ||
      faq.answerEn.toLowerCase().includes(query) ||
      faq.answerUr.toLowerCase().includes(query);
      
    return matchesCategory && matchesSearch;
  });

  const getStatusBadge = (status: Ticket['status']) => {
    switch (status) {
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {isRtl ? 'حل شدہ' : 'Resolved'}
          </span>
        );
      case 'in-progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            {isRtl ? 'جاری ہے' : 'In Progress'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            {isRtl ? 'نیا' : 'Open'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Title & Breadcrumbs */}
      <div className="flex flex-col gap-2">
        <h2 className="font-display-lg text-3xl font-bold flex items-center gap-3">
          <HelpCircle className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          <span>{getTranslation(locale, 'helpCenter')}</span>
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-2xl font-body-md">
          {isRtl 
            ? 'اکثر پوچھے گئے سوالات کے جوابات حاصل کریں، فیوچروورس کے استعمال کے بارے میں جانیں یا براہ راست سپورٹ سے رابطہ کریں۔' 
            : 'Find answers to frequently asked questions, learn how to use FuturoVerse AI, or get direct assistance.'}
        </p>
      </div>

      {/* Sub tabs: FAQs vs Support Tickets */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setCurrentSubTab('faqs')}
          className={`pb-3 text-sm font-bold select-none cursor-pointer transition-all relative ${
            currentSubTab === 'faqs' 
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          {isRtl ? 'اکثر پوچھے گئے سوالات' : 'Knowledge Base & FAQs'}
        </button>
        <button
          onClick={() => setCurrentSubTab('tickets')}
          className={`pb-3 text-sm font-bold select-none cursor-pointer transition-all relative ${
            currentSubTab === 'tickets' 
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          {isRtl ? 'سپورٹ ٹکٹس' : 'My Support Tickets'}
          {tickets.filter(t => t.status !== 'resolved').length > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-extrabold bg-blue-500 text-white rounded-full">
              {tickets.filter(t => t.status !== 'resolved').length}
            </span>
          )}
        </button>
      </div>

      {currentSubTab === 'faqs' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* FAQs List Area */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isRtl ? 'اکثر پوچھے گئے سوالات تلاش کریں...' : 'Search answers, boarding curricula, bilingual features...'}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all shadow-xs"
              />
            </div>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', labelEn: 'All Help', labelUr: 'تمام مدد' },
                { id: 'general', labelEn: 'General Info', labelUr: 'عمومی معلومات' },
                { id: 'teacher', labelEn: 'For Teachers', labelUr: 'اساتذہ کے لیے' },
                { id: 'student', labelEn: 'For Students', labelUr: 'طلباء کے لیے' },
                { id: 'ai', labelEn: 'AI & Curriculum', labelUr: 'اے آئی اور نصاب' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id as any)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all border select-none cursor-pointer ${
                    activeCategory === cat.id 
                      ? 'bg-blue-600 dark:bg-blue-500 text-white border-blue-600 dark:border-blue-500 shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {isRtl ? cat.labelUr : cat.labelEn}
                </button>
              ))}
            </div>

            {/* Accordion List */}
            <div className="space-y-4">
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((faq, index) => {
                  const isOpen = expandedFaq === index;
                  return (
                    <Card 
                      key={faq.id} 
                      className={`overflow-hidden border transition-all ${
                        isOpen 
                          ? 'border-blue-200 dark:border-blue-900/50 shadow-md ring-1 ring-blue-500/10' 
                          : 'hover:border-slate-300 dark:hover:border-slate-700/80'
                      }`}
                    >
                      <button
                        onClick={() => setExpandedFaq(isOpen ? null : index)}
                        className="w-full text-left flex justify-between items-start gap-4 p-5 select-none cursor-pointer"
                        dir={isRtl ? 'rtl' : 'ltr'}
                      >
                        <div className="space-y-1">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                            {faq.category}
                          </span>
                          <h4 className="font-headline-sm text-base font-bold text-slate-800 dark:text-slate-100 flex gap-2">
                            {isRtl ? faq.questionUr : faq.questionEn}
                          </h4>
                        </div>
                        <div className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </button>

                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: 'easeInOut' }}
                          >
                            <div 
                              className="px-5 pb-5 pt-1 border-t border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-sm leading-relaxed font-body-md"
                              dir={isRtl ? 'rtl' : 'ltr'}
                            >
                              <p className="font-semibold text-slate-800 dark:text-slate-200 mb-2">
                                {isRtl ? faq.answerUr : faq.answerEn}
                              </p>
                              {/* Display secondary translation below */}
                              <p className="text-xs text-slate-400 dark:text-slate-500 italic mt-3 pt-3 border-t border-slate-100/60 dark:border-slate-800/40">
                                {isRtl ? faq.answerEn : faq.answerUr}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  );
                })
              ) : (
                <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <Inbox className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold">
                    {isRtl ? 'کوئی متعلقہ سوال نہیں ملا۔' : 'No relevant articles found.'}
                  </p>
                  <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
                    {isRtl ? 'براہ کرم کوئی اور الفاظ استعمال کریں۔' : 'Try refining your search terms.'}
                  </p>
                </div>
              )}
            </div>

            {/* Technical Document External links */}
            <Card className="bg-[#e5eeff]/20 dark:bg-slate-900/40 border-dashed border-blue-200 dark:border-slate-800 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <h5 className="font-headline-sm text-sm font-bold text-blue-900 dark:text-blue-300">
                  {isRtl ? 'سلیبس اور امتحانی پیٹرن کی گائیڈ لائنز' : 'Syllabus & Exam Pattern Guidelines'}
                </h5>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
                  {isRtl 
                    ? 'اے آئی کوپائلٹ کے ساتھ امتحانی پرچے اور فلیش کارڈز تیار کرنے کے بہترین طریقوں کے دستاویزات دیکھیں' 
                    : 'View documentation on optimal prompt parameters for FBISE & Board Exams quiz-generations.'}
                </p>
              </div>
              <a 
                href="https://fbise.edu.pk" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              >
                <span>FBISE Official Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </Card>

          </div>

          {/* Sidebar Area: Contact Support Form */}
          <div className="space-y-6">
            <Card className="p-6 space-y-6 border border-slate-200 dark:border-slate-800">
              <div className="space-y-2">
                <h3 className="font-headline-md text-lg font-bold flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span>{isRtl ? 'ہم سے رابطہ کریں' : 'Direct Support Helpline'}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-body-md">
                  {isRtl 
                    ? 'پاکستانی سلیبس، اے آئی ٹیوٹر یا ٹوکن کی خرابی کے متعلق کوئی بھی مسئلہ یہاں سبمٹ کریں اور ہمارا ایڈمن سیشن 24 گھنٹوں کے اندر جواب فراہم کرے گا۔' 
                    : 'Submit issues concerning syllabus, AI Tutor, or registration. Our academic operations desk will respond within 24 hours.'}
                </p>
              </div>

              {submitSuccess && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl flex items-start gap-3"
                >
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-emerald-700 dark:text-emerald-400 space-y-0.5">
                    <p className="font-bold">{isRtl ? 'ٹکٹ کامیابی سے جمع ہو گیا!' : 'Support Ticket Submitted!'}</p>
                    <p>{isRtl ? 'آپ کو جلد ای میل موصول ہوگی۔' : 'We have saved your query and initialized support routing.'}</p>
                  </div>
                </motion.div>
              )}

              <form onSubmit={handleSubmitTicket} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{isRtl ? 'مکمل نام' : 'Your Full Name'}</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder={isRtl ? 'نام درج کریں...' : 'Dr. / Prof. / Student Name'}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3.5 text-xs focus:bg-white focus:border-blue-500 focus:outline-none transition-all text-slate-800 dark:text-slate-100 font-sans"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{isRtl ? 'ای میل ایڈریس' : 'Email Address'}</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder={isRtl ? 'email@domain.com' : 'e.g. user@institution.edu.pk'}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3.5 text-xs focus:bg-white focus:border-blue-500 focus:outline-none transition-all text-slate-800 dark:text-slate-100 font-sans"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <Folder className="w-3.5 h-3.5 text-slate-400" />
                    <span>{isRtl ? 'زمرہ (Category)' : 'Issue Category'}</span>
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs focus:bg-white focus:border-blue-500 focus:outline-none transition-all text-slate-800 dark:text-slate-100 font-sans"
                  >
                    <option value="General">General Inquiry</option>
                    <option value="Quiz Generation">Quiz Generation</option>
                    <option value="Classroom Management">Classroom Codes & Invites</option>
                    <option value="AI Tools">AI Tutor & Chats</option>
                    <option value="Bilingual UI">Urdu Bilingual UI</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <span>{isRtl ? 'موضوع' : 'Subject'}</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    placeholder={isRtl ? 'مسئلے کا عنوان...' : 'e.g., Cannot invite student via code'}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3.5 text-xs focus:bg-white focus:border-blue-500 focus:outline-none transition-all text-slate-800 dark:text-slate-100 font-sans"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <span>{isRtl ? 'تفصیل' : 'Detailed Message'}</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formMessage}
                    onChange={(e) => setFormMessage(e.target.value)}
                    placeholder={isRtl ? 'مسئلہ تفصیل سے بیان کریں...' : 'Provide complete details of what is not working as expected.'}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3.5 text-xs focus:bg-white focus:border-blue-500 focus:outline-none transition-all text-slate-800 dark:text-slate-100 font-sans resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full text-xs font-bold py-3 justify-center gap-2"
                  disabled={isSubmitting}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? (isRtl ? 'جمع ہو رہا ہے...' : 'Submitting...') : (isRtl ? 'ٹکٹ جمع کریں' : 'Send Ticket')}</span>
                </Button>
              </form>
            </Card>
          </div>

        </div>
      ) : (
        /* My Support Tickets List Area */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-headline-md text-xl font-bold flex items-center gap-2">
              <Inbox className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>{isRtl ? 'میرے سپورٹ ٹکٹس' : 'Active Queries & Communication Log'}</span>
            </h3>
            <Button
              variant="outlined"
              onClick={fetchTickets}
              className="text-xs font-bold py-1.5 px-3"
            >
              {isRtl ? 'فہرست تازہ کریں' : 'Refresh Log'}
            </Button>
          </div>

          {ticketsLoading ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400 text-xs font-bold">{isRtl ? 'ٹکٹس لوڈ ہو رہے ہیں...' : 'Syncing support channels...'}</p>
            </div>
          ) : tickets.length > 0 ? (
            <div className="space-y-4 max-w-4xl">
              {tickets.map((t) => (
                <Card 
                  key={t.id} 
                  className="border border-slate-200 dark:border-slate-800 p-6 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-mono text-[10px] font-extrabold text-slate-400">{t.id}</span>
                        {getStatusBadge(t.status)}
                        <span className="inline-flex items-center gap-1 text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-300 font-bold font-sans">
                          {t.category}
                        </span>
                      </div>
                      <h4 className="font-headline-sm text-base font-bold text-slate-800 dark:text-slate-100">
                        {t.subject}
                      </h4>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono sm:text-right">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(t.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl leading-relaxed font-body-md border border-slate-100/50 dark:border-slate-900/40">
                    <p className="font-bold text-slate-800 dark:text-slate-200 mb-1">
                      {t.name} ({t.email}) {isRtl ? 'نے لکھا:' : 'wrote:'}
                    </p>
                    <p className="whitespace-pre-line">{t.message}</p>
                  </div>

                  {/* Replies array */}
                  {t.replies && t.replies.length > 0 ? (
                    <div className="space-y-3 pl-4 md:pl-8 border-l-2 border-blue-100 dark:border-blue-950">
                      {t.replies.map((reply) => (
                        <div 
                          key={reply.id} 
                          className="bg-blue-50/40 dark:bg-slate-900/40 p-4 rounded-xl border border-blue-100/40 dark:border-slate-800 space-y-1"
                        >
                          <div className="flex justify-between items-center gap-2">
                            <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                              {isRtl ? 'سپورٹ ٹیم' : 'FuturoVerse Support Desk'}
                            </span>
                            <span className="font-mono text-[9px] text-slate-400">
                              {new Date(reply.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-body-md whitespace-pre-line">
                            {reply.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 italic flex items-center gap-1.5 font-sans">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{isRtl ? 'اس ٹکٹ پر فی الحال کوئی جواب نہیں ملا ہے۔' : 'Awaiting review from our academic operations desk.'}</span>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl">
              <Inbox className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-300 text-sm font-semibold">
                {isRtl ? 'آپ نے اب تک کوئی سپورٹ ٹکٹ جمع نہیں کروایا ہے۔' : 'No submitted support tickets found.'}
              </p>
              <p className="text-slate-400 dark:text-slate-500 text-xs mt-1.5 max-w-md mx-auto">
                {isRtl 
                  ? 'اگر آپ کو کوئی مسئلہ درپیش ہے تو اوپر بائیں جانب "Knowledge Base" سیکشن سے ہم سے رابطہ فارم استعمال کریں۔' 
                  : 'If you encounter any administrative issues with classroom codes, quizzes or translations, use the form on the Knowledge Base tab.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
