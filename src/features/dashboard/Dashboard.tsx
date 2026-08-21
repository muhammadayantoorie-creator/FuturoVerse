/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/src/store/useAppStore';
import { getTranslation } from '@/src/config/i18n';
import { 
  Users, 
  FileText, 
  Award, 
  TrendingUp, 
  Plus, 
  BookOpen, 
  Video, 
  Bell, 
  Trash2, 
  Calendar as CalendarIcon, 
  Search as SearchIcon, 
  Check, 
  Sparkles, 
  Clock, 
  FileCheck,
  ChevronRight,
  UserPlus,
  Swords,
  Mic,
  Eye,
  GitBranch,
  Zap,
  Flame,
  Target,
  CheckCircle2,
  Send,
  ArrowRight,
  Brain
} from 'lucide-react';
import { VoiceTutorModal } from '@/src/features/ai-tools/VoiceTutorModal';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Cell 
} from 'recharts';

// UI components from our reusable library
import { 
  Card, 
  Button, 
  Table, 
  Pagination, 
  Dialog, 
  Input, 
  Select, 
  Badge, 
  FileUpload, 
  Spinner,
  EmptyState
} from '@/src/components/ui';

// Mock data for charts
const progressTrendData = [
  { name: 'Week 1', avgScore: 68, progress: 20 },
  { name: 'Week 2', avgScore: 71, progress: 38 },
  { name: 'Week 3', avgScore: 70, progress: 52 },
  { name: 'Week 4', avgScore: 74, progress: 68 },
  { name: 'Week 5', avgScore: 76.5, progress: 85 },
];

