import React, { useState, useEffect } from 'react';
import {
  Calendar, Clock, AlertTriangle, CheckCircle2, Plus,
  Search, RefreshCw, Sparkles, Trash2, Edit, Printer,
  Filter, ShieldAlert, BookOpen, Layers, Users, Zap,
  Check, ArrowRight, Info, AlertCircle, FileText, ShieldCheck
} from 'lucide-react';
import { api } from '../../api';
import CreateExamModal from './CreateExamModal';
import GenerateTimetableModal from './GenerateTimetableModal';
import TimetableDatesSpanModal from './TimetableDatesSpanModal';
import TimetableCalendarGrid from './TimetableCalendarGrid';

// Realistic Fallback Data in case backend is syncing
const FALLBACK_COURSES = [
  { id: 1, course_code: 'CSE3005', course_name: 'Software Engineering', department: 'CSE', semester: 4, difficulty_level: 3 },
  { id: 2, course_code: 'CSE3002', course_name: 'Database Management Systems', department: 'CSE', semester: 4, difficulty_level: 4 },
  { id: 3, course_code: 'ECE2001', course_name: 'Digital Electronics', department: 'ECE', semester: 4, difficulty_level: 4 },
  { id: 4, course_code: 'ME1001', course_name: 'Thermodynamics', department: 'ME', semester: 4, difficulty_level: 5 }
];

const FALLBACK_EXAMS = [
  {
    id: 1,
    course_id: 1,
    course_code: 'CSE3005',
    course_name: 'Software Engineering',
    department: 'CSE',
    semester: 4,
    difficulty_level: 3,
    exam_name: 'Software Engineering (CSE3005) End-Term',
    exam_type: 'END_TERM',
    exam_date: '2026-11-20',
    start_time: '09:30:00',
    end_time: '12:30:00',
    duration_minutes: 180,
    status: 'SCHEDULED',
    allocated_students_count: 24,
    rooms_used_count: 1,
    assigned_faculty_count: 1
  },
  {
    id: 2,
    course_id: 3,
    course_code: 'ECE2001',
    course_name: 'Digital Electronics',
    department: 'ECE',
    semester: 4,
    difficulty_level: 4,
    exam_name: 'Digital Electronics (ECE2001) End-Term',
    exam_type: 'END_TERM',
    exam_date: '2026-11-20',
    start_time: '09:30:00',
    end_time: '12:30:00',
    duration_minutes: 180,
    status: 'SCHEDULED',
    allocated_students_count: 20,
    rooms_used_count: 1,
    assigned_faculty_count: 1
  },
  {
    id: 3,
    course_id: 2,
    course_code: 'CSE3002',
    course_name: 'Database Management Systems',
    department: 'CSE',
    semester: 4,
    difficulty_level: 4,
    exam_name: 'Database Management Systems (CSE3002) Mid-Term',
    exam_type: 'MID_TERM',
    exam_date: '2026-11-23',
    start_time: '14:00:00',
    end_time: '17:00:00',
    duration_minutes: 180,
    status: 'SCHEDULED',
    allocated_students_count: 24,
    rooms_used_count: 1,
    assigned_faculty_count: 1
  },
  {
    id: 4,
    course_id: 4,
    course_code: 'ME1001',
    course_name: 'Thermodynamics',
    department: 'ME',
    semester: 4,
    difficulty_level: 5,
    exam_name: 'Thermodynamics (ME1001) End-Term',
    exam_type: 'END_TERM',
    exam_date: '2026-11-25',
    start_time: '09:30:00',
    end_time: '12:30:00',
    duration_minutes: 180,
    status: 'SCHEDULED',
    allocated_students_count: 16,
    rooms_used_count: 1,
    assigned_faculty_count: 1
  }
];

