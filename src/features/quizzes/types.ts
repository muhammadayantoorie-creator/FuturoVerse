/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type QuestionType = 'multiple-choice' | 'true-false' | 'fill-blank' | 'short-answer' | 'long-answer';

export interface McqOption {
  id: string;
  text: string;
  correct: boolean;
  imageUrl?: string;
  codeSnippet?: string;
  mathFormula?: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  questionText: string;
  options?: string[]; // For multiple-choice
  correctAnswer: string; // The correct answer or reference answer keywords
  explanation: string;
  points: number;
  tags?: string[];
  imageUrl?: string;
  diagramName?: string;
  mathFormula?: string;
  timerSeconds?: number; // Time limit for this specific question in seconds
  difficulty?: string;
  subject?: string;
  bloomLevel?: string;
  mcqOptions?: McqOption[];
}

export interface Quiz {
  id: string;
  title: string;
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
  durationSeconds: number;
  questions: Question[];
  status: 'draft' | 'published';
  startDate?: string;
  endDate?: string;
  attemptsAllowed: number;
  passingMarks: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  randomQuestionOrder?: boolean;
  randomOptionOrder?: boolean;
  autoSubmitOnTimeout: boolean;
  showScoreAfterSubmission: boolean;
  showCorrectAnswers: boolean;
  negativeMarking: boolean;
  warningLimit?: number;
  autoSubmitThreshold: number; // e.g. 3 violations auto-submits
  creatorId?: string;
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  totalPoints: number;
  timeSpentSeconds: number;
  grade: string;
  date: string;
  quizId?: string;
}

export interface ViolationLog {
  id: string;
  studentId: string;
  studentName: string;
  quizId: string;
  quizTitle: string;
  eventType: 'tab-switched' | 'browser-minimized' | 'page-hidden' | 'fullscreen-exited' | 'lost-focus' | 'excessive-idle' | 'refresh-attempt' | 'navigation-attempt' | 'clipboard-disallowed';
  timestamp: string;
}

export interface QuizAttempt {
  id: string;
  studentId: string;
  studentName: string;
  quizId: string;
  quizTitle: string;
  score: number;
  totalPoints: number;
  timeSpentSeconds: number;
  grade: string;
  date: string;
  completed: boolean;
  violationsCount: number;
  violationsList: ViolationLog[];
  gradedQuestions: Array<{
    questionId: string;
    userResponse: string;
    isCorrect: boolean;
    pointsAwarded: number;
    aiEvaluation?: string;
  }>;
}
