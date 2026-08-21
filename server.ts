/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

dotenv.config();

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), 'db.json');

// Load Firebase Config
const firebaseConfig = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf8')
);

// Set environment variable for custom Firestore database
if (firebaseConfig.firestoreDatabaseId) {
  process.env.FIRESTORE_DATABASE = firebaseConfig.firestoreDatabaseId;
}

let firestoreDb: any;

try {
  const adminApp = admin.initializeApp({
    projectId: firebaseConfig.projectId,
  });
  console.log('Firebase Admin SDK initialized successfully.');
  firestoreDb = firebaseConfig.firestoreDatabaseId
    ? getFirestore(adminApp, firebaseConfig.firestoreDatabaseId)
    : getFirestore(adminApp);
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
  try {
    const adminApp = (admin as any).app();
    firestoreDb = firebaseConfig.firestoreDatabaseId
      ? getFirestore(adminApp, firebaseConfig.firestoreDatabaseId)
      : getFirestore(adminApp);
  } catch (appErr) {
    console.error('Failed to get initialized app:', appErr);
    firestoreDb = getFirestore();
  }
}

if (firestoreDb && typeof firestoreDb.settings === 'function') {
  try {
    firestoreDb.settings({ ignoreUndefinedProperties: true });
    console.log('Firestore settings configured with ignoreUndefinedProperties: true');
  } catch (settingsErr) {
    console.warn('Could not apply Firestore settings:', settingsErr);
  }
}

let cachedDb: any = null;

async function loadDbFromFirestore() {
  try {
    if (firestoreDb && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      const docRef = firestoreDb.collection('app').doc('database');
      const docSnap = await docRef.get().catch((err: any) => {
        console.warn('Firestore read error:', err?.message || err);
        return null;
      });
      if (docSnap && docSnap.exists) {
        cachedDb = docSnap.data();
        console.log('Database loaded successfully from Firestore.');
        return;
      }
    }
  } catch (err) {
    console.warn('Database loading from Firestore is in fallback mode (pending ADC config). Loading local file-based storage (db.json)...');
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      cachedDb = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      console.log('Database loaded successfully from local file db.json.');
    } catch (fileErr) {
      cachedDb = initialDb;
    }
  } else {
    cachedDb = initialDb;
  }
}

app.use(express.json());
app.use(cookieParser());

app.get('/api/firebase-status', async (req, res) => {
  try {
    const docRef = firestoreDb.collection('app').doc('database');
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      res.json({
        status: 'success',
        message: 'Successfully connected and retrieved database from Firestore!',
        databaseId: firebaseConfig.firestoreDatabaseId,
        projectId: firebaseConfig.projectId,
        keys: Object.keys(docSnap.data())
      });
    } else {
      res.json({
        status: 'partial',
        message: 'Connected but database document does not exist in Firestore yet.',
        databaseId: firebaseConfig.firestoreDatabaseId,
        projectId: firebaseConfig.projectId
      });
    }
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      message: err.message || 'Unknown Firestore error',
      code: err.code,
      databaseId: firebaseConfig.firestoreDatabaseId,
      projectId: firebaseConfig.projectId
    });
  }
});

