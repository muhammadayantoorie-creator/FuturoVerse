/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { Role, Theme, Locale, User, ClassItem, Stats, UploadedMaterial, Lesson, Achievement, WeakTopicData, Classroom } from '@/src/types';

interface AppState {
  // Authentication & Session
  currentUser: User;
  currentRole: Role;
  locale: Locale;
  theme: Theme;
  activeTab: string; // 'dashboard' | 'classes' | 'ai-tools' | 'resources' | 'settings'
  
  // App Data
  classes: ClassItem[];
  classrooms: Classroom[];
  stats: Stats & { totalMaterials?: number };
  uploadedMaterials: UploadedMaterial[];
  todaysLessons: Lesson[];
  achievements: Achievement[];
  weakTopics: WeakTopicData[];
  notifications: any[];
  
  // UI States
  notificationCount: number;
  isAiTutorOpen: boolean;
  isCreateClassModalOpen: boolean;
  aiTutorChatHistory: { sender: 'user' | 'bot'; text: string; timestamp: string }[];
  
  // Basic Actions
  setRole: (role: Role) => void;
  setLocale: (locale: Locale) => void;
  toggleTheme: () => void;
  setActiveTab: (tab: string) => void;
  setCreateClassModalOpen: (open: boolean) => void;
  addUploadedMaterial: (material: Omit<UploadedMaterial, 'id' | 'uploadedAt' | 'status'>) => void;
  addAiChatMessage: (sender: 'user' | 'bot', text: string) => void;
  setAiTutorOpen: (open: boolean) => void;
  clearNotifications: () => void;

  // Async API Actions
  fetchStats: () => Promise<void>;
  fetchMaterials: (search?: string, course?: string, page?: number, limit?: number) => Promise<{ data: UploadedMaterial[]; pagination: any }>;
  uploadMaterial: (material: { fileName: string; fileType: string; courseName: string; fileContentText?: string; fileSize?: string }) => Promise<any>;
  deleteMaterial: (id: string) => Promise<void>;
  renameMaterial: (id: string, fileName: string) => Promise<void>;
  fetchStudents: (search?: string, course?: string, page?: number, limit?: number) => Promise<{ data: any[]; pagination: any }>;
  addStudent: (student: { name: string; email: string; course: string; score: number; progress: number }) => Promise<void>;
  fetchNotifications: () => Promise<void>;
  clearNotification: (id: string) => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  addNotification: (notification: { title: string; message: string; type?: string; link?: string }) => Promise<void>;
  fetchLessons: () => Promise<void>;
  scheduleLesson: (lesson: { title: string; subject: string; time: string; date: string; instructor?: string; joinUrl?: string }) => Promise<void>;
  generateQuiz: (config: { difficulty: string; questionCount: number; language: string; materialId?: string; customTopic?: string }) => Promise<any>;
  fetchWeakTopics: () => Promise<void>;

  // Classroom Actions
  fetchClassrooms: (search?: string, department?: string, status?: string, sort?: string, order?: string, page?: number, limit?: number) => Promise<{ data: Classroom[]; pagination: any }>;
  createClassroom: (classroom: { name: string; subjectCode: string; department: string; description: string; section?: string; room?: string; status?: string }) => Promise<any>;
  updateClassroom: (id: string, classroom: { name?: string; subjectCode?: string; department?: string; description?: string; section?: string; room?: string; status?: string }) => Promise<any>;
  deleteClassroom: (id: string) => Promise<void>;
  inviteStudentToClassroom: (id: string, name: string, email: string) => Promise<void>;
  joinClassroom: (id: string, name: string, email: string) => Promise<void>;
  leaveClassroom: (id: string, email: string) => Promise<void>;
}

const initialUser: User = {
  id: 'usr_ahmed',
  name: 'Ahmed',
  email: 'ahmed.alipk@uol.edu.pk',
  role: 'student',
  avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC1jpDL0T17Nug1I73cKFaluo__r7LzQwxx6PsTUeiM0PfB0KlnSyBK5Gry5_OqPHSu2XUeiLHD0Pdgl8c-FK1Nh3ekz_yu2JDPjldCEwf2xom-BnUr3BRfYFoOKs-KxtJsF9Sn0_bmZZ3xkm_zpTa7yzbvyGvm8KxE63XBzDRXTGUNIFpriJG7TBj5SU4ituE492UPv8YljJ3pdhsSM98_2YKFMEOD68dkMEuppByzzUSEjWiE1ImHHA',
  semesterProgress: 75,
};