export const Dashboard: React.FC = () => {
  const { 
    locale, 
    theme,
    stats, 
    uploadedMaterials, 
    todaysLessons, 
    notifications, 
    notificationCount,
    weakTopics,
    achievements,
    classes,
    fetchStats,
    fetchMaterials,
    uploadMaterial,
    fetchStudents,
    addStudent,
    fetchNotifications,
    clearNotification,
    markAllNotificationsRead,
    fetchLessons,
    scheduleLesson,
    generateQuiz,
    fetchWeakTopics,
    fetchClassrooms,
    currentRole,
    currentUser,
    setRole,
    setAiTutorOpen,
    addAiChatMessage,
    setActiveTab
  } = useAppStore();

  const isRtl = locale === 'ur';
  const tickColor = theme === 'dark' ? '#8ec3ba' : '#42756c';
  const gridColor = theme === 'dark' ? '#143d37' : '#e2e8f0';

  // State managers
  const [loadingStats, setLoadingStats] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  
  // Materials list state
  const [materialsData, setMaterialsData] = useState<any[]>([]);
  const [materialsSearch, setMaterialsSearch] = useState('');
  const [materialsCourse, setMaterialsCourse] = useState('All');
  const [materialsPage, setMaterialsPage] = useState(1);
  const [materialsTotalPages, setMaterialsTotalPages] = useState(1);
  const [loadingMaterials, setLoadingMaterials] = useState(false);

  // Students list state
  const [studentsData, setStudentsData] = useState<any[]>([]);
  const [studentsSearch, setStudentsSearch] = useState('');
  const [studentsCourse, setStudentsCourse] = useState('All');
  const [studentsPage, setStudentsPage] = useState(1);
  const [studentsTotalPages, setStudentsTotalPages] = useState(1);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Selected Material for Key Takeaways modal
  const [selectedMaterial, setSelectedMaterial] = useState<any | null>(null);
  const [isTakeawaysOpen, setIsTakeawaysOpen] = useState(false);

  // New Student modal
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [newStudentForm, setNewStudentForm] = useState({
    name: '',
    email: '',
    course: 'Physics 101',
    score: 80,
    progress: 70
  });

  // Schedule Lesson modal
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [newLessonForm, setNewLessonForm] = useState({
    title: '',
    subject: 'Physics 101',
    time: '10:00 AM',
    date: new Date().toISOString().split('T')[0],
    instructor: 'Dr. Ahmed',
    joinUrl: 'https://zoom.us/j/pk-class'
  });

  // Calendar selected day
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());
  const [calendarMonth] = useState<number>(new Date().getMonth());
  const [calendarYear] = useState<number>(new Date().getFullYear());

  // Quick Action AI Quiz Generator Modal
  const [isQuizGenOpen, setIsQuizGenOpen] = useState(false);
  const [quizConfig, setQuizConfig] = useState({
    difficulty: 'medium',
    questionCount: 5,
    language: 'bilingual',
    materialId: '',
    customTopic: ''
  });
  const [generatingQuizStatus, setGeneratingQuizStatus] = useState<string | null>(null); // 'idle' | 'generating' | 'done' | 'error'
  const [generatedQuiz, setGeneratedQuiz] = useState<any | null>(null);

  // Notification Alerts toast feedback
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Student Dashboard interactive states
  const [studentQuery, setStudentQuery] = useState('');
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({
    task1: true,
    task2: false,
    task3: true
  });

  // Initial loads
  useEffect(() => {
    setLoadingStats(true);
    Promise.all([
      fetchStats(),
      fetchNotifications(),
      fetchLessons(),
      fetchWeakTopics(),
      fetchClassrooms()
    ]).finally(() => setLoadingStats(false));
  }, []);

  // Synchronize default class/subject selection when classes list is loaded or updated
  useEffect(() => {
    if (classes && classes.length > 0) {
      const firstClassName = classes[0].name;
      setNewStudentForm(prev => {
        if (prev.course === 'Physics 101' && !classes.some(c => c.name === 'Physics 101')) {
          return { ...prev, course: firstClassName };
        }
        return prev;
      });
      setNewLessonForm(prev => {
        if (prev.subject === 'Physics 101' && !classes.some(c => c.name === 'Physics 101')) {
          return { ...prev, subject: firstClassName };
        }
        return prev;
      });
    }
  }, [classes]);

  // Fetch materials whenever filters/search/page changes
  useEffect(() => {
    setLoadingMaterials(true);
    fetchMaterials(materialsSearch, materialsCourse, materialsPage, 4)
      .then(payload => {
        setMaterialsData(payload.data || []);
        setMaterialsTotalPages(payload.pagination?.totalPages || 1);
      })
      .finally(() => setLoadingMaterials(false));
  }, [materialsSearch, materialsCourse, materialsPage]);

  // Fetch students whenever filters/search/page changes
  useEffect(() => {
    setLoadingStudents(true);
    fetchStudents(studentsSearch, studentsCourse, studentsPage, 5)
      .then(payload => {
        setStudentsData(payload.data || []);
        setStudentsTotalPages(payload.pagination?.totalPages || 1);
      })
      .finally(() => setLoadingStudents(false));
  }, [studentsSearch, studentsCourse, studentsPage]);

  // Handle Drag-and-drop file upload
  const handleFileUpload = (files: FileList) => {
    if (files && files.length > 0) {
      const file = files[0];
      const type = file.name.split('.').pop()?.toLowerCase();
      const validTypes = ['pdf', 'pptx', 'mp4'];
      const fileType = validTypes.includes(type || '') ? type : 'pdf';
      
      showToast(`Uploading and processing "${file.name}" with AI Summarizer...`, 'success');

      // We send a nice description of topic in the text body if they drop a file
      uploadMaterial({
        fileName: file.name,
        fileType: fileType as any,
        courseName: materialsCourse === 'All' ? 'Physics 101' : materialsCourse,
        fileContentText: `Lecture file containing full concepts on ${file.name.replace(/\.[^/.]+$/, "")}. This covers standard engineering/collegiate syllabus contents for Pakistan.`
      }).then(() => {
        setMaterialsPage(1);
        showToast('Lecture uploaded successfully! AI is analyzing key takeaways in the background.', 'success');
      });
    }
  };

  // Add Student submit
  const handleAddStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentForm.name || !newStudentForm.email) return;

    await addStudent(newStudentForm);
    setIsAddStudentOpen(false);
    setStudentsPage(1);
    setNewStudentForm({
      name: '',
      email: '',
      course: 'Physics 101',
      score: 80,
      progress: 70
    });
    // reload stats
    fetchStats();
    // reload list
    const payload = await fetchStudents(studentsSearch, studentsCourse, 1, 5);
    setStudentsData(payload.data);
    showToast('Student successfully enrolled!', 'success');
  };

  // Schedule Class submit
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLessonForm.title) return;

    await scheduleLesson(newLessonForm);
    setIsScheduleOpen(false);
    setNewLessonForm({
      title: '',
      subject: 'Physics 101',
      time: '10:00 AM',
      date: new Date().toISOString().split('T')[0],
      instructor: 'Dr. Ahmed',
      joinUrl: 'https://zoom.us/j/pk-class'
    });
    showToast('Class session scheduled in calendar!', 'success');
  };

  // Generate Quiz submit
  const handleGenerateQuizSubmit = async () => {
    setGeneratingQuizStatus('generating');
    setGeneratedQuiz(null);
    try {
      const quiz = await generateQuiz(quizConfig);
      setGeneratedQuiz(quiz);
      setGeneratingQuizStatus('done');
      showToast('AI Bilingual Quiz successfully generated!', 'success');
    } catch (err: any) {
      console.error(err);
      setGeneratingQuizStatus('error');
      showToast(err.message || 'AI generation failed. Please configure GEMINI_API_KEY.', 'error');
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setFeedbackToast({ message, type });
    setTimeout(() => setFeedbackToast(null), 5000);
  };

  // Helper to determine the week-days of the month for our interactive calendar
  const getDaysInMonth = () => {
    const days = [];
    const date = new Date(calendarYear, calendarMonth, 1);
    const startDay = date.getDay(); // 0 is Sunday
    const totalDays = new Date(calendarYear, calendarMonth + 1, 0).getDate();

    // Padding empty cells
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= totalDays; i++) {
      days.push(i);
    }
    return days;
  };

  // Check if a calendar day has scheduled lessons
  const dayHasLesson = (dayNum: number) => {
    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    return todaysLessons.some((l: any) => l.date === dateStr);
  };

  // Filter lessons based on selected day
  const getSelectedDayLessons = () => {
    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    return todaysLessons.filter((l: any) => l.date === dateStr);
  };

  const askAiAboutTopic = (topic: string) => {
    addAiChatMessage('user', `Can you explain the key concepts of "${topic}" and provide some basic practice questions?`);
    addAiChatMessage('bot', `Hello ${currentUser.name || 'Student'}! Let's review **${topic}**. I am preparing a tailored explanation with formulas and concept definitions. What specific part would you like to focus on first?`);
    setAiTutorOpen(true);
  };

  const renderStudentDashboard = () => {
    return (
      <div className="space-y-8 select-none animate-fade-in">
        {/* Student greeting banner with Quick AI Search */}
        <div className="text-white p-8 rounded-3xl relative overflow-hidden shadow-xl" style={{ background: 'linear-gradient(135deg, #115e59 0%, #0d9488 100%)' }}>
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute left-1/3 bottom-0 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10">
            <span className="text-teal-100 text-xs font-bold uppercase tracking-widest font-mono">
              {getTranslation(locale, 'roleStudent')} Workspace
            </span>
            <h2 className="text-3xl md:text-4xl font-bold font-sans tracking-tight mt-2">
              {getTranslation(locale, 'assalamAlaikum')}, {currentUser.name}! 👋
            </h2>
            <p className="text-teal-50/90 text-sm mt-2 max-w-xl">
              {getTranslation(locale, 'learningOverviewSub')} Keep pushing yourself to build cognitive rigor and achieve academic excellence.
            </p>

            {/* Quick AI Question Bar */}
            <form 
              onSubmit={(e) => { 
                e.preventDefault(); 
                if (!studentQuery.trim()) return; 
                askAiAboutTopic(studentQuery); 
                setStudentQuery(''); 
              }} 
              className="mt-6 flex flex-col sm:flex-row gap-2.5 max-w-2xl"
            >
              <div className="relative flex-1">
                <SearchIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-200/80" />
                <input
                  type="text"
                  placeholder="Ask AI Tutor any concept, equation, past board question or theorem..."
                  value={studentQuery}
                  onChange={(e) => setStudentQuery(e.target.value)}
                  className="w-full bg-white/20 hover:bg-white/25 focus:bg-white/30 border border-white/25 focus:border-white rounded-2xl py-3 pl-10 pr-4 text-xs text-white placeholder-emerald-100/80 focus:outline-none transition-all shadow-inner"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-3 bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-black rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md shrink-0 cursor-pointer hover:scale-[1.02] active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>Ask AI Tutor</span>
              </button>
            </form>
          </div>
        </div>

        {/* 🌟 Next-Gen AI Feature Suite Showcase */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border border-emerald-500/30 rounded-3xl space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                🌟 Next-Gen AI Innovation Suite
              </span>
              <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-mono rounded-full font-bold">
                Live Demos
              </span>
            </div>
            <span className="text-[10px] text-slate-400 hidden sm:inline">1-Click Launchers</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Voice Tutor */}
            <button
              onClick={() => setIsVoiceModalOpen(true)}
              className="p-3.5 bg-slate-800/80 hover:bg-emerald-950/70 border border-slate-700/80 hover:border-emerald-500/50 rounded-2xl text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Mic className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">AI Voice Tutor</span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-1">Speech audio tutor with waveform</p>
            </button>

            {/* 2. Vision Solver */}
            <button
              onClick={() => setActiveTab('ai-tools')}
              className="p-3.5 bg-slate-800/80 hover:bg-emerald-950/70 border border-slate-700/80 hover:border-emerald-500/50 rounded-2xl text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-7 h-7 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Eye className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">Vision Solver</span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-1">Handwritten math & diagrams</p>
            </button>

            {/* 3. Battle Arena */}
            <button
              onClick={() => setActiveTab('quizzes')}
              className="p-3.5 bg-slate-800/80 hover:bg-emerald-950/70 border border-slate-700/80 hover:border-emerald-500/50 rounded-2xl text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Swords className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">AI Battle Arena</span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-1">1v1 speed duel quiz engine</p>
            </button>

            {/* 4. Mind Map */}
            <button
              onClick={() => setActiveTab('ai-tools')}
              className="p-3.5 bg-slate-800/80 hover:bg-emerald-950/70 border border-slate-700/80 hover:border-emerald-500/50 rounded-2xl text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-7 h-7 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <GitBranch className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">Mind Map Tree</span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-1">Concept graphs & topologies</p>
            </button>
          </div>
        </div>

        {/* Bento stats indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Semester Progress Card */}
          <Card hoverable className="p-5 border-l-4 border-blue-500 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {getTranslation(locale, 'semesterProgress')}
                </p>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1.5 font-sans">
                  {currentUser.semesterProgress || 75}%
                </h3>
              </div>
              <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-500 shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            {/* Custom progress bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-4 overflow-hidden">
              <div className="bg-blue-500 h-full rounded-full transition-all" style={{ width: `${currentUser.semesterProgress || 75}%` }}></div>
            </div>
          </Card>

          {/* Today's Lessons Card */}
          <Card hoverable className="p-5 border-l-4 border-violet-500 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {getTranslation(locale, 'todaysLessons')}
                </p>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1.5 font-sans">
                  {todaysLessons.length} Scheduled
                </h3>
              </div>
              <div className="w-11 h-11 rounded-xl bg-violet-50 dark:bg-violet-950/50 flex items-center justify-center text-violet-500 shrink-0">
                <Video className="w-5 h-5" />
              </div>
            </div>
            <div className="text-[10px] text-violet-500 font-bold mt-4 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Interactive classrooms active</span>
            </div>
          </Card>

          {/* Achievements Card */}
          <Card hoverable className="p-5 border-l-4 border-amber-500 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {getTranslation(locale, 'achievements')}
                </p>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1.5 font-sans">
                  {achievements.length} Badges
                </h3>
              </div>
              <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-500 shrink-0">
                <Award className="w-5 h-5" />
              </div>
            </div>
            <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold mt-4 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Click to view credentials below</span>
            </div>
          </Card>

          {/* Materials Uploaded Card */}
          <Card hoverable className="p-5 border-l-4 border-emerald-500 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Study Resources
                </p>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1.5 font-sans">
                  {uploadedMaterials.length} Documents
                </h3>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-500 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-4 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Summaries & key insights ready</span>
            </div>
          </Card>
        </div>

        {/* 🚀 Interactive Student Productivity & Daily Smart AI Widget */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Daily Streak & Study Focus Goals */}
          <div className="lg:col-span-6">
            <Card className="p-6 h-full bg-gradient-to-br from-amber-500/5 via-white to-white dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900 border border-amber-200/60 dark:border-amber-900/40">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-500">
                    <Flame className="w-5 h-5 animate-bounce" />
                  </div>
                  <div>
                    <h4 className="font-sans font-bold text-sm text-slate-800 dark:text-slate-100">
                      5-Day Study Streak
                    </h4>
                    <p className="text-[10px] text-slate-400 font-sans">Complete daily learning goals to maintain streak</p>
                  </div>
                </div>
                <Badge variant="warning" styleType="tonal" className="font-black text-xs px-2.5 py-1">
                  🔥 Active Streak
                </Badge>
              </div>

              <div className="space-y-2.5">
                {[
                  { id: 'task1', text: 'Review Week 4 Quantum Mechanics PDF takeaways', icon: BookOpen },
                  { id: 'task2', text: 'Complete 1 Speed Duel Quiz in Battle Arena', icon: Swords },
                  { id: 'task3', text: '25-min Focused study session on Calculus Limits', icon: Target },
                ].map((item) => {
                  const isDone = completedTasks[item.id];
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setCompletedTasks(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                      className={`w-full p-3 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                        isDone 
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 text-slate-700 dark:text-slate-200' 
                          : 'bg-slate-50/40 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-amber-300 dark:hover:border-amber-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <Icon className={`w-4 h-4 shrink-0 ${isDone ? 'text-emerald-500' : 'text-slate-400'}`} />
                        <span className={`text-xs font-semibold truncate ${isDone ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                          {item.text}
                        </span>
                      </div>
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${
                        isDone 
                          ? 'bg-emerald-500 border-emerald-500 text-white' 
                          : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
                      }`}>
                        {isDone && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-[11px] font-semibold text-slate-500">
                  {Object.values(completedTasks).filter(Boolean).length} of 3 Daily Goals Finished
                </span>
                <button 
                  onClick={() => setActiveTab('quizzes')} 
                  className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Launch Practice</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </Card>
          </div>

          {/* AI Smart Daily Concept Recommendation */}
          <div className="lg:col-span-6">
            <Card className="p-6 h-full bg-gradient-to-br from-indigo-500/5 via-white to-white dark:from-indigo-950/20 dark:via-slate-900 dark:to-slate-900 border border-indigo-200/60 dark:border-indigo-900/40 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-500">
                      <Brain className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-sans font-bold text-sm text-slate-800 dark:text-slate-100">
                        AI Recommended Focus
                      </h4>
                      <p className="text-[10px] text-slate-400 font-sans">Adaptive learning insight generated for you</p>
                    </div>
                  </div>
                  <Badge variant="primary" styleType="tonal" className="text-xs px-2.5 py-1">
                    Targeted Review
                  </Badge>
                </div>

                <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider font-mono">
                      Physics 101: Mechanics
                    </span>
                    <span className="text-[10px] font-extrabold text-rose-500 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded">
                      Score: 38%
                    </span>
                  </div>
                  <h5 className="font-sans font-bold text-xs text-slate-900 dark:text-slate-100">
                    Wave-Particle Duality & de Broglie Wavelength (λ = h/p)
                  </h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Mastering de Broglie formulas and 1D potential well nodes is essential before midterms. Reviewing the 4-point takeaway now will boost your mastery.
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <Button 
                  variant="outlined" 
                  size="sm" 
                  onClick={() => askAiAboutTopic('Wave-Particle Duality and de Broglie wavelength')}
                  className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/40"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Explain Topic</span>
                </Button>
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={() => setActiveTab('ai-tools')}
                  className="text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <span>Solve Drills in AI Studio</span>
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Double Column content: Left - Weak Topics, Right - Today's lessons or profile */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Weak Topic Analysis */}
          <div className="lg:col-span-7">
            <Card className="p-6 h-full bg-white dark:bg-slate-900">
              <div className="border-b border-slate-100 dark:border-slate-800/60 pb-4 mb-5">
                <div className="flex items-center gap-2">
                  <span className="p-1 bg-rose-50 dark:bg-rose-950/40 rounded-lg text-rose-500">
                    <TrendingUp className="w-4 h-4" />
                  </span>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                    {getTranslation(locale, 'weakTopicAnalysis')}
                  </h4>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  {getTranslation(locale, 'weakTopicSub')}
                </p>
              </div>

              <div className="space-y-4">
                {weakTopics.map((item: any, idx: number) => {
                  const isCritical = item.score < 50;
                  const isWarning = item.score >= 50 && item.score < 70;
                  
                  let barColor = 'bg-emerald-500';
                  let textColor = 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400';
                  let statusLabel = 'Proficient';

                  if (isCritical) {
                    barColor = 'bg-rose-500';
                    textColor = 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400';
                    statusLabel = 'Attention Required';
                  } else if (isWarning) {
                    barColor = 'bg-amber-500';
                    textColor = 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400';
                    statusLabel = 'Nearing Proficiency';
                  }

                  return (
                    <div key={idx} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-950/20 hover:border-indigo-100 dark:hover:border-indigo-900/60 transition duration-200">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-2.5">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                          {item.topic}
                        </span>
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${textColor}`}>
                            {statusLabel}
                          </span>
                          <span className="text-xs font-bold text-slate-500">
                            {item.score}% Mastery
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex-grow bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${item.score}%` }}></div>
                        </div>
                        <Button 
                          variant="outlined" 
                          size="sm" 
                          className="py-1 px-3 text-[10px] font-bold shrink-0 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/30"
                          onClick={() => askAiAboutTopic(item.topic)}
                        >
                          Ask AI Tutor
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Right Column: Profile & quick actions */}
          <div className="lg:col-span-5 space-y-6">
            {/* Student Profile Info Card */}
            <Card className="p-6 bg-white dark:bg-slate-900">
              <div className="flex flex-col items-center text-center py-4">
                <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-indigo-100 dark:border-slate-800 shadow-md">
                  <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                </div>
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 mt-3">
                  {currentUser.name}
                </h4>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  {currentUser.email}
                </p>
                <div className="mt-2.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                  University of Lahore Campus
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800/60 mt-4 pt-4 space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Class Year:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">First Year / Semester 1</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Role:</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400 font-sans">Active Student</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Learning Speed:</span>
                  <span className="font-semibold text-emerald-500 font-sans">Self-Paced / Guided</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Scheduled lessons section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-bold text-base text-slate-800 dark:text-slate-100">
                {getTranslation(locale, 'todaysLessons')}
              </h4>
              <p className="text-xs text-slate-400">Live online interactive classrooms scheduled by your instructors</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {todaysLessons.map((lesson: any) => (
              <Card key={lesson.id} className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 hover:shadow-md transition flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100/30 dark:border-indigo-900/50 uppercase tracking-wider font-mono">
                      {lesson.subject}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold">
                      <Clock className="w-3.5 h-3.5 text-slate-300" />
                      {lesson.time}
                    </span>
                  </div>

                  <h5 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {lesson.title}
                  </h5>
                  <p className="text-xs text-slate-400 mt-1">
                    Instructor: {lesson.instructor || 'Class Professor'}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-50 dark:border-slate-800/60 flex justify-end">
                  <a
                    href={lesson.joinUrl || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition animate-pulse-slow"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Join Live Lecture</span>
                  </a>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Study Materials Review Grid */}
        <div className="space-y-4">
          <div>
            <h4 className="font-bold text-base text-slate-800 dark:text-slate-100">
              Reference Lecture Materials
            </h4>
            <p className="text-xs text-slate-400">Review summaries, keys, and core take-aways produced by FuturoVerse AI</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {uploadedMaterials.map((material: any) => (
              <Card 
                key={material.id} 
                className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 hover:border-indigo-200 dark:hover:border-indigo-900/60 hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40 rounded">
                      PROCESSED BY AI
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {material.fileType.toUpperCase()}
                    </span>
                  </div>

                  <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate" title={material.fileName}>
                    {material.fileName}
                  </h5>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                    Course: {material.courseName}
                  </p>
                </div>

                <div className="border-t border-slate-50 dark:border-slate-800/60 mt-4 pt-3 flex justify-between items-center">
                  <span className="text-[10px] text-slate-400">
                    {new Date(material.uploadedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                  <Button 
                    variant="outlined" 
                    size="sm" 
                    className="py-1.5 px-3 text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/30"
                    onClick={() => {
                      setSelectedMaterial(material);
                      setIsTakeawaysOpen(true);
                    }}
                  >
                    Review Takeaways
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Unlocked badges list */}
        <div className="space-y-4">
          <div>
            <h4 className="font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <Award className="w-5 h-5 text-amber-500" />
              My Academic Achievement Badges
            </h4>
            <p className="text-xs text-slate-400 font-sans">Celebrate your learning milestones and academic accomplishments</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {achievements.map((badge: any) => (
              <div key={badge.id} className="p-4 rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/20 dark:bg-amber-950/10 flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950 border border-amber-100 dark:border-amber-900/50 text-amber-500 shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    {badge.title}
                  </h5>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-normal">
                    {badge.description}
                  </p>
                  <div className="text-[9px] text-amber-600 dark:text-amber-400 font-bold font-mono mt-1.5">
                    UNLOCKED: {new Date(badge.unlockedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TAKEAWAYS DIALOG (Reused so it functions perfectly) */}
        <Dialog 
          isOpen={isTakeawaysOpen} 
          onClose={() => setIsTakeawaysOpen(false)}
          title="AI Summarizer Output"
          size="lg"
        >
          {selectedMaterial && (
            <div className="space-y-5">
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-500 tracking-wider">Lecture Resource Summary</span>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1">{selectedMaterial.fileName}</h4>
              </div>

              {selectedMaterial.aiInsight && (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30">
                  <div className="flex gap-2 items-start">
                    <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
                    <div>
                      <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300">Strategic AI Warning / Insight:</span>
                      <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5 leading-relaxed">{selectedMaterial.aiInsight}</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Key Takeaways Summary:</span>
                <ul className="list-disc pl-5 space-y-2 mt-2">
                  {selectedMaterial.keyTakeaways && selectedMaterial.keyTakeaways.length > 0 ? (
                    selectedMaterial.keyTakeaways.map((point: string, idx: number) => (
                      <li key={idx} className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{point}</li>
                    ))
                  ) : (
                    <li className="text-xs text-slate-400 italic">No bullet summary points extracted yet. AI might be processing in the background.</li>
                  )}
                </ul>
              </div>

              <div className="flex justify-end pt-4">
                <Button variant="secondary" onClick={() => setIsTakeawaysOpen(false)}>Close Summary</Button>
              </div>
            </div>
          )}
        </Dialog>
      </div>
    );
  };

  const renderGuestDashboard = () => {
    return (
      <div className="space-y-12 select-none py-4 animate-fade-in">
        {/* Hero Area */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 uppercase tracking-widest font-mono">
            {getTranslation(locale, 'trustedBy')}
          </span>
          <h2 className="text-4xl md:text-5xl font-black font-sans tracking-tight text-slate-900 dark:text-white leading-tight">
            {getTranslation(locale, 'empoweringNextGen')}
          </h2>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            {getTranslation(locale, 'empoweringSub')}
          </p>
        </div>

        {/* Interactive Switch View cards */}
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              {getTranslation(locale, 'switchRole')}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Select an active context perspective below to experience FuturoVerse AI</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Teacher Card */}
            <div 
              onClick={() => setRole('teacher')}
              className="p-6 rounded-3xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 hover:border-indigo-200 dark:hover:border-indigo-900/80 transition shadow-sm hover:shadow-lg hover:-translate-y-1 duration-300 group cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100/50 dark:border-indigo-900/30 font-bold shrink-0">
                  <Plus className="w-5 h-5 group-hover:scale-110 transition duration-300" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">
                    {getTranslation(locale, 'roleTeacher')} Dashboard
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1.5">
                    Manage classes, syllabus documents, and trigger Gemini AI to auto-generate quizzes, comprehensive bulleted summaries, and analytical assignments.
                  </p>
                </div>
              </div>
              <div className="mt-8 border-t border-slate-50 dark:border-slate-800/60 pt-4 flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  Enter Teacher View <ChevronRight className="w-4 h-4" />
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Syllabus Upload & Quizzes</span>
              </div>
            </div>

            {/* Student Card */}
            <div 
              onClick={() => setRole('student')}
              className="p-6 rounded-3xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 hover:border-emerald-200 dark:hover:border-emerald-900/80 transition shadow-sm hover:shadow-lg hover:-translate-y-1 duration-300 group cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100/50 dark:border-emerald-900/30 font-bold shrink-0">
                  <Award className="w-5 h-5 group-hover:scale-110 transition duration-300" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">
                    {getTranslation(locale, 'roleStudent')} Dashboard
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1.5">
                    Review assigned lecture takeaways, join online video lessons, monitor academic achievements, and ask the adaptive AI tutor to assist in weak syllabus areas.
                  </p>
                </div>
              </div>
              <div className="mt-8 border-t border-slate-50 dark:border-slate-800/60 pt-4 flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  Enter Student View <ChevronRight className="w-4 h-4" />
                </span>
                <span className="text-[10px] text-slate-400 font-mono">AI Tutor & Study Guides</span>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Features Grid */}
        <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="text-center">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              {getTranslation(locale, 'intelligentTools')}
            </h3>
            <p className="text-xs text-slate-400 mt-1">{getTranslation(locale, 'intelligentToolsSub')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl border border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/40">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                {getTranslation(locale, 'instantAiSummaries')}
              </h4>
              <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                {getTranslation(locale, 'instantAiSummariesSub')}
              </p>
            </div>
            
            <div className="p-5 rounded-2xl border border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/40">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-violet-500" />
                {getTranslation(locale, 'quizGeneration')}
              </h4>
              <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                {getTranslation(locale, 'quizGenerationSub')}
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/40">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-500" />
                {getTranslation(locale, 'interactiveAiTutor')}
              </h4>
              <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                {getTranslation(locale, 'interactiveAiTutorSub')}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (currentRole === 'student') {
    return renderStudentDashboard();
  }

  if (currentRole === 'guest') {
    return renderGuestDashboard();
  }

  return (
    <div className="space-y-8 select-none">
      
      {/* Toast feedback alerts */}
      {feedbackToast && (
        <div className={`fixed top-6 right-6 z-50 p-4 rounded-2xl border flex items-center gap-3 shadow-lg max-w-sm transition-all duration-300 animate-slide-in ${
          feedbackToast.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-100'
            : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-100'
        }`}>
          {feedbackToast.type === 'success' ? <Check className="w-5 h-5 shrink-0 text-emerald-500" /> : <TrendingUp className="w-5 h-5 shrink-0 text-rose-500" />}
          <span className="text-xs font-semibold">{feedbackToast.message}</span>
        </div>
      )}

      {/* Greeting Banner */}
      <div 
        className="text-white p-8 rounded-3xl relative overflow-hidden shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6" 
        style={{ 
          background: currentRole === 'admin' 
            ? 'linear-gradient(135deg, #3b0764 0%, #4c1d95 50%, #1e1b4b 100%)' 
            : 'linear-gradient(135deg, #115e59 0%, #0d9488 100%)' 
        }}
      >
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute left-1/3 bottom-0 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 space-y-1.5">
          <span className="text-teal-100 text-xs font-bold uppercase tracking-widest font-mono">
            {currentRole === 'admin' ? '🛡️ Campus Executive Administration' : `${getTranslation(locale, 'roleTeacher') || 'Professor'} Workspace`}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold font-sans tracking-tight">
            {currentRole === 'admin' ? `Welcome, ${currentUser.name || 'Administrator'}!` : `Welcome back, ${currentUser.name || 'Professor'}! 👋`}
          </h2>
          <p className="text-teal-50/90 text-sm max-w-xl">
            {currentRole === 'admin' 
              ? 'Complete institutional authority: Full access across all departments, teacher classrooms, analytics, and grade audit logs.' 
              : `${getTranslation(locale, 'classesOverviewSub')} Designed for the Pakistani educational landscape.`}
          </p>
        </div>
        
        <div className="relative z-10 flex flex-wrap items-center gap-3 shrink-0">
          {currentRole === 'admin' ? (
            <>
              <Button 
                variant="outlined" 
                size="sm"
                onClick={() => setActiveTab('analytics')}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white hover:text-white border-transparent shadow-md"
              >
                <TrendingUp className="w-4 h-4 text-white" />
                <span>Campus Analytics</span>
              </Button>
              <Button 
                variant="primary" 
                size="sm"
                onClick={() => setActiveTab('settings')}
                className="flex items-center gap-2 shadow-md bg-white text-purple-950 hover:bg-purple-50 font-bold"
              >
                <span>System Settings</span>
              </Button>
            </>
          ) : (
            <Button 
              variant="outlined" 
              size="sm"
              onClick={() => {
                if (classes && classes.length > 0) {
                  setNewLessonForm(prev => ({ ...prev, subject: classes[0].name }));
                }
                setIsScheduleOpen(true);
              }}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white hover:text-white border-transparent shadow-md dark:bg-emerald-700 dark:hover:bg-emerald-800"
            >
              <CalendarIcon className="w-4 h-4 text-white" />
              <span className="text-white">Schedule Session</span>
            </Button>
          )}

          <Button 
            variant="outlined" 
            size="sm"
            onClick={() => {
              if (classes && classes.length > 0) {
                setNewStudentForm(prev => ({ ...prev, course: classes[0].name }));
              }
              setIsAddStudentOpen(true);
            }}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white hover:text-white border-transparent shadow-md dark:bg-emerald-700 dark:hover:bg-emerald-800"
          >
            <UserPlus className="w-4 h-4 text-white" />
            <span className="text-white">Enroll Student</span>
          </Button>
        </div>
      </div>

      {/* 1. Statistics Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Dynamic Card 1 */}
        <Card hoverable className="p-5 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {getTranslation(locale, 'activeStudents')}
              </p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1.5 font-sans">
                {loadingStats ? <Spinner size="xs" /> : (stats.activeStudents || 0)}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-500 shrink-0">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold mt-3">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+12% vs last semester</span>
          </div>
        </Card>

        {/* Dynamic Card 2 */}
        <Card hoverable className="p-5 border-l-4 border-violet-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {getTranslation(locale, 'quizzesGenerated')}
              </p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1.5 font-sans">
                {loadingStats ? <Spinner size="xs" /> : (stats.quizzesGenerated || 0)}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-950/50 flex items-center justify-center text-violet-500 shrink-0">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-violet-500 font-bold mt-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Fully compiled with Gemini AI</span>
          </div>
        </Card>

        {/* Dynamic Card 3 */}
        <Card hoverable className="p-5 border-l-4 border-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {getTranslation(locale, 'avgClassScore')}
              </p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1.5 font-sans">
                {loadingStats ? <Spinner size="xs" /> : `${(stats.avgClassScore || 0)}%`}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-500 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold mt-3">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+2.4% this week</span>
          </div>
        </Card>

        {/* Dynamic Card 4 */}
        <Card hoverable className="p-5 border-l-4 border-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Uploaded Materials
              </p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1.5 font-sans">
                {loadingStats ? <Spinner size="xs" /> : (stats.totalMaterials || 0)}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-500 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold mt-3">
            <Clock className="w-3.5 h-3.5" />
            <span>All vectorized on cloud</span>
          </div>
        </Card>
      </div>

      {/* 2. Charts Section (Double Column Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class Progress Trend AreaChart */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                {getTranslation(locale, 'studentProgressTrend')}
              </h4>
              <p className="text-[10px] text-slate-400">Class averages and lesson completions over semester weeks</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={progressTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: tickColor }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: tickColor }} axisLine={false} tickLine={false} />
                <ChartTooltip />
                <Area type="monotone" dataKey="avgScore" name="Avg Score (%)" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorAvg)" />
                <Area type="monotone" dataKey="progress" name="Syllabus Progress (%)" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorProgress)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Weak Topic Analysis BarChart */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                {getTranslation(locale, 'weakTopicAnalysis')}
              </h4>
              <p className="text-[10px] text-slate-400">{getTranslation(locale, 'weakTopicSub')}</p>
            </div>
          </div>
          <div className="h-64">
            {weakTopics.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <Spinner size="sm" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weakTopics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                  <XAxis dataKey="topic" tick={{ fontSize: 9, fill: tickColor }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: tickColor }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <ChartTooltip />
                  <Bar dataKey="score" name="Average Score (%)">
                    {weakTopics.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.score < 50 ? '#f43f5e' : entry.score < 75 ? '#f59e0b' : '#3b82f6'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* 3. Quick Actions and Real-Time Notifications Bento Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions List */}
        <Card className="p-6 lg:col-span-1 flex flex-col gap-4">
          <div>
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
              {getTranslation(locale, 'aiQuickActions')}
            </h4>
            <p className="text-[10px] text-slate-400">{getTranslation(locale, 'aiQuickActionsSub')}</p>
          </div>

          <div className="flex flex-col gap-3">
            {/* Action 1 */}
            <button 
              onClick={() => {
                setActiveTab('quizzes');
              }}
              className="group flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-blue-400 dark:hover:border-blue-500/50 hover:bg-blue-50/10 transition-all text-left select-none cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-500">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    {getTranslation(locale, 'generateWeeklyQuiz')}
                  </span>
                  <p className="text-[9px] text-slate-400">Instantly generate bilingual test</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Action 2 */}
            <button 
              onClick={() => {
                if (uploadedMaterials.length > 0) {
                  setSelectedMaterial(uploadedMaterials[0]);
                  setIsTakeawaysOpen(true);
                } else {
                  showToast('Please upload some lecture materials first.', 'error');
                }
              }}
              className="group flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-violet-400 dark:hover:border-violet-500/50 hover:bg-violet-50/10 transition-all text-left select-none cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-950 flex items-center justify-center text-violet-500">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    {getTranslation(locale, 'summarizeLatestPDF')}
                  </span>
                  <p className="text-[9px] text-slate-400">Extract takeaways from processed files</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Action 3 */}
            <button 
              onClick={() => showToast('Homework generation feature configured. Select custom syllabus topics inside Quick Quiz Portal!', 'success')}
              className="group flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-emerald-400 dark:hover:border-emerald-500/50 hover:bg-emerald-50/10 transition-all text-left select-none cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-500">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    {getTranslation(locale, 'createHomework')}
                  </span>
                  <p className="text-[9px] text-slate-400">Compile offline assignments</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </Card>

        {/* Live Notification Drawer Section */}
        <Card className="p-6 lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-500" />
                <span>Live Instructor Alerts Feed</span>
                {notificationCount > 0 && (
                  <Badge variant="danger" className="ml-2">
                    {notificationCount} New
                  </Badge>
                )}
              </h4>
              <p className="text-[10px] text-slate-400">Activity and status notifications generated by backend operations</p>
            </div>
            
            {notifications.length > 0 && (
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={markAllNotificationsRead}
                className="py-1 px-3 text-xs"
              >
                Mark all read
              </Button>
            )}
          </div>

          <div className="flex flex-col gap-2.5 max-h-[175px] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="h-full py-10 flex flex-col items-center justify-center text-slate-400">
                <Bell className="w-8 h-8 text-slate-200 dark:text-slate-800 mb-2" />
                <span className="text-xs font-semibold">No notifications yet</span>
              </div>
            ) : (
              notifications.map((not: any) => (
                <div 
                  key={not.id}
                  className={`flex items-start justify-between p-3 border rounded-xl transition-all ${
                    not.read 
                      ? 'bg-slate-50/50 dark:bg-slate-950/20 border-slate-100 dark:border-slate-900/50' 
                      : 'bg-blue-50/10 dark:bg-blue-950/10 border-blue-100 dark:border-blue-900/30'
                  }`}
                >
                  <div className="flex gap-3">
                    <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${not.read ? 'bg-slate-300 dark:bg-slate-700' : 'bg-blue-500'}`} />
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{not.title}</span>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{not.message}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => clearNotification(not.id)}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-red-500 shrink-0 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* 4. Interactive Class Calendar and Scheduler */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          
          {/* Left Column: Calendar Sheet */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  Interactive Class Calendar
                </h4>
                <p className="text-[10px] text-slate-400">Click a day to view daily scheduled events</p>
              </div>
              <div className="text-xs font-bold text-blue-600 dark:text-blue-400">
                {new Date(calendarYear, calendarMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}
              </div>
            </div>

            {/* Grid Headings */}
            <div className="grid grid-cols-7 text-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase mb-2">
              <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
            </div>

            {/* Calendar Grid Days */}
            <div className="grid grid-cols-7 gap-1.5">
              {getDaysInMonth().map((day, idx) => {
                if (day === null) return <div key={`empty-${idx}`} />;
                const isSelected = selectedDay === day;
                const isToday = new Date().getDate() === day;
                const hasLesson = dayHasLesson(day);
                
                return (
                  <button
                    key={`day-${day}`}
                    onClick={() => setSelectedDay(day)}
                    className={`h-11 rounded-xl flex flex-col items-center justify-center relative cursor-pointer font-sans transition-all border ${
                      isSelected 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs font-bold' 
                        : isToday
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900 font-bold'
                        : 'bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <span className="text-xs">{day}</span>
                    {hasLesson && (
                      <span className={`w-1.5 h-1.5 rounded-full absolute bottom-1 ${isSelected ? 'bg-white' : 'bg-blue-500'}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Day Schedule details */}
          <div className="w-full md:w-[320px] shrink-0 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 pt-6 md:pt-0 md:pl-6 flex flex-col gap-4">
            <div>
              <h5 className="font-bold text-xs text-slate-800 dark:text-slate-200">
                Schedules for July {selectedDay}
              </h5>
              <p className="text-[9px] text-slate-400">Class link invites and Zoom links</p>
            </div>

            <div className="flex flex-col gap-3 overflow-y-auto max-h-[250px] custom-scrollbar">
              {getSelectedDayLessons().length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  <CalendarIcon className="w-8 h-8 text-slate-200 dark:text-slate-800 mx-auto mb-2" />
                  <span className="text-xs font-semibold">No classes scheduled today</span>
                </div>
              ) : (
                getSelectedDayLessons().map((les: any) => (
                  <div key={les.id} className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl relative">
                    <span className="text-[8px] uppercase tracking-wider font-bold text-blue-500">{les.subject}</span>
                    <h6 className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5">{les.title}</h6>
                    
                    <div className="flex gap-4 text-[9px] text-slate-500 mt-2">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{les.time}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-slate-400" />
                        <span>{les.instructor}</span>
                      </div>
                    </div>

                    {les.joinUrl && (
                      <a 
                        href={les.joinUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-1 text-[9px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        <Video className="w-3 h-3" />
                        <span>Launch Online Session</span>
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </Card>

      {/* 5. Lecture Materials Section (With drag-and-drop & Table) */}
      <Card className="p-6">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                Lecture Materials Repository
              </h4>
              <p className="text-[10px] text-slate-400">Dynamic listing of processed slides and readings. Drag and drop to analyze.</p>
            </div>

            {/* Filter and search bar */}
            <div className="flex flex-wrap items-center gap-2 max-w-xl w-full sm:w-auto">
              {/* Search */}
              <div className="relative flex-1 sm:max-w-xs">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                <Input 
                  placeholder="Search files..." 
                  value={materialsSearch}
                  onChange={(e) => { setMaterialsSearch(e.target.value); setMaterialsPage(1); }}
                  className="pl-9 py-1 text-xs"
                />
              </div>

              {/* Filter */}
              <Select 
                value={materialsCourse} 
                onChange={(e) => { setMaterialsCourse(e.target.value); setMaterialsPage(1); }}
                className="py-1 text-xs"
              >
                <option value="All">All Courses</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left: Drag and Drop Uploader */}
            <div className="lg:col-span-1">
              <FileUpload 
                onFileSelect={handleFileUpload} 
                accept=".pdf,.pptx,.mp4" 
                multiple={false} 
                maxSizeMB={20} 
              />
            </div>

            {/* Right: Table of materials */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <Table 
                columns={[
                  {
                    key: 'fileName',
                    header: 'File Name',
                    render: (item: any) => (
                      <div className="flex flex-col">
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate max-w-[200px]">{item.fileName}</span>
                        <span className="text-[9px] text-slate-400 mt-0.5">{item.courseName}</span>
                      </div>
                    )
                  },
                  {
                    key: 'uploadedAt',
                    header: 'Uploaded Date',
                    render: (item: any) => (
                      <span className="text-[10px] text-slate-500 font-medium">
                        {new Date(item.uploadedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    )
                  },
                  {
                    key: 'status',
                    header: 'AI Processing Status',
                    render: (item: any) => {
                      if (item.status === 'processed') {
                        return <Badge variant="success">Vectorized</Badge>;
                      }
                      if (item.status === 'processing') {
                        return <Badge variant="warning" className="animate-pulse">Analyzing...</Badge>;
                      }
                      return <Badge variant="danger">Failed</Badge>;
                    }
                  },
                  {
                    key: 'actions',
                    header: 'AI Output',
                    align: 'right',
                    render: (item: any) => (
                      <Button 
                        variant="secondary" 
                        size="sm"
                        disabled={item.status !== 'processed'}
                        onClick={() => {
                          setSelectedMaterial(item);
                          setIsTakeawaysOpen(true);
                        }}
                      >
                        Takeaways
                      </Button>
                    )
                  }
                ]}
                data={materialsData}
                loading={loadingMaterials}
                emptyMessage="No matching lecture materials found in database."
              />

              {materialsTotalPages > 1 && (
                <Pagination 
                  currentPage={materialsPage} 
                  totalPages={materialsTotalPages} 
                  onPageChange={setMaterialsPage} 
                />
              )}
            </div>
          </div>

        </div>
      </Card>

      {/* 6. Enrolled Students Progress Panel */}
      <Card className="p-6">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                Syllabus Progress & Grade-sheet
              </h4>
              <p className="text-[10px] text-slate-400">Class tracking matrix. Filter and search dynamically.</p>
            </div>

            {/* Filter and search bar */}
            <div className="flex flex-wrap items-center gap-2 max-w-xl w-full sm:w-auto">
              <div className="relative flex-1 sm:max-w-xs">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                <Input 
                  placeholder="Search students..." 
                  value={studentsSearch}
                  onChange={(e) => { setStudentsSearch(e.target.value); setStudentsPage(1); }}
                  className="pl-9 py-1 text-xs"
                />
              </div>

              <Select 
                value={studentsCourse} 
                onChange={(e) => { setStudentsCourse(e.target.value); setStudentsPage(1); }}
                className="py-1 text-xs"
              >
                <option value="All">All Classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </Select>
            </div>
          </div>

          <Table 
            columns={[
              {
                key: 'name',
                header: 'Student Name',
                render: (item: any) => (
                  <div className="flex flex-col">
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{item.name}</span>
                    <span className="text-[9px] text-slate-400 mt-0.5">{item.email}</span>
                  </div>
                )
              },
              {
                key: 'course',
                header: 'Enrolled Course',
                render: (item: any) => (
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{item.course}</span>
                )
              },
              {
                key: 'progress',
                header: 'Syllabus Progress',
                render: (item: any) => (
                  <div className="flex items-center gap-3 w-40">
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          item.progress >= 80 ? 'bg-emerald-500' : item.progress >= 50 ? 'bg-blue-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 shrink-0">{item.progress}%</span>
                  </div>
                )
              },
              {
                key: 'score',
                header: 'Average Quiz Score',
                render: (item: any) => (
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{item.score}%</span>
                )
              },
              {
                key: 'status',
                header: 'Overall Status',
                render: (item: any) => {
                  if (item.status === 'active') {
                    return <Badge variant="success">Active</Badge>;
                  }
                  if (item.status === 'warning') {
                    return <Badge variant="warning">At Risk</Badge>;
                  }
                  return <Badge variant="danger">Critical</Badge>;
                }
              }
            ]}
            data={studentsData}
            loading={loadingStudents}
            emptyMessage="No students matches found in enrollment register."
          />

          {studentsTotalPages > 1 && (
            <Pagination 
              currentPage={studentsPage} 
              totalPages={studentsTotalPages} 
              onPageChange={setStudentsPage} 
            />
          )}
        </div>
      </Card>


      {/* --- ALL MODALS --- */}

      {/* 1. KEY TAKEAWAYS DIALOG */}
      <Dialog 
        isOpen={isTakeawaysOpen} 
        onClose={() => setIsTakeawaysOpen(false)}
        title="AI Summarizer Output"
        size="lg"
      >
        {selectedMaterial && (
          <div className="space-y-5">
            <div>
              <span className="text-[10px] uppercase font-bold text-blue-500 tracking-wider">Lecture Resource Summary</span>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1">{selectedMaterial.fileName}</h4>
            </div>

            {/* Strategic Warning */}
            {selectedMaterial.aiInsight && (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30">
                <div className="flex gap-2 items-start">
                  <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300">Strategic AI Warning / Insight:</span>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5 leading-relaxed">{selectedMaterial.aiInsight}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Bullet points */}
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Key Takeaways Summary:</span>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                {selectedMaterial.keyTakeaways && selectedMaterial.keyTakeaways.length > 0 ? (
                  selectedMaterial.keyTakeaways.map((point: string, idx: number) => (
                    <li key={idx} className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{point}</li>
                  ))
                ) : (
                  <li className="text-xs text-slate-400 italic">No bullet summary points extracted yet. AI might be processing in the background.</li>
                )}
              </ul>
            </div>

            <div className="flex justify-end pt-4">
              <Button variant="secondary" onClick={() => setIsTakeawaysOpen(false)}>Close Summary</Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* 2. ENROLL STUDENT DIALOG */}
      <Dialog
        isOpen={isAddStudentOpen}
        onClose={() => setIsAddStudentOpen(false)}
        title="Enroll New Student"
      >
        <form onSubmit={handleAddStudentSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Full Student Name</label>
            <Input 
              type="text" 
              placeholder="e.g. Muhammad Bilal" 
              value={newStudentForm.name}
              onChange={(e) => setNewStudentForm(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Institutional Email</label>
            <Input 
              type="email" 
              placeholder="e.g. bilal.s@uol.edu.pk" 
              value={newStudentForm.email}
              onChange={(e) => setNewStudentForm(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Assigned Class</label>
              <Select
                value={newStudentForm.course}
                onChange={(e) => setNewStudentForm(prev => ({ ...prev, course: e.target.value }))}
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Syllabus Progress (%)</label>
              <Input 
                type="number" 
                min="0" 
                max="100" 
                value={newStudentForm.progress}
                onChange={(e) => setNewStudentForm(prev => ({ ...prev, progress: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Average Starting Score (%)</label>
            <Input 
              type="number" 
              min="0" 
              max="100" 
              value={newStudentForm.score}
              onChange={(e) => setNewStudentForm(prev => ({ ...prev, score: Number(e.target.value) }))}
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsAddStudentOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Add Student</Button>
          </div>
        </form>
      </Dialog>

      {/* 3. SCHEDULE LESSON DIALOG */}
      <Dialog
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        title="Schedule Classroom Session"
      >
        <form onSubmit={handleScheduleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Lecture Topic / Title</label>
            <Input 
              type="text" 
              placeholder="e.g. Limits and Derivatives Introduction" 
              value={newLessonForm.title}
              onChange={(e) => setNewLessonForm(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Course Code</label>
              <Select
                value={newLessonForm.subject}
                onChange={(e) => setNewLessonForm(prev => ({ ...prev, subject: e.target.value }))}
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Session Date</label>
              <Input 
                type="date" 
                value={newLessonForm.date}
                onChange={(e) => setNewLessonForm(prev => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Time Slot</label>
              <Input 
                type="text" 
                placeholder="e.g. 10:00 AM" 
                value={newLessonForm.time}
                onChange={(e) => setNewLessonForm(prev => ({ ...prev, time: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Instructor Name</label>
              <Input 
                type="text" 
                value={newLessonForm.instructor}
                onChange={(e) => setNewLessonForm(prev => ({ ...prev, instructor: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Online Video Meet URL</label>
            <Input 
              type="url" 
              placeholder="e.g. https://zoom.us/j/pk-class" 
              value={newLessonForm.joinUrl}
              onChange={(e) => setNewLessonForm(prev => ({ ...prev, joinUrl: e.target.value }))}
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsScheduleOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Schedule Class</Button>
          </div>
        </form>
      </Dialog>

      {/* 4. AI BILINGUAL QUIZ GENERATOR PORTAL */}
      <Dialog
        isOpen={isQuizGenOpen}
        onClose={() => { setIsQuizGenOpen(false); setGeneratingQuizStatus(null); setGeneratedQuiz(null); }}
        title="AI Bilingual Quiz Generator"
        size="xl"
      >
        {generatingQuizStatus === null && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">Generate high-fidelity MCQs or True-False tests formatted for Pakistani colleges using Gemini.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Source Material Context</label>
                  <Select
                    value={quizConfig.materialId}
                    onChange={(e) => setQuizConfig(prev => ({ ...prev, materialId: e.target.value, customTopic: '' }))}
                  >
                    <option value="">-- Generate From Custom Topic --</option>
                    {uploadedMaterials.map(m => (
                      <option key={m.id} value={m.id}>{m.fileName}</option>
                    ))}
                  </Select>
                </div>

                {!quizConfig.materialId && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Or Type Custom Syllabus Topic</label>
                    <Input 
                      type="text" 
                      placeholder="e.g. Newton Laws of Motion or Calculus Derivatives" 
                      value={quizConfig.customTopic}
                      onChange={(e) => setQuizConfig(prev => ({ ...prev, customTopic: e.target.value }))}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Target Language Style</label>
                  <Select
                    value={quizConfig.language}
                    onChange={(e) => setQuizConfig(prev => ({ ...prev, language: e.target.value }))}
                  >
                    <option value="bilingual">Bilingual (English + Urdu script)</option>
                    <option value="english">English Only</option>
                    <option value="urdu">Urdu Only (اردو)</option>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Difficulty level</label>
                    <Select
                      value={quizConfig.difficulty}
                      onChange={(e) => setQuizConfig(prev => ({ ...prev, difficulty: e.target.value }))}
                    >
                      <option value="easy">Easy (Conceptual)</option>
                      <option value="medium">Medium (Analytical)</option>
                      <option value="hard">Hard (Computational)</option>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Question Count</label>
                    <Select
                      value={String(quizConfig.questionCount)}
                      onChange={(e) => setQuizConfig(prev => ({ ...prev, questionCount: Number(e.target.value) }))}
                    >
                      <option value="3">3 Questions</option>
                      <option value="5">5 Questions</option>
                      <option value="10">10 Questions</option>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-5 border-t border-slate-100 dark:border-slate-800">
              <Button variant="secondary" onClick={() => setIsQuizGenOpen(false)}>Cancel</Button>
              <Button 
                variant="primary" 
                onClick={handleGenerateQuizSubmit}
                disabled={!quizConfig.materialId && !quizConfig.customTopic}
              >
                Generate via Gemini
              </Button>
            </div>
          </div>
        )}

        {generatingQuizStatus === 'generating' && (
          <div className="py-12 flex flex-col items-center justify-center text-center gap-4">
            <Spinner size="lg" variant="primary" />
            <div>
              <h5 className="font-bold text-sm text-slate-800 dark:text-slate-100 animate-pulse">Running Gemini Reasoning...</h5>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">Generating bilingual question structures, options, and localized answers. This takes about 5 seconds.</p>
            </div>
          </div>
        )}

        {generatingQuizStatus === 'error' && (
          <div className="py-12 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center text-rose-500 border border-rose-100 dark:border-rose-900/50">
              <Trash2 className="w-8 h-8" />
            </div>
            <div>
              <h5 className="font-bold text-sm text-slate-800 dark:text-slate-100">AI Generation Blocked</h5>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-md">The Gemini SDK require a valid API Key. To execute active test generation, configure your GEMINI_API_KEY in the Settings &gt; Secrets tab on the platform menu.</p>
            </div>
            <div className="flex gap-2.5 pt-4">
              <Button variant="secondary" onClick={() => setGeneratingQuizStatus(null)}>Configure Parameters</Button>
              <Button variant="primary" onClick={() => setIsQuizGenOpen(false)}>Close Portal</Button>
            </div>
          </div>
        )}

        {generatingQuizStatus === 'done' && generatedQuiz && (
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-500 tracking-wider">Bilingual Quiz Preview</span>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">{generatedQuiz.title}</h4>
              </div>
              <Badge variant="success">Bilingual PDF ready</Badge>
            </div>

            {/* Questions list */}
            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
              {generatedQuiz.questions.map((q: any, qIdx: number) => (
                <div key={qIdx} className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl space-y-2.5">
                  <div className="flex gap-2 items-start">
                    <span className="w-5 h-5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">{qIdx + 1}</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-relaxed">{q.questionText}</span>
                  </div>

                  {q.type === 'multiple-choice' && q.options && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-7">
                      {q.options.map((opt: string, optIdx: number) => {
                        const isCorrect = opt === q.correctAnswer;
                        return (
                          <div 
                            key={optIdx} 
                            className={`p-2.5 text-xs rounded-lg border flex items-center justify-between ${
                              isCorrect 
                                ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold' 
                                : 'bg-white dark:bg-slate-950 border-slate-150 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            <span>{opt}</span>
                            {isCorrect && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {q.type === 'true-false' && (
                    <div className="grid grid-cols-2 gap-2 pl-7">
                      {['True', 'False'].map((opt) => {
                        const isCorrect = opt.toLowerCase() === q.correctAnswer.toLowerCase();
                        return (
                          <div 
                            key={opt} 
                            className={`p-2.5 text-xs rounded-lg border text-center ${
                              isCorrect 
                                ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold' 
                                : 'bg-white dark:bg-slate-950 border-slate-150 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {opt}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="bg-blue-50/30 dark:bg-blue-950/10 p-2.5 rounded-lg border border-blue-100/30 dark:border-blue-900/20 text-[10px] text-blue-700 dark:text-blue-400 pl-7 leading-relaxed">
                    <span className="font-bold uppercase tracking-wider">Concept:</span> {q.explanation}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button variant="secondary" onClick={() => setGeneratingQuizStatus(null)}>Configure Another</Button>
              <Button variant="primary" onClick={() => setIsQuizGenOpen(false)}>Save & Sync To Students</Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Voice Learning Companion Modal */}
      <VoiceTutorModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
      />

    </div>
  );
};
