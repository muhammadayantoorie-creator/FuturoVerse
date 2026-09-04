import { LeaderboardEntry, Question, Quiz, QuizAttempt } from './types';

// New workspaces begin with no fabricated quizzes, questions, attempts, or
// leaderboard entries. These collections are populated through real use.
export const PRESET_QUIZZES: Quiz[] = [];
export const INITIAL_QUESTION_BANK: Question[] = [];
export const SEED_LEADERBOARD: LeaderboardEntry[] = [];
export const INITIAL_STUDENT_ATTEMPTS: QuizAttempt[] = [];