const initialClasses: ClassItem[] = [
  { id: 'cls_phy101', name: 'Physics 101: Mechanics', subjectCode: 'PHYS-101', department: 'Physics', studentCount: 45 },
  { id: 'cls_bio202', name: 'Biology 202: Cell Biology', subjectCode: 'BIOL-202', department: 'Biology', studentCount: 38 },
  { id: 'cls_math301', name: 'Mathematics 301: Calculus', subjectCode: 'MATH-301', department: 'Mathematics', studentCount: 52 },
];

const initialUploadedMaterials: UploadedMaterial[] = [
  {
    id: 'mat_001',
    fileName: 'Week 4_Quantum_Mechanics_PHYS101.pdf',
    courseName: 'Physics 101',
    uploadedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    status: 'processed',
    fileType: 'pdf',
    keyTakeaways: [
      'Introduction to Wave-Particle Duality and the de Broglie wavelength formula (\\(\\lambda = h/p\\)).',
      "Heisenberg's Uncertainty Principle Establishing fundamental limits on measurement precision.",
      'Overview of the Schrödinger Equation (Time-Independent) for a particle in a 1D box.',
      'Concept of quantization of energy levels.'
    ],
    aiInsight: 'The core focus of this lecture is the shift from deterministic classical physics to probabilistic quantum models.'
  }
];

const initialLessons: Lesson[] = [
  { id: 'les_001', title: 'Quantum Mechanics Intro', subject: 'Physics 101', time: '09:00 AM', instructor: 'Prof. Kamran', joinUrl: 'https://zoom.us/j/123456789' },
  { id: 'les_002', title: "Iqbal's Poetry Analysis", subject: 'Urdu Literature', time: '11:30 AM', instructor: 'Prof. Nasreen', joinUrl: 'https://zoom.us/j/987654321' },
];

const initialAchievements: Achievement[] = [
  { id: 'ach_001', title: 'Top Learner', description: 'Top 5% in Physics this week.', type: 'star', unlockedAt: '2026-07-05T12:00:00Z' },
  { id: 'ach_002', title: 'Quiz Master', description: 'Perfect score in Math Quiz.', type: 'quiz', unlockedAt: '2026-07-06T15:30:00Z' },
];

