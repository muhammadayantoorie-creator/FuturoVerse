/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Quiz, Question, LeaderboardEntry, QuizAttempt } from './types';

export const PRESET_QUIZZES: Quiz[] = [
  {
    id: 'quiz_pak_studies',
    title: 'Pakistan Studies & National Geography',
    subject: 'Social Sciences',
    difficulty: 'medium',
    durationSeconds: 300,
    status: 'published',
    attemptsAllowed: 3,
    passingMarks: 30,
    shuffleQuestions: false,
    shuffleOptions: true,
    autoSubmitOnTimeout: true,
    showScoreAfterSubmission: true,
    showCorrectAnswers: true,
    negativeMarking: false,
    autoSubmitThreshold: 3,
    questions: [
      {
        id: 'pak_q1',
        type: 'multiple-choice',
        questionText: 'In which city was the historic Lahore Resolution (Resolution for Pakistan) passed in 1940?',
        options: ['Karachi', 'Lahore', 'Islamabad', 'Dhaka'],
        correctAnswer: 'Lahore',
        explanation: 'The Lahore Resolution, which laid the foundation for Pakistan, was passed on March 23, 1940, at Minto Park (now Iqbal Park), Lahore.',
        points: 10,
        tags: ['History', 'Lahore Resolution']
      },
      {
        id: 'pak_q2',
        type: 'true-false',
        questionText: "K2, the world's second-highest mountain peak, is located in the Karakoram mountain range of northern Pakistan.",
        correctAnswer: 'True',
        explanation: "Yes, K2 (8,611m) is located in Gilgit-Baltistan, Pakistan, in the Karakoram mountain range.",
        points: 10,
        tags: ['Geography', 'Mountains']
      },
      {
        id: 'pak_q3',
        type: 'fill-blank',
        questionText: 'The founder and first Governor-General of Pakistan, known as Quaid-e-Azam, was [Muhammad Ali Jinnah].',
        correctAnswer: 'Muhammad Ali Jinnah',
        explanation: "Muhammad Ali Jinnah led the Pakistan movement and was sworn in as the country's first Governor-General on August 15, 1947.",
        points: 10,
        tags: ['Leaders', 'Founders']
      },
      {
        id: 'pak_q4',
        type: 'short-answer',
        questionText: 'Name the national sport of Pakistan and mention another popular sport played extensively in the country.',
        correctAnswer: 'Field Hockey and Cricket',
        explanation: 'Field hockey is the official national sport of Pakistan, though cricket is the most widely played and popular sport.',
        points: 15,
        tags: ['Sports', 'Culture']
      },
      {
        id: 'pak_q5',
        type: 'long-answer',
        questionText: 'Discuss the historical significance of the Indus Valley Civilization and name the two primary excavation sites located in Pakistan.',
        correctAnswer: 'Harappa and Mohenjo-Daro',
        explanation: 'The Indus Valley Civilization (c. 3300–1300 BCE) is one of the world\'s oldest urban civilizations. The two main administrative cities excavated are Harappa (near Sahiwal) and Mohenjo-Daro (near Larkana). They are famous for their grid-like street design and sophisticated drainage systems.',
        points: 25,
        tags: ['History', 'Archaeology']
      }
    ]
  },
  {
    id: 'quiz_calculus_101',
    title: 'Differential Calculus & Limits',
    subject: 'Mathematics',
    difficulty: 'hard',
    durationSeconds: 420,
    status: 'published',
    attemptsAllowed: 2,
    passingMarks: 40,
    shuffleQuestions: true,
    shuffleOptions: true,
    autoSubmitOnTimeout: true,
    showScoreAfterSubmission: true,
    showCorrectAnswers: false,
    negativeMarking: true,
    autoSubmitThreshold: 2,
    questions: [
      {
        id: 'calc_q1',
        type: 'multiple-choice',
        questionText: 'What is the limit of sin(x) / x as x approaches 0?',
        options: ['0', '1', 'Infinity', 'Undefined'],
        correctAnswer: '1',
        explanation: 'This is a fundamental trigonometric limit. According to L\'Hopital\'s rule, taking derivative of sin(x) is cos(x) and x is 1. Evaluated at x=0, cos(0)/1 = 1.',
        points: 10,
        tags: ['Calculus', 'Limits'],
        mathFormula: '\\lim_{x \\to 0} \\frac{\\sin(x)}{x} = 1'
      },
      {
        id: 'calc_q2',
        type: 'true-false',
        questionText: 'If a function is continuous at a given point, then it must also be differentiable at that point.',
        correctAnswer: 'False',
        explanation: 'Continuity is a necessary but not sufficient condition for differentiability. A classic counterexample is f(x) = |x| at x = 0, which is continuous but has a sharp corner, making it non-differentiable.',
        points: 10,
        tags: ['Calculus', 'Differentiability']
      },
      {
        id: 'calc_q3',
        type: 'fill-blank',
        questionText: 'Using the power rule of differentiation, the derivative of f(x) = 3x³ - 5x² + 7 with respect to x is [9x² - 10x].',
        correctAnswer: '9x^2 - 10x',
        explanation: 'Apply d/dx(x^n) = n*x^(n-1). d/dx(3x³) = 9x², d/dx(-5x²) = -10x, and d/dx(7) = 0.',
        points: 10,
        tags: ['Calculus', 'Power Rule']
      }
    ]
  }
];