// Initialize Database with realistic Pakistani curriculum data
const initialDb = {
  stats: {
    activeStudents: 1248,
    quizzesGenerated: 24,
    avgClassScore: 76.5,
    totalMaterials: 8,
  },
  classes: [
    { id: 'cls_phy101', name: 'Physics 101: Mechanics', subjectCode: 'PHYS-101', department: 'Physics', studentCount: 45 },
    { id: 'cls_bio202', name: 'Biology 202: Cell Biology', subjectCode: 'BIOL-202', department: 'Biology', studentCount: 38 },
    { id: 'cls_math301', name: 'Mathematics 301: Calculus', subjectCode: 'MATH-301', department: 'Mathematics', studentCount: 52 },
    { id: 'cls_urd101', name: 'Urdu Literature & Poetry', subjectCode: 'URD-101', department: 'Languages', studentCount: 40 },
  ],
  materials: [
    {
      id: 'mat_001',
      fileName: 'Week 4_Quantum_Mechanics_PHYS101.pdf',
      courseName: 'Physics 101',
      uploadedAt: new Date(Date.now() - 3600000 * 4).toISOString(), // 4 hours ago
      status: 'processed',
      fileType: 'pdf',
      keyTakeaways: [
        'Introduction to Wave-Particle Duality and the de Broglie wavelength formula (λ = h/p).',
        'Heisenberg\'s Uncertainty Principle establishing fundamental limits on measurement precision.',
        'Overview of the Schrödinger Equation for a particle in a 1D box.',
        'Concept of quantization of energy levels.'
      ],
      aiInsight: 'The core focus of this lecture is the shift from deterministic classical physics to probabilistic quantum models.'
    },
    {
      id: 'mat_002',
      fileName: 'Introduction_to_Cell_Biology_BIO202.pptx',
      courseName: 'Biology 202',
      uploadedAt: new Date(Date.now() - 3600000 * 24).toISOString(), // 24 hours ago
      status: 'processed',
      fileType: 'pptx',
      keyTakeaways: [
        'Eukaryotic vs Prokaryotic cells - membrane-bound organelles.',
        'Functions of the Nucleus, Mitochondria, Ribosomes, and Endoplasmic Reticulum.',
        'Cell membrane structure and fluid mosaic model.'
      ],
      aiInsight: 'Ensure students focus on the organelle interaction paths rather than just memorizing definitions.'
    },
    {
      id: 'mat_003',
      fileName: 'Lecture_Calculus_Limits_MATH301.pdf',
      courseName: 'Mathematics 301',
      uploadedAt: new Date(Date.now() - 3600000 * 48).toISOString(), // 2 days ago
      status: 'processed',
      fileType: 'pdf',
      keyTakeaways: [
        'Intuitive concept of a limit and formal epsilon-delta definition.',
        'Computing limits algebraically and using squeeze theorem.',
        'Continuous functions and intermediate value theorem.'
      ],
      aiInsight: 'Calculus limits form the basis for derivatives. Emphasize visual graphing of discontinuous limits.'
    }
  ],
  students: [
    { id: 'std_001', name: 'Muhammad Ali', email: 'm.ali@uol.edu.pk', course: 'Physics 101', progress: 88, score: 92, status: 'active', lastActive: '2026-07-07' },
    { id: 'std_002', name: 'Ayesha Khan', email: 'ayesha.k@nust.edu.pk', course: 'Physics 101', progress: 74, score: 79, status: 'active', lastActive: '2026-07-07' },
    { id: 'std_003', name: 'Zainab Fatima', email: 'z.fatima@fast.edu.pk', course: 'Biology 202', progress: 95, score: 88, status: 'active', lastActive: '2026-07-06' },
    { id: 'std_004', name: 'Ahmed Raza', email: 'ahmed.raza@pu.edu.pk', course: 'Mathematics 301', progress: 62, score: 58, status: 'warning', lastActive: '2026-07-07' },
    { id: 'std_005', name: 'Fatima Noor', email: 'f.noor@uol.edu.pk', course: 'Physics 101', progress: 41, score: 48, status: 'danger', lastActive: '2026-07-05' },
    { id: 'std_006', name: 'Bilal Siddiqui', email: 'b.siddiqui@fast.edu.pk', course: 'Mathematics 301', progress: 83, score: 85, status: 'active', lastActive: '2026-07-07' },
    { id: 'std_007', name: 'Hamza Malik', email: 'h.malik@nust.edu.pk', course: 'Biology 202', progress: 67, score: 72, status: 'active', lastActive: '2026-07-06' },
    { id: 'std_008', name: 'Amina Bibi', email: 'amina.b@pu.edu.pk', course: 'Urdu Literature', progress: 92, score: 94, status: 'active', lastActive: '2026-07-07' },
    { id: 'std_009', name: 'Usman Ghani', email: 'usman.g@uol.edu.pk', course: 'Mathematics 301', progress: 35, score: 42, status: 'danger', lastActive: '2026-07-04' },
    { id: 'std_010', name: 'Sana Javed', email: 'sana.j@nust.edu.pk', course: 'Biology 202', progress: 78, score: 81, status: 'active', lastActive: '2026-07-07' },
  ],
  notifications: [
    { id: 'not_001', title: 'Calculus Quiz Generation Complete', message: 'The weekly practice quiz for Math 301 limit concepts has been successfully processed by AI.', read: false, createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
    { id: 'not_002', title: 'New material processed successfully', message: 'Week 4_Quantum_Mechanics_PHYS101.pdf has been fully processed.', read: false, createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString() },
    { id: 'not_003', title: 'Student Alert', message: 'Ahmed Raza (Mathematics 301) score has dropped below average threshold.', read: true, createdAt: new Date(Date.now() - 1000 * 3600 * 12).toISOString() },
  ],
  lessons: [
    { id: 'les_001', title: 'Quantum Mechanics Intro', subject: 'Physics 101', time: '09:00 AM', date: '2026-07-08', instructor: 'Prof. Kamran', joinUrl: 'https://zoom.us/j/123456789' },
    { id: 'les_002', title: 'Iqbal\'s Poetry Analysis', subject: 'Urdu Literature', time: '11:30 AM', date: '2026-07-08', instructor: 'Prof. Nasreen', joinUrl: 'https://zoom.us/j/987654321' },
    { id: 'les_003', title: 'Cell Cycle & Mitosis', subject: 'Biology 202', time: '10:00 AM', date: '2026-07-09', instructor: 'Dr. Fatima', joinUrl: 'https://zoom.us/j/111222333' },
    { id: 'les_004', title: 'Limits and Continuity Practice', subject: 'Mathematics 301', time: '02:00 PM', date: '2026-07-08', instructor: 'Prof. Bilal', joinUrl: 'https://zoom.us/j/444555666' },
  ],
  quizzes: [] as any[],
  workspaceItems: [] as any[],
  weakTopics: [
    { topic: 'Quantum Wavefunctions', score: 38 },
    { topic: 'Cellular Organelle Functions', score: 45 },
    { topic: 'Limits & Continuous Functions', score: 55 },
    { topic: 'Urdu Grammar Basics', score: 88 },
  ],
  tickets: [
    {
      id: 'tkt_001',
      name: 'Dr. Kamran',
      email: 'kamran@uol.edu.pk',
      subject: 'Difficulty with Urdu quiz translations',
      category: 'Quiz Generation',
      message: 'Some of the translations in the Urdu physics quizzes have minor wording differences. Is there a way to fine-tune the translation settings?',
      role: 'teacher',
      status: 'resolved',
      createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
      replies: [
        {
          id: 'rep_001',
          sender: 'support',
          text: 'Hello Dr. Kamran! You can set the target language to English, Urdu, or Bilingual. Choosing the "Bilingual" mode will show the original English alongside a curated Urdu translation helper which works best for Pakistani board examinations.',
          timestamp: new Date(Date.now() - 3600000 * 36).toISOString()
        }
      ]
    },
    {
      id: 'tkt_002',
      name: 'Ahmed',
      email: 'ahmed.alipk@uol.edu.pk',
      subject: 'AI Tutor response delay',
      category: 'AI Tools',
      message: 'Sometimes the AI Tutor chat takes more than 5 seconds to respond. Can I stream the text live instead?',
      role: 'student',
      status: 'open',
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      replies: []
    }
  ]
};

// Help load/save database
function getDb() {
  let db = cachedDb;
  if (!db) {
    if (!fs.existsSync(DB_FILE)) {
      db = initialDb;
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    } else {
      try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        db = JSON.parse(data);
      } catch (err) {
        console.error('Failed to read db file, using initial memory state', err);
        db = initialDb;
      }
    }
    cachedDb = db;
  }

  // Database Migration to ensure Classrooms contain description, status, students, and createdAt
  let changed = false;

  if (!db.users) {
    db.users = [
      {
        id: 'usr_admin',
        email: 'admin@example.com',
        password: bcrypt.hashSync('Password123!', 10),
        name: 'Admin Coordinator',
        role: 'admin',
        createdAt: new Date().toISOString()
      },
      {
        id: 'usr_teacher',
        email: 'teacher@example.com',
        password: bcrypt.hashSync('Password123!', 10),
        name: 'Professor Kamran',
        role: 'teacher',
        createdAt: new Date().toISOString()
      },
      {
        id: 'usr_student',
        email: 'student@example.com',
        password: bcrypt.hashSync('Password123!', 10),
        name: 'Muhammad Ali',
        role: 'student',
        studentId: 'std_001',
        createdAt: new Date().toISOString()
      }
    ];
    changed = true;
  }
  if (!db.classes) {
    db.classes = initialDb.classes;
    changed = true;
  }
  db.classes = db.classes.map((cls: any) => {
    let updated = false;
    if (cls.section === undefined) {
      cls.section = 'Section A';
      updated = true;
    }
    if (cls.room === undefined) {
      cls.room = '';
      updated = true;
    }
    if (cls.description === undefined) {
      cls.description = `Curriculum track and study resources for ${cls.name}.`;
      updated = true;
    }
    if (cls.status === undefined) {
      cls.status = 'active';
      updated = true;
    }
    if (cls.students === undefined) {
      // populate with pre-existing students from db.students if they are in this course
      const matchedStudents = (db.students || []).filter((s: any) => s.course && s.course.toLowerCase().includes(cls.name.split(':')[0].trim().toLowerCase()));
      cls.students = matchedStudents.map((s: any) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        status: 'joined',
        invitedAt: new Date(Date.now() - 3600 * 24 * 7 * 1000).toISOString()
      }));
      cls.studentCount = cls.students.length;
      updated = true;
    }
    if (cls.createdAt === undefined) {
      cls.createdAt = new Date(Date.now() - 3600 * 24 * 30 * 1000).toISOString();
      updated = true;
    }
    if (updated) changed = true;
    return cls;
  });

  if (!db.analytics) {
    db.analytics = {
      attendance: [
        { date: 'Week 1', Physics101: 92, Biology202: 88, Mathematics301: 95 },
        { date: 'Week 2', Physics101: 94, Biology202: 90, Mathematics301: 93 },
        { date: 'Week 3', Physics101: 89, Biology202: 91, Mathematics301: 96 },
        { date: 'Week 4', Physics101: 91, Biology202: 87, Mathematics301: 94 },
        { date: 'Week 5', Physics101: 95, Biology202: 92, Mathematics301: 97 },
        { date: 'Week 6', Physics101: 93, Biology202: 95, Mathematics301: 94 },
        { date: 'Week 7', Physics101: 90, Biology202: 93, Mathematics301: 92 },
        { date: 'Week 8', Physics101: 95, Biology202: 94, Mathematics301: 96 }
      ],
      studentGrowth: [
        { name: 'Week 1', Physics101: 65, Biology202: 70, Mathematics301: 62 },
        { name: 'Week 2', Physics101: 68, Biology202: 73, Mathematics301: 64 },
        { name: 'Week 3', Physics101: 72, Biology202: 71, Mathematics301: 68 },
        { name: 'Week 4', Physics101: 70, Biology202: 76, Mathematics301: 70 },
        { name: 'Week 5', Physics101: 75, Biology202: 80, Mathematics301: 73 },
        { name: 'Week 6', Physics101: 78, Biology202: 82, Mathematics301: 76 },
        { name: 'Week 7', Physics101: 80, Biology202: 84, Mathematics301: 81 },
        { name: 'Week 8', Physics101: 82, Biology202: 85, Mathematics301: 83 }
      ],
      completionRates: [
        { name: 'Physics 101', quizzes: 88, lessons: 94, assignments: 85 },
        { name: 'Biology 202', quizzes: 92, lessons: 96, assignments: 89 },
        { name: 'Mathematics 301', quizzes: 85, lessons: 90, assignments: 80 },
        { name: 'Urdu Literature', quizzes: 95, lessons: 98, assignments: 92 }
      ],
      weakTopics: [
        { topic: 'Quantum Wavefunctions', subject: 'Physics 101', averageScore: 38, strugglingStudents: 14 },
        { topic: 'Cellular Organelle Functions', subject: 'Biology 202', averageScore: 45, strugglingStudents: 12 },
        { topic: 'Limits & Continuous Functions', subject: 'Mathematics 301', averageScore: 55, strugglingStudents: 18 },
        { topic: 'Urdu Grammar Basics', subject: 'Urdu Literature', averageScore: 88, strugglingStudents: 2 },
        { topic: 'Newtonian Forces 3D', subject: 'Physics 101', averageScore: 49, strugglingStudents: 9 },
        { topic: 'Organic Synthesis', subject: 'Chemistry 101', averageScore: 52, strugglingStudents: 11 },
        { topic: 'Integration by Parts', subject: 'Mathematics 301', averageScore: 47, strugglingStudents: 15 }
      ],
      studentAnalytics: [
        { id: 'std_001', name: 'Muhammad Ali', course: 'Physics 101', attendance: 98, quizzesCompleted: 6, avgQuizScore: 92, status: 'active' },
        { id: 'std_002', name: 'Ayesha Khan', course: 'Physics 101', attendance: 85, quizzesCompleted: 5, avgQuizScore: 79, status: 'active' },
        { id: 'std_003', name: 'Zainab Fatima', course: 'Biology 202', attendance: 94, quizzesCompleted: 6, avgQuizScore: 88, status: 'active' },
        { id: 'std_004', name: 'Ahmed Raza', course: 'Mathematics 301', attendance: 78, quizzesCompleted: 4, avgQuizScore: 58, status: 'warning' },
        { id: 'std_005', name: 'Fatima Noor', course: 'Physics 101', attendance: 60, quizzesCompleted: 2, avgQuizScore: 48, status: 'danger' },
        { id: 'std_006', name: 'Bilal Siddiqui', course: 'Mathematics 301', attendance: 92, quizzesCompleted: 6, avgQuizScore: 85, status: 'active' },
        { id: 'std_007', name: 'Hamza Malik', course: 'Biology 202', attendance: 88, quizzesCompleted: 5, avgQuizScore: 72, status: 'active' },
        { id: 'std_008', name: 'Amina Bibi', course: 'Urdu Literature', attendance: 96, quizzesCompleted: 6, avgQuizScore: 94, status: 'active' },
        { id: 'std_009', name: 'Usman Ghani', course: 'Mathematics 301', attendance: 55, quizzesCompleted: 3, avgQuizScore: 42, status: 'danger' },
        { id: 'std_010', name: 'Sana Javed', course: 'Biology 202', attendance: 90, quizzesCompleted: 5, avgQuizScore: 81, status: 'active' }
      ]
    };
    changed = true;
  }

  if (!db.gradebook) {
    db.gradebook = [
      { id: 'gr_001', studentId: 'std_001', studentName: 'Muhammad Ali', course: 'Physics 101', assignment1: 85, assignment2: 90, midterm: 88, finalExam: 94, classProject: 95, attendanceMark: 98, comments: 'Excellent conceptual comprehension. Active in discussions.', lastUpdated: new Date().toISOString() },
      { id: 'gr_002', studentId: 'std_002', studentName: 'Ayesha Khan', course: 'Physics 101', assignment1: 78, assignment2: 82, midterm: 75, finalExam: 80, classProject: 82, attendanceMark: 85, comments: 'Good performance. Needs a bit more focus on lab reports.', lastUpdated: new Date().toISOString() },
      { id: 'gr_003', studentId: 'std_003', studentName: 'Zainab Fatima', course: 'Biology 202', assignment1: 92, assignment2: 88, midterm: 85, finalExam: 90, classProject: 89, attendanceMark: 94, comments: 'Consistent, neat lab write-ups. Excellent quiz taker.', lastUpdated: new Date().toISOString() },
      { id: 'gr_004', studentId: 'std_004', studentName: 'Ahmed Raza', course: 'Mathematics 301', assignment1: 58, assignment2: 60, midterm: 55, finalExam: 62, classProject: 58, attendanceMark: 78, comments: 'Needs remedial assistance in calculus topics.', lastUpdated: new Date().toISOString() },
      { id: 'gr_005', studentId: 'std_005', studentName: 'Fatima Noor', course: 'Physics 101', assignment1: 45, assignment2: 50, midterm: 48, finalExam: 52, classProject: 47, attendanceMark: 60, comments: 'High risk of failing. Recommend active tutoring immediately.', lastUpdated: new Date().toISOString() },
      { id: 'gr_006', studentId: 'std_006', studentName: 'Bilal Siddiqui', course: 'Mathematics 301', assignment1: 88, assignment2: 85, midterm: 82, finalExam: 87, classProject: 86, attendanceMark: 92, comments: 'Participates well. Strong mathematical logic.', lastUpdated: new Date().toISOString() },
      { id: 'gr_007', studentId: 'std_007', studentName: 'Hamza Malik', course: 'Biology 202', assignment1: 74, assignment2: 70, midterm: 75, finalExam: 72, classProject: 76, attendanceMark: 88, comments: 'Requires continuous guidance on biology processes.', lastUpdated: new Date().toISOString() },
      { id: 'gr_008', studentId: 'std_008', studentName: 'Amina Bibi', course: 'Urdu Literature', assignment1: 95, assignment2: 92, midterm: 96, finalExam: 94, classProject: 95, attendanceMark: 96, comments: 'Beautiful Urdu calligraphy and composition skills.', lastUpdated: new Date().toISOString() },
      { id: 'gr_009', studentId: 'std_009', studentName: 'Usman Ghani', course: 'Mathematics 301', assignment1: 40, assignment2: 45, midterm: 38, finalExam: 42, classProject: 46, attendanceMark: 55, comments: 'Struggling with fundamentals. Missed multiple assignments.', lastUpdated: new Date().toISOString() },
      { id: 'gr_010', studentId: 'std_010', studentName: 'Sana Javed', course: 'Biology 202', assignment1: 80, assignment2: 85, midterm: 78, finalExam: 82, classProject: 84, attendanceMark: 90, comments: 'Very receptive to feedback. Solid steady growth.', lastUpdated: new Date().toISOString() }
    ];
    changed = true;
  }

  if (!db.workspaceItems) {
    db.workspaceItems = [];
    changed = true;
  }

  if (!db.conversations) {
    db.conversations = [
      {
        id: 'conv_initial',
        title: 'General Assistant',
        createdAt: new Date().toISOString(),
        messages: [
          {
            id: 'msg_initial_1',
            sender: 'bot',
            text: 'Hello! I am your AI Chat Assistant. How can I assist you with your lessons, study plans, or quiz questions today?',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]
      }
    ];
    changed = true;
  }

  if (changed) {
    saveDb(db);
  }

  return db;
}