const initialWeakTopics: WeakTopicData[] = [
  { topic: 'Quantum Wavefunctions', score: 38 },
  { topic: 'Cellular Organelle Functions', score: 45 },
  { topic: 'Limits & Continuous Functions', score: 55 },
  { topic: 'Urdu Grammar Basics', score: 88 },
];

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: initialUser,
  currentRole: 'teacher', // Default role is Teacher to load full functional dashboard
  locale: 'en',
  theme: 'light',
  activeTab: 'dashboard',
  classes: initialClasses,
  classrooms: [],
  stats: {
    activeStudents: 1248,
    quizzesGenerated: 24,
    avgClassScore: 76.5,
    totalMaterials: 3,
  },
  uploadedMaterials: initialUploadedMaterials,
  todaysLessons: initialLessons,
  achievements: initialAchievements,
  weakTopics: initialWeakTopics,
  notifications: [],
  notificationCount: 0,
  isAiTutorOpen: false,
  isCreateClassModalOpen: false,
  aiTutorChatHistory: [
    {
      sender: 'bot',
      text: 'Hi Professor! How can I assist you with your classes or quiz generations today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ],

  setRole: (role) => set({ currentRole: role }),
  setLocale: (locale) => set({ locale }),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setCreateClassModalOpen: (open) => set({ isCreateClassModalOpen: open }),
  addUploadedMaterial: (material) => set((state) => {
    const newId = `mat_${Math.random().toString(36).substr(2, 9)}`;
    const newMaterial: UploadedMaterial = {
      ...material,
      id: newId,
      uploadedAt: new Date().toISOString(),
      status: 'processing',
    };
    return {
      uploadedMaterials: [newMaterial, ...state.uploadedMaterials],
      stats: {
        ...state.stats,
        totalMaterials: (state.stats.totalMaterials || 0) + 1,
      }
    };
  }),
  addAiChatMessage: (sender, text) => set((state) => ({
    aiTutorChatHistory: [
      ...state.aiTutorChatHistory,
      {
        sender,
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ]
  })),
  setAiTutorOpen: (open) => set({ isAiTutorOpen: open }),
  clearNotifications: () => set({ notificationCount: 0 }),

  // Fetch Stats
  fetchStats: async () => {
    try {
      const res = await fetch('/api/teacher/stats');
      if (res.ok) {
        const stats = await res.json();
        set({ stats });
      }
    } catch (err) {
      console.error('fetchStats error:', err);
    }
  },

  // Fetch Materials
  fetchMaterials: async (search = '', course = '', page = 1, limit = 4) => {
    try {
      const url = `/api/teacher/materials?search=${encodeURIComponent(search)}&course=${encodeURIComponent(course)}&page=${page}&limit=${limit}`;
      const res = await fetch(url);
      if (res.ok) {
        const payload = await res.json();
        set({ uploadedMaterials: payload.data });
        return payload;
      }
    } catch (err) {
      console.error('fetchMaterials error:', err);
    }
    return { data: get().uploadedMaterials, pagination: { currentPage: 1, totalPages: 1, totalItems: get().uploadedMaterials.length } };
  },

  // Upload Material
  uploadMaterial: async (material) => {
    try {
      const res = await fetch('/api/teacher/materials/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(material),
      });
      if (res.ok) {
        const payload = await res.json();
        await get().fetchMaterials();
        await get().fetchStats();
        await get().fetchNotifications();
        return payload;
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Failed to upload material');
      }
    } catch (err) {
      console.error('uploadMaterial error:', err);
      throw err;
    }
  },

  deleteMaterial: async (id) => {
    try {
      const res = await fetch(`/api/teacher/materials/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await get().fetchMaterials();
        await get().fetchStats();
        await get().fetchNotifications();
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete material');
      }
    } catch (err) {
      console.error('deleteMaterial error:', err);
      throw err;
    }
  },

  renameMaterial: async (id, fileName) => {
    try {
      const res = await fetch(`/api/teacher/materials/${id}/rename`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName }),
      });
      if (res.ok) {
        await get().fetchMaterials();
        await get().fetchNotifications();
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Failed to rename material');
      }
    } catch (err) {
      console.error('renameMaterial error:', err);
      throw err;
    }
  },

  // Fetch Students
  fetchStudents: async (search = '', course = '', page = 1, limit = 5) => {
    try {
      const url = `/api/teacher/students?search=${encodeURIComponent(search)}&course=${encodeURIComponent(course)}&page=${page}&limit=${limit}`;
      const res = await fetch(url);
      if (res.ok) {
        const payload = await res.json();
        return payload;
      }
    } catch (err) {
      console.error('fetchStudents error:', err);
    }
    return { data: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0 } };
  },

  // Add Student
  addStudent: async (student) => {
    try {
      const res = await fetch('/api/teacher/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(student),
      });
      if (res.ok) {
        await get().fetchStats();
        await get().fetchNotifications();
      }
    } catch (err) {
      console.error('addStudent error:', err);
    }
  },

  // Fetch Notifications
  fetchNotifications: async () => {
    try {
      const res = await fetch('/api/teacher/notifications');
      if (res.ok) {
        const notifications = await res.json();
        const unreadCount = notifications.filter((n: any) => !n.read).length;
        set({ notifications, notificationCount: unreadCount });
      }
    } catch (err) {
      console.error('fetchNotifications error:', err);
    }
  },

  // Clear single Notification
  clearNotification: async (id) => {
    try {
      const res = await fetch(`/api/teacher/notifications/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await get().fetchNotifications();
      }
    } catch (err) {
      console.error('clearNotification error:', err);
    }
  },

  // Mark single notification as read
  markNotificationAsRead: async (id) => {
    try {
      const res = await fetch(`/api/teacher/notifications/${id}/read`, { method: 'POST' });
      if (res.ok) {
        await get().fetchNotifications();
      }
    } catch (err) {
      console.error('markNotificationAsRead error:', err);
    }
  },

  // Mark all notifications as read
  markAllNotificationsRead: async () => {
    try {
      const res = await fetch('/api/teacher/notifications/read', { method: 'POST' });
      if (res.ok) {
        await get().fetchNotifications();
      }
    } catch (err) {
      console.error('markAllNotificationsRead error:', err);
    }
  },

  // Clear all notifications
  clearAllNotifications: async () => {
    try {
      const res = await fetch('/api/teacher/notifications', { method: 'DELETE' });
      if (res.ok) {
        set({ notifications: [], notificationCount: 0 });
      }
    } catch (err) {
      console.error('clearAllNotifications error:', err);
    }
  },

  // Add custom notification
  addNotification: async (notification) => {
    try {
      const res = await fetch('/api/teacher/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notification),
      });
      if (res.ok) {
        await get().fetchNotifications();
      }
    } catch (err) {
      console.error('addNotification error:', err);
    }
  },

  // Fetch Lessons
  fetchLessons: async () => {
    try {
      const res = await fetch('/api/teacher/lessons');
      if (res.ok) {
        const todaysLessons = await res.json();
        set({ todaysLessons });
      }
    } catch (err) {
      console.error('fetchLessons error:', err);
    }
  },

  // Schedule a new lesson
  scheduleLesson: async (lesson) => {
    try {
      const res = await fetch('/api/teacher/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lesson),
      });
      if (res.ok) {
        await get().fetchLessons();
        await get().fetchNotifications();
      }
    } catch (err) {
      console.error('scheduleLesson error:', err);
    }
  },

  // Generate Quiz (uses backend Gemini model!)
  generateQuiz: async (config) => {
    const res = await fetch('/api/teacher/quizzes/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (res.ok) {
      const quiz = await res.json();
      await get().fetchStats();
      await get().fetchNotifications();
      return quiz;
    } else {
      const err = await res.json();
      throw new Error(err.error || 'Failed to generate quiz');
    }
  },

  // Fetch Weak Topics
  fetchWeakTopics: async () => {
    try {
      const res = await fetch('/api/teacher/weak-topics');
      if (res.ok) {
        const weakTopics = await res.json();
        set({ weakTopics });
      }
    } catch (err) {
      console.error('fetchWeakTopics error:', err);
    }
  },

  // Classroom action implementations
  fetchClassrooms: async (search = '', department = '', status = '', sort = 'name', order = 'asc', page = 1, limit = 6) => {
    try {
      const url = `/api/classrooms?search=${encodeURIComponent(search)}&department=${encodeURIComponent(department)}&status=${encodeURIComponent(status)}&sort=${sort}&order=${order}&page=${page}&limit=${limit}`;
      const res = await fetch(url);
      if (res.ok) {
        const payload = await res.json();
        set({ classrooms: payload.data });
        // update classes array as well for backward compatibility
        const simplifiedClasses = payload.data.map((c: Classroom) => ({
          id: c.id,
          name: c.name,
          subjectCode: c.subjectCode,
          department: c.department,
          studentCount: c.studentCount,
          section: c.section,
          room: c.room,
        }));
        set({ classes: simplifiedClasses });
        return payload;
      }
    } catch (err) {
      console.error('fetchClassrooms error:', err);
    }
    return { data: get().classrooms, pagination: { currentPage: 1, totalPages: 1, totalItems: get().classrooms.length } };
  },

  createClassroom: async (classroom) => {
    const res = await fetch('/api/classrooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(classroom),
    });
    if (res.ok) {
      const created = await res.json();
      await get().fetchClassrooms();
      await get().fetchStats();
      await get().fetchNotifications();
      return created;
    } else {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create classroom');
    }
  },

  updateClassroom: async (id, classroom) => {
    const res = await fetch(`/api/classrooms/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(classroom),
    });
    if (res.ok) {
      const updated = await res.json();
      await get().fetchClassrooms();
      return updated;
    } else {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update classroom');
    }
  },

  deleteClassroom: async (id) => {
    const res = await fetch(`/api/classrooms/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await get().fetchClassrooms();
      await get().fetchStats();
      await get().fetchNotifications();
    } else {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete classroom');
    }
  },

  inviteStudentToClassroom: async (id, name, email) => {
    const res = await fetch(`/api/classrooms/${id}/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email }),
    });
    if (res.ok) {
      await get().fetchClassrooms();
      await get().fetchNotifications();
    } else {
      const err = await res.json();
      throw new Error(err.error || 'Failed to invite student');
    }
  },

  joinClassroom: async (id, name, email) => {
    const res = await fetch(`/api/classrooms/${id}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email }),
    });
    if (res.ok) {
      await get().fetchClassrooms();
      await get().fetchStats();
      await get().fetchNotifications();
    } else {
      const err = await res.json();
      throw new Error(err.error || 'Failed to join classroom');
    }
  },

  leaveClassroom: async (id, email) => {
    const res = await fetch(`/api/classrooms/${id}/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (res.ok) {
      await get().fetchClassrooms();
      await get().fetchStats();
      await get().fetchNotifications();
    } else {
      const err = await res.json();
      throw new Error(err.error || 'Failed to leave classroom');
    }
  }
}));
