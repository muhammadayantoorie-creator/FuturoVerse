/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from 'jspdf';
import { Quiz, Question, QuizAttempt } from '@/src/features/quizzes/types';

// Helper to strip html/markdown tags for clean PDF text
export function cleanText(str: string | undefined | null): string {
  if (!str) return '';
  return str
    .replace(/<[^>]*>/g, '') // remove HTML tags
    .replace(/\*\*(.*?)\*\*/g, '$1') // remove bold md
    .replace(/\*(.*?)\*/g, '$1') // remove italic md
    .replace(/`(.*?)`/g, '$1') // remove code md
    .replace(/\\\(|\\\)/g, '') // remove latex delimiters
    .trim();
}

/**
 * 1. Export Quiz to PDF (Student Worksheet, Exam Question Paper, or Teacher Answer Key)
 */
export interface QuizPdfOptions {
  mode?: 'exam' | 'answer-key' | 'both';
  institutionName?: string;
  className?: string;
  includeAnswerKey?: boolean;
}

export function exportQuizToPdf(quiz: Partial<Quiz>, options: QuizPdfOptions = {}): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 595.28 pt for A4
  const pageHeight = doc.internal.pageSize.getHeight(); // 841.89 pt for A4
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const mode = options.mode || (options.includeAnswerKey ? 'both' : 'exam');
  const institution = options.institutionName || 'CLASS COPILOT ACADEMIC NETWORK';
  const subject = quiz.subject || 'General Studies';
  const title = quiz.title || 'Examination Question Paper';
  const durationMins = Math.round((quiz.durationSeconds || 1800) / 60);
  const totalQuestions = (quiz.questions || []).length;
  const totalMarks = (quiz.questions || []).reduce((acc, q) => acc + (q.points || 10), 0);

  // Helper for adding headers to new pages
  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin - 30) {
      addFooter();
      doc.addPage();
      y = margin + 15;
    }
  };

  const addFooter = () => {
    const pageCount = (doc as any).internal.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text(
      `Class Copilot Educational System | ${title} | Page ${pageCount}`,
      pageWidth / 2,
      pageHeight - 20,
      { align: 'center' }
    );
  };

  // --- HEADER SECTION ---
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(margin, y, contentWidth, 75, 6, 6, 'F');
  doc.setDrawColor(210, 215, 225);
  doc.roundedRect(margin, y, contentWidth, 75, 6, 6, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(79, 70, 229); // Indigo 600
  doc.text(institution.toUpperCase(), pageWidth / 2, y + 18, { align: 'center' });

  doc.setFontSize(14);
  doc.setTextColor(20, 25, 35);
  doc.text(title, pageWidth / 2, y + 36, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 110, 125);
  const subInfo = `Subject: ${subject}   |   Time Allowed: ${durationMins} Mins   |   Total Marks: ${totalMarks}   |   Questions: ${totalQuestions}`;
  doc.text(subInfo, pageWidth / 2, y + 54, { align: 'center' });

  if (mode === 'answer-key') {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38); // Red
    doc.text('[ TEACHER MASTER ANSWER KEY & GRADING RUBRIC ]', pageWidth / 2, y + 68, { align: 'center' });
  }

  y += 90;

  // --- CANDIDATE INFO BOX (For exam/student copies) ---
  if (mode === 'exam' || mode === 'both') {
    doc.setDrawColor(220, 225, 230);
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, y, contentWidth, 36, 'S');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(60, 60, 60);
    doc.text('Student Name: _________________________________', margin + 10, y + 15);
    doc.text('Roll / Seat No: ____________________', margin + 300, y + 15);
    doc.text('Date: ________________________', margin + 10, y + 28);
    doc.text('Section / Class: ____________________', margin + 300, y + 28);

    y += 48;
  }

  // --- INSTRUCTIONS ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  doc.text('INSTRUCTIONS FOR CANDIDATES:', margin, y);
  y += 12;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(90, 95, 105);
  const instructions = [
    '1. Answer all questions clearly. Ensure selections are neatly marked.',
    '2. For Multiple Choice Questions, tick [✓] or fill the corresponding option box.',
    '3. Write legibly in the designated spaces. Calculators/devices are strictly prohibited unless specified.'
  ];
  instructions.forEach(ins => {
    doc.text(ins, margin + 8, y);
    y += 10;
  });

  doc.setDrawColor(200, 205, 215);
  doc.line(margin, y + 4, margin + contentWidth, y + 4);
  y += 18;

  // --- QUESTIONS LIST ---
  const questions = quiz.questions || [];

  questions.forEach((q, idx) => {
    checkPageBreak(90);

    // Question header line: Q1. (Points) [Type / Difficulty]
    const qNum = `Q${idx + 1}.`;
    const qPoints = `(${q.points || 10} Marks)`;
    const qMeta = `[${q.type === 'multiple-choice' ? 'MCQ' : q.type} | ${q.difficulty || 'Medium'}${q.bloomLevel ? ' | ' + q.bloomLevel : ''}]`;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(20, 25, 35);
    doc.text(qNum, margin, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(79, 70, 229);
    doc.text(qPoints, margin + 25, y);

    doc.setFontSize(7.5);
    doc.setTextColor(130, 135, 145);
    doc.text(qMeta, margin + contentWidth, y, { align: 'right' });
    y += 14;

    // Question prompt text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 35, 45);
    const cleanedPrompt = cleanText(q.questionText || 'Question prompt');
    const promptLines = doc.splitTextToSize(cleanedPrompt, contentWidth - 10);
    doc.text(promptLines, margin + 10, y);
    y += promptLines.length * 12 + 4;

    // If LaTeX Math Formula exists
    if (q.mathFormula) {
      doc.setFont('courier', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(50, 50, 120);
      doc.text(`Formula: ${q.mathFormula}`, margin + 15, y);
      y += 12;
    }

    // MCQ Options Render
    if (q.type === 'multiple-choice') {
      const opts = q.mcqOptions && q.mcqOptions.length > 0 
        ? q.mcqOptions 
        : (q.options || []).map((t, i) => ({
            id: String.fromCharCode(65 + i),
            text: t,
            correct: t === q.correctAnswer
          }));

      opts.forEach((opt, oIdx) => {
        checkPageBreak(25);
        const optLetter = opt.id || String.fromCharCode(65 + oIdx);
        const isCorrect = opt.correct || opt.text === q.correctAnswer;
        const isKeyMode = mode === 'answer-key' || mode === 'both';

        // Draw checkbox / bubble
        if (isKeyMode && isCorrect) {
          doc.setFillColor(220, 252, 231); // emerald light
          doc.setDrawColor(34, 197, 94); // emerald 500
          doc.roundedRect(margin + 15, y - 9, contentWidth - 30, 16, 3, 3, 'FD');
          
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(22, 101, 52); // dark green
          doc.text(`[✓] ${optLetter}.`, margin + 22, y + 2);
          doc.text(cleanText(opt.text), margin + 50, y + 2);
          doc.setFontSize(7.5);
          doc.text('(Correct Answer)', margin + contentWidth - 40, y + 2, { align: 'right' });
        } else {
          doc.setDrawColor(210, 215, 225);
          doc.roundedRect(margin + 15, y - 9, contentWidth - 30, 16, 3, 3, 'S');

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(60, 65, 75);
          doc.text(`[  ] ${optLetter}.`, margin + 22, y + 2);
          doc.text(cleanText(opt.text), margin + 50, y + 2);
        }

        y += 19;
      });
    } else if (q.type === 'true-false') {
      checkPageBreak(25);
      const isTrueCorrect = q.correctAnswer?.toLowerCase() === 'true';
      const isKeyMode = mode === 'answer-key' || mode === 'both';

      doc.setFont('helvetica', isKeyMode && isTrueCorrect ? 'bold' : 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(isKeyMode && isTrueCorrect ? 22 : 60, isKeyMode && isTrueCorrect ? 101 : 65, isKeyMode && isTrueCorrect ? 52 : 75);
      doc.text(`[ ${isKeyMode && isTrueCorrect ? '✓' : ' '} ] True`, margin + 25, y);

      const isFalseCorrect = q.correctAnswer?.toLowerCase() === 'false';
      doc.setFont('helvetica', isKeyMode && isFalseCorrect ? 'bold' : 'normal');
      doc.setTextColor(isKeyMode && isFalseCorrect ? 22 : 60, isKeyMode && isFalseCorrect ? 101 : 65, isKeyMode && isFalseCorrect ? 52 : 75);
      doc.text(`[ ${isKeyMode && isFalseCorrect ? '✓' : ' '} ] False`, margin + 120, y);
      y += 18;
    } else {
      // Fill blank or short/long answer - provide write lines
      checkPageBreak(50);
      doc.setDrawColor(220, 225, 230);
      const lineCount = q.type === 'long-answer' ? 4 : 2;
      for (let i = 0; i < lineCount; i++) {
        doc.line(margin + 20, y + 8, margin + contentWidth - 20, y + 8);
        y += 16;
      }

      if ((mode === 'answer-key' || mode === 'both') && q.correctAnswer) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(79, 70, 229);
        doc.text(`Key Answer Reference: ${cleanText(q.correctAnswer)}`, margin + 20, y);
        y += 12;
      }
    }

    // Explanation Box (In answer key mode)
    if ((mode === 'answer-key' || mode === 'both') && q.explanation) {
      checkPageBreak(35);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      const expClean = cleanText(q.explanation);
      const expLines = doc.splitTextToSize(`Explanation: ${expClean}`, contentWidth - 40);
      const boxH = expLines.length * 10 + 10;
      doc.roundedRect(margin + 15, y, contentWidth - 30, boxH, 3, 3, 'FD');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text(expLines, margin + 22, y + 8);
      y += boxH + 8;
    }

    // Space after question
    y += 10;
    doc.setDrawColor(240, 242, 245);
    doc.line(margin, y, margin + contentWidth, y);
    y += 12;
  });

  // Final page footer
  addFooter();

  // Save the PDF
  const filename = `${(quiz.title || 'Exam_Question_Paper').toLowerCase().replace(/\s+/g, '_')}_${mode}.pdf`;
  doc.save(filename);
}

/**
 * 2. Export Academic Performance Analytics Report to PDF
 */
export interface AnalyticsPdfData {
  stats: {
    avgScore: number;
    attendance: number;
    completion: number;
    weakTopicsCount: number;
  };
  courseFocus?: string;
  weakTopics?: Array<{
    topic: string;
    subject: string;
    averageScore: number;
    strugglingStudents: number;
  }>;
  students?: Array<{
    name: string;
    course: string;
    avgQuizScore: number;
    attendance: number;
    status: string;
  }>;
}

export function exportAnalyticsToPdf(data: AnalyticsPdfData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const addFooter = () => {
    const pageCount = (doc as any).internal.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text(
      `Class Copilot Analytics Diagnostic Engine | Page ${pageCount}`,
      pageWidth / 2,
      pageHeight - 20,
      { align: 'center' }
    );
  };

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin - 30) {
      addFooter();
      doc.addPage();
      y = margin + 15;
    }
  };

  // Header Banner
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.roundedRect(margin, y, contentWidth, 68, 6, 6, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('CLASS COPILOT - ACADEMIC ANALYTICS REPORT', margin + 18, y + 26);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text(`Course Scope: ${data.courseFocus || 'All Subjects'}   |   Generated: ${new Date().toLocaleDateString()}`, margin + 18, y + 46);

  y += 82;

  // Key KPI Cards Grid (4 boxes)
  const boxW = (contentWidth - 24) / 4;
  const kpis = [
    { label: 'Avg Class Score', val: `${data.stats.avgScore}%`, color: [79, 70, 229] },
    { label: 'Avg Attendance', val: `${data.stats.attendance}%`, color: [16, 185, 129] },
    { label: 'Quiz Completion', val: `${data.stats.completion}%`, color: [59, 130, 246] },
    { label: 'Gaps / Weak Topics', val: `${data.stats.weakTopicsCount}`, color: [239, 68, 68] }
  ];

  kpis.forEach((k, idx) => {
    const x = margin + idx * (boxW + 8);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, y, boxW, 48, 4, 4, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(k.label, x + 8, y + 16);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(k.color[0], k.color[1], k.color[2]);
    doc.text(k.val, x + 8, y + 36);
  });

  y += 62;

  // Section 1: Weak Topics Diagnostic Matrix
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('Syllabus Diagnostic & Remedial Priority Matrix', margin, y);
  y += 14;

  // Table header
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 20, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Topic Name', margin + 8, y + 13);
  doc.text('Subject', margin + 200, y + 13);
  doc.text('Avg Score', margin + 330, y + 13);
  doc.text('Students at Risk', margin + 410, y + 13);
  y += 20;

  const topics = data.weakTopics || [];
  topics.slice(0, 8).forEach((t, i) => {
    checkPageBreak(20);
    if (i % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentWidth, 18, 'F');
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(t.topic, margin + 8, y + 12);
    doc.text(t.subject, margin + 200, y + 12);

    const isLow = t.averageScore < 60;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(isLow ? 220 : 30, isLow ? 38 : 41, isLow ? 38 : 59);
    doc.text(`${t.averageScore}%`, margin + 330, y + 12);

    doc.setTextColor(71, 85, 105);
    doc.text(`${t.strugglingStudents} Students`, margin + 410, y + 12);
    y += 18;
  });

  y += 20;

  // Section 2: Student Performance Roster
  checkPageBreak(120);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('Student Performance & Integrity Roster', margin, y);
  y += 14;

  // Table header
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 20, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Student Name', margin + 8, y + 13);
  doc.text('Course', margin + 180, y + 13);
  doc.text('Quiz Avg', margin + 300, y + 13);
  doc.text('Attendance', margin + 370, y + 13);
  doc.text('Academic Standing', margin + 440, y + 13);
  y += 20;

  const students = data.students || [];
  students.slice(0, 15).forEach((s, i) => {
    checkPageBreak(18);
    if (i % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentWidth, 18, 'F');
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(s.name, margin + 8, y + 12);
    doc.text(s.course, margin + 180, y + 12);
    doc.text(`${s.avgQuizScore}%`, margin + 300, y + 12);
    doc.text(`${s.attendance}%`, margin + 370, y + 12);

    doc.setFont('helvetica', 'bold');
    if (s.status === 'Needs Attention') {
      doc.setTextColor(220, 38, 38);
    } else if (s.status === 'Excelling') {
      doc.setTextColor(16, 185, 129);
    } else {
      doc.setTextColor(71, 85, 105);
    }
    doc.text(s.status, margin + 440, y + 12);
    y += 18;
  });

  addFooter();
  doc.save(`Academic_Analytics_Report_${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * 3. Export Gradebook Marksheet to PDF
 */
export interface GradebookPdfData {
  className?: string;
  term?: string;
  students: Array<{
    id: string;
    name: string;
    rollNo: string;
    quizzes: number[];
    midterm: number;
    finalExam: number;
    overallScore: number;
    letterGrade: string;
    attendance: number;
    status: string;
  }>;
}

export function exportGradebookToPdf(data: GradebookPdfData): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 841.89 pt in landscape
  const pageHeight = doc.internal.pageSize.getHeight(); // 595.28 pt in landscape
  const margin = 35;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const addFooter = () => {
    const pageCount = (doc as any).internal.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text(
      `Class Copilot Official Examination Marksheet | Page ${pageCount}`,
      pageWidth / 2,
      pageHeight - 15,
      { align: 'center' }
    );
  };

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin - 25) {
      addFooter();
      doc.addPage();
      y = margin + 15;
    }
  };

  // Header
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(margin, y, contentWidth, 54, 5, 5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('CLASS COPILOT - OFFICIAL GRADEBOOK & ROSTER MARKSHEET', margin + 15, y + 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Class/Cohort: ${data.className || 'General Science & Tech'}   |   Term: ${data.term || 'Spring Semester'}   |   Date: ${new Date().toLocaleDateString()}`, margin + 15, y + 40);

  y += 66;

  // Table Headers
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 22, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  
  doc.text('Roll No', margin + 8, y + 14);
  doc.text('Student Name', margin + 65, y + 14);
  doc.text('Quiz 1', margin + 220, y + 14);
  doc.text('Quiz 2', margin + 270, y + 14);
  doc.text('Quiz 3', margin + 320, y + 14);
  doc.text('Midterm', margin + 375, y + 14);
  doc.text('Final Exam', margin + 435, y + 14);
  doc.text('Total %', margin + 505, y + 14);
  doc.text('Grade', margin + 560, y + 14);
  doc.text('Attendance', margin + 615, y + 14);
  doc.text('Status', margin + 685, y + 14);

  y += 22;

  data.students.forEach((s, idx) => {
    checkPageBreak(17);
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentWidth, 16, 'F');
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);

    doc.text(s.rollNo || `PK-${100 + idx}`, margin + 8, y + 11);
    doc.text(s.name, margin + 65, y + 11);
    doc.text(`${s.quizzes?.[0] ?? 85}`, margin + 220, y + 11);
    doc.text(`${s.quizzes?.[1] ?? 88}`, margin + 270, y + 11);
    doc.text(`${s.quizzes?.[2] ?? 90}`, margin + 320, y + 11);
    doc.text(`${s.midterm ?? 84}`, margin + 375, y + 11);
    doc.text(`${s.finalExam ?? 89}`, margin + 435, y + 11);

    doc.setFont('helvetica', 'bold');
    doc.text(`${s.overallScore}%`, margin + 505, y + 11);
    doc.text(s.letterGrade || 'A', margin + 560, y + 11);

    doc.setFont('helvetica', 'normal');
    doc.text(`${s.attendance}%`, margin + 615, y + 11);

    if (s.status === 'At Risk') {
      doc.setTextColor(220, 38, 38);
    } else {
      doc.setTextColor(16, 185, 129);
    }
    doc.setFont('helvetica', 'bold');
    doc.text(s.status, margin + 685, y + 11);

    y += 16;
  });

  addFooter();
  doc.save(`Official_Gradebook_Marksheet_${new Date().toISOString().split('T')[0]}.pdf`);
}