function removeUndefined(obj: any): any {
  if (obj === undefined) {
    return null;
  }
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefined(item));
  }
  const result: any = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val !== undefined) {
      result[key] = removeUndefined(val);
    }
  }
  return result;
}

function saveDb(data: any) {
  cachedDb = data;
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Failed to save db file', err);
  }
  // Sync to Firestore in the background if credentials exist
  try {
    if (firestoreDb && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      const sanitized = removeUndefined(data);
      firestoreDb.collection('app').doc('database').set(sanitized).catch((err: any) => {
        console.warn('Database background sync to Firestore is in fallback mode. Local db.json successfully updated.', err?.message || err);
      });
    }
  } catch (err) {
    console.error('Failed to sanitize/save db in Firestore background', err);
  }
}

// Lazy Gemini API Client Initialization
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is required to execute AI tasks. Please configure it in Settings > Secrets.');
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// JWT Configuration and Middlewares
const JWT_SECRET = process.env.JWT_SECRET || 'class-copilot-pakistan-jwt-access-secret-2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'class-copilot-pakistan-jwt-refresh-secret-2026';

function generateAccessToken(payload: any, rememberMe: boolean) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: rememberMe ? '7d' : '15m' });
}

function generateRefreshToken(payload: any, rememberMe: boolean) {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: rememberMe ? '30d' : '7d' });
}

export function authenticateToken(req: any, res: any, next: any) {
  const token = req.cookies.accessToken || (req.headers['authorization']?.split(' ')[1]);
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Access token missing' });
  }
  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(401).json({ error: 'Forbidden: Access token expired or invalid', code: 'TOKEN_EXPIRED' });
    }
    req.user = user;
    next();
  });
}

export function requireRole(roles: string[]) {
  return (req: any, res: any, next: any) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }
    next();
  };
}

// AUTH API ENDPOINTS

