/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/src/store/useAppStore';
import { UploadedMaterial, UploadFileType } from '@/src/types';
import {
  Card,
  Button,
  Input,
  Select,
  Badge,
  Dialog,
  Pagination,
  ToastContainer,
  Skeleton,
  Spinner,
  EmptyState,
} from '@/src/components/ui';
import {
  BookOpen,
  Search,
  Plus,
  Trash2,
  Edit2,
  Eye,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  FileText,
  Clock,
  X,
  UploadCloud,
  Sparkles,
  CloudLightning,
  Filter,
  FileUp,
  FileWarning,
  ExternalLink,
  ChevronRight,
  Info,
} from 'lucide-react';

interface UploadQueueItem {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  error?: string;
  course: string;
  sizeMB: number;
}

export const Resources: React.FC = () => {
  const {
    uploadedMaterials,
    fetchMaterials,
    uploadMaterial,
    deleteMaterial,
    renameMaterial,
    classrooms,
    fetchClassrooms,
    locale,
  } = useAppStore();

  // Bilingual UI Text helper
  const t = (en: string, ur: string) => (locale === 'ur' ? ur : en);

  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState('All');
  const [page, setPage] = useState(1);
  const limit = 5;

  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });

  // Custom Toast Notification System
  const [toasts, setToasts] = useState<any[]>([]);
  const addToast = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const id = `toast_${Math.random().toString(36).substr(2, 9)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  };
  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Upload Panel state
  const [selectedCourse, setSelectedCourse] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [simulateNetworkError, setSimulateNetworkError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modals Visibility
  const [previewOpen, setPreviewOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Selected Material for Actions
  const [selectedMaterial, setSelectedMaterial] = useState<UploadedMaterial | null>(null);
  const [renamingMaterial, setRenamingMaterial] = useState<UploadedMaterial | null>(null);
  const [deletingMaterial, setDeletingMaterial] = useState<UploadedMaterial | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);

  // Fetch classrooms and set default course
  useEffect(() => {
    const init = async () => {
      try {
        if (classrooms.length === 0) {
          await fetchClassrooms();
        }
      } catch (err) {
        console.error('Failed to init classrooms:', err);
      }
    };
    init();
  }, []);

  const courseOptions = React.useMemo(() => {
    const list = classrooms.map((cls) => cls.name);
    const unique = Array.from(new Set(list));
    if (unique.length === 0) {
      return ['Physics 101', 'Chemistry 201', 'Calculus I', 'Biology II', 'Computer Science'];
    }
    return unique;
  }, [classrooms]);

  // Set initial selected course once options are available
  useEffect(() => {
    if (courseOptions.length > 0 && !selectedCourse) {
      setSelectedCourse(courseOptions[0]);
    }
  }, [courseOptions, selectedCourse]);

  // Search Debouncing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1); // Reset to page 1 on search change
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load Materials from API
  const loadMaterials = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await fetchMaterials(debouncedQuery, courseFilter, page, limit);
      if (res && res.pagination) {
        setPagination(res.pagination);
      }
    } catch (err: any) {
      console.error('loadMaterials error:', err);
      addToast(t('Failed to load materials database.', 'مواد کا ڈیٹا لوڈ کرنے میں ناکامی۔'), 'error');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, [debouncedQuery, courseFilter, page]);

  // Polling for processing materials
  useEffect(() => {
    const hasProcessing = uploadedMaterials.some((m) => m.status === 'processing');
    if (hasProcessing) {
      const timer = setInterval(() => {
        loadMaterials(false);
      }, 4000);
      return () => clearInterval(timer);
    }
  }, [uploadedMaterials]);

  // Sync selected preview item if list updates
  useEffect(() => {
    if (previewOpen && selectedMaterial) {
      const fresh = uploadedMaterials.find((m) => m.id === selectedMaterial.id);
      if (fresh) setSelectedMaterial(fresh);
    }
  }, [uploadedMaterials, previewOpen, selectedMaterial?.id]);

  // Content Generation based on File Name to supply Gemini with rich text
  const generateMockContent = (fileName: string): string => {
    const name = fileName.toLowerCase();
    if (name.includes('newton') || name.includes('phys') || name.includes('motion')) {
      return `Lecture Syllabus: Isaac Newton's Laws of Motion. 
      - First Law (Law of Inertia): Every body perseveres in its state of rest, or of uniform motion in a right line, unless it is compelled to change that state by forces impressed thereon.
      - Second Law (F=ma): The alteration of motion is ever proportional to the motive force impressed; and is made in the direction of the right line in which that force is impressed.
      - Third Law (Action-Reaction): To every action there is always opposed an equal reaction: or the mutual actions of two bodies upon each other are always equal, and directed to contrary parts.
      Industrial and engineering application limits: Gravitational forces, friction constraints, and aerodynamics calculations. Specially tailored for modern high-speed transportation research.`;
    }
    if (name.includes('cell') || name.includes('bio') || name.includes('genetic') || name.includes('life') || name.includes('plant')) {
      return `Syllabus: Cell Structure & Molecular Biology.
      - Cell Membrane: Semi-permeable double lipid layer controlling cellular influx.
      - Mitochondria: The powerhouse of the eukaryotic cell producing ATP via aerobic cellular respiration.
      - Nucleus: Repository of cell genome containing chromosomal DNA strings.
      - Ribosomes: Cellular complex translating mRNA structures into catalytic protein sequences.
      Genetic replication: DNA transcription, polymerase activity, translation mechanisms. Critical for diagnostics in public health research.`;
    }
    if (name.includes('calculus') || name.includes('math') || name.includes('algebra') || name.includes('integral') || name.includes('limit')) {
      return `Lecture notes: Fundamental Concepts of Calculus.
      - Limits and Continuity: Assessing function behaviors as independent parameters converge towards specific boundary coordinates.
      - Derivatives: Instantaneous rates of change, slopes of tangent lines. Formulas: power rule, product rule, chain rule.
      - Integrals: Summation of infinitesimal slices to calculate area configurations under curves. 
      - Fundamental Theorem of Calculus: Connecting integration with differentiation operations. 
      Practical applications: Fluid mechanics, structural engineering load designs, and algorithmic training datasets.`;
    }
    if (name.includes('chem') || name.includes('acid') || name.includes('organic') || name.includes('atom') || name.includes('bonding')) {
      return `Class Module: Organic Chemistry & Structural Formulas.
      - Covalent vs. Ionic Bonding: Sharing versus transfer of valence shell electrons.
      - Hydrocarbon categorization: Alkanes, alkenes, alkynes, and aromatic benzene rings.
      - Reaction Kinetics: Activation energy curves, catalysts, reaction orders.
      - Thermodynamic laws: Enthalpy, entropy, Gibbs free energy calculations.
      Industrial applications: Polymerization, pharmaceutical synthesis, fertilizer manufacture, and environmental purification.`;
    }
    if (name.includes('computer') || name.includes('code') || name.includes('program') || name.includes('python') || name.includes('algorithm')) {
      return `Lecture Curriculum: Advanced Data Structures & Algorithms.
      - Big O Notation: Time and Space Complexity calculations for optimized runtimes.
      - Linear Structures: Arrays, linked lists, stacks, queues.
      - Non-linear structures: Trees, binary search trees, heap systems, and graphical vertices.
      - Search/Sort Algorithms: Dijkstra pathfinding, quicksort, mergesort, binary search.
      Applications: Database index trees, machine learning structures, and high-performance routing protocols.`;
    }
    return `Educational Syllabus & Handout: "${fileName.replace(/\.[^/.]+$/, "")}". 
    This academic curriculum encompasses core fundamental principles, theoretical methodologies, sample problem calculations, and instructional laboratory experiments. 
    Reviewers are advised to consult recommended textbooks and complete matching assignments to reinforce conceptual understanding.`;
  };

  // Drag & Drop Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesAdded(e.target.files);
    }
  };

  // File Upload Logic
  const handleFilesAdded = (files: FileList) => {
    const validExtensions = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'png', 'jpg', 'jpeg', 'gif'];
    const activeCourse = selectedCourse || courseOptions[0] || 'General';

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const sizeMB = file.size / (1024 * 1024);

      // 1. File Type Validation
      if (!validExtensions.includes(ext)) {
        addToast(
          t(
            `Unsupported format: "${file.name}". Only PDF, DOCX, PPTX, or Images are supported.`,
            `غلط فائل فارمیٹ: "${file.name}"۔ صرف PDF، DOCX، PPTX یا تصویر کی اجازت ہے۔`
          ),
          'error'
        );
        continue;
      }

      // 2. Max File Size Validation (Large File Support Limit check)
      if (sizeMB > 50) {
        addToast(
          t(
            `File size of "${file.name}" exceeds 50MB limit (${sizeMB.toFixed(1)}MB).`,
            `فائل "${file.name}" ۵۰ ایم بی سے بڑی ہے (${sizeMB.toFixed(1)}MB)۔`
          ),
          'error'
        );
        continue;
      }

      // 3. Create Queue Item
      const queueId = `queue_${Math.random().toString(36).substr(2, 9)}`;
      const newItem: UploadQueueItem = {
        id: queueId,
        file,
        progress: 0,
        status: 'pending',
        course: activeCourse,
        sizeMB,
      };

      setUploadQueue((prev) => [...prev, newItem]);
      startUpload(queueId, file, activeCourse, sizeMB);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const startUpload = (queueId: string, file: File, course: string, sizeMB: number) => {
    setUploadQueue((prev) =>
      prev.map((item) =>
        item.id === queueId ? { ...item, status: 'uploading', progress: 0, error: undefined } : item
      )
    );

    // Large File Speed simulation: larger files upload slightly slower
    const uploadSteps = sizeMB > 15 ? 15 : 6;
    const tickInterval = sizeMB > 15 ? 180 : 80;
    let currentProgress = 0;

    const timer = setInterval(async () => {
      // Check if item was removed from queue
      let stillExists = false;
      setUploadQueue((prev) => {
        stillExists = prev.some((item) => item.id === queueId);
        return prev;
      });
      if (!stillExists) {
        clearInterval(timer);
        return;
      }

      currentProgress += Math.floor(Math.random() * 15) + 5;
      if (currentProgress >= 100) {
        currentProgress = 100;
      }

      // Simulated network failure to demo Retry Upload
      if (simulateNetworkError && currentProgress >= 50 && currentProgress < 85) {
        clearInterval(timer);
        setUploadQueue((prev) =>
          prev.map((item) =>
            item.id === queueId
              ? {
                  ...item,
                  status: 'failed',
                  error: t(
                    'Network interruption: connection reset (ERR_CONNECTION_RESET).',
                    'نیٹ ورک خلل: کنکشن ری سیٹ ہو گیا ہے۔'
                  ),
                }
              : item
          )
        );
        addToast(
          t(
            `Failed uploading "${file.name}". Click retry to resume.`,
            `فائل "${file.name}" اپ لوڈ کرنے میں ناکامی۔ دوبارہ کوشش کریں۔`
          ),
          'warning'
        );
        return;
      }

      setUploadQueue((prev) =>
        prev.map((item) =>
          item.id === queueId ? { ...item, progress: currentProgress } : item
        )
      );

      if (currentProgress === 100) {
        clearInterval(timer);

        try {
          // Send content to server
          const generatedText = generateMockContent(file.name);
          const fileTypeMap: Record<string, UploadFileType> = {
            pdf: 'pdf',
            docx: 'docx',
            doc: 'docx',
            pptx: 'pptx',
            ppt: 'pptx',
            png: 'image',
            jpg: 'image',
            jpeg: 'image',
            gif: 'image',
          };
          const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
          const fileType = fileTypeMap[ext] || 'pdf';

          await uploadMaterial({
            fileName: file.name,
            fileType,
            courseName: course,
            fileContentText: generatedText,
            fileSize: `${sizeMB.toFixed(1)} MB`,
          });

          setUploadQueue((prev) =>
            prev.map((item) =>
              item.id === queueId ? { ...item, status: 'completed' } : item
            )
          );

          addToast(
            t(
              `"${file.name}" uploaded. AI processing started!`,
              `فائل "${file.name}" کامیابی سے اپ لوڈ ہو گئی۔ آئی اسکین شروع!`
            ),
            'success'
          );

          // Refresh main listing
          loadMaterials(false);
        } catch (err: any) {
          setUploadQueue((prev) =>
            prev.map((item) =>
              item.id === queueId
                ? {
                    ...item,
                    status: 'failed',
                    error: err.message || t('API upload call failed.', 'اپ لوڈ سروس نے منع کر دیا'),
                  }
                : item
            )
          );
        }
      }
    }, tickInterval);
  };

  const handleRetry = (queueId: string) => {
    const item = uploadQueue.find((q) => q.id === queueId);
    if (!item) return;
    startUpload(item.id, item.file, item.course, item.sizeMB);
  };

  const handleRemoveQueueItem = (queueId: string) => {
    setUploadQueue((prev) => prev.filter((item) => item.id !== queueId));
  };

  // Preview Click Handler
  const handlePreview = (mat: UploadedMaterial) => {
    setSelectedMaterial(mat);
    setPreviewOpen(true);
  };

  // Rename Actions
  const handleRenameClick = (mat: UploadedMaterial) => {
    setRenamingMaterial(mat);
    setRenameInput(mat.fileName);
    setRenameOpen(true);
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingMaterial) return;
    if (!renameInput.trim()) {
      addToast(t('File name cannot be empty', 'فائل کا نام خالی نہیں ہو سکتا'), 'error');
      return;
    }
    setIsActionSubmitting(true);
    try {
      await renameMaterial(renamingMaterial.id, renameInput.trim());
      addToast(t('File renamed successfully!', 'فائل کا نام کامیابی سے تبدیل ہو گیا!'), 'success');
      setRenameOpen(false);
      setRenamingMaterial(null);
    } catch (err: any) {
      addToast(err.message || t('Failed to rename file.', 'نام تبدیل کرنے میں ناکامی۔'), 'error');
    } finally {
      setIsActionSubmitting(false);
    }
  };

  // Delete Actions
  const handleDeleteClick = (mat: UploadedMaterial) => {
    setDeletingMaterial(mat);
    setDeleteOpen(true);
  };

  const handleDeleteSubmit = async () => {
    if (!deletingMaterial) return;
    setIsActionSubmitting(true);
    try {
      await deleteMaterial(deletingMaterial.id);
      addToast(t('File deleted successfully!', 'فائل کامیابی سے حذف کر دی گئی!'), 'success');
      setDeleteOpen(false);
      setDeletingMaterial(null);
    } catch (err: any) {
      addToast(err.message || t('Failed to delete file.', 'فائل حذف کرنے میں ناکامی۔'), 'error');
    } finally {
      setIsActionSubmitting(false);
    }
  };

  // Download Action
  const handleDownloadFile = (mat: UploadedMaterial) => {
    const textContent = mat.fileContentText || generateMockContent(mat.fileName);
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = mat.fileName.includes('.') ? mat.fileName : `${mat.fileName}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast(t(`Downloaded "${mat.fileName}" successfully.`, `فائل "${mat.fileName}" کامیابی سے ڈاؤن لوڈ ہو گئی۔`), 'success');
  };

  // File type design helpers
  const getFileDesign = (type: UploadFileType) => {
    switch (type) {
      case 'pdf':
        return {
          icon: <FileText className="w-5 h-5 text-rose-500" />,
          badgeColor: 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300',
        };
      case 'docx':
        return {
          icon: <FileText className="w-5 h-5 text-blue-500" />,
          badgeColor: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300',
        };
      case 'pptx':
        return {
          icon: <FileText className="w-5 h-5 text-amber-500" />,
          badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300',
        };
      case 'image':
        return {
          icon: <FileText className="w-5 h-5 text-emerald-500" />,
          badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300',
        };
      default:
        return {
          icon: <FileText className="w-5 h-5 text-slate-500" />,
          badgeColor: 'bg-slate-50 text-slate-700 dark:bg-slate-950/30 dark:text-slate-300',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Header card with Stats */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-2xl">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <h1 className="font-sans font-extrabold text-2xl tracking-tight text-slate-900 dark:text-slate-100">
              {t('Lecture Materials', 'نصابی مواد اور لیکچرز')}
            </h1>
            <p className="font-sans text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
              {t(
                'Upload and scan lecture files (PDF, DOCX, PPTX, Images). Real-time AI processing will instantly generate key academic summaries and insights.',
                'لیکچر فائلز اپ لوڈ کریں۔ پنے مواد کا تفصیلی خاکہ اور تعلیمی نکات حاصل کرنے کے لیے سمارٹ سکینر کا استعمال کریں۔'
              )}
            </p>
          </div>
        </div>

        {/* Mini stats cards */}
        <div className="flex gap-3">
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2.5 text-center min-w-[100px]">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{t('Total Files', 'کل فائلیں')}</div>
            <div className="text-xl font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">{pagination.totalItems}</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2.5 text-center min-w-[100px]">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{t('Uploading', 'جاری ہے')}</div>
            <div className="text-xl font-mono font-bold text-blue-600 dark:text-blue-400 mt-0.5">
              {uploadQueue.filter((q) => q.status === 'uploading').length}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Upload left, Files right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Upload Control Panel */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-sans font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <FileUp className="w-4.5 h-4.5 text-blue-500" />
              {t('Upload Lecture Material', 'لیکچر فائل اپ لوڈ کریں')}
            </h3>

            {/* Course Dropdown */}
            <Select
              label={t('Associate with Course *', 'متعلقہ کلاس کا انتخاب *')}
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              options={courseOptions.map((course) => ({ value: course, label: course }))}
            />

            {/* Drag & Drop Box */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`w-full h-44 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center cursor-pointer select-none transition-all ${
                isDragActive
                  ? 'border-blue-500 bg-blue-50/40 dark:border-blue-600 dark:bg-blue-950/20'
                  : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/10 hover:border-slate-400 dark:hover:border-slate-600'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,image/*"
                onChange={handleFileChange}
                className="hidden"
                multiple
              />
              <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-slate-800/80 shadow-xs border border-blue-100/50 dark:border-slate-700 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="font-sans font-bold text-xs text-slate-800 dark:text-slate-200">
                {t('Drag & drop lecture here, or ', 'لیکچر فائل کھینچ کر یہاں لائیں، یا ')}
                <span className="text-blue-600 dark:text-blue-400 font-extrabold underline">{t('browse', 'کمپیوٹر سے منتخب کریں')}</span>
              </p>
              <p className="font-sans text-[10px] text-slate-400 dark:text-slate-500 mt-1.5">
                {t('Supports PDF, DOCX, PPTX or Images up to 50MB', 'صرف PDF، DOCX، PPTX یا تصویر کی اجازت ہے۔ حد ۵۰ ایم بی')}
              </p>
            </div>

            {/* Simulated Interruption Switch */}
            <div className="flex items-center justify-between p-3 bg-amber-50/40 dark:bg-amber-950/10 border border-amber-100/30 dark:border-amber-900/30 rounded-xl">
              <div className="flex gap-2 items-center">
                <CloudLightning className="w-4 h-4 text-amber-500 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                    {t('Simulate Network Errors', 'نیٹ ورک خلل کی مشق')}
                  </span>
                  <span className="text-[9px] text-slate-400">
                    {t('Enables testing the Retry Upload feature', 'دوبارہ اپ لوڈ کی خصوصیت کو جانچنے کے لیے')}
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={simulateNetworkError}
                onChange={(e) => setSimulateNetworkError(e.target.checked)}
                className="w-4 h-4 accent-amber-500 cursor-pointer"
              />
            </div>
          </Card>

          {/* ACTIVE QUEUE CONTAINER */}
          {uploadQueue.length > 0 && (
            <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <h4 className="font-sans font-bold text-xs text-slate-800 dark:text-slate-200">
                  {t('Upload Status Queue', 'اپ لوڈ کی صورتحال')}
                </h4>
                <Button
                  variant="outlined"
                  onClick={() => setUploadQueue([])}
                  className="text-[10px] h-6 px-2 font-sans py-0 cursor-pointer text-slate-400 hover:text-slate-600 border border-slate-100 dark:border-slate-800 rounded-md"
                >
                  {t('Clear Queue', 'صاف کریں')}
                </Button>
              </div>

              <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
                {uploadQueue.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 rounded-xl space-y-2 relative"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 max-w-[80%]">
                        <FileText className="w-4.5 h-4.5 text-blue-500 shrink-0" />
                        <div>
                          <p className="font-sans text-xs font-bold text-slate-800 dark:text-slate-200 truncate" title={item.file.name}>
                            {item.file.name}
                          </p>
                          <span className="text-[9px] text-slate-400 font-semibold block">
                            {item.sizeMB.toFixed(2)} MB &bull; {item.course}
                          </span>
                        </div>
                      </div>

                      {/* Remove/Delete Item button */}
                      <button
                        onClick={() => handleRemoveQueueItem(item.id)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Progress Bar & Badges */}
                    <div className="space-y-1.5">
                      {item.status === 'uploading' && (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-blue-600 h-full rounded-full transition-all duration-150"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                          <span className="text-[9px] font-mono font-bold text-slate-500">{item.progress}%</span>
                        </div>
                      )}

                      {/* Completed */}
                      {item.status === 'completed' && (
                        <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>{t('Upload completed successfully!', 'کامیابی سے اپ لوڈ ہو گئی')}</span>
                        </div>
                      )}

                      {/* Failed / Network Error Block */}
                      {item.status === 'failed' && (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 text-[10px] text-rose-500 font-semibold">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span className="leading-tight">{item.error}</span>
                          </div>
                          <Button
                            onClick={() => handleRetry(item.id)}
                            className="w-full text-[10px] font-sans font-bold h-7 py-0 bg-amber-500 hover:bg-amber-600 text-white rounded-lg flex items-center justify-center gap-1"
                          >
                            <RefreshCw className="w-3 h-3 animate-spin-reverse" />
                            {t('Retry Upload Now', 'دوبارہ کوشش کریں')}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* RIGHT COLUMN: Uploaded Materials Database */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              {/* Search */}
              <div className="sm:col-span-7">
                <Input
                  placeholder={t('Search files by name...', 'فائل تلاش کریں...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftElement={<Search className="w-4 h-4 text-slate-400" />}
                  className="w-full"
                />
              </div>

              {/* Course filter */}
              <div className="sm:col-span-5">
                <Select
                  value={courseFilter}
                  onChange={(e) => {
                    setCourseFilter(e.target.value);
                    setPage(1);
                  }}
                  options={[
                    { value: 'All', label: t('All Courses', 'تمام کلاسز') },
                    ...courseOptions.map((c) => ({ value: c, label: c })),
                  ]}
                />
              </div>
            </div>
          </Card>

          {/* List display */}
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-1/3 rounded-md" />
                    <Skeleton className="h-5 w-20 rounded-md" />
                  </div>
                  <Skeleton className="h-4 w-1/2 rounded-md" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </Card>
              ))}
            </div>
          ) : uploadedMaterials.length === 0 ? (
            <Card className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
              <EmptyState
                title={t('No Materials Found', 'کوئی نصابی مواد نہیں ملا')}
                description={t(
                  'No educational files correspond to your filters. Adjust filters or drag a file to upload.',
                  'تلاش کے نتائج کے مطابق کوئی فائل نہیں ملی۔ فلٹرز تبدیل کریں یا نئی فائل اپ لوڈ کریں۔'
                )}
                icon="menu_book"
              />
            </Card>
          ) : (
            <div className="space-y-3">
              {uploadedMaterials.map((material) => {
                const design = getFileDesign(material.fileType);
                return (
                  <Card
                    key={material.id}
                    className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-blue-400/40 dark:hover:border-blue-500/20 hover:shadow-xs transition-all flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex gap-3">
                        <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 shrink-0">
                          {design.icon}
                        </div>
                        <div>
                          <h4 className="font-sans font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">
                            {material.fileName}
                          </h4>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <Badge
                              variant="neutral"
                              styleType="tonal"
                              className="text-[9px] uppercase font-mono px-1 py-0 rounded-sm"
                            >
                              {material.fileType}
                            </Badge>
                            <span className="text-[10px] text-slate-400 font-semibold bg-slate-50 dark:bg-slate-950 px-1.5 py-0.5 rounded">
                              {material.courseName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {material.fileSize || '1.5 MB'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status Badges */}
                      <div>
                        {material.status === 'processing' && (
                          <Badge variant="primary" styleType="tonal" className="text-[9px] px-1.5 py-0.5 flex items-center gap-1 animate-pulse">
                            <Spinner size="xs" />
                            <span>{t('Processing', 'تجزیہ ہو رہا ہے')}</span>
                          </Badge>
                        )}
                        {material.status === 'processed' && (
                          <Badge variant="success" styleType="tonal" className="text-[9px] px-1.5 py-0.5 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-emerald-500" />
                            <span>{t('Processed', 'سکین مکمل')}</span>
                          </Badge>
                        )}
                        {material.status === 'failed' && (
                          <Badge variant="error" styleType="tonal" className="text-[9px] px-1.5 py-0.5 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-rose-500" />
                            <span>{t('Failed', 'ناکام')}</span>
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* AI Insights strip if processed */}
                    {material.status === 'processed' && material.aiInsight && (
                      <div className="mt-3 p-2 bg-blue-50/50 dark:bg-blue-950/20 border-l-2 border-blue-500 text-[10px] font-sans text-slate-600 dark:text-blue-300 leading-normal flex gap-1.5 items-start">
                        <Sparkles className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                        <span className="line-clamp-1 italic">{material.aiInsight}</span>
                      </div>
                    )}

                    {/* Lower actions bar */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {new Date(material.uploadedAt).toLocaleDateString(locale === 'ur' ? 'ur-PK' : 'en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: 'numeric',
                          })}
                        </span>
                      </div>

                      {/* Action buttons row */}
                      <div className="flex gap-1.5">
                        {/* Preview button */}
                        <Button
                          variant="secondary"
                          onClick={() => handlePreview(material)}
                          className="h-7 w-7 p-0 justify-center rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 dark:bg-slate-950 dark:hover:bg-slate-800/60 dark:text-slate-400 dark:hover:text-slate-200"
                          title={t('Preview File', 'فائل کا خاکہ دیکھیں')}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>

                        {/* Download button */}
                        <Button
                          variant="secondary"
                          onClick={() => handleDownloadFile(material)}
                          className="h-7 w-7 p-0 justify-center rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 dark:bg-slate-950 dark:hover:bg-slate-800/60 dark:text-slate-400 dark:hover:text-slate-200"
                          title={t('Download File', 'ڈاؤن لوڈ کریں')}
                        >
                          <Download className="w-3.5 h-3.5" />
                        </Button>

                        {/* Rename button */}
                        <Button
                          variant="secondary"
                          onClick={() => handleRenameClick(material)}
                          className="h-7 w-7 p-0 justify-center rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 dark:bg-slate-950 dark:hover:bg-slate-800/60 dark:text-slate-400 dark:hover:text-slate-200"
                          title={t('Rename File', 'نام تبدیل کریں')}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>

                        {/* Delete button */}
                        <Button
                          variant="secondary"
                          onClick={() => handleDeleteClick(material)}
                          className="h-7 w-7 p-0 justify-center rounded-lg cursor-pointer bg-rose-50 hover:bg-rose-100 text-rose-500 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 dark:text-rose-400"
                          title={t('Delete File', 'حذف کریں')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {!loading && pagination.totalPages > 1 && (
            <Card className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <Pagination
                currentPage={page}
                totalPages={pagination.totalPages}
                onPageChange={(p) => setPage(p)}
                isRtl={locale === 'ur'}
              />
            </Card>
          )}
        </div>
      </div>

      {/* ================= MODALS ================= */}

      {/* 1. Preview Lecture Modal */}
      <Dialog
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={selectedMaterial ? selectedMaterial.fileName : t('Lecture Preview', 'لیکچر پیش منظر')}
        size="lg"
        footer={
          <Button
            variant="secondary"
            onClick={() => setPreviewOpen(false)}
            className="rounded-xl border border-slate-200 dark:border-slate-800 font-sans font-semibold px-4 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {t('Close', 'بند کریں')}
          </Button>
        }
      >
        {selectedMaterial && (
          <div className="space-y-5">
            {/* Metadata Badges strip */}
            <div className="flex flex-wrap gap-2.5 items-center p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 rounded-xl">
              <span className="text-[10px] text-slate-400 font-semibold">{t('Course:', 'کلاس:')}</span>
              <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">{selectedMaterial.courseName}</span>
              <span className="text-slate-300 dark:text-slate-800">|</span>
              <span className="text-[10px] text-slate-400 font-semibold">{t('Size:', 'سائز:')}</span>
              <span className="text-[11px] font-mono text-slate-700 dark:text-slate-300">{selectedMaterial.fileSize || '1.5 MB'}</span>
              <span className="text-slate-300 dark:text-slate-800">|</span>
              <span className="text-[10px] text-slate-400 font-semibold">{t('Format:', 'فارمیٹ:')}</span>
              <span className="text-[11px] uppercase font-mono font-bold text-blue-500">{selectedMaterial.fileType}</span>
            </div>

            {/* AI Summary Section */}
            <div className="space-y-3">
              <h4 className="font-sans font-bold text-xs text-slate-900 dark:text-slate-200 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                <Sparkles className="w-4.5 h-4.5 text-blue-500" />
                {t('AI Smart Scan Takeaways', 'آئی اسمارٹ نکات اور خلاصہ')}
              </h4>

              {selectedMaterial.status === 'processing' ? (
                <div className="p-4 bg-blue-50/30 dark:bg-blue-950/10 rounded-xl flex items-center gap-3">
                  <Spinner size="xs" />
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {t('AI is scanning and generating curriculum takeaways. Please wait...', 'آئی لیکچر کا گہرا جائزہ لے کر تعلیمی خاکہ تیار کر رہا ہے...')}
                  </span>
                </div>
              ) : selectedMaterial.status === 'failed' ? (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl flex items-center gap-2 text-xs font-semibold">
                  <AlertCircle className="w-4.5 h-4.5" />
                  <span>{selectedMaterial.aiInsight || t('AI processing failed for this lecture.', 'اس لیکچر کا آئی تجزیہ ناکام ہو گیا۔')}</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Strategic Insight banner */}
                  {selectedMaterial.aiInsight && (
                    <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/20 border-l-3 border-blue-500 rounded-r-xl">
                      <div className="text-[10px] font-semibold text-blue-500 dark:text-blue-400 uppercase tracking-wide flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        {t('Strategic Teacher Insight', 'اساتذہ کے لیے آئی اسٹرٹیجک مشورہ')}
                      </div>
                      <p className="font-sans text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 italic leading-relaxed">
                        "{selectedMaterial.aiInsight}"
                      </p>
                    </div>
                  )}

                  {/* Bullet Takeaways */}
                  <div className="bg-slate-50/50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 rounded-xl p-4 space-y-2.5">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{t('Core Takeaways & Concepts', 'بنیادی نظریات اور تعلیمی نکات')}</div>
                    {selectedMaterial.keyTakeaways && selectedMaterial.keyTakeaways.length > 0 ? (
                      <ul className="space-y-2">
                        {selectedMaterial.keyTakeaways.map((takeaway, idx) => (
                          <li key={idx} className="flex gap-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            <ChevronRight className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                            <span>{takeaway}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        {t('No key takeaways generated.', 'کوئی معلوماتی نکات مرتب نہیں کیے گئے۔')}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Source Text Tab */}
            <div className="space-y-2">
              <h4 className="font-sans font-bold text-xs text-slate-900 dark:text-slate-200 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                <FileText className="w-4.5 h-4.5 text-slate-400" />
                {t('Extracted Syllabus Material', 'اصل نصابی عبارت')}
              </h4>
              <div className="max-h-[160px] overflow-y-auto border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 p-4 custom-scrollbar">
                <p className="font-mono text-xs text-slate-600 dark:text-slate-400 whitespace-pre-line leading-relaxed">
                  {selectedMaterial.fileContentText || generateMockContent(selectedMaterial.fileName)}
                </p>
              </div>
            </div>
          </div>
        )}
      </Dialog>

      {/* 2. Rename File Modal */}
      <Dialog
        isOpen={renameOpen}
        onClose={() => setRenameOpen(false)}
        title={t('Rename Lecture Material', 'فائل کا نام تبدیل کریں')}
        size="md"
        footer={
          <>
            <Button
              variant="outlined"
              onClick={() => setRenameOpen(false)}
              className="rounded-xl border border-slate-200 dark:border-slate-800 font-sans font-semibold px-4 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
            >
              {t('Cancel', 'منسوخ')}
            </Button>
            <Button
              onClick={handleRenameSubmit}
              disabled={isActionSubmitting}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-sans font-semibold px-4 flex items-center gap-1"
            >
              {isActionSubmitting ? <Spinner size="xs" variant="white" /> : null}
              {t('Save Changes', 'محفوظ کریں')}
            </Button>
          </>
        }
      >
        <form onSubmit={handleRenameSubmit} className="space-y-4">
          <Input
            label={t('File Name *', 'فائل کا نام *')}
            value={renameInput}
            onChange={(e) => setRenameInput(e.target.value)}
            required
            className="w-full"
          />
        </form>
      </Dialog>

      {/* 3. Delete Confirmation Modal */}
      <Dialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title={t('Confirm Delete File', 'فائل حذف کرنے کی تصدیق')}
        size="sm"
        footer={
          <>
            <Button
              variant="outlined"
              onClick={() => setDeleteOpen(false)}
              className="rounded-xl border border-slate-200 dark:border-slate-800 font-sans font-semibold px-4 text-slate-700"
            >
              {t('Cancel', 'کینسل')}
            </Button>
            <Button
              onClick={handleDeleteSubmit}
              disabled={isActionSubmitting}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-sans font-semibold px-4 flex items-center gap-1"
            >
              {isActionSubmitting ? <Spinner size="xs" variant="white" /> : null}
              <Trash2 className="w-4 h-4" />
              {t('Delete Now', 'ابھی حذف کریں')}
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-center">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-xl inline-block mx-auto">
            <Trash2 className="w-10 h-10" />
          </div>
          <p className="font-sans text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {t(
              `Are you sure you want to delete "${deletingMaterial?.fileName}"? This will permanently remove the lecture transcript, key takeaways, and AI insights from your curriculum index.`,
              `کیا آپ واقعی "${deletingMaterial?.fileName}" کو مستقل طور پر خارج کرنا چاہتے ہیں؟ اس سے فائل کا خاکہ اور تمام تعلیمی نکات صاف ہو جائیں گے۔`
            )}
          </p>
        </div>
      </Dialog>
    </div>
  );
};
