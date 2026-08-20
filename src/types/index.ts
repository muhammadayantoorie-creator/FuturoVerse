/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role = 'teacher' | 'student' | 'admin' | 'guest';
export type Theme = 'light' | 'dark';
export type Locale = 'en' | 'ur';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  semesterProgress?: number; // percentage
}

export interface ClassItem {
  id: string;
  name: string;
  subjectCode: string;
  department: string;
  studentCount: number;
  section?: string;
  room?: string;
}

export interface Stats {
  activeStudents: number;
  quizzesGenerated: number;
  avgClassScore: number;
}

export type UploadStatus = 'processed' | 'processing' | 'failed';
export type UploadFileType = 'pdf' | 'docx' | 'pptx' | 'image' | 'mp4';

export interface UploadedMaterial {
  id: string;
  fileName: string;
  courseName: string;
  uploadedAt: string; // ISO string
  status: UploadStatus;
  fileType: UploadFileType;
  keyTakeaways?: string[];
  aiInsight?: string;
  fileSize?: string;
  fileContentText?: string;
}

export interface Lesson {
  id: string;
  title: string;
  subject: string;
  time: string; // e.g. "09:00 AM"
  instructor: string;
  joinUrl?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  type: 'star' | 'quiz' | 'badge';
  unlockedAt: string;
}

export interface WeakTopicData {
  topic: string;
  score: number; // 0 to 100
}

export type QuestionType = 'multiple-choice' | 'true-false';

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  questionText: string;
  options?: string[]; // for multiple choice
  correctAnswer: string; // correct option text or "true" | "false"
  explanation?: string;
  selectedAnswer?: string; // user selection during practice
}

export interface QuizConfig {
  difficulty: 'easy' | 'medium' | 'hard';
  questionCount: number;
  language: 'en' | 'ur' | 'bilingual';
  sourceMaterialId?: string;
}

export interface Quiz {
  id: string;
  title: string;
  sourceMaterialId: string;
  config: QuizConfig;
  questions: QuizQuestion[];
  createdAt: string;
}

export interface InvitedStudent {
  id: string;
  name: string;
  email: string;
  status: 'invited' | 'joined';
  invitedAt: string;
}

export interface Classroom {
  id: string;
  name: string;
  subjectCode: string;
  department: string;
  section?: string;
  room?: string;
  inviteCode?: string;
  studentCount: number;
  description: string;
  status: 'active' | 'archived';
  students: InvitedStudent[];
  createdAt: string;
}

export interface AttendanceRecord {
  date: string;
  Physics101: number;
  Biology202: number;
  Mathematics301: number;
}

export interface StudentGrowthRecord {
  name: string;
  Physics101: number;
  Biology202: number;
  Mathematics301: number;
}

export interface CompletionRateRecord {
  name: string;
  quizzes: number;
  lessons: number;
  assignments: number;
}

export interface WeakTopicRecord {
  topic: string;
  subject: string;
  averageScore: number;
  strugglingStudents: number;
}

export interface StudentAnalyticsRecord {
  id: string;
  name: string;
  course: string;
  attendance: number;
  quizzesCompleted: number;
  avgQuizScore: number;
  status: 'active' | 'warning' | 'danger';
}

export interface AnalyticsData {
  attendance: AttendanceRecord[];
  studentGrowth: StudentGrowthRecord[];
  completionRates: CompletionRateRecord[];
  weakTopics: WeakTopicRecord[];
  studentAnalytics: StudentAnalyticsRecord[];
}

export interface GradebookRecord {
  id: string;
  studentId: string;
  studentName: string;
  course: string;
  assignment1: number;
  assignment2: number;
  midterm: number;
  finalExam: number;
  classProject: number;
  attendanceMark: number;
  comments: string;
  lastUpdated: string;
}