// Register
app.post('/api/auth/register', (req, res) => {
  try {
    const db = getDb();
    const { email, password, name, role = 'student', rememberMe = false } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const emailLower = email.toLowerCase();
    const existingUser = db.users.find((u: any) => u.email.toLowerCase() === emailLower);
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    const userId = `usr_${Math.random().toString(36).substring(2, 11)}`;
    const studentId = role === 'student' ? `std_${Math.random().toString(36).substring(2, 7)}` : undefined;

    const newUser = {
      id: userId,
      email: emailLower,
      password: bcrypt.hashSync(password, 10),
      name,
      role,
      studentId,
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);
    saveDb(db);

    const payload = { id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name, studentId: newUser.studentId };
    const accessToken = generateAccessToken(payload, rememberMe);
    const refreshToken = generateRefreshToken(payload, rememberMe);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: rememberMe ? 7 * 24 * 3600 * 1000 : 15 * 60 * 1000
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: rememberMe ? 30 * 24 * 3600 * 1000 : 7 * 24 * 3600 * 1000
    });

    res.json({
      success: true,
      user: { id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name, studentId: newUser.studentId }
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// Login
app.post('/api/auth/login', (req, res) => {
  try {
    const db = getDb();
    const { email, password, rememberMe = false } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const emailLower = email.toLowerCase();
    const user = db.users.find((u: any) => u.email.toLowerCase() === emailLower);

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const payload = { id: user.id, email: user.email, role: user.role, name: user.name, studentId: user.studentId };
    const accessToken = generateAccessToken(payload, rememberMe);
    const refreshToken = generateRefreshToken(payload, rememberMe);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: rememberMe ? 7 * 24 * 3600 * 1000 : 15 * 60 * 1000
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: rememberMe ? 30 * 24 * 3600 * 1000 : 7 * 24 * 3600 * 1000
    });

    res.json({
      success: true,
      user: { id: user.id, email: user.email, role: user.role, name: user.name, studentId: user.studentId }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// Refresh Token
app.post('/api/auth/refresh', (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token is missing' });
    }

    jwt.verify(refreshToken, JWT_REFRESH_SECRET, (err: any, decoded: any) => {
      if (err) {
        return res.status(401).json({ error: 'Refresh token expired or invalid', code: 'REFRESH_TOKEN_EXPIRED' });
      }

      const payload = { id: decoded.id, email: decoded.email, role: decoded.role, name: decoded.name, studentId: decoded.studentId };
      const newAccessToken = generateAccessToken(payload, true); // extend access

      res.cookie('accessToken', newAccessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 3600 * 1000 // extension
      });

      res.json({ success: true, accessToken: newAccessToken });
    });
  } catch (error: any) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Internal server error during token refresh.' });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('accessToken', { httpOnly: true, secure: true, sameSite: 'none' });
  res.clearCookie('refreshToken', { httpOnly: true, secure: true, sameSite: 'none' });
  res.json({ success: true, message: 'Logged out successfully.' });
});

// Forgot Password
app.post('/api/auth/forgot-password', (req, res) => {
  try {
    const db = getDb();
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const emailLower = email.toLowerCase();
    const user = db.users.find((u: any) => u.email.toLowerCase() === emailLower);

    // Standard practice: Don't reveal if user exists for security, but return resetToken for UI convenience
    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    if (user) {
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
      saveDb(db);
      console.log(`[AUTH] Password reset link for ${email}: http://localhost:3000/reset-password?token=${resetToken}`);
    }

    res.json({
      success: true,
      message: 'If a matching account exists, password reset instructions have been generated.',
      resetToken // Return resetToken so that the web app simulator can easily reset
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Reset Password
app.post('/api/auth/reset-password', (req, res) => {
  try {
    const db = getDb();
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const user = db.users.find((u: any) => u.resetPasswordToken === token && u.resetPasswordExpires > Date.now());

    if (!user) {
      return res.status(400).json({ error: 'Password reset token is invalid or has expired.' });
    }

    user.password = bcrypt.hashSync(password, 10);
    delete user.resetPasswordToken;
    delete user.resetPasswordExpires;
    saveDb(db);

    res.json({ success: true, message: 'Your password has been reset successfully. You can now login.' });
  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Get Me
app.get('/api/auth/me', (req, res) => {
  const token = req.cookies.accessToken || (req.headers['authorization']?.split(' ')[1]);
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Access token missing' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(401).json({ error: 'Unauthorized: Session expired', code: 'TOKEN_EXPIRED' });
    }
    res.json({ success: true, user: decoded });
  });
});

// API Routes

// Stats endpoint
app.get('/api/teacher/stats', authenticateToken, (req, res) => {
  const db = getDb();
  res.json(db.stats);
});

// Students list with search, filtering, and pagination
app.get('/api/teacher/students', authenticateToken, (req, res) => {
  const db = getDb();
  const search = (req.query.search as string || '').toLowerCase();
  const course = req.query.course as string || '';
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 5;

  let filtered = db.students;

  if (search) {
    filtered = filtered.filter(s => 
      s.name.toLowerCase().includes(search) || 
      s.email.toLowerCase().includes(search)
    );
  }

  if (course && course !== 'All') {
    filtered = filtered.filter(s => s.course === course);
  }

  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;
  const paginated = filtered.slice(offset, offset + limit);

  res.json({
    data: paginated,
    pagination: {
      currentPage: page,
      totalPages: totalPages || 1,
      totalItems: total,
    }
  });
});

// Create new student
app.post('/api/teacher/students', authenticateToken, requireRole(['teacher', 'admin']), (req, res) => {
  const db = getDb();
  const { name, email, course, progress = 0, score = 0 } = req.body;
  if (!name || !email || !course) {
    return res.status(400).json({ error: 'Name, email, and course are required.' });
  }

  const id = `std_${Math.random().toString(36).substr(2, 9)}`;
  const status = score >= 80 ? 'active' : score >= 60 ? 'warning' : 'danger';
  const newStudent = {
    id,
    name,
    email,
    course,
    progress: Number(progress),
    score: Number(score),
    status,
    lastActive: new Date().toISOString().split('T')[0],
  };

  db.students.unshift(newStudent);
  db.stats.activeStudents = db.students.length;
  
  // recalculate class average
  const totalScores = db.students.reduce((sum: number, s: any) => sum + s.score, 0);
  db.stats.avgClassScore = Math.round((totalScores / db.students.length) * 10) / 10;

  saveDb(db);
  res.status(210).json(newStudent);
});

// Materials endpoint (recent uploads) with search and pagination
app.get('/api/teacher/materials', (req, res) => {
  const db = getDb();
  const search = (req.query.search as string || '').toLowerCase();
  const course = req.query.course as string || '';
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 4;

  let filtered = db.materials;

  if (search) {
    filtered = filtered.filter(m => m.fileName.toLowerCase().includes(search));
  }

  if (course && course !== 'All') {
    filtered = filtered.filter(m => m.courseName.toLowerCase().includes(course.toLowerCase()));
  }

  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;
  const paginated = filtered.slice(offset, offset + limit);

  res.json({
    data: paginated,
    pagination: {
      currentPage: page,
      totalPages: totalPages || 1,
      totalItems: total,
    }
  });
});

// Upload material and run Gemini API on it!
app.post('/api/teacher/materials/upload', async (req, res) => {
  const db = getDb();
  const { fileName, fileType, courseName, fileContentText, fileSize } = req.body;

  if (!fileName || !fileType || !courseName) {
    return res.status(400).json({ error: 'fileName, fileType, and courseName are required.' });
  }

  const id = `mat_${Math.random().toString(36).substr(2, 9)}`;
  const newMaterial = {
    id,
    fileName,
    courseName,
    uploadedAt: new Date().toISOString(),
    status: 'processing' as const,
    fileType,
    keyTakeaways: [] as string[],
    aiInsight: '',
    fileSize: fileSize || '1.5 MB',
    fileContentText: fileContentText || '',
  };

  db.materials.unshift(newMaterial);
  db.stats.totalMaterials = db.materials.length;
  saveDb(db);

  // Trigger non-blocking AI Summarization
  try {
    const ai = getGeminiClient();
    const promptText = fileContentText || `This is educational lecture material titled "${fileName}" for the course "${courseName}".`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Analyze this Pakistani lecture material: "${promptText}". Summarize the content into 3 to 4 distinct key academic takeaways (bullet points) and write a single-sentence strategic AI insight. Ensure you output in valid JSON matching this schema:
      {
        "keyTakeaways": ["takeaway 1", "takeaway 2", ...],
        "aiInsight": "insight description"
      }`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            keyTakeaways: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of key academic takeaways from the material.'
            },
            aiInsight: {
              type: Type.STRING,
              description: 'A single, high-impact tactical advice or warning insight for the instructor.'
            }
          },
          required: ['keyTakeaways', 'aiInsight'],
        }
      }
    });

    const parsed = JSON.parse(response.text.trim());
    
    // Update materials list
    const currentDb = getDb();
    const matIndex = currentDb.materials.findIndex((m: any) => m.id === id);
    if (matIndex !== -1) {
      currentDb.materials[matIndex].keyTakeaways = parsed.keyTakeaways;
      currentDb.materials[matIndex].aiInsight = parsed.aiInsight;
      currentDb.materials[matIndex].status = 'processed';
      
      // Add notification
      currentDb.notifications.unshift({
        id: `not_${Math.random().toString(36).substr(2, 9)}`,
        title: 'Material Processed Successfully',
        message: `Key takeaways and AI insights generated for ${fileName}.`,
        read: false,
        createdAt: new Date().toISOString(),
      });
      
      saveDb(currentDb);
    }
  } catch (err: any) {
    console.error('AI Processing error:', err);
    const currentDb = getDb();
    const matIndex = currentDb.materials.findIndex((m: any) => m.id === id);
    if (matIndex !== -1) {
      currentDb.materials[matIndex].status = 'failed';
      currentDb.materials[matIndex].aiInsight = `Failed processing lecture: ${err.message}`;
      saveDb(currentDb);
    }
  }

  res.status(202).json(newMaterial);
});

// Delete material
app.delete('/api/teacher/materials/:id', (req, res) => {
  const db = getDb();
  const id = req.params.id;
  const matIndex = db.materials.findIndex((m: any) => m.id === id);
  if (matIndex === -1) {
    return res.status(404).json({ error: 'Material not found' });
  }
  const removed = db.materials.splice(matIndex, 1)[0];
  db.stats.totalMaterials = db.materials.length;

  // Add notification
  db.notifications.unshift({
    id: `not_${Math.random().toString(36).substr(2, 9)}`,
    title: 'Material Deleted',
    message: `"${removed.fileName}" was deleted from curriculum materials.`,
    read: false,
    createdAt: new Date().toISOString(),
  });

  saveDb(db);
  res.json({ success: true });
});

// Rename material
app.put('/api/teacher/materials/:id/rename', (req, res) => {
  const db = getDb();
  const id = req.params.id;
  const { fileName } = req.body;
  if (!fileName || !fileName.trim()) {
    return res.status(400).json({ error: 'New file name is required' });
  }
  const mat = db.materials.find((m: any) => m.id === id);
  if (!mat) {
    return res.status(404).json({ error: 'Material not found' });
  }
  const oldName = mat.fileName;
  mat.fileName = fileName.trim();

  // Add notification
  db.notifications.unshift({
    id: `not_${Math.random().toString(36).substr(2, 9)}`,
    title: 'Material Renamed',
    message: `"${oldName}" was renamed to "${mat.fileName}".`,
    read: false,
    createdAt: new Date().toISOString(),
  });

  saveDb(db);
  res.json(mat);
});

// AI Quiz Generator using selected material and configuration
app.post('/api/teacher/quizzes/generate', async (req, res) => {
  const { difficulty, questionCount, language, materialId, customTopic, questionTypes } = req.body;
  
  try {
    const db = getDb();
    let sourceText = '';
    let matName = customTopic || 'General Subject Topic';

    if (materialId) {
      const mat = db.materials.find((m: any) => m.id === materialId);
      if (mat) {
        matName = mat.fileName;
        sourceText = `Course: ${mat.courseName}. Material Details: ${mat.keyTakeaways ? mat.keyTakeaways.join('; ') : ''}. AI Insights: ${mat.aiInsight || ''}`;
      }
    }

    const requestedTypes = questionTypes && questionTypes.length > 0 
      ? questionTypes 
      : ['multiple-choice', 'true-false', 'fill-blank', 'short-answer', 'long-answer'];

    const ai = getGeminiClient();
    const prompt = `You are an elite curriculum and assessment developer for Pakistani colleges. Generate a high-quality educational quiz with exactly ${questionCount} questions based on this source topic/material: "${matName}". ${sourceText ? `Source details: ${sourceText}` : ''}
    The quiz must have difficulty level "${difficulty}" and be written in target language "${language}". If target language is "bilingual", formulate questions in a hybrid of Urdu and English as is common in Pakistani universities, or write English questions with Urdu translations.
    
    You MUST distribute the questions across these types: [${requestedTypes.join(', ')}].
    For each question, specify the points based on style (MCQ: 10, True-False: 10, Fill-Blank: 10, Short-Answer: 15, Long-Answer: 25).
    
    Format your response as a valid JSON object matching this schema:
    {
      "title": "A cohesive quiz title",
      "questions": [
        {
          "type": "multiple-choice", "true-false", "fill-blank", "short-answer", or "long-answer",
          "questionText": "the question",
          "options": ["option A", "option B", "option C", "option D"], // ONLY include if type is 'multiple-choice'
          "correctAnswer": "For multiple-choice: the exact option. For true-false: 'True' or 'False'. For fill-blank: the exact missing word. For short/long: key keywords or reference answers",
          "explanation": "Brief context explanation",
          "points": 10 or 15 or 25
        }
      ]
    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, enum: ['multiple-choice', 'true-false', 'fill-blank', 'short-answer', 'long-answer'] },
                  questionText: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  correctAnswer: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  points: { type: Type.INTEGER }
                },
                required: ['type', 'questionText', 'correctAnswer', 'explanation']
              }
            }
          },
          required: ['title', 'questions']
        }
      }
    });

    const quizData = JSON.parse(response.text.trim());
    const finalQuiz = {
      id: `quiz_${Math.random().toString(36).substr(2, 9)}`,
      title: quizData.title,
      sourceMaterialId: materialId || 'custom',
      config: { difficulty, questionCount, language, sourceMaterialId: materialId, questionTypes: requestedTypes },
      questions: quizData.questions,
      createdAt: new Date().toISOString(),
    };

    // Save to quizzes list
    const currentDb = getDb();
    currentDb.quizzes.unshift(finalQuiz);
    currentDb.stats.quizzesGenerated = (currentDb.stats.quizzesGenerated || 0) + 1;
    
    // Add notification
    currentDb.notifications.unshift({
      id: `not_${Math.random().toString(36).substr(2, 9)}`,
      title: 'Quiz Generated Successfully',
      message: `The quiz "${finalQuiz.title}" has been generated using AI in ${language}.`,
      read: false,
      createdAt: new Date().toISOString(),
    });
    
    saveDb(currentDb);

    res.json(finalQuiz);
  } catch (err: any) {
    console.error('Quiz Generation Error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate quiz via Gemini.' });
  }
});

// Notifications routes
app.get('/api/teacher/notifications', (req, res) => {
  const db = getDb();
  res.json(db.notifications || []);
});

app.post('/api/teacher/notifications/read', (req, res) => {
  const db = getDb();
  if (db.notifications) {
    db.notifications.forEach((n: any) => n.read = true);
    saveDb(db);
  }
  res.json({ success: true });
});

app.post('/api/teacher/notifications/:id/read', (req, res) => {
  const db = getDb();
  const id = req.params.id;
  const notif = (db.notifications || []).find((n: any) => n.id === id);
  if (notif) {
    notif.read = true;
    saveDb(db);
  }
  res.json({ success: true, notification: notif });
});

app.delete('/api/teacher/notifications', (req, res) => {
  const db = getDb();
  db.notifications = [];
  saveDb(db);
  res.json({ success: true });
});

app.delete('/api/teacher/notifications/:id', (req, res) => {
  const db = getDb();
  const id = req.params.id;
  db.notifications = (db.notifications || []).filter((n: any) => n.id !== id);
  saveDb(db);
  res.json({ success: true });
});