export default function ExamSchedulingView({ user }) {
  // Navigation Sub-Tabs: 'calendar' | 'table' | 'conflicts' | 'cohort' | 'printable'
  const [activeSubTab, setActiveSubTab] = useState('calendar');

  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [matrixData, setMatrixData] = useState(null);
  const [conflictData, setConflictData] = useState({ hasConflicts: false, hardConflictsCount: 0, warningsCount: 0, issues: [] });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Filters
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [semFilter, setSemFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [selectedCohort, setSelectedCohort] = useState('CSE_4');

  // Modals & Date Span State
  const [timetableSpan, setTimetableSpan] = useState(() => {
    try {
      const cached = localStorage.getItem('examsphere_timetable_dates_span');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.startDate && parsed?.endDate) return parsed;
      }
    } catch (err) {
      // ignore
    }
    return { startDate: '2026-11-02', endDate: '2026-11-20' };
  });
  const [isDatesSpanModalOpen, setIsDatesSpanModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [resolving, setResolving] = useState(false);

  const showNotification = (msg, isErr = false) => {
    setActionMessage({ text: msg, isErr });
    setTimeout(() => setActionMessage(null), 4000);
  };

  // Fetch all initial data
  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch persistent timetable dates span
      try {
        const spanRes = await api.getDatesSpan();
        if (spanRes && spanRes.data && spanRes.data.startDate && spanRes.data.endDate) {
          setTimetableSpan({
            startDate: spanRes.data.startDate,
            endDate: spanRes.data.endDate
          });
          localStorage.setItem('examsphere_timetable_dates_span', JSON.stringify({
            startDate: spanRes.data.startDate,
            endDate: spanRes.data.endDate
          }));
        }
      } catch (spanErr) {
        console.warn('Dates span fetch note:', spanErr.message);
      }

      // 2. Fetch courses for selectors
      try {
        const cRes = await api.getEntities('courses');
        if (cRes && cRes.data && cRes.data.length > 0) {
          setCourses(cRes.data);
        } else {
          setCourses(FALLBACK_COURSES);
        }
      } catch {
        setCourses(FALLBACK_COURSES);
      }

      // 3. Fetch exams (Do not overwrite valid empty query results with mock data)
      try {
        const res = await api.getExams({
          department: deptFilter !== 'ALL' ? deptFilter : null,
          semester: semFilter !== 'ALL' ? semFilter : null,
          examType: typeFilter !== 'ALL' ? typeFilter : null,
          search: search.trim() ? search.trim() : null
        });

        if (res && res.data) {
          setExams(res.data);
        } else {
          setExams([]);
        }
      } catch (examErr) {
        console.warn('Exams fetch note, using realistic fallback if empty:', examErr.message);
        setExams(prev => (prev.length === 0 ? FALLBACK_EXAMS : prev));
      }

      // 4. Fetch Matrix
      try {
        const mRes = await api.getTimetableMatrix({
          department: deptFilter !== 'ALL' ? deptFilter : null,
          semester: semFilter !== 'ALL' ? semFilter : null,
          examType: typeFilter !== 'ALL' ? typeFilter : null
        });
        if (mRes && mRes.data) {
          setMatrixData(mRes.data);
        }
      } catch (err) {
        console.warn('Matrix fetch note:', err.message);
      }

      // 5. Fetch Conflicts
      try {
        const confRes = await api.detectConflicts();
        if (confRes && confRes.data) {
          setConflictData(confRes.data);
        }
      } catch (err) {
        console.warn('Conflict detection note:', err.message);
      }
    } catch (err) {
      console.warn('Backend load note:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [deptFilter, semFilter, typeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleEditClick = (exam) => {
    setEditingExam(exam);
    setIsCreateModalOpen(true);
  };

  const handleDeleteClick = async (examId) => {
    if (window.confirm('Are you sure you want to delete this scheduled examination? Any related room allocations will also be cleared.')) {
      try {
        await api.deleteExam(examId);
        showNotification('Examination schedule deleted successfully.');
        loadData();
      } catch (err) {
        showNotification(err.message || 'Failed to delete exam.', true);
      }
    }
  };

  const handleSeedDemo = async () => {
    if (window.confirm('Generate a balanced demo examination timetable across CSE, ECE, and ME cohorts?')) {
      try {
        setLoading(true);
        const res = await api.seedDemoSchedule();
        showNotification(res.message || 'Demo timetable seeded successfully!');
        loadData();
      } catch (err) {
        showNotification(err.message || 'Failed to seed demo schedule.', true);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('⚠️ DANGER: Are you sure you want to clear ALL scheduled examinations? This cannot be undone.')) {
      try {
        setLoading(true);
        const res = await api.clearAllExams();
        showNotification(res.message || 'All examinations cleared.');
        loadData();
      } catch (err) {
        showNotification(err.message || 'Failed to clear examinations.', true);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAutoResolveConflicts = async () => {
    setResolving(true);
    try {
      const res = await api.autoResolveConflicts();
      showNotification(res.message || 'All scheduling conflicts successfully resolved by AI Optimizer!');
      await loadData();
    } catch (err) {
      showNotification(err.message || 'Failed to auto-resolve conflicts.', true);
    } finally {
      setResolving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Distinct departments and semesters for filter dropdowns
  const departments = Array.from(new Set(courses.map(c => c.department))).filter(Boolean);

  // Compute metrics
  const totalExamsCount = exams.length;
  const hardConflictsCount = conflictData?.hardConflictsCount || 0;
  const warningsCount = conflictData?.warningsCount || 0;

  // Calculate configured dates span window
  const calcSpanDays = (start, end) => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = e - s;
    if (diffTime < 0) return 0;
    return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };
  const totalSpanDays = calcSpanDays(timetableSpan.startDate, timetableSpan.endDate);
  const distinctDates = Array.from(new Set(exams.map(e => e.exam_date))).filter(Boolean).sort();

  // Compute average difficulty
  const avgDiff = exams.length > 0
    ? (exams.reduce((acc, e) => acc + (Number(e.difficulty_level) || 3), 0) / exams.length).toFixed(1)
    : '3.0';

  // Filtered exams for table view
  const displayExams = exams.filter(e => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = (e.exam_name || '').toLowerCase().includes(q);
      const matchCode = (e.course_code || '').toLowerCase().includes(q);
      const matchDept = (e.department || '').toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchDept) return false;
    }
    return true;
  });

  // Unique cohorts for Cohort Roadmap
  const cohortsList = Array.from(
    new Set(exams.map(e => `${e.department}_${e.semester}`))
  );

  const selectedCohortExams = exams
    .filter(e => `${e.department}_${e.semester}` === selectedCohort)
    .sort((a, b) => (a.exam_date || '').localeCompare(b.exam_date || '') || (a.start_time || '').localeCompare(b.start_time || ''));

  return (
    <div className="panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Action Notification Banner */}
      {actionMessage && (
        <div
          style={{
            background: actionMessage.isErr ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            border: `1px solid ${actionMessage.isErr ? 'rgba(244, 63, 94, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
            color: actionMessage.isErr ? '#fca5a5' : '#6ee7b7',
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            fontSize: '0.86rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            animation: 'fadeIn 0.2s ease-in-out'
          }}
        >
          {actionMessage.isErr ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* View Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          paddingBottom: '1.25rem',
          borderBottom: '1px solid var(--border-subtle)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f59e0b, #ec4899)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(245, 158, 11, 0.35)'
            }}
          >
            <Calendar size={22} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>
                Exam Scheduling & Timetable
              </h2>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '0.15rem 0.5rem',
                  borderRadius: '6px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}
              >
                MODULE 3 LIVE
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Create examinations, generate automated conflict-free timetables, and detect room & cohort collisions
            </p>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-primary"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
              boxShadow: '0 0 16px rgba(99, 102, 241, 0.35)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem'
            }}
            onClick={() => setIsGenerateModalOpen(true)}
          >
            <Sparkles size={16} />
            <span>Generate Timetable (AI Algorithm)</span>
          </button>

          <button
            type="button"
            className="btn btn-primary"
            style={{
              background: hardConflictsCount > 0 ? 'linear-gradient(135deg, #f59e0b, #ef4444)' : 'linear-gradient(135deg, #10b981, #059669)',
              boxShadow: hardConflictsCount > 0 ? '0 0 16px rgba(239, 68, 68, 0.4)' : '0 0 16px rgba(16, 185, 129, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontWeight: 700
            }}
            disabled={resolving || exams.length === 0}
            onClick={handleAutoResolveConflicts}
            title="Automatically eliminate all conflicts by adjusting dates & times without common-student clashes"
          >
            {resolving ? (
              <>
                <RefreshCw size={15} className="spin" />
                <span>Resolving Clashes...</span>
              </>
            ) : (
              <>
                <Zap size={15} />
                <span>Auto-Resolve Conflicts (AI)</span>
                {hardConflictsCount > 0 && (
                  <span style={{ background: '#fff', color: '#dc2626', fontSize: '0.68rem', fontWeight: 900, padding: '0.1rem 0.35rem', borderRadius: '8px' }}>
                    {hardConflictsCount}
                  </span>
                )}
              </>
            )}
          </button>

          <button
            type="button"
            className="btn btn-emerald"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
            onClick={() => {
              setEditingExam(null);
              setIsCreateModalOpen(true);
            }}
          >
            <Plus size={16} />
            <span>Schedule Exam</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            title="Seed balanced demo examination timetable"
            onClick={handleSeedDemo}
          >
            <Zap size={15} color="#fbbf24" />
            <span>Seed Demo</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            title="Print printable timetable roster"
            onClick={handlePrint}
          >
            <Printer size={15} />
            <span>Print</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            title="Refresh examination records"
            onClick={loadData}
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Top 4 Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem'
        }}
      >
        {/* Card 1: Total Exams */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '1.1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Total Examinations
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#f3f4f6', marginTop: '0.15rem' }}>
              {totalExamsCount}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)' }}>
              Active on Master Schedule
            </div>
          </div>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calendar size={20} color="#818cf8" />
          </div>
        </div>

        {/* Card 2: Hard Conflicts */}
        <div
          style={{
            background: hardConflictsCount > 0 ? 'rgba(244, 63, 94, 0.06)' : 'rgba(16, 185, 129, 0.06)',
            border: `1px solid ${hardConflictsCount > 0 ? 'rgba(244, 63, 94, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
            borderRadius: '12px',
            padding: '1.1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer'
          }}
          onClick={() => setActiveSubTab('conflicts')}
          title="Click to view conflict inspector"
        >
          <div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Hard Conflict Status
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: hardConflictsCount > 0 ? '#f87171' : '#34d399', marginTop: '0.15rem' }}>
              {hardConflictsCount === 0 ? '0 Clashes' : `${hardConflictsCount} Critical`}
            </div>
            <div style={{ fontSize: '0.72rem', color: hardConflictsCount > 0 ? '#fca5a5' : '#6ee7b7' }}>
              {hardConflictsCount === 0 ? '✓ 100% Conflict-Free' : 'Requires Re-scheduling'}
            </div>
          </div>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: hardConflictsCount > 0 ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {hardConflictsCount > 0 ? <ShieldAlert size={20} color="#f43f5e" /> : <ShieldCheck size={20} color="#10b981" />}
          </div>
        </div>

        {/* Card 3: Session Dates Span (Clickable to change dates span) */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(6, 182, 212, 0.35)',
            borderRadius: '12px',
            padding: '1.1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'var(--transition)'
          }}
          onClick={() => setIsDatesSpanModalOpen(true)}
          title="Click to view and change the overarching timetable dates span across which exams can be scheduled"
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Timetable Dates Span
              </span>
              <span style={{ fontSize: '0.66rem', background: 'rgba(6, 182, 212, 0.18)', color: '#38bdf8', padding: '0.1rem 0.4rem', borderRadius: '5px', fontWeight: 800 }}>
                Active Session
              </span>
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f3f4f6', marginTop: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {timetableSpan.startDate} <span style={{ color: '#06b6d4', margin: '0 0.25rem' }}>→</span> {timetableSpan.endDate}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              {totalSpanDays > 0 ? `${totalSpanDays} Total Window Days` : 'Dates Configured'} • {distinctDates.length} Exam Day{distinctDates.length === 1 ? '' : 's'} Scheduled
            </div>
            <div style={{ marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', borderColor: 'rgba(6, 182, 212, 0.4)', color: '#38bdf8' }}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDatesSpanModalOpen(true);
                }}
              >
                <Calendar size={12} color="#06b6d4" />
                <span>Change Dates Span</span>
              </button>
            </div>
          </div>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={20} color="#06b6d4" />
          </div>
        </div>

        {/* Card 4: Cognitive Difficulty Spacing */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '1.1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Average Exam Load
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#fbbf24', marginTop: '0.15rem' }}>
              {avgDiff} / 5.0
            </div>
            <div style={{ fontSize: '0.72rem', color: warningsCount > 0 ? '#fbbf24' : '#a5b4fc' }}>
              {warningsCount > 0 ? `${warningsCount} Spacing Warnings` : 'Optimal Prep Gaps'}
            </div>
          </div>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={20} color="#f59e0b" />
          </div>
        </div>
      </div>

      {/* Critical Conflict Banner with 1-Click AI Auto-Resolve */}
      {conflictData.hasConflicts && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(245, 158, 11, 0.12))',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            boxShadow: '0 4px 20px rgba(239, 68, 68, 0.15)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <AlertTriangle size={22} color="#f87171" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.96rem', color: '#fca5a5' }}>
                Scheduling Clashes Detected: {hardConflictsCount} Hard Collision{hardConflictsCount !== 1 ? 's' : ''} & {warningsCount} Warning{warningsCount !== 1 ? 's' : ''}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Subjects sharing common enrolled students or identical cohorts are colliding on dates/slots. The AI Optimizer will dynamically adjust dates & time slots into a 100% collision-free schedule.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.82rem' }}
              onClick={() => setActiveSubTab('conflicts')}
            >
              <span>Inspect {hardConflictsCount} Issue{hardConflictsCount !== 1 ? 's' : ''}</span>
            </button>

            <button
              type="button"
              className="btn btn-primary"
              style={{
                background: 'linear-gradient(135deg, #ef4444, #f59e0b)',
                boxShadow: '0 0 16px rgba(239, 68, 68, 0.4)',
                fontSize: '0.82rem',
                fontWeight: 700
              }}
              disabled={resolving}
              onClick={handleAutoResolveConflicts}
            >
              {resolving ? (
                <>
                  <RefreshCw size={14} className="spin" />
                  <span>Resolving Clashes...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Auto-Resolve Conflicts (AI)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '0.25rem',
          overflowX: 'auto'
        }}
      >
        <button
          type="button"
          className={`tab-btn ${activeSubTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('calendar')}
        >
          <Calendar size={15} />
          <span>Timetable Calendar (Matrix Grid)</span>
        </button>

        <button
          type="button"
          className={`tab-btn ${activeSubTab === 'table' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('table')}
        >
          <BookOpen size={15} />
          <span>Examinations Roster ({exams.length})</span>
        </button>

        <button
          type="button"
          className={`tab-btn ${activeSubTab === 'conflicts' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('conflicts')}
          style={{ position: 'relative' }}
        >
          <ShieldAlert size={15} color={hardConflictsCount > 0 ? '#f43f5e' : 'inherit'} />
          <span>Conflict Inspector</span>
          {hardConflictsCount > 0 && (
            <span
              style={{
                background: '#f43f5e',
                color: '#fff',
                fontSize: '0.65rem',
                fontWeight: 800,
                padding: '0.1rem 0.4rem',
                borderRadius: '10px',
                marginLeft: '0.3rem'
              }}
            >
              {hardConflictsCount}
            </span>
          )}
        </button>

        <button
          type="button"
          className={`tab-btn ${activeSubTab === 'cohort' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('cohort')}
        >
          <Layers size={15} />
          <span>Student Cohort Roadmap</span>
        </button>

        <button
          type="button"
          className={`tab-btn ${activeSubTab === 'printable' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('printable')}
        >
          <Printer size={15} />
          <span>Official Notice Roster</span>
        </button>
      </div>

      {/* Search & Filter Toolbar (Shown for Table and Calendar views) */}
      {(activeSubTab === 'calendar' || activeSubTab === 'table') && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.85rem',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '0.75rem 1rem'
          }}
        >
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '240px' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
              <Search size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: '2rem' }}
                placeholder="Search course code, title, or exam..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-secondary" style={{ padding: '0.45rem 0.85rem' }}>
              Filter
            </button>
          </form>

          {/* Filter Dropdowns */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <select
              className="form-control"
              style={{ width: 'auto', fontSize: '0.8rem', padding: '0.4rem 0.65rem' }}
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
            >
              <option value="ALL">All Departments</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            <select
              className="form-control"
              style={{ width: 'auto', fontSize: '0.8rem', padding: '0.4rem 0.65rem' }}
              value={semFilter}
              onChange={(e) => setSemFilter(e.target.value)}
            >
              <option value="ALL">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                <option key={s} value={s}>Sem {s}</option>
              ))}
            </select>

            <select
              className="form-control"
              style={{ width: 'auto', fontSize: '0.8rem', padding: '0.4rem 0.65rem' }}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="ALL">All Sessions</option>
              <option value="END_TERM">End-Term</option>
              <option value="MID_TERM">Mid-Term</option>
              <option value="QUIZ">Quiz</option>
            </select>

            {(deptFilter !== 'ALL' || semFilter !== 'ALL' || typeFilter !== 'ALL' || search) && (
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.78rem', padding: '0.4rem 0.65rem' }}
                onClick={() => {
                  setDeptFilter('ALL');
                  setSemFilter('ALL');
                  setTypeFilter('ALL');
                  setSearch('');
                }}
              >
                Reset
              </button>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 1: Visual Timetable Matrix Grid */}
      {activeSubTab === 'calendar' && (
        <TimetableCalendarGrid
          matrix={matrixData || {
            dates: distinctDates,
            grid: distinctDates.reduce((acc, d) => {
              acc[d] = {
                slots: {
                  MORNING: exams.filter(e => e.exam_date === d && e.start_time < '13:00:00'),
                  AFTERNOON: exams.filter(e => e.exam_date === d && e.start_time >= '13:00:00' && e.start_time <= '17:30:00'),
                  EVENING: exams.filter(e => e.exam_date === d && e.start_time > '17:30:00')
                }
              };
              return acc;
            }, {})
          }}
          onEditExam={handleEditClick}
          onDeleteExam={handleDeleteClick}
        />
      )}

      {/* SUB-TAB 2: Examinations Roster Table */}
      {activeSubTab === 'table' && (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Examination Name</th>
                <th>Category</th>
                <th>Date</th>
                <th>Time Window</th>
                <th>Difficulty</th>
                <th>Allocations</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayExams.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    No examinations match the active filter criteria.
                  </td>
                </tr>
              ) : (
                displayExams.map(ex => (
                  <tr key={ex.id}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 800, color: 'var(--text-main)', fontFamily: 'monospace' }}>
                          {ex.course_code}
                        </span>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          {ex.department} · Sem {ex.semester}
                        </span>
                      </div>
                    </td>

                    <td>
                      <span style={{ fontWeight: 600 }}>{ex.exam_name}</span>
                    </td>

                    <td>
                      <span
                        className="badge"
                        style={{
                          fontSize: '0.7rem',
                          background: ex.exam_type === 'END_TERM' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(6, 182, 212, 0.15)',
                          color: ex.exam_type === 'END_TERM' ? '#a5b4fc' : '#67e8f9',
                          border: `1px solid ${ex.exam_type === 'END_TERM' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(6, 182, 212, 0.3)'}`
                        }}
                      >
                        {ex.exam_type}
                      </span>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.84rem' }}>
                        <Calendar size={13} color="var(--primary)" />
                        <span>{ex.exam_date}</span>
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.84rem', color: 'var(--accent-cyan)' }}>
                        <Clock size={13} />
                        <span>{ex.start_time.slice(0, 5)} - {ex.end_time.slice(0, 5)}</span>
                      </div>
                    </td>

                    <td>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.45rem',
                          borderRadius: '6px',
                          background: (ex.difficulty_level || 3) >= 4 ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          color: (ex.difficulty_level || 3) >= 4 ? '#f87171' : '#34d399',
                          border: `1px solid ${(ex.difficulty_level || 3) >= 4 ? 'rgba(244, 63, 94, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
                        }}
                      >
                        Diff {ex.difficulty_level || 3}/5
                      </span>
                    </td>

                    <td>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <span>{ex.allocated_students_count || 0} students</span> · <span>{ex.rooms_used_count || 0} rooms</span>
                      </div>
                    </td>

                    <td>
                      <span
                        className="badge"
                        style={{
                          fontSize: '0.7rem',
                          background: ex.status === 'SCHEDULED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: ex.status === 'SCHEDULED' ? '#34d399' : '#fbbf24',
                          border: `1px solid ${ex.status === 'SCHEDULED' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                        }}
                      >
                        {ex.status}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <button
                          type="button"
                          className="btn-icon"
                          title="Edit examination schedule"
                          onClick={() => handleEditClick(ex)}
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon"
                          style={{ color: '#f87171' }}
                          title="Delete examination"
                          onClick={() => handleDeleteClick(ex.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* SUB-TAB 3: Dedicated Conflict Inspector */}
      {activeSubTab === 'conflicts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Conflict Summary Header */}
          <div
            style={{
              background: conflictData.hasConflicts ? 'rgba(244, 63, 94, 0.08)' : 'rgba(16, 185, 129, 0.08)',
              border: `1px solid ${conflictData.hasConflicts ? 'rgba(244, 63, 94, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
              borderRadius: '12px',
              padding: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              {conflictData.hasConflicts ? (
                <ShieldAlert size={28} color="#f43f5e" />
              ) : (
                <ShieldCheck size={28} color="#10b981" />
              )}
              <div>
                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: conflictData.hasConflicts ? '#fca5a5' : '#6ee7b7' }}>
                  {conflictData.hasConflicts
                    ? `${conflictData.hardConflictsCount} Critical Conflicts & ${conflictData.warningsCount} Warnings Found`
                    : 'All Schedules Are 100% Conflict-Free'}
                </h4>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Continuous collision scanner evaluating cohort overlaps, student cross-enrollments, room collisions, and prep spacing
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              {conflictData.hasConflicts && (
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, #ef4444, #f59e0b)',
                    boxShadow: '0 0 14px rgba(239, 68, 68, 0.35)',
                    fontSize: '0.82rem',
                    fontWeight: 700
                  }}
                  disabled={resolving}
                  onClick={handleAutoResolveConflicts}
                >
                  {resolving ? (
                    <>
                      <RefreshCw size={14} className="spin" />
                      <span>AI Resolving Clashes...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>Auto-Resolve All Clashes (AI)</span>
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                className="btn btn-secondary"
                onClick={loadData}
              >
                <RefreshCw size={14} className={loading ? 'spin' : ''} />
                <span>Re-Run Deep Scan</span>
              </button>
            </div>
          </div>

          {/* Issue Cards */}
          {(!conflictData.issues || conflictData.issues.length === 0) ? (
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '2.5rem',
                textAlign: 'center',
                color: 'var(--text-muted)'
              }}
            >
              <CheckCircle2 size={40} color="#10b981" style={{ margin: '0 auto 0.75rem' }} />
              <h4 style={{ color: '#f3f4f6', marginBottom: '0.35rem' }}>Zero Conflicts Detected</h4>
              <p style={{ fontSize: '0.84rem', maxWidth: '420px', margin: '0 auto' }}>
                Every student cohort has exactly 1 exam per day, student cross-enrollments are collision-free, and high-difficulty courses have appropriate preparation buffers.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {conflictData.issues.map((issue, idx) => {
                const isHard = issue.severity === 'HIGH';

                return (
                  <div
                    key={issue.id || idx}
                    style={{
                      background: isHard ? 'rgba(244, 63, 94, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                      border: `1px solid ${isHard ? 'rgba(244, 63, 94, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`,
                      borderRadius: '12px',
                      padding: '1.1rem 1.25rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '1rem',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flex: 1, minWidth: '280px' }}>
                      {isHard ? (
                        <ShieldAlert size={20} color="#f43f5e" style={{ flexShrink: 0, marginTop: '2px' }} />
                      ) : (
                        <AlertTriangle size={20} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
                      )}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              padding: '0.12rem 0.45rem',
                              borderRadius: '5px',
                              background: isHard ? 'rgba(244, 63, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                              color: isHard ? '#f87171' : '#fbbf24',
                              border: `1px solid ${isHard ? 'rgba(244, 63, 94, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
                              textTransform: 'uppercase'
                            }}
                          >
                            {issue.severity} SEVERITY
                          </span>
                          <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#f3f4f6' }}>
                            {issue.title || issue.type}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.84rem', color: isHard ? '#fca5a5' : '#fde68a', lineHeight: 1.45 }}>
                          {issue.message}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
                        onClick={() => {
                          // Open edit modal for the first involved exam
                          const examToEdit = exams.find(e => e.id === issue.details?.exam1_id || e.id === issue.details?.exam2_id);
                          if (examToEdit) {
                            handleEditClick(examToEdit);
                          } else {
                            setIsCreateModalOpen(true);
                          }
                        }}
                      >
                        Reschedule Slot
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 4: Student Cohort Roadmap */}
      {activeSubTab === 'cohort' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Cohort Selector Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '1rem 1.25rem',
              flexWrap: 'wrap',
              gap: '1rem'
            }}
          >
            <div>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>
                Select Student Cohort
              </h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                View the sequential examination progression and prep day intervals for a specific student batch
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {cohortsList.map(c => {
                const [d, s] = c.split('_');
                const isSelected = selectedCohort === c;
                return (
                  <button
                    key={c}
                    type="button"
                    className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                    onClick={() => setSelectedCohort(c)}
                  >
                    {d} · Sem {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sequential Timeline Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {selectedCohortExams.length === 0 ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No examinations scheduled for this cohort.
              </div>
            ) : (
              selectedCohortExams.map((ex, idx) => {
                const prevExam = idx > 0 ? selectedCohortExams[idx - 1] : null;
                let daysGap = null;
                if (prevExam) {
                  const d1 = new Date(prevExam.exam_date);
                  const d2 = new Date(ex.exam_date);
                  const diffTime = Math.abs(d2 - d1);
                  daysGap = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                }

                return (
                  <React.Fragment key={ex.id}>
                    {/* Days Gap Indicator between exams */}
                    {daysGap !== null && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          margin: '0.2rem 0'
                        }}
                      >
                        <div style={{ height: '1px', background: 'var(--border-subtle)', flex: 1 }} />
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.6rem',
                            borderRadius: '12px',
                            background: daysGap >= 2 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: daysGap >= 2 ? '#34d399' : '#fbbf24',
                            border: `1px solid ${daysGap >= 2 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                          }}
                        >
                          {daysGap} {daysGap === 1 ? 'Day Gap (Next Day)' : 'Days Prep Buffer'}
                        </span>
                        <div style={{ height: '1px', background: 'var(--border-subtle)', flex: 1 }} />
                      </div>
                    )}

                    {/* Exam Card */}
                    <div
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '12px',
                        padding: '1.1rem 1.25rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '1rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '10px',
                            background: 'rgba(99, 102, 241, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            color: '#a5b4fc',
                            fontSize: '0.9rem'
                          }}
                        >
                          {idx + 1}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.2rem' }}>
                            <span style={{ fontWeight: 800, fontFamily: 'monospace', color: '#67e8f9', fontSize: '0.85rem' }}>
                              {ex.course_code}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              {ex.exam_type}
                            </span>
                          </div>
                          <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: '#f3f4f6' }}>
                            {ex.course_name || ex.exam_name}
                          </h4>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.86rem', fontWeight: 700, color: '#f3f4f6' }}>
                            <Calendar size={14} color="var(--primary)" />
                            <span>{ex.exam_date}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--accent-cyan)', marginTop: '0.15rem' }}>
                            <Clock size={12} />
                            <span>{ex.start_time.slice(0, 5)} - {ex.end_time.slice(0, 5)}</span>
                          </div>
                        </div>

                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.5rem',
                            borderRadius: '6px',
                            background: (ex.difficulty_level || 3) >= 4 ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            color: (ex.difficulty_level || 3) >= 4 ? '#f87171' : '#34d399',
                            border: `1px solid ${(ex.difficulty_level || 3) >= 4 ? 'rgba(244, 63, 94, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
                          }}
                        >
                          Diff {ex.difficulty_level || 3}/5
                        </span>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 5: Printable Official Examination Notice Roster */}
      {activeSubTab === 'printable' && (
        <div
          style={{
            background: '#ffffff',
            color: '#111827',
            borderRadius: '12px',
            padding: '2.5rem',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
            fontFamily: 'Arial, sans-serif'
          }}
        >
          {/* Printable Header */}
          <div style={{ textAlign: 'center', borderBottom: '2px solid #111827', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            <h2 style={{ margin: '0 0 0.35rem 0', fontSize: '1.4rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ExamSphere University Examination Branch
            </h2>
            <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', fontWeight: 700, color: '#374151' }}>
              Official Final Examination Timetable & Schedule Notification
            </h3>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#6b7280' }}>
              Academic Session 2025-2026 · Published by Office of the Controller of Examinations
            </p>
          </div>

          {/* Printable Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#f3f4f6', borderBottom: '2px solid #d1d5db' }}>
                <th style={{ padding: '0.65rem 0.75rem', textAlign: 'left', border: '1px solid #d1d5db' }}>Sr.</th>
                <th style={{ padding: '0.65rem 0.75rem', textAlign: 'left', border: '1px solid #d1d5db' }}>Course Code</th>
                <th style={{ padding: '0.65rem 0.75rem', textAlign: 'left', border: '1px solid #d1d5db' }}>Course Title</th>
                <th style={{ padding: '0.65rem 0.75rem', textAlign: 'center', border: '1px solid #d1d5db' }}>Dept / Sem</th>
                <th style={{ padding: '0.65rem 0.75rem', textAlign: 'center', border: '1px solid #d1d5db' }}>Exam Date</th>
                <th style={{ padding: '0.65rem 0.75rem', textAlign: 'center', border: '1px solid #d1d5db' }}>Time Slot</th>
                <th style={{ padding: '0.65rem 0.75rem', textAlign: 'center', border: '1px solid #d1d5db' }}>Duration</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((ex, i) => (
                <tr key={ex.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '0.6rem 0.75rem', border: '1px solid #e5e7eb', textAlign: 'center', fontWeight: 'bold' }}>{i + 1}</td>
                  <td style={{ padding: '0.6rem 0.75rem', border: '1px solid #e5e7eb', fontFamily: 'monospace', fontWeight: 'bold' }}>{ex.course_code}</td>
                  <td style={{ padding: '0.6rem 0.75rem', border: '1px solid #e5e7eb' }}>{ex.course_name || ex.exam_name}</td>
                  <td style={{ padding: '0.6rem 0.75rem', border: '1px solid #e5e7eb', textAlign: 'center' }}>{ex.department} - Sem {ex.semester}</td>
                  <td style={{ padding: '0.6rem 0.75rem', border: '1px solid #e5e7eb', textAlign: 'center', fontWeight: '600' }}>{ex.exam_date}</td>
                  <td style={{ padding: '0.6rem 0.75rem', border: '1px solid #e5e7eb', textAlign: 'center' }}>{ex.start_time.slice(0, 5)} - {ex.end_time.slice(0, 5)}</td>
                  <td style={{ padding: '0.6rem 0.75rem', border: '1px solid #e5e7eb', textAlign: 'center' }}>{ex.duration_minutes || 180} mins</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Printable Footer */}
          <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '1.5rem', borderTop: '1px dashed #9ca3af' }}>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              <div>* Identity verification and hall tickets mandatory in examination halls.</div>
              <div>* Electronic gadgets, smartwatches, and notes strictly prohibited under UFM regulations.</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Dr. Shilpa Mahajan</div>
              <div style={{ fontSize: '0.75rem', color: '#4b5563' }}>Controller of Examinations</div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateExamModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingExam(null);
        }}
        onSuccess={() => {
          showNotification(editingExam ? 'Exam updated successfully.' : 'Exam scheduled successfully.');
          loadData();
        }}
        initialExam={editingExam}
        courses={courses}
        timetableSpan={timetableSpan}
        onOpenGenerateTimetable={() => setIsGenerateModalOpen(true)}
      />

      <GenerateTimetableModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        onSuccess={(genResult) => {
          showNotification('Automated timetable generated successfully!');
          if (genResult?.startDate && genResult?.endDate) {
            setTimetableSpan({ startDate: genResult.startDate, endDate: genResult.endDate });
            localStorage.setItem('examsphere_timetable_dates_span', JSON.stringify({
              startDate: genResult.startDate,
              endDate: genResult.endDate
            }));
          }
          loadData();
        }}
        departments={departments}
        initialStartDate={timetableSpan.startDate}
        initialEndDate={timetableSpan.endDate}
      />

      <TimetableDatesSpanModal
        isOpen={isDatesSpanModalOpen}
        onClose={() => setIsDatesSpanModalOpen(false)}
        currentSpan={timetableSpan}
        exams={exams}
        onSuccess={(newSpan) => {
          setTimetableSpan(newSpan);
          localStorage.setItem('examsphere_timetable_dates_span', JSON.stringify(newSpan));
          showNotification(`Timetable dates span updated to ${newSpan.startDate} → ${newSpan.endDate}`);
          loadData();
        }}
        onOpenGenerateTimetable={() => setIsGenerateModalOpen(true)}
      />
    </div>
  );
}

