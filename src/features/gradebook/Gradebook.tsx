/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '@/src/store/useAppStore';
import { getTranslation } from '@/src/config/i18n';
import { Card } from '@/src/components/shared/Card';
import { Button } from '@/src/components/shared/Button';
import { 
  Search, 
  Download, 
  Printer, 
  SlidersHorizontal, 
  Sparkles, 
  TrendingUp, 
  UserPlus, 
  ArrowUpDown, 
  Check, 
  X, 
  Loader2, 
  AlertCircle, 
  Award, 
  AlertTriangle, 
  Bookmark, 
  BookmarkCheck, 
  ChevronLeft, 
  ChevronRight, 
  User, 
  Edit3, 
  Calendar,
  Save,
  Grid,
  List,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GradebookRecord } from '@/src/types';
import { exportGradebookToPdf } from '@/src/utils/pdfExport';

export const Gradebook: React.FC = () => {
  const { locale, theme, classes, fetchClassrooms } = useAppStore();
  const isRtl = locale === 'ur';

  // API State
  const [records, setRecords] = useState<GradebookRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filtering State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCourse, setSelectedCourse] = useState<string>('All');
  const [gradeAlertFilter, setGradeAlertFilter] = useState<string>('All'); // 'All', 'High Achiever', 'Passing', 'Remedial'

  // Sorting State
  const [sortField, setSortField] = useState<keyof GradebookRecord | 'average'>('studentName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Bulk Update State
  const [showBulkModal, setShowBulkModal] = useState<boolean>(false);
  const [bulkField, setBulkField] = useState<'assignment1' | 'assignment2' | 'midterm' | 'finalExam' | 'classProject' | 'attendanceMark'>('assignment1');
  const [bulkAction, setBulkAction] = useState<'add' | 'set'>('add');
  const [bulkValue, setBulkValue] = useState<string>('');
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkSuccess, setBulkSuccess] = useState<string | null>(null);

  // Inline/Modal Edit Record State
  const [editingRecord, setEditingRecord] = useState<GradebookRecord | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<boolean>(false);

  // Selection state for Bulk updates (e.g. checkbox on each row)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Layout View mode for responsiveness ('table' vs 'cards' list)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // CSV Export dropdown state
  const [showExport, setShowExport] = useState<boolean>(false);

  // Fetch gradebook records
  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/teacher/gradebook');
      if (!res.ok) {
        throw new Error(`Failed to load gradebook: ${res.statusText}`);
      }
      const data = await res.json();
      setRecords(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Could not synchronized gradebook marks.');
      // Load fallback local items in case server is refreshing
      setRecords([
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
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassrooms();
    fetchRecords();
  }, []);

  // Calculate student average score dynamically
  const calculateAverage = (r: GradebookRecord) => {
    const sum = Number(r.assignment1) + Number(r.assignment2) + Number(r.midterm) + Number(r.finalExam) + Number(r.classProject);
    return Math.round((sum / 5) * 10) / 10;
  };

  // Classify GPA levels based on averages
  const getGradeCategory = (avg: number) => {
    if (avg >= 85) return 'High Achiever';
    if (avg >= 60) return 'Passing';
    return 'Remedial';
  };

  // Handles individual updates
  const saveIndividualRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    try {
      setUpdating(true);
      setEditError(null);

      // Simple bounds validation
      const scores = [
        editingRecord.assignment1,
        editingRecord.assignment2,
        editingRecord.midterm,
        editingRecord.finalExam,
        editingRecord.classProject,
        editingRecord.attendanceMark
      ];
      if (scores.some(s => isNaN(Number(s)) || Number(s) < 0 || Number(s) > 100)) {
        throw new Error('All academic marks must be numeric values between 0 and 100.');
      }

      const res = await fetch(`/api/teacher/gradebook/${editingRecord.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingRecord)
      });

      if (!res.ok) {
        throw new Error('Failed to update student grades.');
      }

      const data = await res.json();
      
      // Update local record
      setRecords(prev => prev.map(r => r.id === editingRecord.id ? data.record : r));
      setEditingRecord(null);
    } catch (err: any) {
      setEditError(err.message || 'Something went wrong while saving marks.');
    } finally {
      setUpdating(false);
    }
  };

  // Run Bulk update (adds bonus marks or sets specific grades for selected ids)
  const executeBulkUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkError(null);
    setBulkSuccess(null);

    if (selectedIds.length === 0) {
      setBulkError('Please select at least one student by checking their row box.');
      return;
    }

    const val = Number(bulkValue);
    if (isNaN(val) || bulkValue.trim() === '') {
      setBulkError('Bulk update value must be a valid number.');
      return;
    }

    if (bulkAction === 'set' && (val < 0 || val > 100)) {
      setBulkError('Direct score assignment value must be between 0 and 100.');
      return;
    }

    if (bulkAction === 'add' && (val < -50 || val > 50)) {
      setBulkError('Bonus adjustment must be a realistic offset (between -50 and 50).');
      return;
    }

    try {
      setUpdating(true);
      const res = await fetch('/api/teacher/gradebook/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: selectedIds,
          field: bulkField,
          value: val,
          type: bulkAction
        })
      });

      if (!res.ok) {
        throw new Error('Bulk operation failed');
      }

      const data = await res.json();
      setRecords(data.records);
      setBulkSuccess(`Successfully updated the ${bulkField} marks of ${selectedIds.length} students!`);
      setSelectedIds([]);
      setBulkValue('');
      
      setTimeout(() => {
        setShowBulkModal(false);
        setBulkSuccess(null);
      }, 1500);

    } catch (err: any) {
      setBulkError(err.message || 'Error occurred during bulk operation.');
    } finally {
      setUpdating(false);
    }
  };

  // Sorting trigger
  const handleSort = (field: keyof GradebookRecord | 'average') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter & Search computation
  const filteredAndSortedRecords = useMemo(() => {
    let result = [...records];

    // 1. Search text filter
    if (searchTerm.trim() !== '') {
      result = result.filter(r => 
        r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 2. Course subject filter
    if (selectedCourse !== 'All') {
      result = result.filter(r => r.course === selectedCourse);
    }

    // 3. Alert/GPA category filter
    if (gradeAlertFilter !== 'All') {
      result = result.filter(r => {
        const avg = calculateAverage(r);
        const cat = getGradeCategory(avg);
        return cat === gradeAlertFilter;
      });
    }

    // 4. Sort calculations
    result.sort((a, b) => {
      let valA: any = sortField === 'average' ? calculateAverage(a) : a[sortField];
      let valB: any = sortField === 'average' ? calculateAverage(b) : b[sortField];

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [records, searchTerm, selectedCourse, gradeAlertFilter, sortField, sortDirection]);

  // Selected checkbox management
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredAndSortedRecords.map(r => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Pagination bounds
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedRecords.slice(start, start + pageSize);
  }, [filteredAndSortedRecords, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredAndSortedRecords.length / pageSize) || 1;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCourse, gradeAlertFilter, pageSize]);

  // CSV Export helper
  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExport(false);
  };

  const exportFullRoster = () => {
    const headers = ['Student ID', 'Name', 'Course', 'Assignment 1', 'Assignment 2', 'Midterm', 'Final Exam', 'Project', 'Attendance', 'Comments', 'Grade Average %', 'Last Updated'];
    const rows = records.map(r => [
      r.studentId,
      r.studentName,
      r.course,
      r.assignment1,
      r.assignment2,
      r.midterm,
      r.finalExam,
      r.classProject,
      r.attendanceMark,
      `"${r.comments.replace(/"/g, '""')}"`,
      `${calculateAverage(r)}%`,
      r.lastUpdated
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    downloadCSV(csvContent, 'Comprehensive_Gradebook_Marksheet.csv');
  };

  // Trigger PDF Export workflow
  const [showPdfMenu, setShowPdfMenu] = useState<boolean>(false);

  const handleDownloadPDF = () => {
    const getLetter = (avg: number) => {
      if (avg >= 90) return 'A+';
      if (avg >= 80) return 'A';
      if (avg >= 70) return 'B';
      if (avg >= 60) return 'C';
      if (avg >= 50) return 'D';
      return 'F';
    };

    exportGradebookToPdf({
      className: selectedCourse === 'All' ? 'All Classes & Subjects' : selectedCourse,
      term: 'Spring 2026 Academic Term',
      students: filteredAndSortedRecords.map(r => {
        const avg = calculateAverage(r);
        return {
          id: r.id,
          name: r.studentName,
          rollNo: r.studentId,
          quizzes: [r.assignment1, r.assignment2, r.classProject],
          midterm: r.midterm,
          finalExam: r.finalExam,
          overallScore: avg,
          letterGrade: getLetter(avg),
          attendance: r.attendanceMark,
          status: avg >= 60 ? 'Active' : 'At Risk'
        };
      })
    });
    setShowPdfMenu(false);
  };

  const handlePrintPDF = () => {
    window.print();
    setShowPdfMenu(false);
  };

  // Aggregate stats of current filtered cohort
  const classStats = useMemo(() => {
    if (filteredAndSortedRecords.length === 0) {
      return { count: 0, classAvg: 0, highAchievers: 0, remedialCount: 0 };
    }
    const sum = filteredAndSortedRecords.reduce((acc, r) => acc + calculateAverage(r), 0);
    const averages = filteredAndSortedRecords.map(r => calculateAverage(r));
    return {
      count: filteredAndSortedRecords.length,
      classAvg: Math.round((sum / filteredAndSortedRecords.length) * 10) / 10,
      highAchievers: averages.filter(a => a >= 85).length,
      remedialCount: averages.filter(a => a < 60).length
    };
  }, [filteredAndSortedRecords]);

  return (
    <div className="space-y-6 print:space-y-4 font-sans select-text">
      {/* Print Cover Header */}
      <div className="hidden print:block border-b-2 border-slate-300 pb-4 mb-6">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">FuturoVerse Pakistan</h1>
            <p className="text-sm text-slate-500">Official Consolidated Academic Gradebook & Marksheet Report</p>
          </div>
          <div className="text-right text-xs text-slate-500 font-mono">
            <p>Printed on: {new Date().toLocaleDateString()}</p>
            <p>Subject: {selectedCourse}</p>
            <p>Grade alert focus: {gradeAlertFilter}</p>
          </div>
        </div>
      </div>

      {/* Main Header Screen */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {isRtl ? 'پیشہ ورانہ گریڈ بک' : 'Professional Gradebook'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {isRtl 
              ? 'کلاس روم کے نشانات کا نظم کریں، بلک اپڈیٹس کریں، اور کارکردگی کی بنیاد پر چھانٹی کریں۔' 
              : 'Direct marksheet editing, fast bulk score updates, complex column sorting, performance rosters, and custom PDF templates.'}
          </p>
        </div>

        {/* Top actions */}
        <div className="flex items-center gap-2 self-start md:self-center">
          <div className="relative">
            <button
              onClick={() => setShowPdfMenu(!showPdfMenu)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors shadow-xs cursor-pointer text-slate-700 dark:text-slate-200"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-500" />
              <span>{isRtl ? 'پرنٹ / پی ڈی ایف ایکسپورٹ' : 'Export PDF / Print'}</span>
            </button>

            {showPdfMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowPdfMenu(false)} />
                <div className="absolute right-0 top-10 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-1.5 flex flex-col gap-1 z-50">
                  <button
                    onClick={handleDownloadPDF}
                    className="w-full text-left px-3 py-2 text-xs font-medium rounded-lg text-slate-800 dark:text-slate-100 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Download Marksheet PDF</span>
                  </button>
                  <button
                    onClick={handlePrintPDF}
                    className="w-full text-left px-3 py-2 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-400" />
                    <span>Print Page View</span>
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowExport(!showExport)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isRtl ? 'ایکسپورٹ شیٹ' : 'Export Marksheet'}</span>
            </button>

            {showExport && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowExport(false)} />
                <div className="absolute right-0 top-10 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-1.5 flex flex-col gap-1 z-50">
                  <button
                    onClick={exportFullRoster}
                    className="w-full text-left px-3 py-2 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    Export Full CSV
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Cohort Statistics overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
            {isRtl ? 'کل طلباء' : 'Students Enrolled'}
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl md:text-2xl font-black text-slate-900 dark:text-white font-mono">
              {classStats.count}
            </span>
            <span className="text-xs text-slate-400">active</span>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
            {isRtl ? 'کلاس کا اوسط' : 'Class average'}
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl md:text-2xl font-black text-slate-900 dark:text-white font-mono">
              {classStats.classAvg}%
            </span>
            <span className="text-xs text-emerald-500 font-bold">Passing</span>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between border-l-4 border-l-emerald-500">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
            {isRtl ? 'اعلیٰ کارکردگی' : 'High Achievers'}
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl md:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {classStats.highAchievers}
            </span>
            <span className="text-xs text-slate-400">&gt;= 85% score</span>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between border-l-4 border-l-rose-500">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
            {isRtl ? 'ریمیڈیل الرٹس' : 'Remedial alerts'}
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className={`text-xl md:text-2xl font-black font-mono ${classStats.remedialCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'}`}>
              {classStats.remedialCount}
            </span>
            <span className="text-xs text-slate-400">&lt; 60% average</span>
          </div>
        </Card>
      </div>

      {/* Search, Filter, Bulk Update Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 space-y-4 shadow-xs print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="gradebook-search-input"
                aria-label={isRtl ? 'طالب علم کا نام تلاش کریں' : 'Search student by name'}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={isRtl ? 'طالب علم کا نام تلاش کریں...' : 'Search student...'}
                className="pl-9 pr-4 py-2 w-full sm:w-[220px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-400 dark:focus:border-blue-500 transition-all placeholder-slate-400 text-slate-700 dark:text-slate-200"
              />
            </div>

            {/* Course Dropdown */}
            <select
              id="gradebook-course-filter"
              aria-label={isRtl ? 'مضمون کے لحاظ سے فلٹر کریں' : 'Filter gradebook by course subject'}
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="All">{isRtl ? 'تمام مضامین' : 'All Subjects / Courses'}</option>
              {classes.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>

            {/* Alert Level Filter */}
            <select
              id="gradebook-alert-filter"
              aria-label={isRtl ? 'کارکردگی کے درجے کے لحاظ سے فلٹر کریں' : 'Filter gradebook by performance alert level'}
              value={gradeAlertFilter}
              onChange={(e) => setGradeAlertFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="All">{isRtl ? 'تمام درجات' : 'All Performance Levels'}</option>
              <option value="High Achiever">{isRtl ? 'اعلیٰ کارکردگی (>=85%)' : 'High Achievers (>= 85%)'}</option>
              <option value="Passing">{isRtl ? 'پاسنگ اسکور (60-84%)' : 'Passing Grade (60% - 84%)'}</option>
              <option value="Remedial">{isRtl ? 'ریمیڈیل درکار (<60%)' : 'Remedial Focus (< 60%)'}</option>
            </select>
          </div>

          <div className="flex items-center gap-2 self-end lg:self-center">
            {/* View layout mode switch */}
            <div className="flex items-center border border-slate-100 dark:border-slate-800 p-0.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-800 shadow-xs text-blue-500' : 'text-slate-400'}`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'cards' ? 'bg-white dark:bg-slate-800 shadow-xs text-blue-500' : 'text-slate-400'}`}
                title="Cards Grid View (Responsive)"
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>

            {/* Bulk Update Modal Opener */}
            <button
              onClick={() => {
                if (selectedIds.length === 0) {
                  alert(isRtl ? 'براہ کرم بلک اپڈیٹ سے پہلے کم از کم ایک طالب علم کے خانے کو منتخب کریں۔' : 'Please check at least one student checkbox in the list below to run a bulk score action.');
                  return;
                }
                setShowBulkModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-colors cursor-pointer select-none"
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>{isRtl ? 'بلک اپڈیٹ' : 'Bulk Action'} ({selectedIds.length})</span>
            </button>
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div className="p-2.5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/50 dark:border-blue-900/30 rounded-xl flex items-center justify-between text-xs text-blue-700 dark:text-blue-300 font-medium">
            <div className="flex items-center gap-1.5">
              <Info className="w-4 h-4 text-blue-500" />
              <span>You have selected <strong>{selectedIds.length}</strong> students. Click &quot;Bulk Action&quot; to apply bonus marks or overwrite scores instantly.</span>
            </div>
            <button 
              onClick={() => setSelectedIds([])}
              className="text-[10px] uppercase font-bold tracking-wider underline hover:text-blue-900 dark:hover:text-white cursor-pointer"
            >
              Deselect All
            </button>
          </div>
        )}
      </div>

      {/* Main Gradebook Container */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading live gradebook records...</p>
        </div>
      ) : error && records.length === 0 ? (
        <div className="bg-red-50 dark:bg-red-950/10 border border-red-200 dark:border-red-900/30 p-5 rounded-2xl text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <p className="text-sm font-semibold text-red-800 dark:text-red-400">{error}</p>
          <Button size="sm" onClick={fetchRecords}>Retry</Button>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          {viewMode === 'table' ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs print:border-none print:shadow-none">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider select-none">
                    <tr>
                      {/* Checkbox column */}
                      <th className="p-3.5 text-center w-12 print:hidden">
                        <input
                          type="checkbox"
                          onChange={handleSelectAll}
                          checked={filteredAndSortedRecords.length > 0 && selectedIds.length === filteredAndSortedRecords.length}
                          className="rounded-sm border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                        />
                      </th>
                      {/* Student Info */}
                      <th className="p-3.5 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-colors w-[18%] group" onClick={() => handleSort('studentName')}>
                        <div className="flex items-center gap-1">
                          <span>{isRtl ? 'طالب علم' : 'Student'}</span>
                          <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </th>
                      {/* Course */}
                      <th className="p-3.5 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-colors w-[15%] group" onClick={() => handleSort('course')}>
                        <div className="flex items-center gap-1">
                          <span>{isRtl ? 'مضمون' : 'Course Subject'}</span>
                          <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </th>
                      {/* Assignments */}
                      <th className="p-3.5 text-center cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-colors group" onClick={() => handleSort('assignment1')}>
                        <div className="flex items-center justify-center gap-1">
                          <span>Asg 1 (100)</span>
                          <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </th>
                      <th className="p-3.5 text-center cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-colors group" onClick={() => handleSort('assignment2')}>
                        <div className="flex items-center justify-center gap-1">
                          <span>Asg 2 (100)</span>
                          <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </th>
                      {/* Midterm */}
                      <th className="p-3.5 text-center cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-colors group" onClick={() => handleSort('midterm')}>
                        <div className="flex items-center justify-center gap-1">
                          <span>Midterm (100)</span>
                          <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </th>
                      {/* Project */}
                      <th className="p-3.5 text-center cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-colors group" onClick={() => handleSort('classProject')}>
                        <div className="flex items-center justify-center gap-1">
                          <span>Project (100)</span>
                          <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </th>
                      {/* Attendance */}
                      <th className="p-3.5 text-center cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-colors group" onClick={() => handleSort('attendanceMark')}>
                        <div className="flex items-center justify-center gap-1">
                          <span>Attend %</span>
                          <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </th>
                      {/* Final Exam */}
                      <th className="p-3.5 text-center cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-colors group" onClick={() => handleSort('finalExam')}>
                        <div className="flex items-center justify-center gap-1">
                          <span>Final (100)</span>
                          <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </th>
                      {/* Calculated Grade Average */}
                      <th className="p-3.5 text-center cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-colors group" onClick={() => handleSort('average')}>
                        <div className="flex items-center justify-center gap-1">
                          <span>Average Grade</span>
                          <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </th>
                      {/* Inline Actions */}
                      <th className="p-3.5 text-right print:hidden w-16">{isRtl ? 'تدوین' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {paginatedRecords.map((r) => {
                      const avg = calculateAverage(r);
                      const isSelected = selectedIds.includes(r.id);
                      return (
                        <tr 
                          key={r.id} 
                          className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors ${isSelected ? 'bg-blue-50/20 dark:bg-blue-950/10' : ''}`}
                        >
                          <td className="p-3.5 text-center print:hidden">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSelectRow(r.id)}
                              className="rounded-sm border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                            />
                          </td>
                          <td className="p-3.5">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900 dark:text-white text-sm">
                                {r.studentName}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                                {r.studentId}
                              </span>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <span className="text-slate-600 dark:text-slate-300 font-medium">
                              {r.course}
                            </span>
                          </td>
                          {/* Assignment 1 */}
                          <td className="p-3.5 text-center font-mono font-semibold text-slate-700 dark:text-slate-300">
                            {r.assignment1}
                          </td>
                          {/* Assignment 2 */}
                          <td className="p-3.5 text-center font-mono font-semibold text-slate-700 dark:text-slate-300">
                            {r.assignment2}
                          </td>
                          {/* Midterm */}
                          <td className="p-3.5 text-center font-mono font-semibold text-slate-700 dark:text-slate-300">
                            {r.midterm}
                          </td>
                          {/* Project */}
                          <td className="p-3.5 text-center font-mono font-semibold text-slate-700 dark:text-slate-300">
                            {r.classProject}
                          </td>
                          {/* Attendance */}
                          <td className="p-3.5 text-center font-mono font-semibold">
                            <span className={r.attendanceMark < 75 ? 'text-rose-500 font-black' : 'text-slate-700 dark:text-slate-300'}>
                              {r.attendanceMark}%
                            </span>
                          </td>
                          {/* Final Exam */}
                          <td className="p-3.5 text-center font-mono font-semibold text-slate-700 dark:text-slate-300">
                            {r.finalExam}
                          </td>
                          {/* Average Grade Status Badge */}
                          <td className="p-3.5 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold font-mono ${
                                avg >= 85 
                                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20' 
                                  : avg >= 60 
                                  ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20' 
                                  : 'bg-rose-50 text-rose-600 dark:bg-rose-950/20'
                              }`}>
                                {avg}%
                              </span>
                              <span className="text-[9px] text-slate-400 font-mono">
                                {avg >= 85 ? 'Grade: A' : avg >= 60 ? 'Grade: B/C' : 'Alert: F'}
                              </span>
                            </div>
                          </td>
                          {/* Inline Action (Edit icon triggers modular drawer) */}
                          <td className="p-3.5 text-right print:hidden">
                            <button
                              onClick={() => setEditingRecord(r)}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer text-slate-500 dark:text-slate-400"
                              title="Edit marks"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filteredAndSortedRecords.length === 0 && (
                <div className="p-12 text-center text-slate-400">
                  {isRtl ? 'کوئی ریکارڈ نہیں ملا۔' : 'No student marksheet records match the filtering parameters.'}
                </div>
              )}
            </div>
          ) : (
            /* Responsive Card List View for Mobile Devices */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2">
              {paginatedRecords.map((r) => {
                const avg = calculateAverage(r);
                const isSelected = selectedIds.includes(r.id);
                return (
                  <Card 
                    key={r.id} 
                    className={`p-5 space-y-4 hover:border-blue-400 dark:hover:border-blue-500/50 transition-all ${
                      isSelected ? 'ring-2 ring-blue-500/30 bg-blue-50/10' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(r.id)}
                          className="rounded-sm border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer print:hidden"
                        />
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm">{r.studentName}</h4>
                          <span className="text-[10px] text-slate-400 font-mono">{r.studentId} • {r.course}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold font-mono ${
                          avg >= 85 
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20' 
                            : avg >= 60 
                            ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20' 
                            : 'bg-rose-50 text-rose-600 dark:bg-rose-950/20'
                        }`}>
                          {avg}% Avg
                        </span>
                        <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                          {avg >= 85 ? 'Excellent' : avg >= 60 ? 'Satisfactory' : 'Remedial Required'}
                        </div>
                      </div>
                    </div>

                    {/* Scores Grid inside Card */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl text-center">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wide">Asg 1</div>
                        <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">{r.assignment1}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wide">Asg 2</div>
                        <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">{r.assignment2}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wide">Midterm</div>
                        <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">{r.midterm}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wide">Project</div>
                        <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">{r.classProject}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wide">Attend</div>
                        <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">{r.attendanceMark}%</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wide">Final</div>
                        <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">{r.finalExam}</div>
                      </div>
                    </div>

                    {r.comments && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 italic line-clamp-2">
                        &ldquo;{r.comments}&rdquo;
                      </p>
                    )}

                    <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800/60 text-[10px] text-slate-400">
                      <span>Updated: {new Date(r.lastUpdated).toLocaleDateString()}</span>
                      <button
                        onClick={() => setEditingRecord(r)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-500 text-slate-600 dark:text-slate-300 font-semibold cursor-pointer transition-colors"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit Marks</span>
                      </button>
                    </div>
                  </Card>
                );
              })}

              {filteredAndSortedRecords.length === 0 && (
                <div className="p-12 text-center text-slate-400 col-span-2">
                  No records match selected parameters.
                </div>
              )}
            </div>
          )}

          {/* Pagination Controls */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>{isRtl ? 'درج شدہ ریکارڈز فی صفحہ:' : 'Show items per page:'}</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs focus:outline-none cursor-pointer text-slate-700 dark:text-slate-200"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
              <span className="ml-2">
                Showing {Math.min(filteredAndSortedRecords.length, (currentPage - 1) * pageSize + 1)} - {Math.min(filteredAndSortedRecords.length, currentPage * pageSize)} of {filteredAndSortedRecords.length}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </button>

              <div className="text-xs font-bold text-slate-700 dark:text-slate-200 px-2">
                {isRtl ? `صفحہ ${currentPage} کا ${totalPages}` : `Page ${currentPage} of ${totalPages}`}
              </div>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* BULK UPDATE SIDE OVERLAY MODAL */}
      <AnimatePresence>
        {showBulkModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center print:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { if (!updating) setShowBulkModal(false); }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            />

            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-2xl z-50 space-y-4 text-slate-800 dark:text-slate-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-md">
                    Bulk Update Scores
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Applying changes to {selectedIds.length} checked students
                  </p>
                </div>
                <button
                  disabled={updating}
                  onClick={() => setShowBulkModal(false)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              {/* Status Feedbacks */}
              {bulkError && (
                <div className="p-3 rounded-xl text-xs font-medium bg-rose-50 border border-rose-100 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{bulkError}</span>
                </div>
              )}

              {bulkSuccess && (
                <div className="p-3 rounded-xl text-xs font-medium bg-emerald-50 border border-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400">
                  {bulkSuccess}
                </div>
              )}

              <form onSubmit={executeBulkUpdate} className="space-y-4">
                {/* Field dropdown */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Target Test / Assignment Column</label>
                  <select
                    value={bulkField}
                    onChange={(e: any) => setBulkField(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none"
                  >
                    <option value="assignment1">Assignment 1 (Max 100)</option>
                    <option value="assignment2">Assignment 2 (Max 100)</option>
                    <option value="midterm">Midterm (Max 100)</option>
                    <option value="finalExam">Final Exam (Max 100)</option>
                    <option value="classProject">Class Project (Max 100)</option>
                    <option value="attendanceMark">Attendance (Max 100)</option>
                  </select>
                </div>

                {/* Operation type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Operation Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setBulkAction('add')}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        bulkAction === 'add' 
                          ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400' 
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      Add Marks (Bonus)
                    </button>
                    <button
                      type="button"
                      onClick={() => setBulkAction('set')}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        bulkAction === 'set' 
                          ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400' 
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      Overwrite Score
                    </button>
                  </div>
                </div>

                {/* Mark Value input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    {bulkAction === 'add' ? 'Offset Value (e.g. 5 to add, -5 to subtract)' : 'New Target Score Value'}
                  </label>
                  <input
                    type="number"
                    required
                    value={bulkValue}
                    onChange={(e) => setBulkValue(e.target.value)}
                    placeholder={bulkAction === 'add' ? 'Enter e.g. 5' : 'Enter e.g. 85'}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-2 justify-end pt-2">
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={() => setShowBulkModal(false)}
                    disabled={updating}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={updating}
                    className="bg-amber-600 hover:bg-amber-700 border-none flex items-center gap-1.5 text-white"
                  >
                    {updating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Confirm Bulk Update</span>
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* INDIVIDUAL EDIT DRAWER / MODAL OVERLAY */}
      <AnimatePresence>
        {editingRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center print:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { if (!updating) setEditingRecord(null); }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            />

            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-2xl z-50 space-y-4 text-slate-800 dark:text-slate-200"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-3">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-md">
                    Edit Student Marksheet
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Modifying grade parameters of {editingRecord.studentName} ({editingRecord.studentId})
                  </p>
                </div>
                <button
                  disabled={updating}
                  onClick={() => setEditingRecord(null)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              {/* Status errors */}
              {editError && (
                <div className="p-3 rounded-xl text-xs font-medium bg-rose-50 border border-rose-100 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <form onSubmit={saveIndividualRecord} className="space-y-4">
                {/* Inputs grid */}
                <div className="grid grid-cols-2 gap-3.5">
                  {/* Assignment 1 */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assignment 1 (Max 100)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={100}
                      value={editingRecord.assignment1}
                      onChange={(e) => setEditingRecord({ ...editingRecord, assignment1: Number(e.target.value) })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none"
                    />
                  </div>

                  {/* Assignment 2 */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assignment 2 (Max 100)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={100}
                      value={editingRecord.assignment2}
                      onChange={(e) => setEditingRecord({ ...editingRecord, assignment2: Number(e.target.value) })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none"
                    />
                  </div>

                  {/* Midterm */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Midterm (Max 100)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={100}
                      value={editingRecord.midterm}
                      onChange={(e) => setEditingRecord({ ...editingRecord, midterm: Number(e.target.value) })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none"
                    />
                  </div>

                  {/* Class Project */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Class Project (Max 100)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={100}
                      value={editingRecord.classProject}
                      onChange={(e) => setEditingRecord({ ...editingRecord, classProject: Number(e.target.value) })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none"
                    />
                  </div>

                  {/* Attendance Mark */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attendance Mark %</label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={100}
                      value={editingRecord.attendanceMark}
                      onChange={(e) => setEditingRecord({ ...editingRecord, attendanceMark: Number(e.target.value) })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none"
                    />
                  </div>

                  {/* Final Exam */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Final Exam (Max 100)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={100}
                      value={editingRecord.finalExam}
                      onChange={(e) => setEditingRecord({ ...editingRecord, finalExam: Number(e.target.value) })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none"
                    />
                  </div>
                </div>

                {/* Comment box */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Teacher Feedback & Comments</label>
                  <textarea
                    value={editingRecord.comments}
                    onChange={(e) => setEditingRecord({ ...editingRecord, comments: e.target.value })}
                    rows={3}
                    placeholder="Enter academic feedback..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-medium focus:outline-none resize-none placeholder-slate-400 text-slate-700 dark:text-slate-200"
                  />
                </div>

                {/* Bottom Buttons */}
                <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 dark:border-slate-800/60">
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={() => setEditingRecord(null)}
                    disabled={updating}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={updating}
                    className="flex items-center gap-1.5 text-white"
                  >
                    {updating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Save Marks</span>
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