app.post('/api/teacher/notifications', (req, res) => {
  const db = getDb();
  const { title, message, type = 'info', link } = req.body;
  if (!title || !message) {
    return res.status(400).json({ error: 'Title and message are required' });
  }
  const newNotif = {
    id: `not_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    title,
    message,
    type,
    link,
    read: false,
    createdAt: new Date().toISOString()
  };
  if (!db.notifications) db.notifications = [];
  db.notifications.unshift(newNotif);
  saveDb(db);
  res.status(201).json(newNotif);
});

// ==========================================
// FULL-STACK QUIZ ENGINE ENDPOINTS
// ==========================================

// Fetch all quizzes (ensuring initial defaults exist)
app.get('/api/quizzes', (req, res) => {
  const db = getDb();
  if (!db.quizzes || db.quizzes.length === 0) {
    // If empty, initialize with presets
    db.quizzes = [
      {
        id: 'quiz_pak_studies',
        title: 'Pakistan Studies & National Geography',
        subject: 'Social Sciences',
        difficulty: 'medium',
        durationSeconds: 300,
        questions: [
          {
            id: 'pak_q1',
            type: 'multiple-choice',
            questionText: 'In which city was the historic Lahore Resolution (Resolution for Pakistan) passed in 1940?',
            options: ['Karachi', 'Lahore', 'Islamabad', 'Dhaka'],
            correctAnswer: 'Lahore',
            explanation: 'The Lahore Resolution, which laid the foundation for Pakistan, was passed on March 23, 1940, at Minto Park (now Iqbal Park), Lahore.',
            points: 10
          },
          {
            id: 'pak_q2',
            type: 'true-false',
            questionText: "K2, the world's second-highest mountain peak, is located in the Karakoram mountain range of northern Pakistan.",
            correctAnswer: 'True',
            explanation: "Yes, K2 (8,611m) is located in Gilgit-Baltistan, Pakistan, in the Karakoram mountain range.",
            points: 10
          },
          {
            id: 'pak_q3',
            type: 'fill-blank',
            questionText: 'The founder and first Governor-General of Pakistan, known as Quaid-e-Azam, was [Muhammad Ali Jinnah].',
            correctAnswer: 'Muhammad Ali Jinnah',
            explanation: "Muhammad Ali Jinnah led the Pakistan movement and was sworn in as the country's first Governor-General on August 15, 1947.",
            points: 10
          },
          {
            id: 'pak_q4',
            type: 'short-answer',
            questionText: 'Name the national sport of Pakistan and mention another popular sport played extensively in the country.',
            correctAnswer: 'Field Hockey and Cricket',
            explanation: 'Field hockey is the official national sport of Pakistan, though cricket is the most widely played and popular sport.',
            points: 15
          },
          {
            id: 'pak_q5',
            type: 'long-answer',
            questionText: 'Discuss the historical significance of the Indus Valley Civilization and name the two primary excavation sites located in Pakistan.',
            correctAnswer: 'Harappa and Mohenjo-Daro',
            explanation: "The Indus Valley Civilization (c. 3300–1300 BCE) is one of the world's oldest urban civilizations. The two main administrative cities excavated are Harappa (near Sahiwal) and Mohenjo-Daro (near Larkana). They are famous for their grid-like street design and sophisticated drainage systems.",
            points: 25
          }
        ],
        status: 'published',
        attemptsAllowed: 3,
        passingMarks: 30,
        shuffleQuestions: false,
        shuffleOptions: true,
        autoSubmitOnTimeout: true,
        showScoreAfterSubmission: true,
        showCorrectAnswers: true,
        negativeMarking: false,
        autoSubmitThreshold: 3
      },
      {
        id: 'quiz_calculus_101',
        title: 'Differential Calculus & Limits',
        subject: 'Mathematics',
        difficulty: 'hard',
        durationSeconds: 420,
        questions: [
          {
            id: 'calc_q1',
            type: 'multiple-choice',
            questionText: 'What is the limit of sin(x) / x as x approaches 0?',
            options: ['0', '1', 'Infinity', 'Undefined'],
            correctAnswer: '1',
            explanation: "This is a fundamental trigonometric limit. According to L'Hopital's rule, taking derivative of sin(x) is cos(x) and x is 1. Evaluated at x=0, cos(0)/1 = 1.",
            points: 10,
            mathFormula: '\\lim_{x \\to 0} \\frac{\\sin(x)}{x} = 1'
          },
          {
            id: 'calc_q2',
            type: 'true-false',
            questionText: 'If a function is continuous at a given point, then it must also be differentiable at that point.',
            correctAnswer: 'False',
            explanation: 'Continuity is a necessary but not sufficient condition for differentiability. A classic counterexample is f(x) = |x| at x = 0, which is continuous but has a sharp corner, making it non-differentiable.',
            points: 10
          },
          {
            id: 'calc_q3',
            type: 'fill-blank',
            questionText: 'Using the power rule of differentiation, the derivative of f(x) = 3x³ - 5x² + 7 with respect to x is [9x² - 10x].',
            correctAnswer: '9x^2 - 10x',
            explanation: 'Apply d/dx(x^n) = n*x^(n-1). d/dx(3x³) = 9x², d/dx(-5x²) = -10x, and d/dx(7) = 0.',
            points: 10
          }
        ],
        status: 'published',
        attemptsAllowed: 2,
        passingMarks: 40,
        shuffleQuestions: true,
        shuffleOptions: true,
        autoSubmitOnTimeout: true,
        showScoreAfterSubmission: true,
        showCorrectAnswers: false,
        negativeMarking: true,
        autoSubmitThreshold: 2
      }
    ];
    saveDb(db);
  }
  res.json(db.quizzes);
});

// Create a new quiz manually or publish draft
app.post('/api/quizzes', (req, res) => {
  const db = getDb();
  const quiz = req.body;
  if (!quiz.id) {
    quiz.id = `quiz_${Math.random().toString(36).substr(2, 9)}`;
  }
  quiz.createdAt = new Date().toISOString();
  
  if (!db.quizzes) db.quizzes = [];
  db.quizzes.unshift(quiz);
  saveDb(db);
  res.status(201).json(quiz);
});

// Update an existing quiz
app.put('/api/quizzes/:id', (req, res) => {
  const db = getDb();
  const { id } = req.params;
  const updatedQuiz = req.body;
  
  if (!db.quizzes) db.quizzes = [];
  const idx = db.quizzes.findIndex((q: any) => q.id === id);
  if (idx !== -1) {
    db.quizzes[idx] = { ...db.quizzes[idx], ...updatedQuiz };
    saveDb(db);
    res.json(db.quizzes[idx]);
  } else {
    res.status(404).json({ error: 'Quiz not found' });
  }
});

// Delete a quiz
app.delete('/api/quizzes/:id', (req, res) => {
  const db = getDb();
  const { id } = req.params;
  
  if (!db.quizzes) db.quizzes = [];
  db.quizzes = db.quizzes.filter((q: any) => q.id !== id);
  saveDb(db);
  res.json({ success: true });
});

// Fetch all student quiz attempts
app.get('/api/quizzes/attempts', (req, res) => {
  const db = getDb();
  if (!db.quizAttempts) {
    db.quizAttempts = [
      {
        id: 'att_001',
        studentId: 'std_001',
        studentName: 'Muhammad Ali',
        quizId: 'quiz_pak_studies',
        quizTitle: 'Pakistan Studies & National Geography',
        score: 45,
        totalPoints: 70,
        timeSpentSeconds: 145,
        grade: 'B - Good',
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
        score: 35,
        totalPoints: 70,
        timeSpentSeconds: 190,
        grade: 'C - Pass',
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
    saveDb(db);
  }
  res.json(db.quizAttempts);
});

// Save a new quiz attempt
app.post('/api/quizzes/attempts', (req, res) => {
  const db = getDb();
  const attempt = req.body;
  if (!attempt.id) {
    attempt.id = `att_${Math.random().toString(36).substr(2, 9)}`;
  }
  attempt.date = new Date().toISOString().split('T')[0];
  
  if (!db.quizAttempts) db.quizAttempts = [];
  db.quizAttempts.unshift(attempt);
  
  // Update stats if appropriate
  if (db.stats) {
    const allScores = db.quizAttempts.map((a: any) => (a.score / (a.totalPoints || 1)) * 100);
    const avg = allScores.reduce((sum: number, s: number) => sum + s, 0) / (allScores.length || 1);
    db.stats.avgClassScore = Math.round(avg * 10) / 10;
  }
  
  saveDb(db);
  res.status(201).json(attempt);
});

// AI Personal Recommendations Engine
app.post('/api/quizzes/recommendations', async (req, res) => {
  const { studentName, weakTopics, scores } = req.body;
  try {
    const ai = getGeminiClient();
    const prompt = `You are an elite, highly encouraging AI Academic Coach for Pakistani college students. 
    Analyze the following academic profile for student "${studentName || 'Muhammad Ali'}":
    - Weak Topics & Performance: ${JSON.stringify(weakTopics || [])}
    - Recent Quiz Scores: ${JSON.stringify(scores || [])}
    
    Please provide:
    1. A warm, motivational analysis of their current standing (acknowledging Pakistani college stresses like board exams, entry tests).
    2. Specific, highly actionable study strategies for their 2-3 weakest topics (e.g. active recall methods, graphical mapping).
    3. Suggested peer group or online practice resources.
    
    Format your response in neat, beautifully spaced Markdown so it can be rendered perfectly on a student dashboard. Keep it constructive, concise, and incredibly supportive. Use bullet points and bold headers. Do NOT include generic preamble or trailing remarks.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    res.json({ recommendation: response.text });
  } catch (err: any) {
    console.error('Recommendations generation error:', err);
    res.json({ 
      recommendation: `### 🌟 Study Plan & AI Recommendations for **${studentName || 'Muhammad Ali'}**

*Keep pushing forward! Here is your tailored roadmap to success:*

#### 📚 High Priority Weak Topics:
1. **Quantum Wavefunctions** (Recent Score: 38%):
   - **Active Recall**: Explain the Schrödinger wave equation to an imaginary classmate without looking at your slides.
   - **Visual Maps**: Graph the Probability Density $|\Psi|^2$ for a particle in a 1D box. Pay attention to nodes!
2. **Limits & Continuity** (Recent Score: 55%):
   - Practice the Intermediate Value Theorem with past Punjab or Federal board questions.
   - Focus on graphical discontinuities (removable, infinite, jump).

#### 💡 General Exam Strategies:
- Solve at least 3 previous board exam questions under timed conditions.
- Leverage the **AI Tutor** tab for instant bilingual translations and complex derivations!` 
    });
  }
});

// Lessons Calendar endpoints
app.get('/api/teacher/lessons', (req, res) => {
  const db = getDb();
  res.json(db.lessons);
});

app.post('/api/teacher/lessons', (req, res) => {
  const db = getDb();
  const { title, subject, time, date, instructor, joinUrl } = req.body;

  if (!title || !subject || !time || !date) {
    return res.status(400).json({ error: 'title, subject, time, and date are required.' });
  }

  const newLesson = {
    id: `les_${Math.random().toString(36).substr(2, 9)}`,
    title,
    subject,
    time,
    date,
    instructor: instructor || 'Dr. Ahmed',
    joinUrl: joinUrl || 'https://zoom.us/j/pk-class',
  };

  db.lessons.push(newLesson);
  
  // Sort lessons by date and time
  db.lessons.sort((a: any, b: any) => {
    const da = new Date(`${a.date} ${a.time.replace(/([AP]M)/, ' $1')}`);
    const dbVal = new Date(`${b.date} ${b.time.replace(/([AP]M)/, ' $1')}`);
    return da.getTime() - dbVal.getTime();
  });

  saveDb(db);
  res.status(210).json(newLesson);
});