export const INITIAL_QUESTION_BANK: Question[] = [
  {
    id: 'bank_q1',
    type: 'multiple-choice',
    questionText: 'What is the velocity of light in a vacuum?',
    options: ['3 x 10^8 m/s', '1.5 x 10^8 m/s', '3 x 10^6 m/s', '3 x 10^10 m/s'],
    correctAnswer: '3 x 10^8 m/s',
    explanation: 'The speed of light in a vacuum is a fundamental physical constant exactly equal to 299,792,458 meters per second, commonly approximated as 3 x 10^8 m/s.',
    points: 10,
    tags: ['Physics', 'Electromagnetism']
  },
  {
    id: 'bank_q2',
    type: 'true-false',
    questionText: 'In Urdu literature, Allama Iqbal is celebrated as Shair-e-Mashriq (Poet of the East).',
    correctAnswer: 'True',
    explanation: 'Allama Muhammad Iqbal is universally known as Shair-e-Mashriq in recognition of his powerful philosophical Urdu and Persian poetry.',
    points: 10,
    tags: ['Urdu Literature', 'Poetry']
  },
  {
    id: 'bank_q3',
    type: 'fill-blank',
    questionText: 'The chemical formula for water is [H2O].',
    correctAnswer: 'H2O',
    explanation: 'Water molecules consist of two hydrogen atoms covalently bonded to a single oxygen atom.',
    points: 10,
    tags: ['Chemistry', 'Basics']
  },
  {
    id: 'bank_q4',
    type: 'short-answer',
    questionText: "Define photosynthesis and state the primary pigments responsible.",
    correctAnswer: 'Chlorophyll',
    explanation: 'Photosynthesis is the process used by plants to convert light energy into chemical energy. Chlorophyll is the primary pigment involved.',
    points: 15,
    tags: ['Biology', 'Plant Sciences']
  }
];

export const SEED_LEADERBOARD: LeaderboardEntry[] = [
  { name: 'Muhammad Ali', score: 68, totalPoints: 70, timeSpentSeconds: 145, grade: 'A1 - Outstanding', date: '2026-07-07', quizId: 'quiz_pak_studies' },
  { name: 'Ayesha Khan', score: 65, totalPoints: 70, timeSpentSeconds: 190, grade: 'A1 - Outstanding', date: '2026-07-06', quizId: 'quiz_pak_studies' },
  { name: 'Zainab Fatima', score: 58, totalPoints: 70, timeSpentSeconds: 240, grade: 'A - Excellent', date: '2026-07-07', quizId: 'quiz_pak_studies' },
  { name: 'Bilal Siddiqui', score: 28, totalPoints: 30, timeSpentSeconds: 150, grade: 'A1 - Outstanding', date: '2026-07-08', quizId: 'quiz_calculus_101' },
  { name: 'Hamza Malik', score: 18, totalPoints: 30, timeSpentSeconds: 210, grade: 'C - Pass', date: '2026-07-09', quizId: 'quiz_calculus_101' }
];

export const INITIAL_STUDENT_ATTEMPTS: QuizAttempt[] = [
  {
    id: 'att_001',
    studentId: 'std_001',
    studentName: 'Muhammad Ali',
    quizId: 'quiz_pak_studies',
    quizTitle: 'Pakistan Studies & National Geography',
    score: 68,
    totalPoints: 70,
    timeSpentSeconds: 145,
    grade: 'A1 - Outstanding',
    date: '2026-07-07',
    completed: true,
    violationsCount: 0,
    violationsList: [],
    gradedQuestions: [
      { questionId: 'pak_q1', userResponse: 'Lahore', isCorrect: true, pointsAwarded: 10 },
      { questionId: 'pak_q2', userResponse: 'True', isCorrect: true, pointsAwarded: 10 }
    ]
  },
  {
    id: 'att_002',
    studentId: 'std_002',
    studentName: 'Ayesha Khan',
    quizId: 'quiz_pak_studies',
    quizTitle: 'Pakistan Studies & National Geography',
    score: 65,
    totalPoints: 70,
    timeSpentSeconds: 190,
    grade: 'A1 - Outstanding',
    date: '2026-07-06',
    completed: true,
    violationsCount: 2,
    violationsList: [
      {
        id: 'vio_1',
        studentId: 'std_002',
        studentName: 'Ayesha Khan',
        quizId: 'quiz_pak_studies',
        quizTitle: 'Pakistan Studies & National Geography',
        eventType: 'tab-switched',
        timestamp: '2026-07-06T14:32:10Z'
      },
      {
        id: 'vio_2',
        studentId: 'std_002',
        studentName: 'Ayesha Khan',
        quizId: 'quiz_pak_studies',
        quizTitle: 'Pakistan Studies & National Geography',
        eventType: 'lost-focus',
        timestamp: '2026-07-06T14:33:45Z'
      }
    ],
    gradedQuestions: []
  }
];
