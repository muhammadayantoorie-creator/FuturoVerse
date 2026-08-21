/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/src/store/useAppStore';
import { getTranslation } from '@/src/config/i18n';
import { Classroom, InvitedStudent } from '@/src/types';
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
  School,
  Search as SearchIcon,
  Plus,
  Edit2,
  Trash2,
  Users,
  Mail,
  BookOpen,
  Filter,
  ArrowUpDown,
  Check,
  X,
  Sparkles,
  UserPlus,
  UserCheck,
  PlusCircle,
  Archive,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Clock,
  UserX,
  Copy,
  Send,
  ExternalLink,
} from 'lucide-react';

export const Classes: React.FC = () => {
  const {
    classrooms,
    fetchClassrooms,
    createClassroom,
    updateClassroom,
    deleteClassroom,
    inviteStudentToClassroom,
    joinClassroom,
    leaveClassroom,
    locale,
    currentRole,
    isCreateClassModalOpen,
    setCreateClassModalOpen,
  } = useAppStore();

  // Bilingual UI Text helper
  const t = (en: string, ur: string) => (locale === 'ur' ? ur : en);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [department, setDepartment] = useState('All');
  const [status, setStatus] = useState('All');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const limit = 6;

  // Data Loading & Pagination States
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

  // Modals Visibility
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);

  // Selected Records for Actions
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [deletingClassroom, setDeletingClassroom] = useState<Classroom | null>(null);

  // Invitation Form State inside Manage Dialog
  const [inviteForm, setInviteForm] = useState({ name: '', email: '' });
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [lastInvitedStudent, setLastInvitedStudent] = useState<{ name: string; email: string } | null>(null);

  // Student Direct Join Form State (For Simulation / Student View role)
  const [joinForm, setJoinForm] = useState({ name: '', email: '' });
  const [joinSubmitting, setJoinSubmitting] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Listen to external create modal trigger (e.g. from Sidebar CTA)
  useEffect(() => {
    if (isCreateClassModalOpen) {
      setCreateOpen(true);
      setCreateClassModalOpen(false);
    }
  }, [isCreateClassModalOpen, setCreateClassModalOpen]);

  // Search Debouncing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1); // Reset to page 1 on search change
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load Classrooms from API
  const loadClassrooms = async () => {
    setLoading(true);
    try {
      const res = await fetchClassrooms(debouncedQuery, department, status, sortBy, sortOrder, page, limit);
      if (res && res.pagination) {
        setPagination(res.pagination);
      }
    } catch (err: any) {
      console.error('loadClassrooms error:', err);
      addToast(t('Failed to fetch classrooms data.', 'کلاس رومز کا ڈیٹا لوڈ کرنے میں ناکامی۔'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClassrooms();
  }, [debouncedQuery, department, status, sortBy, sortOrder, page]);

  // Refetch selected classroom inside detail modal if classrooms list updates
  useEffect(() => {
    if (selectedClassroom) {
      const fresh = classrooms.find((c) => c.id === selectedClassroom.id);
      if (fresh) setSelectedClassroom(fresh);
    }
  }, [classrooms, selectedClassroom?.id]);

  // Edit Click Initiator
  const handleEditClick = (cls: Classroom) => {
    setSelectedClassroom(cls);
    setEditOpen(true);
  };

  // Delete Confirmation Click
  const handleDeleteClick = (cls: Classroom) => {
    setDeletingClassroom(cls);
    setDeleteOpen(true);
  };

  // Delete Action Handler
  const handleDeleteSubmit = async () => {
    if (!deletingClassroom) return;
    setLoading(true);
    try {
      await deleteClassroom(deletingClassroom.id);
      addToast(t(`Classroom "${deletingClassroom.name}" was successfully deleted.`, `کلاس روم "${deletingClassroom.name}" کامیابی سے حذف کر دی گئی۔`), 'success');
      setDeleteOpen(false);
      setDeletingClassroom(null);
      await loadClassrooms();
    } catch (err: any) {
      addToast(err.message || t('Failed to delete classroom.', 'کلاس روم حذف کرنے میں ناکامی۔'), 'error');
    } finally {
      setLoading(false);
    }
  };

  // Generate Mailto Link for Single Student
  const getStudentMailto = (studentEmail: string, studentName?: string) => {
    if (!selectedClassroom) return `mailto:${studentEmail}`;
    const code = selectedClassroom.inviteCode || selectedClassroom.id;
    const subject = encodeURIComponent(`Classroom Invitation: ${selectedClassroom.name} (${selectedClassroom.section || 'General Section'})`);
    const body = encodeURIComponent(
      `Dear ${studentName || 'Student'},\n\n` +
      `You are invited to join the curriculum workspace for "${selectedClassroom.name}" [Code: ${selectedClassroom.subjectCode || 'N/A'}].\n\n` +
      `Course Details:\n` +
      `• Department: ${selectedClassroom.department}\n` +
      `• Section / Batch: ${selectedClassroom.section || 'Standard'}\n` +
      `• Room / Location: ${selectedClassroom.room || 'Main Campus'}\n` +
      `• Classroom Join Code: ${code}\n\n` +
      `To get started:\n` +
      `1. Log in to FuturoVerse Pakistan.\n` +
      `2. Navigate to "Classrooms" -> "Join Class".\n` +
      `3. Enter the Classroom Code: ${code}\n\n` +
      `Warm regards,\n` +
      `Academic Instruction Team`
    );
    return `mailto:${studentEmail}?subject=${subject}&body=${body}`;
  };

  // Generate Broadcast Mailto for All Enrolled Students
  const getAllStudentsMailto = () => {
    if (!selectedClassroom || !selectedClassroom.students || !selectedClassroom.students.length) return '#';
    const emails = selectedClassroom.students.map((s) => s.email).filter(Boolean).join(';');
    const subject = encodeURIComponent(`Announcement: ${selectedClassroom.name} (${selectedClassroom.section || 'General'})`);
    const body = encodeURIComponent(
      `Dear Students,\n\n` +
      `This is an announcement regarding our course "${selectedClassroom.name}" (${selectedClassroom.subjectCode || ''}).\n\n` +
      `• Section: ${selectedClassroom.section || 'All'}\n` +
      `• Room: ${selectedClassroom.room || 'Designated Hall'}\n\n` +
      `Please check the FuturoVerse platform for the latest lecture notes, upcoming quizzes, and syllabus materials.\n\n` +
      `Best regards,\n` +
      `Course Instructor`
    );
    return `mailto:?bcc=${emails}&subject=${subject}&body=${body}`;
  };

  // Copy Formatted Invitation Text to Clipboard
  const handleCopyInviteMessage = (studentName?: string) => {
    if (!selectedClassroom) return;
    const code = selectedClassroom.inviteCode || selectedClassroom.id;
    const text = 
      `🎓 *Classroom Invitation: ${selectedClassroom.name}*\n` +
      `📚 Course Code: ${selectedClassroom.subjectCode || 'N/A'}\n` +
      `🏷️ Section: ${selectedClassroom.section || 'Standard'}\n` +
      `📍 Room: ${selectedClassroom.room || 'Campus Hall'}\n` +
      `🔑 *Join Code: ${code}*\n\n` +
      `${studentName ? `Dear ${studentName}, you` : 'You'} have been invited to join this classroom. Log in to FuturoVerse and enter code *${code}* to access all curriculum resources.`;

    navigator.clipboard.writeText(text);
    addToast(t('Invitation details copied to clipboard!', 'دعوت نامہ کی تفصیلات کلپ بورڈ پر کاپی ہو گئیں!'), 'success');
  };

  // Invite Student Handler
  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassroom) return;
    const nameTrim = inviteForm.name.trim();
    const emailTrim = inviteForm.email.trim().toLowerCase();

    if (!nameTrim || !emailTrim) {
      setInviteError(t('Both Name and Email are required.', 'نام اور ای میل دونوں معلومات لازمی ہیں۔'));
      return;
    }
    setInviteSubmitting(true);
    setInviteError(null);
    try {
      await inviteStudentToClassroom(selectedClassroom.id, nameTrim, emailTrim);
      setLastInvitedStudent({ name: nameTrim, email: emailTrim });
      addToast(t(`Invitation recorded for ${nameTrim}! Email options available below.`, `دعوت نامہ ${nameTrim} کے لیے محفوظ کر لیا گیا!`), 'success');
      setInviteForm({ name: '', email: '' });
    } catch (err: any) {
      setInviteError(err.message || t('Failed to invite student.', 'طالب علم کو مدعو کرنے میں ناکامی۔'));
    } finally {
      setInviteSubmitting(false);
    }
  };

  // Direct Join Simulation Handler
  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassroom) return;
    if (!joinForm.email.trim()) {
      setJoinError(t('Student email is required to join.', 'شامل ہونے کے لیے طالب علم کی ای میل ضروری ہے۔'));
      return;
    }
    setJoinSubmitting(true);
    setJoinError(null);
    try {
      const studentName = joinForm.name.trim() || joinForm.email.split('@')[0];
      await joinClassroom(selectedClassroom.id, studentName, joinForm.email.trim().toLowerCase());
      addToast(t(`Enrolled successfully as ${studentName}!`, `کلاس روم میں بطور ${studentName} کامیابی سے رجسٹریشن ہو گئی!`), 'success');
      setJoinForm({ name: '', email: '' });
    } catch (err: any) {
      setJoinError(err.message || t('Failed to join classroom.', 'کلاس روم میں شامل ہونے میں ناکامی۔'));
    } finally {
      setJoinSubmitting(false);
    }
  };

  // Unenroll / Leave Classroom Student Handler
  const handleUnenrollStudent = async (email: string, name: string) => {
    if (!selectedClassroom) return;
    const confirmed = window.confirm(
      t(`Are you sure you want to remove student "${name}" from this classroom?`, `کیا آپ واقعی طالب علم "${name}" کو اس کلاس روم سے نکالنا چاہتے ہیں؟`)
    );
    if (!confirmed) return;

    try {
      await leaveClassroom(selectedClassroom.id, email);
      addToast(t(`Removed ${name} from classroom roster.`, `طالب علم ${name} کو کلاس فہرست سے کامیابی سے نکال دیا گیا۔`), 'success');
    } catch (err: any) {
      addToast(err.message || t('Failed to remove student.', 'طالب علم کو نکالنے میں ناکامی۔'), 'error');
    }
  };

  // Manage Classroom click handler
  const handleManageClick = (cls: Classroom) => {
    setSelectedClassroom(cls);
    setManageOpen(true);
  };

  // Departments List
  const departments = ['Physics', 'Biology', 'Mathematics', 'Languages', 'Chemistry', 'Computer Science'];

  return (
    <div className="space-y-6">
      {/* Toast Notifications Container */}
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-2xl">
            <School className="w-8 h-8" />
          </div>
          <div>
            <h1 className="font-sans font-extrabold text-2xl tracking-tight text-slate-900 dark:text-slate-100">
              {t('Classrooms', 'کلاس رومز')}
            </h1>
            <p className="font-sans text-sm text-slate-500 dark:text-slate-400 mt-1">
              {t('Create, update academic streams, invite students, and manage curriculum schedules.', 'تعلیمی نصاب ترتیب دیں، طلباء کو مدعو کریں اور کلاس ریکارڈز کا نظم کریں۔')}
            </p>
          </div>
        </div>
        <Button
          onClick={() => {
            setCreateError(null);
            setCreateOpen(true);
          }}
          className="cursor-pointer gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md rounded-xl font-sans font-semibold py-2.5 px-4 inline-flex items-center"
        >
          <Plus className="w-5 h-5" />
          {t('Create Classroom', 'کلاس روم بنائیں')}
        </Button>
      </div>

      {/* Filter & Search Bar Card */}
      <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Search Query */}
          <div className="md:col-span-4">
            <Input
              placeholder={t('Search by Name, Subject Code, Department...', 'نام، مضمون کوڈ، یا شعبہ تلاش کریں...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftElement={<SearchIcon className="w-4 h-4 text-slate-400" />}
              className="w-full"
            />
          </div>

          {/* Department Filter */}
          <div className="md:col-span-2">
            <Select
              label={t('Department', 'شعبہ')}
              value={department}
              onChange={(e) => {
                setDepartment(e.target.value);
                setPage(1);
              }}
              options={[
                { value: 'All', label: t('All Departments', 'تمام شعبہ جات') },
                ...departments.map((dept) => ({ value: dept, label: dept })),
              ]}
            />
          </div>

          {/* Status Filter */}
          <div className="md:col-span-2">
            <Select
              label={t('Status', 'حیثیت')}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              options={[
                { value: 'All', label: t('All Statuses', 'تمام حیثیتیں') },
                { value: 'active', label: t('Active', 'فعال') },
                { value: 'archived', label: t('Archived', 'آرکائیو شدہ') },
              ]}
            />
          </div>

          {/* Sort Field Select */}
          <div className="md:col-span-2">
            <Select
              label={t('Sort By', 'ترتیب دیں')}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              options={[
                { value: 'name', label: t('Class Name', 'کلاس کا نام') },
                { value: 'subjectCode', label: t('Subject Code', 'مضمون کوڈ') },
                { value: 'studentCount', label: t('Student Count', 'طلباء تعداد') },
                { value: 'createdAt', label: t('Date Created', 'بنانے کی تاریخ') },
              ]}
            />
          </div>

          {/* Sort Order Action button */}
          <div className="md:col-span-2 flex items-center justify-end">
            <Button
              variant="secondary"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="w-full font-sans font-semibold gap-2 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <ArrowUpDown className="w-4 h-4" />
              {sortOrder === 'asc' ? t('Ascending', 'صعودی') : t('Descending', 'نزولی')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Grid View */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-24 rounded-md animate-pulse" />
                <Skeleton className="h-6 w-16 rounded-md animate-pulse" />
              </div>
              <Skeleton className="h-8 w-3/4 rounded-md animate-pulse" />
              <Skeleton className="h-4 w-1/2 rounded-md animate-pulse" />
              <Skeleton className="h-12 w-full rounded-md animate-pulse" />
              <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <Skeleton className="h-8 w-20 rounded-md animate-pulse" />
                <Skeleton className="h-8 w-24 rounded-md animate-pulse" />
              </div>
            </Card>
          ))}
        </div>
      ) : classrooms.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <EmptyState
            title={t('No Classrooms Found', 'کوئی کلاس روم نہیں ملی')}
            description={t(
              'No academic classes match your filtering criteria. Try adjusting your query or create a brand new classroom.',
              'فلٹر اور تلاش کے نتائج کے مطابق کوئی کلاس روم نہیں ملا۔ پنے فلٹرز درست کریں یا ایک نئی کلاس بنائیں'
            )}
            icon="school"
          />
          <Button
            variant="secondary"
            onClick={() => setCreateOpen(true)}
            className="mt-6 font-sans font-semibold gap-2"
          >
            <Plus className="w-4 h-4" />
            {t('Create Your First Classroom', 'پہلی کلاس روم بنائیں')}
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classrooms.map((cls) => (
            <Card
              key={cls.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-blue-400/40 dark:hover:border-blue-500/30 hover:shadow-lg transition-all p-6 flex flex-col justify-between"
            >
              <div>
                {/* Header Badge Row */}
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="primary" styleType="tonal" className="font-mono uppercase text-xs font-bold">
                      {cls.subjectCode}
                    </Badge>
                    <Badge variant="secondary" styleType="tonal" className="text-xs font-semibold">
                      {cls.section || 'Section A'}
                    </Badge>
                  </div>
                  <Badge
                    variant={cls.status === 'active' ? 'success' : 'warning'}
                    styleType="tonal"
                    className="capitalize text-xs"
                  >
                    {cls.status === 'active' ? t('Active', 'فعال') : t('Archived', 'آرکائیو شدہ')}
                  </Badge>
                </div>

                {/* Info Text */}
                <h3 className="font-sans font-extrabold text-lg text-slate-900 dark:text-slate-100 tracking-tight leading-snug line-clamp-1">
                  {cls.name}
                </h3>
                
                <div className="flex flex-wrap items-center gap-2 mt-1 mb-3">
                  <span className="inline-block text-xs font-semibold text-blue-500 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20 px-2 py-0.5 rounded-md">
                    {cls.department}
                  </span>
                  {cls.room && (
                    <span className="inline-block text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                      📍 {cls.room}
                    </span>
                  )}
                </div>

                <p className="font-sans text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3 mb-4 min-h-[4.5rem]">
                  {cls.description || t('No description provided for this classroom syllabus.', 'اس کلاس روم کے لیے کوئی تفصیل فراہم نہیں کی گئی۔')}
                </p>
              </div>

              {/* Stats & Actions Footer */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-4">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span>{cls.studentCount || 0} {t('Students Enrolled', 'طلباء بھرتی ہیں')}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(cls.createdAt).toLocaleDateString(locale === 'ur' ? 'ur-PK' : 'en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>

                {/* Actions Button Grid */}
                <div className="grid grid-cols-12 gap-2">
                  <Button
                    onClick={() => handleManageClick(cls)}
                    variant="secondary"
                    className="col-span-6 cursor-pointer justify-center text-xs font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950/30 dark:hover:bg-blue-950/50 dark:text-blue-300"
                  >
                    <Users className="w-3.5 h-3.5" />
                    {t('Manage', 'انتظام کریں')}
                  </Button>
                  <Button
                    onClick={() => handleEditClick(cls)}
                    variant="outlined"
                    className="col-span-3 cursor-pointer justify-center text-xs font-semibold py-1.5 px-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    onClick={() => handleDeleteClick(cls)}
                    variant="outlined"
                    className="col-span-3 cursor-pointer justify-center text-xs font-semibold py-1.5 px-2 rounded-lg border border-rose-100 dark:border-rose-950/40 text-rose-500 hover:text-rose-600 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
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

      {/* ================= MODALS ================= */}

      {/* 1. Create Classroom Dialog */}
      <CreateClassDialog
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={async (data) => {
          await createClassroom(data);
          addToast(t(`Class "${data.name}" (${data.section || 'Section A'}) created successfully!`, `کلاس روم "${data.name}" کامیابی سے بنائی گئی!`), 'success');
          await loadClassrooms();
        }}
        departments={departments}
        t={t}
      />

      {/* 2. Edit Classroom Dialog */}
      {selectedClassroom && (
        <EditClassDialog
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
          classroom={selectedClassroom}
          onSubmit={async (id, data) => {
            await updateClassroom(id, data);
            addToast(t('Classroom settings updated successfully!', 'کلاس روم کی ترتیبات کامیابی سے اپ ڈیٹ ہو گئیں!'), 'success');
            await loadClassrooms();
          }}
          departments={departments}
          t={t}
        />
      )}

      {/* 3. Delete Confirmation Dialog */}
      <Dialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title={t('Confirm Delete Classroom', 'کلاس روم حذف کرنے کی تصدیق')}
        size="sm"
        footer={
          <>
            <Button
              variant="outlined"
              onClick={() => setDeleteOpen(false)}
              className="rounded-xl border border-slate-200 dark:border-slate-800 font-sans font-semibold px-4 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
            >
              {t('Cancel', 'منسوخ کریں')}
            </Button>
            <Button
              onClick={handleDeleteSubmit}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-sans font-semibold px-4 flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4" />
              {t('Delete', 'حذف کریں')}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center">
            <Trash2 className="w-12 h-12" />
          </div>
          <p className="font-sans text-sm text-slate-600 dark:text-slate-300 text-center leading-relaxed">
            {t(
              `Are you sure you want to delete classroom "${deletingClassroom?.name}"? All student enrollment data will be removed. This cannot be undone.`,
              `کیا آپ واقعی کلاس روم "${deletingClassroom?.name}" کو مستقل طور پر حذف کرنا چاہتے ہیں؟ تمام داخلہ شدہ طلباء کا ڈیٹا فارغ ہو جائے گا۔`
            )}
          </p>
        </div>
      </Dialog>

      {/* 4. Manage Classroom (Detail & Student Rosters) Dialog */}
      <Dialog
        isOpen={manageOpen}
        onClose={() => setManageOpen(false)}
        title={selectedClassroom ? `${selectedClassroom.name} (${selectedClassroom.subjectCode})` : t('Classroom Management', 'کلاس روم انتظام')}
        size="xl"
      >
        {selectedClassroom && (
          <div className="space-y-6">
            {/* Summary Details Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                <div className="text-xs text-slate-400 font-semibold">{t('Subject & Section', 'مضمون اور سیکشن')}</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200 uppercase">{selectedClassroom.subjectCode}</span>
                  <span className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold rounded">{selectedClassroom.section || 'Section A'}</span>
                </div>
              </Card>
              <Card className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                <div className="text-xs text-slate-400 font-semibold">{t('Department', 'شعبہ')}</div>
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">{selectedClassroom.department}</div>
              </Card>
              <Card className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                <div className="text-xs text-slate-400 font-semibold">{t('Room / Location', 'کمرہ / لیب')}</div>
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">{selectedClassroom.room || t('Not Assigned', 'مقرر نہیں')}</div>
              </Card>
              <Card className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                <div className="text-xs text-slate-400 font-semibold">{t('Created At', 'بنانے کی تاریخ')}</div>
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-1">
                  {new Date(selectedClassroom.createdAt).toLocaleDateString(undefined, {
                    dateStyle: 'medium',
                  })}
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Student List Section (8 cols) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <h3 className="font-sans font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    {t('Student Roster', 'طلباء فہرست')}
                    <Badge variant="primary" styleType="tonal" className="rounded-full ml-1">
                      {selectedClassroom.students?.length || 0}
                    </Badge>
                  </h3>

                  {selectedClassroom.students && selectedClassroom.students.length > 0 && (
                    <div className="flex items-center gap-2">
                      <a
                        href={getAllStudentsMailto()}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-semibold transition-colors border border-blue-200/60 dark:border-blue-800/60"
                        title={t('Send email announcement to all students', 'تمام طلباء کو ای میل اعلان بھیجیں')}
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>{t('Email Class', 'کلاس کو ای میل')}</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => handleCopyInviteMessage()}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                        title={t('Copy invitation template to clipboard', 'دعوت نامہ ٹیمپلیٹ کاپی کریں')}
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{t('Copy Invite', 'دعوت نامہ')}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Students List or Empty State */}
                {!selectedClassroom.students || selectedClassroom.students.length === 0 ? (
                  <div className="p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center">
                    <Users className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-2" />
                    <p className="font-sans text-xs text-slate-400 font-semibold">
                      {t('No students currently registered in this class syllabus roster.', 'اس کلاس روم میں ابھی تک کوئی طالب علم شامل نہیں ہے۔')}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleCopyInviteMessage()}
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {t('Copy Class Invite Code', 'کلاس کوڈ کاپی کریں')}
                    </button>
                  </div>
                ) : (
                  <div className="max-h-[300px] overflow-y-auto border border-slate-100 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800/80 custom-scrollbar pr-1">
                    {selectedClassroom.students.map((student) => (
                      <div
                        key={student.id}
                        className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center uppercase">
                            {student.name.slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-sans text-xs font-bold text-slate-800 dark:text-slate-200">
                              {student.name}
                            </div>
                            <div className="font-sans text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3" />
                              <a
                                href={getStudentMailto(student.email, student.name)}
                                className="hover:underline hover:text-blue-500"
                                title={t('Click to compose email', 'ای میل لکھنے کے لیے کلک کریں')}
                              >
                                {student.email}
                              </a>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge
                            variant={student.status === 'joined' ? 'success' : 'warning'}
                            styleType="tonal"
                            className="text-[9px] px-1.5 py-0.5 rounded-md"
                          >
                            {student.status === 'joined' ? t('Joined', 'شامل ہو گیا') : t('Invited', 'مدعو کیا گیا')}
                          </Badge>
                          <a
                            href={getStudentMailto(student.email, student.name)}
                            className="p-1.5 border border-slate-100 hover:border-blue-200 hover:bg-blue-50 dark:border-slate-800/80 dark:hover:border-blue-950 text-slate-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-400 rounded-lg transition-colors"
                            title={t('Send email to student', 'طالب علم کو ای میل بھیجیں')}
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </a>
                          <Button
                            onClick={() => handleUnenrollStudent(student.email, student.name)}
                            variant="outlined"
                            className="p-1 border border-slate-100 hover:border-rose-200 hover:bg-rose-50 dark:border-slate-800/80 dark:hover:border-rose-950 text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-red-400 rounded-lg cursor-pointer transition-colors"
                            title={t('Unenroll student', 'طالب علم کو خارج کریں')}
                          >
                            <UserX className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Roster Operations (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                {/* 4a. Send invitation email */}
                <Card className="p-4 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800 rounded-xl space-y-3">
                  <h4 className="font-sans font-bold text-xs text-slate-900 dark:text-slate-200 flex items-center gap-1.5 border-b border-slate-200/30 dark:border-slate-800/40 pb-1.5">
                    <UserPlus className="w-4.5 h-4.5 text-blue-500" />
                    {t('Invite New Student', 'نئے طالب علم کو مدعو کریں')}
                  </h4>
                  {inviteError && (
                    <div className="p-2.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-950/40 text-rose-600 dark:text-rose-400 text-[11px] font-semibold rounded-xl flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{inviteError}</span>
                    </div>
                  )}

                  {/* Last Invited Student Email Action Card */}
                  {lastInvitedStudent && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300">
                        <span className="flex items-center gap-1 truncate">
                          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          {t('Invite Ready', 'دعوت تیار')}: {lastInvitedStudent.name}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 break-all">
                        {lastInvitedStudent.email}
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <a
                          href={getStudentMailto(lastInvitedStudent.email, lastInvitedStudent.name)}
                          className="flex items-center justify-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold text-center transition-colors shadow-sm"
                        >
                          <Send className="w-3.5 h-3.5" />
                          {t('Open in Mail App', 'میل ایپ کھولیں')}
                        </a>
                        <button
                          type="button"
                          onClick={() => handleCopyInviteMessage(lastInvitedStudent.name)}
                          className="flex items-center justify-center gap-1 px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-emerald-300 dark:border-emerald-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          {t('Copy Letter', 'خط کاپی کریں')}
                        </button>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleInviteSubmit} className="space-y-3.5">
                    <Input
                      label={t('Student Name', 'طالب علم کا نام')}
                      placeholder={t('e.g., Muhammad Ali', 'مثال: محمد علی')}
                      value={inviteForm.name}
                      onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                      required
                    />
                    <Input
                      label={t('Student Email', 'طالب علم کا ای میل')}
                      placeholder={t('e.g., student@uol.edu.pk', 'مثال: student@uol.edu.pk')}
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                      required
                    />
                    <Button
                      type="submit"
                      disabled={inviteSubmitting}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-sans text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5"
                    >
                      {inviteSubmitting ? (
                        <Spinner size="xs" variant="white" />
                      ) : (
                        <Mail className="w-4 h-4" />
                      )}
                      {t('Send Invitation Email', 'دعوت نامہ ای میل بھیجیں')}
                    </Button>
                  </form>
                </Card>

                {/* 4b. Student Direct Join Simulation */}
                <Card className="p-4 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800 rounded-xl space-y-3">
                  <h4 className="font-sans font-bold text-xs text-slate-900 dark:text-slate-200 flex items-center gap-1.5 border-b border-slate-200/30 dark:border-slate-800/40 pb-1.5">
                    <UserCheck className="w-4.5 h-4.5 text-emerald-500" />
                    {t('Direct Student Join (Simulation)', 'طالب علم براہ راست شامل کریں (مشق)')}
                  </h4>
                  {joinError && (
                    <div className="p-2.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-950/40 text-rose-600 dark:text-rose-400 text-[11px] font-semibold rounded-xl flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{joinError}</span>
                    </div>
                  )}
                  <form onSubmit={handleJoinSubmit} className="space-y-3">
                    <Input
                      label={t('Student Email to join as', 'شامل ہونے والے طالب علم کا ای میل')}
                      placeholder={t('e.g., student.name@nust.edu.pk', 'مثال: student.name@nust.edu.pk')}
                      value={joinForm.email}
                      onChange={(e) => setJoinForm({ ...joinForm, email: e.target.value })}
                      required
                    />
                    <Input
                      label={t('Name (Optional)', 'نام (اختیاری)')}
                      placeholder={t('e.g., Zainab Fatima', 'مثال: زینب فاطمہ')}
                      value={joinForm.name}
                      onChange={(e) => setJoinForm({ ...joinForm, name: e.target.value })}
                    />
                    <Button
                      type="submit"
                      disabled={joinSubmitting}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5"
                    >
                      {joinSubmitting ? (
                        <Spinner size="xs" variant="white" />
                      ) : (
                        <PlusCircle className="w-4 h-4" />
                      )}
                      {t('Register & Join Classroom Now', 'رجسٹریشن کر کے ابھی شامل ہوں')}
                    </Button>
                  </form>
                </Card>
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};

/* ================= ISOLATED MODAL COMPONENTS (ZERO-LAG TYPING) ================= */

interface CreateClassDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    subjectCode: string;
    department: string;
    section: string;
    room: string;
    description: string;
    status: 'active';
  }) => Promise<void>;
  departments: string[];
  t: (en: string, ur: string) => string;
}

const CreateClassDialog: React.FC<CreateClassDialogProps> = React.memo(
  ({ isOpen, onClose, onSubmit, departments, t }) => {
    const [name, setName] = useState('');
    const [subjectCode, setSubjectCode] = useState('');
    const [department, setDepartment] = useState('Physics');
    const [section, setSection] = useState('Section A');
    const [room, setRoom] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset fields when opening
    useEffect(() => {
      if (isOpen) {
        setName('');
        setSubjectCode('');
        setDepartment('Physics');
        setSection('Section A');
        setRoom('');
        setDescription('');
        setError(null);
      }
    }, [isOpen]);

    const handleSubmit = async (e?: React.FormEvent) => {
      if (e && e.preventDefault) e.preventDefault();
      if (!name.trim()) {
        setError(t('Please enter a Class / Course Name.', 'براہ کرم کلاس کا نام درج کریں۔'));
        return;
      }
      
      const cleanName = name.trim();
      const cleanCode = subjectCode.trim()
        ? subjectCode.trim().toUpperCase()
        : `${cleanName.substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '') || 'CRS'}-${Math.floor(100 + Math.random() * 900)}`;
      const cleanDept = department.trim() || 'Physics';
      const cleanSec = section.trim() || 'Section A';

      setSubmitting(true);
      setError(null);
      try {
        await onSubmit({
          name: cleanName,
          subjectCode: cleanCode,
          department: cleanDept,
          section: cleanSec,
          room: room.trim(),
          description: description.trim(),
          status: 'active',
        });
        onClose();
      } catch (err: any) {
        setError(err.message || t('An error occurred while creating classroom.', 'کلاس روم بنانے کے دوران خرابی پیش آئی۔'));
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <Dialog
        isOpen={isOpen}
        onClose={onClose}
        title={t('Create New Classroom', 'نئی کلاس روم بنائیں')}
        size="md"
        footer={
          <>
            <Button
              variant="outlined"
              onClick={onClose}
              className="rounded-xl border border-slate-200 dark:border-slate-800 font-sans font-semibold px-4 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              {t('Cancel', 'کینسل')}
            </Button>
            <Button
              type="button"
              onClick={() => handleSubmit()}
              disabled={submitting}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-sans font-semibold px-4 flex items-center gap-1.5 cursor-pointer"
            >
              {submitting ? (
                <Spinner size="xs" variant="white" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {t('Create', 'تخلیق کریں')}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4.5 h-4.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <Input
              label={t('Class / Course Name *', 'کلاس کا نام *')}
              placeholder={t('e.g., Physics 101: Mechanics', 'مثال کے طور پر: فزکس ۱۰۱')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t('Subject Code (Optional)', 'مضمون کوڈ (اختیاری)')}
                placeholder={t('e.g., PHYS-101', 'مثال کے طور پر: PHYS-101')}
                value={subjectCode}
                onChange={(e) => setSubjectCode(e.target.value)}
              />

              <Input
                label={t('Section / Batch', 'سیکشن / بیچ')}
                placeholder={t('e.g., Section A, Section B, Morning', 'مثال: سیکشن اے، بی، مارننگ')}
                value={section}
                onChange={(e) => setSection(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label={t('Department', 'شعبہ جات')}
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                options={departments.map((dept) => ({ value: dept, label: dept }))}
              />

              <Input
                label={t('Room / Lab Location (Optional)', 'کمرہ / لیب (اختیاری)')}
                placeholder={t('e.g., Lab 3B, Hall 102', 'مثال: لیب ۳ بی، ہال ۱۰۲')}
                value={room}
                onChange={(e) => setRoom(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-sans font-semibold text-xs text-on-surface dark:text-slate-300">
                {t('Description', 'تفصیل')}
              </label>
              <textarea
                rows={3}
                placeholder={t('e.g., Extended lectures with quantum waves and mechanics labs...', 'مثال کے طور پر: مکینکس اور کوانٹم فزکس کا نصاب...')}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-surface-container-low dark:bg-slate-900 border border-outline-variant dark:border-slate-800 rounded-xl p-3.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-sans text-sm transition-colors duration-150 placeholder:text-outline/70 dark:text-slate-100"
              />
            </div>
          </div>
        </form>
      </Dialog>
    );
  }
);

interface EditClassDialogProps {
  isOpen: boolean;
  onClose: () => void;
  classroom: Classroom;
  onSubmit: (
    id: string,
    data: {
      name: string;
      subjectCode: string;
      department: string;
      section: string;
      room: string;
      description: string;
      status: 'active' | 'archived';
    }
  ) => Promise<void>;
  departments: string[];
  t: (en: string, ur: string) => string;
}

const EditClassDialog: React.FC<EditClassDialogProps> = React.memo(
  ({ isOpen, onClose, classroom, onSubmit, departments, t }) => {
    const [name, setName] = useState(classroom.name || '');
    const [subjectCode, setSubjectCode] = useState(classroom.subjectCode || '');
    const [department, setDepartment] = useState(classroom.department || 'Physics');
    const [section, setSection] = useState(classroom.section || 'Section A');
    const [room, setRoom] = useState(classroom.room || '');
    const [description, setDescription] = useState(classroom.description || '');
    const [status, setStatus] = useState<'active' | 'archived'>(classroom.status || 'active');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      setName(classroom.name || '');
      setSubjectCode(classroom.subjectCode || '');
      setDepartment(classroom.department || 'Physics');
      setSection(classroom.section || 'Section A');
      setRoom(classroom.room || '');
      setDescription(classroom.description || '');
      setStatus(classroom.status || 'active');
      setError(null);
    }, [classroom]);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim() || !subjectCode.trim() || !department) {
        setError(t('Please fill in all required fields.', 'براہ کرم تمام مطلوبہ معلومات فراہم کریں۔'));
        return;
      }
      setSubmitting(true);
      setError(null);
      try {
        await onSubmit(classroom.id, {
          name: name.trim(),
          subjectCode: subjectCode.trim().toUpperCase(),
          department,
          section: section.trim() || 'Section A',
          room: room.trim(),
          description: description.trim(),
          status,
        });
        onClose();
      } catch (err: any) {
        setError(err.message || t('An error occurred while updating classroom.', 'کلاس روم اپ ڈیٹ کرنے کے دوران خرابی پیش آئی۔'));
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <Dialog
        isOpen={isOpen}
        onClose={onClose}
        title={t('Edit Classroom & Section Details', 'کلاس اور سیکشن کی تفصیلات درست کریں')}
        size="md"
        footer={
          <>
            <Button
              variant="outlined"
              onClick={onClose}
              className="rounded-xl border border-slate-200 dark:border-slate-800 font-sans font-semibold px-4 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              {t('Cancel', 'کینسل')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-sans font-semibold px-4 flex items-center gap-1.5 cursor-pointer"
            >
              {submitting ? (
                <Spinner size="xs" variant="white" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {t('Save Changes', 'تبدیلیاں محفوظ کریں')}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4.5 h-4.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <Input
              label={t('Class / Course Name *', 'کلاس کا نام *')}
              placeholder="e.g., Physics 101: Mechanics"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t('Subject Code *', 'مضمون کوڈ *')}
                placeholder="e.g., PHYS-101"
                value={subjectCode}
                onChange={(e) => setSubjectCode(e.target.value)}
                required
              />

              <Input
                label={t('Section / Batch *', 'سیکشن / بیچ *')}
                placeholder="e.g., Section A, Morning"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label={t('Department *', 'شعبہ جات *')}
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                options={departments.map((dept) => ({ value: dept, label: dept }))}
              />

              <Input
                label={t('Room / Lab Location', 'کمرہ / لیب')}
                placeholder="e.g., Lab 3B, Hall 102"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
              />
            </div>

            <Select
              label={t('Status', 'حیثیت')}
              value={status}
              onChange={(e) => setStatus(e.target.value as 'active' | 'archived')}
              options={[
                { value: 'active', label: t('Active', 'فعال') },
                { value: 'archived', label: t('Archived', 'آرکائیو شدہ') },
              ]}
            />

            <div className="flex flex-col gap-1.5">
              <label className="font-sans font-semibold text-xs text-on-surface dark:text-slate-300">
                {t('Description', 'تفصیل')}
              </label>
              <textarea
                rows={3}
                placeholder="Details of the course structure..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-surface-container-low dark:bg-slate-900 border border-outline-variant dark:border-slate-800 rounded-xl p-3.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-sans text-sm transition-colors duration-150 placeholder:text-outline/70 dark:text-slate-100"
              />
            </div>
          </div>
        </form>
      </Dialog>
    );
  }
);