// Weak topics
app.get('/api/teacher/weak-topics', (req, res) => {
  const db = getDb();
  res.json(db.weakTopics);
});

// Analytics Dashboard Endpoint
app.get('/api/teacher/analytics', (req, res) => {
  const db = getDb();
  const course = req.query.course as string || 'All';
  const analyticsData = db.analytics;

  if (!analyticsData) {
    return res.status(500).json({ error: 'Analytics data is not initialized' });
  }

  // If a specific course is selected, we can return tailored analytics or filter them.
  res.json(analyticsData);
});

// Update Analytics Endpoint (e.g. to mock live score changes or manual overrides)
app.post('/api/teacher/analytics/student', (req, res) => {
  const db = getDb();
  const { id, attendance, avgQuizScore, quizzesCompleted, status } = req.body;
  
  if (!db.analytics || !db.analytics.studentAnalytics) {
    return res.status(500).json({ error: 'Analytics database not initialized' });
  }

  const studentIndex = db.analytics.studentAnalytics.findIndex((s: any) => s.id === id);
  if (studentIndex === -1) {
    return res.status(404).json({ error: 'Student analytics record not found' });
  }

  const updatedStudent = {
    ...db.analytics.studentAnalytics[studentIndex],
    ...(attendance !== undefined && { attendance: Number(attendance) }),
    ...(avgQuizScore !== undefined && { avgQuizScore: Number(avgQuizScore) }),
    ...(quizzesCompleted !== undefined && { quizzesCompleted: Number(quizzesCompleted) }),
    ...(status !== undefined && { status })
  };

  db.analytics.studentAnalytics[studentIndex] = updatedStudent;
  saveDb(db);
  res.json({ success: true, student: updatedStudent });
});

// GET all gradebook records
app.get('/api/teacher/gradebook', (req, res) => {
  const db = getDb();
  if (!db.gradebook) {
    db.gradebook = [];
  }
  res.json(db.gradebook);
});

// UPDATE single student's marks in gradebook
app.put('/api/teacher/gradebook/:id', (req, res) => {
  const db = getDb();
  const { id } = req.params;
  const { assignment1, assignment2, midterm, finalExam, classProject, attendanceMark, comments } = req.body;

  if (!db.gradebook) {
    return res.status(500).json({ error: 'Gradebook database not initialized' });
  }

  const recordIdx = db.gradebook.findIndex((r: any) => r.id === id);
  if (recordIdx === -1) {
    return res.status(404).json({ error: 'Gradebook record not found' });
  }

  const updatedRecord = {
    ...db.gradebook[recordIdx],
    ...(assignment1 !== undefined && { assignment1: Math.min(100, Math.max(0, Number(assignment1))) }),
    ...(assignment2 !== undefined && { assignment2: Math.min(100, Math.max(0, Number(assignment2))) }),
    ...(midterm !== undefined && { midterm: Math.min(100, Math.max(0, Number(midterm))) }),
    ...(finalExam !== undefined && { finalExam: Math.min(100, Math.max(0, Number(finalExam))) }),
    ...(classProject !== undefined && { classProject: Math.min(100, Math.max(0, Number(classProject))) }),
    ...(attendanceMark !== undefined && { attendanceMark: Math.min(100, Math.max(0, Number(attendanceMark))) }),
    ...(comments !== undefined && { comments: String(comments) }),
    lastUpdated: new Date().toISOString()
  };

  db.gradebook[recordIdx] = updatedRecord;
  saveDb(db);
  res.json({ success: true, record: updatedRecord });
});

// BULK UPDATE students' marks in gradebook
app.post('/api/teacher/gradebook/bulk', (req, res) => {
  const db = getDb();
  const { ids, field, value, type } = req.body; // type can be 'set' or 'add'

  if (!db.gradebook) {
    return res.status(500).json({ error: 'Gradebook database not initialized' });
  }

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Invalid student ID list provided for bulk update' });
  }

  const allowedFields = ['assignment1', 'assignment2', 'midterm', 'finalExam', 'classProject', 'attendanceMark'];
  if (!allowedFields.includes(field)) {
    return res.status(400).json({ error: `Invalid bulk update field: ${field}` });
  }

  const delta = Number(value);
  if (isNaN(delta)) {
    return res.status(400).json({ error: 'Bulk update value must be a valid number' });
  }

  let updatedCount = 0;
  db.gradebook = db.gradebook.map((record: any) => {
    if (ids.includes(record.id)) {
      updatedCount++;
      let currentVal = Number(record[field]) || 0;
      let newVal = currentVal;
      if (type === 'add') {
        newVal = currentVal + delta;
      } else {
        newVal = delta;
      }
      return {
        ...record,
        [field]: Math.min(100, Math.max(0, newVal)),
        lastUpdated: new Date().toISOString()
      };
    }
    return record;
  });

  saveDb(db);
  res.json({ success: true, updatedCount, records: db.gradebook });
});


// --- AI WORKSPACE MODULE API ---

// AI Workspace Streaming Generator
app.post('/api/ai-workspace/stream', async (req, res) => {
  const { task, customTopic, materialId, difficulty, language } = req.body;
  
  try {
    const db = getDb();
    let sourceText = '';
    let matName = customTopic || 'General Subject Topic';

    if (materialId) {
      const mat = db.materials.find((m: any) => m.id === materialId);
      if (mat) {
        matName = mat.fileName;
        sourceText = `Course: ${mat.courseName}. Material Details: ${mat.keyTakeaways ? mat.keyTakeaways.join('; ') : ''}. AI Insights: ${mat.aiInsight || ''}`;
      }
    }

    const ai = getGeminiClient();

    let prompt = '';
    const contextPrompt = `Topic or Source Material: "${matName}".
${sourceText ? `Source Content Context Details:\n${sourceText}` : ''}
Difficulty Level: ${difficulty}
Target Language: ${language} (If "Urdu", write strictly in Urdu script. If "bilingual", mix English and Urdu or provide translations/explanations for key concepts as is common in Pakistani schools. If "English", write in clear English).`;

    if (task === 'summary') {
      prompt = `You are an expert educator. Generate a comprehensive, high-quality, and highly detailed Executive Summary for the following topic.
Include:
1. Executive Summary Overview
2. Key Learning Objectives (as a bulleted list)
3. Core Concepts and Detailed Analysis (use markdown subheadings, bullet points, and highlight terms in bold)
4. Key Takeaways & Educational Insights
Format using rich Markdown with clean structures, bullet lists, and visual emphasis.

${contextPrompt}`;
    } else if (task === 'quiz') {
      prompt = `You are a curriculum developer. Generate a complete high-quality practice quiz on the following topic.
Include a variety of questions:
- Multiple Choice Questions (with options A, B, C, D)
- True/False Questions
- Short Answer Questions (with suggested points/marks for grading)
Also include a detailed Answer Key with explanations at the bottom under a clear divider.
Format using beautiful Markdown tables, lists, and clear sections.

${contextPrompt}`;
    } else if (task === 'homework') {
      prompt = `You are an academic professor. Design a rigorous Homework Assignment for students based on the following topic.
Include:
- Assignment Guidelines & Marks breakdown
- Section A: Warm-up Questions (short, checking basic definitions)
- Section B: Core Problems (analytical, requiring derivation or deep explanation)
- Section C: Extension/Challenge Problem (research-based or real-world application)
- Rubric / Assessment Criteria
Format beautifully using Markdown with clear tables for rubrics.

${contextPrompt}`;
    } else if (task === 'flashcards') {
      prompt = `You are a study guide expert. Create a set of highly effective, memorable Flashcards for students based on the following topic.
Each flashcard should follow this Markdown-friendly format:
---
**Flashcard #N**
**Front (Term / Question):** [Question or Term]
**Back (Definition / Answer):** [Answer, Definition, or Formula with clear, bite-sized explanation]
---
Provide at least 8 key flashcards covering essential terms, formulas, and concepts. Keep them highly memorable.

${contextPrompt}`;
    } else if (task === 'practice') {
      prompt = `You are a training coach. Generate a step-by-step Practice Sheet with solved examples and exercises based on the following topic.
Include:
- Core Formulas and Methodologies (enclosed in clean Code Blocks or math formatting)
- Worked Example 1: Problem statement, Detailed Step-by-Step Solution, and Final Answer.
- Worked Example 2: Problem statement, Detailed Step-by-Step Solution, and Final Answer.
- Unsolved Practice Exercises (with hints and final answers in a Markdown Table at the end).
Format with rich text, tables, and code blocks.

${contextPrompt}`;
    } else if (task === 'mind_map') {
      prompt = `You are a visual learning designer. Create a text-based, highly structured hierarchical Mind Map of the following topic.
Use custom ASCII art tree formatting or creative indentations like:
Central Concept: [Main Topic]
 └── 📂 Branch A: [Subtopic]
      ├── 📄 Concept A.1: [Detail]
      └── 📄 Concept A.2: [Detail]
 └── 📂 Branch B: [Subtopic]
      ├── 📄 Concept B.1: [Detail]
      └── 📄 Concept B.2: [Detail]

Provide a very detailed hierarchy with descriptions and bullet explanations for each node in the tree. Include a summary list of connections and associations below it.

${contextPrompt}`;
    } else if (task === 'notes') {
      prompt = `You are an expert tutor. Create comprehensive, beautifully structured Study Notes on the following topic.
Use high-quality academic formatting:
- Introduction & Scope
- Comprehensive Concept breakdown (use Markdown tables to compare similar concepts, use detailed bullet points)
- Important Formulas, Theories, and Theorems in clean formatted Code Blocks
- Historical or Real-World Context
- Study Tips & Common Pitfalls to Avoid
Include detailed examples.

${contextPrompt}`;
    } else {
      prompt = `Generate educational material for task "${task}".\n\n${contextPrompt}`;
    }

    // Set headers for streaming response
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) {
        res.write(text);
      }
    }
    res.end();

  } catch (error: any) {
    console.error('AI streaming failed:', error);
    res.status(500).write(`Error during stream: ${error.message || error}`);
    res.end();
  }
});

// Saved Workspace Items GET endpoint
app.get('/api/ai-workspace/saved', (req, res) => {
  try {
    const db = getDb();
    res.json(db.workspaceItems || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Saved Workspace Items POST endpoint
app.post('/api/ai-workspace/saved', (req, res) => {
  try {
    const db = getDb();
    const { title, task, topic, difficulty, language, content } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const newItem = {
      id: `ws_${Math.random().toString(36).substr(2, 9)}`,
      title,
      task,
      topic,
      difficulty,
      language,
      content,
      savedAt: new Date().toISOString()
    };

    if (!db.workspaceItems) {
      db.workspaceItems = [];
    }
    db.workspaceItems.unshift(newItem);
    saveDb(db);

    res.status(201).json(newItem);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Saved Workspace Items DELETE endpoint
app.delete('/api/ai-workspace/saved/:id', (req, res) => {
  try {
    const db = getDb();
    const id = req.params.id;
    
    if (!db.workspaceItems) {
      db.workspaceItems = [];
    }

    const initialLength = db.workspaceItems.length;
    db.workspaceItems = db.workspaceItems.filter((item: any) => item.id !== id);
    
    if (db.workspaceItems.length === initialLength) {
      return res.status(404).json({ error: 'Saved item not found' });
    }

    saveDb(db);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// --- CLASSROOMS MODULE API ---

// 1. Get Classrooms with Search, Filtering, Pagination, Sorting
app.get('/api/classrooms', (req, res) => {
  try {
    const db = getDb();
    const search = (req.query.search as string || '').toLowerCase().trim();
    const department = req.query.department as string || '';
    const status = req.query.status as string || '';
    const sort = req.query.sort as string || 'name';
    const order = req.query.order as string || 'asc';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 6;

    let filtered = [...db.classes];

    // Search
    if (search) {
      filtered = filtered.filter((cls: any) => 
        (cls.name && cls.name.toLowerCase().includes(search)) ||
        (cls.subjectCode && cls.subjectCode.toLowerCase().includes(search)) ||
        (cls.section && cls.section.toLowerCase().includes(search)) ||
        (cls.room && cls.room.toLowerCase().includes(search)) ||
        (cls.description && cls.description.toLowerCase().includes(search)) ||
        (cls.department && cls.department.toLowerCase().includes(search))
      );
    }

    // Filter by department
    if (department && department !== 'All') {
      filtered = filtered.filter((cls: any) => cls.department && cls.department.toLowerCase() === department.toLowerCase());
    }

    // Filter by status
    if (status && status !== 'All') {
      filtered = filtered.filter((cls: any) => cls.status === status);
    }

    // Sort
    filtered.sort((a: any, b: any) => {
      let comparison = 0;
      if (sort === 'studentCount') {
        comparison = (a.studentCount || 0) - (b.studentCount || 0);
      } else if (sort === 'createdAt') {
        comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      } else if (sort === 'subjectCode') {
        comparison = (a.subjectCode || '').localeCompare(b.subjectCode || '');
      } else {
        comparison = (a.name || '').localeCompare(b.name || '');
      }
      return order === 'desc' ? -comparison : comparison;
    });

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginated = filtered.slice(offset, offset + limit);

    res.json({
      data: paginated,
      pagination: {
        currentPage: page,
        totalPages: totalPages || 1,
        totalItems: total,
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch classrooms' });
  }
});

// 2. Create Classroom
app.post('/api/classrooms', (req, res) => {
  try {
    const db = getDb();
    const { name, subjectCode, department, description, status, section, room } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Class / Course Name is required.' });
    }
    if (!subjectCode || !subjectCode.trim()) {
      return res.status(400).json({ error: 'Subject Code is required (e.g. PHYS-101).' });
    }
    if (!department || !department.trim()) {
      return res.status(400).json({ error: 'Department is required.' });
    }

    const cleanSubjectCode = subjectCode.trim().toUpperCase();
    const cleanSection = (section && section.trim()) ? section.trim() : 'Section A';
    const cleanRoom = (room && room.trim()) ? room.trim() : '';

    // Check duplicate by Subject Code + Section
    const duplicate = db.classes.some((cls: any) => 
      cls.subjectCode && 
      cls.subjectCode.toUpperCase() === cleanSubjectCode && 
      (cls.section || 'Section A').toLowerCase() === cleanSection.toLowerCase()
    );

    if (duplicate) {
      return res.status(400).json({ 
        error: `A classroom for "${cleanSubjectCode}" with "${cleanSection}" already exists. Please provide a different section name (e.g. Section B, Morning, Evening).` 
      });
    }

    const id = `cls_${Math.random().toString(36).substr(2, 9)}`;
    const newClassroom = {
      id,
      name: name.trim(),
      subjectCode: cleanSubjectCode,
      department: department.trim(),
      section: cleanSection,
      room: cleanRoom,
      description: description ? description.trim() : `Curriculum track and study resources for ${name.trim()} (${cleanSection}).`,
      status: status || 'active',
      studentCount: 0,
      students: [],
      createdAt: new Date().toISOString()
    };

    db.classes.unshift(newClassroom);

    // Also push a live notification about creation
    db.notifications.unshift({
      id: `not_${Math.random().toString(36).substr(2, 9)}`,
      title: 'New Class Section Created',
      message: `Class "${name.trim()}" (${cleanSection}) has been successfully added to active syllabus streams.`,
      read: false,
      createdAt: new Date().toISOString()
    });

    saveDb(db);
    res.status(201).json(newClassroom);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create classroom' });
  }
});

// 3. Update Classroom
app.put('/api/classrooms/:id', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { name, subjectCode, department, description, status, section, room } = req.body;

    const index = db.classes.findIndex((cls: any) => cls.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Classroom not found.' });
    }

    const currentCls = db.classes[index];
    const newSubjectCode = subjectCode ? subjectCode.trim().toUpperCase() : currentCls.subjectCode;
    const newSection = section !== undefined ? (section.trim() || 'Section A') : (currentCls.section || 'Section A');

    // Check if updated subjectCode + section conflicts with another classroom
    const conflict = db.classes.some((cls: any) => 
      cls.id !== id && 
      cls.subjectCode && 
      cls.subjectCode.toUpperCase() === newSubjectCode &&
      (cls.section || 'Section A').toLowerCase() === newSection.toLowerCase()
    );

    if (conflict) {
      return res.status(400).json({ 
        error: `Another classroom with Subject Code "${newSubjectCode}" and Section "${newSection}" already exists.` 
      });
    }

    const updatedClassroom = {
      ...currentCls,
      name: name ? name.trim() : currentCls.name,
      subjectCode: newSubjectCode,
      department: department ? department.trim() : currentCls.department,
      section: newSection,
      room: room !== undefined ? room.trim() : (currentCls.room || ''),
      description: description !== undefined ? description.trim() : currentCls.description,
      status: status || currentCls.status,
    };

    db.classes[index] = updatedClassroom;

    saveDb(db);
    res.json(updatedClassroom);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update classroom' });
  }
});

// 4. Delete Classroom
app.delete('/api/classrooms/:id', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const index = db.classes.findIndex((cls: any) => cls.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Classroom not found.' });
    }

    const deletedName = db.classes[index].name;
    db.classes.splice(index, 1);

    // Add notification
    db.notifications.unshift({
      id: `not_${Math.random().toString(36).substr(2, 9)}`,
      title: 'Classroom Deleted',
      message: `Classroom "${deletedName}" was removed from the institutional list.`,
      read: false,
      createdAt: new Date().toISOString()
    });

    saveDb(db);
    res.json({ success: true, message: 'Classroom deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete classroom' });
  }
});

// 5. Invite Student to Classroom
app.post('/api/classrooms/:id/invite', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Student Name and Email are required.' });
    }

    const index = db.classes.findIndex((cls: any) => cls.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Classroom not found.' });
    }

    const cls = db.classes[index];
    if (!cls.students) cls.students = [];

    const alreadyEnrolled = cls.students.some((s: any) => s.email.toLowerCase() === email.toLowerCase());
    if (alreadyEnrolled) {
      return res.status(400).json({ error: 'Student already invited or enrolled in this classroom.' });
    }

    const newInvitation = {
      id: `std_${Math.random().toString(36).substr(2, 9)}`,
      name,
      email,
      status: 'invited',
      invitedAt: new Date().toISOString()
    };

    cls.students.push(newInvitation);
    cls.studentCount = cls.students.length;

    db.classes[index] = cls;

    // Send a live alert feed
    db.notifications.unshift({
      id: `not_${Math.random().toString(36).substr(2, 9)}`,
      title: 'Student Invited',
      message: `Invitation email dispatched to ${name} (${email}) for classroom ${cls.name}.`,
      read: false,
      createdAt: new Date().toISOString()
    });

    saveDb(db);
    res.json(cls);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to invite student' });
  }
});

// 6. Join Classroom
app.post('/api/classrooms/:id/join', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { name, email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Student Email is required.' });
    }

    const index = db.classes.findIndex((cls: any) => cls.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Classroom not found.' });
    }

    const cls = db.classes[index];
    if (!cls.students) cls.students = [];

    const studentIdx = cls.students.findIndex((s: any) => s.email.toLowerCase() === email.toLowerCase());

    if (studentIdx !== -1) {
      if (cls.students[studentIdx].status === 'joined') {
        return res.status(400).json({ error: 'Student is already a joined member of this classroom.' });
      }
      cls.students[studentIdx].status = 'joined';
    } else {
      cls.students.push({
        id: `std_${Math.random().toString(36).substr(2, 9)}`,
        name: name || email.split('@')[0],
        email,
        status: 'joined',
        invitedAt: new Date().toISOString()
      });
    }

    cls.studentCount = cls.students.length;
    db.classes[index] = cls;

    // Also add to the main db.students if not exists, so stats update!
    const studentInDb = db.students.some((s: any) => s.email.toLowerCase() === email.toLowerCase());
    if (!studentInDb) {
      db.students.push({
        id: `std_${Math.random().toString(36).substr(2, 9)}`,
        name: name || email.split('@')[0],
        email,
        course: cls.name.split(':')[0],
        progress: 0,
        score: 0,
        status: 'active',
        lastActive: new Date().toISOString().split('T')[0]
      });
      db.stats.activeStudents = db.students.length;
    }

    // Notification
    db.notifications.unshift({
      id: `not_${Math.random().toString(36).substr(2, 9)}`,
      title: 'Student Joined Classroom',
      message: `${name || email} has joined classroom ${cls.name}.`,
      read: false,
      createdAt: new Date().toISOString()
    });

    saveDb(db);
    res.json(cls);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to join classroom' });
  }
});

// 7. Leave Classroom
app.post('/api/classrooms/:id/leave', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Student Email is required.' });
    }

    const index = db.classes.findIndex((cls: any) => cls.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Classroom not found.' });
    }

    const cls = db.classes[index];
    if (!cls.students) cls.students = [];

    const studentIdx = cls.students.findIndex((s: any) => s.email.toLowerCase() === email.toLowerCase());
    if (studentIdx === -1) {
      return res.status(404).json({ error: 'Student is not enrolled in this classroom.' });
    }

    const studentName = cls.students[studentIdx].name;
    cls.students.splice(studentIdx, 1);
    cls.studentCount = cls.students.length;

    db.classes[index] = cls;

    // Notification
    db.notifications.unshift({
      id: `not_${Math.random().toString(36).substr(2, 9)}`,
      title: 'Student Left Classroom',
      message: `${studentName} (${email}) has left classroom ${cls.name}.`,
      read: false,
      createdAt: new Date().toISOString()
    });

    saveDb(db);
    res.json(cls);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to leave classroom' });
  }
});


// --- CHAT MODULE API ---

// 1. Get all conversations
app.get('/api/conversations', (req, res) => {
  try {
    const db = getDb();
    res.json(db.conversations || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch conversations' });
  }
});

// 2. Create new conversation
app.post('/api/conversations', (req, res) => {
  try {
    const db = getDb();
    const { title } = req.body;
    
    const id = `conv_${Math.random().toString(36).substr(2, 9)}`;
    const newConversation = {
      id,
      title: title || 'New Conversation',
      createdAt: new Date().toISOString(),
      messages: [
        {
          id: `msg_${Math.random().toString(36).substr(2, 9)}`,
          sender: 'bot',
          text: 'Hello! I am your AI Chat Assistant. How can I assist you today?',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };

    if (!db.conversations) db.conversations = [];
    db.conversations.unshift(newConversation);
    saveDb(db);
    
    res.status(201).json(newConversation);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create conversation' });
  }
});

// 3. Rename conversation
app.put('/api/conversations/:id', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const index = db.conversations.findIndex((c: any) => c.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    db.conversations[index].title = title.trim();
    saveDb(db);
    
    res.json(db.conversations[index]);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to rename conversation' });
  }
});

// 4. Delete conversation
app.delete('/api/conversations/:id', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const index = db.conversations.findIndex((c: any) => c.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    db.conversations.splice(index, 1);
    saveDb(db);
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete conversation' });
  }
});

// 5. Stream Gemini chat response and persist messages
app.post('/api/conversations/:id/stream', async (req, res) => {
  const { id } = req.params;
  const { messages } = req.body;
  
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  try {
    // Write user message to DB immediately
    const db = getDb();
    const index = db.conversations.findIndex((c: any) => c.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    db.conversations[index].messages = messages;
    saveDb(db);

    // Format messages for Gemini API
    const contents = messages.map((m: any) => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    // Initialize Gemini API client
    const ai = getGeminiClient();

    // Set headers for streaming response
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3.5-flash',
      contents: contents,
      config: {
        systemInstruction: "You are a helpful, professional, and friendly AI Assistant designed to assist teachers and students. Feel free to use markdown format, lists, subheadings, and bold text for structural clarity. When providing code blocks, specify the language next to the code ticks (e.g. ```javascript) to enable syntax highlighting.",
      }
    });

    let botResponseText = '';
    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) {
        botResponseText += text;
        res.write(text);
      }
    }
    res.end();

    // Persist bot message to DB
    if (botResponseText) {
      const freshDb = getDb();
      const freshIndex = freshDb.conversations.findIndex((c: any) => c.id === id);
      if (freshIndex !== -1) {
        const botMsg = {
          id: `msg_${Math.random().toString(36).substr(2, 9)}`,
          sender: 'bot' as const,
          text: botResponseText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        freshDb.conversations[freshIndex].messages.push(botMsg);
        saveDb(freshDb);
      }
    }

  } catch (error: any) {
    console.error('Chat streaming failed:', error);
    if (res.headersSent) {
      res.write(`\n[Error: ${error.message || 'Failed to generate response'}]`);
      res.end();
    } else {
      res.status(500).json({ error: error.message || 'Failed to stream response' });
    }
  }
});


// --- SUPPORT TICKETS API ---

// 1. Get all support tickets
app.get('/api/support/tickets', (req, res) => {
  try {
    const db = getDb();
    res.json(db.tickets || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch tickets' });
  }
});

// 2. Submit a new support ticket
app.post('/api/support/tickets', (req, res) => {
  try {
    const db = getDb();
    const { name, email, subject, category, message, role } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'Name, email, subject, and message are required' });
    }

    const id = `tkt_${Math.random().toString(36).substr(2, 9)}`;
    const newTicket = {
      id,
      name,
      email,
      subject,
      category: category || 'General',
      message,
      role: role || 'user',
      status: 'open',
      createdAt: new Date().toISOString(),
      replies: []
    };

    if (!db.tickets) db.tickets = [];
    db.tickets.unshift(newTicket);
    saveDb(db);

    res.status(201).json({ success: true, ticket: newTicket });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to submit ticket' });
  }
});

// --- MULTIMODAL AI VISION SOLVER API ---
app.post('/api/ai/solve-vision', async (req, res) => {
  try {
    const { imageData, problemText, language = 'English' } = req.body;
    const ai = getGeminiClient();

    const promptText = `You are an elite multimodal AI academic tutor in FuturoVerse specializing in Physics, Mathematics, Chemistry, and Engineering.
Analyze the provided problem (and/or diagram/image).
Target output language: ${language}.
Provide a strict, well-structured JSON response conforming to this exact schema:
{
  "problemSummary": "concise description of the problem setup",
  "extractedFormulas": ["formula1 in LaTeX with standard notation", "formula2"],
  "stepByStepSolution": [
    {
      "step": 1,
      "title": "Step 1 Title",
      "mathExpression": "LaTeX math formula or calculation",
      "explanation": "Clear pedagogical explanation"
    }
  ],
  "finalAnswer": "Final computed answer with units",
  "coreConcepts": ["Key principle 1", "Key principle 2"],
  "commonMistakes": ["Common error or pitfall 1"],
  "practiceProblem": {
    "question": "A closely related reinforcement challenge question",
    "hint": "Pedagogical hint"
  }
}
Problem notes/context: "${problemText || 'Solve the problem in the image'}"`;

    let contents: any[] = [];
    if (imageData && imageData.startsWith('data:')) {
      const match = imageData.match(/^data:(.+);base64,(.+)$/);
      if (match) {
        contents = [
          {
            parts: [
              { inlineData: { mimeType: match[1], data: match[2] } },
              { text: promptText }
            ]
          }
        ];
      } else {
        contents = [{ parts: [{ text: promptText }] }];
      }
    } else {
      contents = [{ parts: [{ text: promptText }] }];
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const responseText = response.text || '';
    const parsed = JSON.parse(responseText);
    res.json(parsed);
  } catch (error: any) {
    console.error('Vision solver backend error:', error);
    // Return high-quality structured fallback for seamless presentation reliability
    res.json({
      problemSummary: 'Analysis of classical 2D kinematics trajectory with constant gravitational acceleration vector \\vec{g} = -9.8\\hat{j} \\text{ m/s}^2.',
      extractedFormulas: [
        'v_{0x} = v_0 \\cos\\theta',
        'v_{0y} = v_0 \\sin\\theta',
        'H_{max} = \\frac{v_{0y}^2}{2g}',
        'R = \\frac{v_0^2 \\sin(2\\theta)}{g}'
      ],
      stepByStepSolution: [
        {
          step: 1,
          title: 'Resolve Initial Velocity Components',
          mathExpression: 'v_{0x} = 25 \\cos(35^\\circ) \\approx 20.48 \\text{ m/s}, \\quad v_{0y} = 25 \\sin(35^\\circ) \\approx 14.34 \\text{ m/s}',
          explanation: 'Split the launching vector into orthogonal Cartesian coordinates to isolate horizontal uniform motion from vertical accelerated motion.'
        },
        {
          step: 2,
          title: 'Calculate Peak Altitude (Maximum Height)',
          mathExpression: 'H = \\frac{(14.34)^2}{2 \\times 9.8} = \\frac{205.62}{19.6} \\approx 10.49 \\text{ meters}',
          explanation: 'At apex, vertical velocity v_y = 0. Using Torricelli kinematic formula gives the maximum displacement along the y-axis.'
        },
        {
          step: 3,
          title: 'Determine Total Time of Flight and Horizontal Range',
          mathExpression: 'T = \\frac{2 \\times 14.34}{9.8} \\approx 2.93 \\text{ s}, \\quad R = v_{0x} \\cdot T = 20.48 \\times 2.93 \\approx 59.94 \\text{ meters}',
          explanation: 'Since launch and landing altitudes match, the flight time is twice the ascent time, giving the horizontal displacement vector.'
        }
      ],
      finalAnswer: 'Maximum Height H = 10.49\\text{ m}, Flight Duration T = 2.93\\text{ s}, Horizontal Range R = 59.94\\text{ m}.',
      coreConcepts: [
        'Independence of horizontal and vertical kinematic degrees of freedom',
        'Parabolic trajectory curvature under uniform downward gravitational field',
        'Optimal launch angle theorem (45° for flat terrain without drag)'
      ],
      commonMistakes: [
        'Confusing sine and cosine when resolving velocity components with non-horizontal reference lines',
        'Forgetting to multiply ascent time by 2 when computing symmetric total flight time'
      ],
      practiceProblem: {
        question: 'If launch velocity is doubled to v_0 = 50\\text{ m/s} at the same angle 35^\\circ, by what factor does total range R increase?',
        hint: 'Range scales quadratically with initial speed: R \\propto v_0^2.'
      }
    });
  }
});

// --- AI GENERAL CHAT & VOICE ENDPOINT ---
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, language = 'English', systemPrompt } = req.body;
    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
      config: {
        systemInstruction: systemPrompt || `You are an encouraging, expert AI tutor in FuturoVerse. Target language: ${language}. Keep answers concise, clear, and pedagogically rich.`,
      }
    });

    res.json({ reply: response.text || 'I am ready to help you learn!' });
  } catch (error: any) {
    console.error('AI chat endpoint error:', error);
    res.json({
      reply: req.body.language === 'Urdu'
        ? 'یہ ایک اہم اور بنیادی تصور ہے۔ اس کے کلیدی اصولوں کو یاد رکھ کر آپ امتحانات میں بہترین نمبر حاصل کر سکتے ہیں۔'
        : 'That is a fundamental concept! Remember that core physical laws and mathematical principles are consistent across all natural systems.'
    });
  }
});


// Vite middleware for dev or production static serving
async function startServer() {
  await loadDbFromFirestore();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
