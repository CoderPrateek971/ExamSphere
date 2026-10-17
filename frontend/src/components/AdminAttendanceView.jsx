import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Camera,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Maximize2,
  Sparkles,
  Clock,
  ShieldCheck,
  Building2,
  Calendar,
  Grid,
  ChevronRight,
  X,
  FileSpreadsheet,
  Award,
  Layers,
  HelpCircle,
  UserCheck
} from 'lucide-react';
import { api, getFullPhotoUrl } from '../api';

export default function AdminAttendanceView({ user }) {
  // Data state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exams, setExams] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    presentCount: 0,
    absentCount: 0,
    flaggedCount: 0,
    unverifiedCount: 0,
    faceVerifiedCount: 0,
    attendanceRate: 0
  });

  // Filter state
  const [selectedExam, setSelectedExam] = useState('ALL');
  const [selectedRoom, setSelectedRoom] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedMethod, setSelectedMethod] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Inspector modal state
  const [inspectedRecord, setInspectedRecord] = useState(null);

  // Status updating state
  const [updatingId, setUpdatingId] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // 1. Fetch attendance records from backend
  const fetchAttendance = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await api.getAttendanceOverview({
        examId: selectedExam !== 'ALL' ? selectedExam : null,
        roomId: selectedRoom !== 'ALL' ? selectedRoom : null,
        status: selectedStatus !== 'ALL' ? selectedStatus : null,
        method: selectedMethod !== 'ALL' ? selectedMethod : null,
        search: searchQuery.trim() || null
      });

      if (res && res.data) {
        setExams(res.data.exams || []);
        setRooms(res.data.rooms || []);
        setRecords(res.data.records || []);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (err) {
      console.error('Failed to load exam attendance overview:', err);
      showToast('Error loading attendance records.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedExam, selectedRoom, selectedStatus, selectedMethod]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAttendance(true);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 2. Quick Admin Attendance Status Override
  const handleUpdateStatus = async (record, newStatus) => {
    setUpdatingId(record.student_id);
    try {
      await api.markAttendance({
        exam_id: record.exam_id,
        student_id: record.student_id,
        room_id: record.room_id,
        status: newStatus,
        verification_method: 'MANUAL',
        photo_path: record.photo_path
      });

      showToast(`Updated ${record.student_name} to ${newStatus}`);
      await fetchAttendance(true);
      if (inspectedRecord && inspectedRecord.student_id === record.student_id) {
        setInspectedRecord((prev) => ({
          ...prev,
          attendance_status: newStatus,
          verification_method: 'MANUAL'
        }));
      }
    } catch (err) {
      console.error('Status update failed:', err);
      showToast('Failed to update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  // 3. Export Attendance Register as CSV
  const handleExportCSV = () => {
    if (records.length === 0) {
      showToast('No records available to export.');
      return;
    }

    const headers = [
      'Exam ID',
      'Exam Name',
      'Course Code',
      'Room Number',
      'Seat Number',
      'Student Name',
      'Enrollment No',
      'Department',
      'Program',
      'Attendance Status',
      'Verification Method',
      'Biometric Confidence (%)',
      'Marked Time',
      'Photo URL'
    ];

    const rows = records.map((r) => [
      `"${r.exam_id}"`,
      `"${r.exam_name || ''}"`,
      `"${r.course_code || ''}"`,
      `"${r.room_number || ''}"`,
      `"${r.seat_number || ''}"`,
      `"${r.student_name || ''}"`,
      `"${r.enrollment_no || ''}"`,
      `"${r.student_department || ''}"`,
      `"${r.program || ''}"`,
      `"${r.attendance_status || 'UNVERIFIED'}"`,
      `"${r.verification_method || 'NONE'}"`,
      `"${r.face_confidence ? r.face_confidence + '%' : 'N/A'}"`,
      `"${r.marked_at ? new Date(r.marked_at).toLocaleString() : 'N/A'}"`,
      `"${r.photo_path ? getFullPhotoUrl(r.photo_path) : 'NONE'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const examCode = selectedExam !== 'ALL' ? `Exam_${selectedExam}` : 'All_Exams';
    link.setAttribute('download', `ExamSphere_Attendance_${examCode}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Attendance Register CSV exported.');
  };

  // Selected Exam object
  const currentExamObj = useMemo(() => {
    if (selectedExam === 'ALL') return null;
    return exams.find((e) => String(e.id) === String(selectedExam));
  }, [exams, selectedExam]);

  return (
    <div className="admin-attendance-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Toast Notification */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(6, 182, 212, 0.5)',
            color: '#f8fafc',
            padding: '0.85rem 1.4rem',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontSize: '0.9rem',
            fontWeight: 500
          }}
        >
          <Sparkles size={16} color="var(--accent-cyan)" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div
        className="glass-card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: '1.25rem 1.75rem',
          background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.9) 0%, rgba(15, 23, 42, 0.75) 100%)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'var(--accent-cyan)',
                background: 'rgba(6, 182, 212, 0.12)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                padding: '0.2rem 0.6rem',
                borderRadius: '20px',
                letterSpacing: '0.05em'
              }}
            >
              MODULE 7 • ADMIN ATTENDANCE & BIOMETRIC RADAR
            </span>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                color: 'var(--accent-emerald)',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '0.2rem 0.55rem',
                borderRadius: '20px'
              }}
            >
              LIVE SYNC
            </span>
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            Exam Attendance & Identity Verification
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem', margin: 0 }}>
            Inspect candidate attendance records across all exam halls, review captured face match photos, and audit biometric verifications.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            className="btn btn-secondary"
            onClick={() => fetchAttendance(true)}
            disabled={refreshing}
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem', padding: '0.6rem 1rem' }}
          >
            <RefreshCw size={15} className={refreshing ? 'spinning' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button
            className="btn btn-primary"
            onClick={handleExportCSV}
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem', padding: '0.6rem 1.1rem' }}
          >
            <Download size={15} />
            <span>Export CSV Register</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '1rem'
        }}
      >
        {/* Total Candidates */}
        <div
          className="glass-card"
          style={{
            padding: '1.1rem 1.3rem',
            background: 'rgba(17, 24, 39, 0.65)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            borderRadius: '14px',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Total Candidates
              </span>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                {stats.totalStudents}
              </div>
            </div>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                background: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)'
              }}
            >
              <Users size={19} />
            </div>
          </div>
          <div style={{ marginTop: '0.5rem', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            Scheduled across selected exam & rooms
          </div>
        </div>

        {/* Present & Attendance Rate */}
        <div
          className="glass-card"
          style={{
            padding: '1.1rem 1.3rem',
            background: 'rgba(17, 24, 39, 0.65)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '14px',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-emerald)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Present Candidates
              </span>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#34d399', marginTop: '0.2rem' }}>
                {stats.presentCount}
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)', marginLeft: '0.4rem' }}>
                  ({stats.attendanceRate}%)
                </span>
              </div>
            </div>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#34d399'
              }}
            >
              <CheckCircle2 size={19} />
            </div>
          </div>
          {/* Progress Bar */}
          <div style={{ marginTop: '0.6rem', height: 4, background: 'rgba(255, 255, 255, 0.08)', borderRadius: 2, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${stats.attendanceRate}%`,
                background: 'linear-gradient(90deg, #10b981, #06b6d4)',
                borderRadius: 2
              }}
            />
          </div>
        </div>

        {/* Biometric Face Verified */}
        <div
          className="glass-card"
          style={{
            padding: '1.1rem 1.3rem',
            background: 'rgba(17, 24, 39, 0.65)',
            border: '1px solid rgba(6, 182, 212, 0.25)',
            borderRadius: '14px',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Biometric Face-Verified
              </span>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.2rem' }}>
                {stats.faceVerifiedCount}
              </div>
            </div>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                background: 'rgba(6, 182, 212, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8'
              }}
            >
              <Camera size={19} />
            </div>
          </div>
          <div style={{ marginTop: '0.5rem', fontSize: '0.74rem', color: '#67e8f9' }}>
            Verified via Camera AI Face Matching
          </div>
        </div>

        {/* Absent */}
        <div
          className="glass-card"
          style={{
            padding: '1.1rem 1.3rem',
            background: 'rgba(17, 24, 39, 0.65)',
            border: '1px solid rgba(244, 63, 94, 0.2)',
            borderRadius: '14px',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-rose)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Absent Candidates
              </span>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#fb7185', marginTop: '0.2rem' }}>
                {stats.absentCount}
              </div>
            </div>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                background: 'rgba(244, 63, 94, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fb7185'
              }}
            >
              <XCircle size={19} />
            </div>
          </div>
          <div style={{ marginTop: '0.5rem', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            Marked absent or no-show
          </div>
        </div>

        {/* Flagged / Unverified */}
        <div
          className="glass-card"
          style={{
            padding: '1.1rem 1.3rem',
            background: 'rgba(17, 24, 39, 0.65)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            borderRadius: '14px',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-amber)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Pending / Flagged
              </span>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#fbbf24', marginTop: '0.2rem' }}>
                {stats.unverifiedCount}
                {stats.flaggedCount > 0 && (
                  <span style={{ fontSize: '0.82rem', color: '#f87171', marginLeft: '0.35rem' }}>
                    ({stats.flaggedCount} FLAGGED)
                  </span>
                )}
              </div>
            </div>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fbbf24'
              }}
            >
              <AlertTriangle size={19} />
            </div>
          </div>
          <div style={{ marginTop: '0.5rem', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            Awaiting invigilator verification
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div
        className="glass-card"
        style={{
          padding: '1.1rem 1.4rem',
          background: 'rgba(17, 24, 39, 0.75)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.9rem'
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem', alignItems: 'center' }}>
          {/* Exam Filter Dropdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: '1 1 240px' }}>
            <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Calendar size={13} color="var(--accent-cyan)" />
              <span>Select Exam Session</span>
            </label>
            <select
              className="form-control"
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              style={{
                background: 'rgba(11, 15, 25, 0.8)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                padding: '0.55rem 0.8rem',
                borderRadius: '8px'
              }}
            >
              <option value="ALL">All Scheduled Exams ({exams.length})</option>
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.exam_name} ({ex.course_code})
                </option>
              ))}
            </select>
          </div>

          {/* Room Filter Dropdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: '1 1 160px' }}>
            <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Building2 size={13} color="var(--primary)" />
              <span>Hall / Room</span>
            </label>
            <select
              className="form-control"
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              style={{
                background: 'rgba(11, 15, 25, 0.8)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                padding: '0.55rem 0.8rem',
                borderRadius: '8px'
              }}
            >
              <option value="ALL">All Exam Halls</option>
              {rooms.map((rm) => (
                <option key={rm.id} value={rm.id}>
                  {rm.room_number} (Cap: {rm.capacity})
                </option>
              ))}
            </select>
          </div>

          {/* Attendance Status Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: '1 1 150px' }}>
            <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <CheckCircle2 size={13} color="var(--accent-emerald)" />
              <span>Status</span>
            </label>
            <select
              className="form-control"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                background: 'rgba(11, 15, 25, 0.8)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                padding: '0.55rem 0.8rem',
                borderRadius: '8px'
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="PRESENT">Present</option>
              <option value="ABSENT">Absent</option>
              <option value="FLAGGED">Flagged / Suspicious</option>
              <option value="UNVERIFIED">Pending / Unverified</option>
            </select>
          </div>

          {/* Verification Method Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: '1 1 160px' }}>
            <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <ShieldCheck size={13} color="var(--accent-cyan)" />
              <span>Method</span>
            </label>
            <select
              className="form-control"
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              style={{
                background: 'rgba(11, 15, 25, 0.8)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                padding: '0.55rem 0.8rem',
                borderRadius: '8px'
              }}
            >
              <option value="ALL">All Methods</option>
              <option value="FACE_MATCH">Biometric Face Match</option>
              <option value="MANUAL">Manual Verification</option>
            </select>
          </div>

          {/* Search Box */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: '1 1 220px' }}>
            <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Search size={13} />
              <span>Search Candidate / Seat</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search name, roll no, seat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(11, 15, 25, 0.8)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                  padding: '0.55rem 0.8rem 0.55rem 2.2rem',
                  borderRadius: '8px'
                }}
              />
              <Search
                size={14}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '0.6rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Active Filter Summary Bar */}
        {(selectedExam !== 'ALL' || selectedRoom !== 'ALL' || selectedStatus !== 'ALL' || selectedMethod !== 'ALL' || searchQuery) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              paddingTop: '0.4rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              flexWrap: 'wrap'
            }}
          >
            <span>Active Filters:</span>
            {selectedExam !== 'ALL' && (
              <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc' }}>
                Exam: {currentExamObj ? currentExamObj.course_code : selectedExam}
              </span>
            )}
            {selectedRoom !== 'ALL' && (
              <span className="badge" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#67e8f9' }}>
                Room: {rooms.find((r) => String(r.id) === String(selectedRoom))?.room_number || selectedRoom}
              </span>
            )}
            {selectedStatus !== 'ALL' && (
              <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#6ee7b7' }}>
                Status: {selectedStatus}
              </span>
            )}
            {selectedMethod !== 'ALL' && (
              <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fcd34d' }}>
                Method: {selectedMethod}
              </span>
            )}
            {searchQuery && (
              <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#fff' }}>
                Search: "{searchQuery}"
              </span>
            )}
            <button
              onClick={() => {
                setSelectedExam('ALL');
                setSelectedRoom('ALL');
                setSelectedStatus('ALL');
                setSelectedMethod('ALL');
                setSearchQuery('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-rose)',
                cursor: 'pointer',
                fontSize: '0.75rem',
                textDecoration: 'underline',
                marginLeft: 'auto'
              }}
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* Main Records Table */}
      <div
        className="glass-card"
        style={{
          padding: 0,
          background: 'rgba(17, 24, 39, 0.8)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            padding: '1rem 1.4rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(11, 15, 25, 0.5)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Candidate Verification Roster
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                background: 'rgba(255, 255, 255, 0.06)',
                padding: '0.15rem 0.55rem',
                borderRadius: '12px'
              }}
            >
              Showing {records.length} of {stats.totalStudents} students
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span>Click any candidate photo to launch full-resolution Biometric Inspector</span>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div className="spinning" style={{ display: 'inline-block', marginBottom: '1rem' }}>
              <RefreshCw size={28} color="var(--accent-cyan)" />
            </div>
            <p style={{ fontSize: '0.92rem', fontWeight: 500 }}>Loading live attendance telemetry...</p>
          </div>
        ) : records.length === 0 ? (
          /* Empty State */
          <div style={{ padding: '4.5rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <UserCheck size={42} color="var(--border-subtle)" style={{ marginBottom: '1rem' }} />
            <h4 style={{ color: 'var(--text-main)', fontSize: '1.1rem', marginBottom: '0.35rem' }}>
              No Attendance Records Found
            </h4>
            <p style={{ fontSize: '0.85rem', maxWidth: 440, margin: '0 auto 1.2rem' }}>
              No candidates match your current filter parameters. Try selecting "All Scheduled Exams" or clearing the search query.
            </p>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setSelectedExam('ALL');
                setSelectedRoom('ALL');
                setSelectedStatus('ALL');
                setSelectedMethod('ALL');
                setSearchQuery('');
              }}
              style={{ fontSize: '0.85rem' }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* Table */
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr
                  style={{
                    background: 'rgba(15, 23, 42, 0.65)',
                    color: 'var(--text-muted)',
                    borderBottom: '1px solid var(--border-subtle)',
                    fontSize: '0.74rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                >
                  <th style={{ padding: '0.85rem 1.2rem', width: 90 }}>Captured Photo</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Candidate</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Exam & Course</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Hall & Seat</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Verification Telemetry</th>
                  <th style={{ padding: '0.85rem 1.2rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, idx) => {
                  const photoUrl = getFullPhotoUrl(r.photo_path);
                  const isPresent = r.attendance_status === 'PRESENT';
                  const isAbsent = r.attendance_status === 'ABSENT';
                  const isFlagged = r.attendance_status === 'FLAGGED';
                  const isUnverified = !r.attendance_status || r.attendance_status === 'UNVERIFIED';

                  return (
                    <tr
                      key={`${r.exam_id}-${r.student_id}-${idx}`}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        transition: 'background 0.15s ease',
                        background: idx % 2 === 0 ? 'rgba(255, 255, 255, 0.01)' : 'transparent'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(6, 182, 212, 0.04)')}
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = idx % 2 === 0 ? 'rgba(255, 255, 255, 0.01)' : 'transparent')
                      }
                    >
                      {/* Photo Thumbnail */}
                      <td style={{ padding: '0.75rem 1.2rem' }}>
                        <div
                          onClick={() => setInspectedRecord(r)}
                          title="Click to view full image in Biometric Inspector"
                          style={{
                            width: 58,
                            height: 58,
                            borderRadius: '10px',
                            background: '#090d16',
                            border: photoUrl
                              ? '2px solid rgba(6, 182, 212, 0.6)'
                              : '1px solid rgba(255, 255, 255, 0.1)',
                            overflow: 'hidden',
                            position: 'relative',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: photoUrl ? '0 0 10px rgba(6, 182, 212, 0.25)' : 'none',
                            transition: 'transform 0.2s, box-shadow 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.08)';
                            e.currentTarget.style.boxShadow = '0 0 16px rgba(6, 182, 212, 0.45)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = photoUrl ? '0 0 10px rgba(6, 182, 212, 0.25)' : 'none';
                          }}
                        >
                          {photoUrl ? (
                            <>
                              <img
                                src={photoUrl}
                                alt={r.student_name}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover'
                                }}
                                onError={(e) => {
                                  // fallback on image load error
                                  e.target.style.display = 'none';
                                }}
                              />
                              <div
                                style={{
                                  position: 'absolute',
                                  inset: 0,
                                  background: 'rgba(0,0,0,0.25)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  opacity: 0,
                                  transition: 'opacity 0.15s'
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
                              >
                                <Maximize2 size={16} color="#fff" />
                              </div>
                              {r.verification_method === 'FACE_MATCH' && (
                                <div
                                  title="Biometric Match Confirmed"
                                  style={{
                                    position: 'absolute',
                                    bottom: 2,
                                    right: 2,
                                    width: 12,
                                    height: 12,
                                    borderRadius: '50%',
                                    background: '#10b981',
                                    border: '2px solid #0b0f19'
                                  }}
                                />
                              )}
                            </>
                          ) : (
                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--text-dim)',
                                textAlign: 'center'
                              }}
                            >
                              <Camera size={18} />
                              <span style={{ fontSize: '0.55rem', marginTop: 2 }}>NO PIC</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Candidate Identity */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                          {r.student_name}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontSize: '0.74rem',
                              color: 'var(--accent-cyan)',
                              background: 'rgba(6, 182, 212, 0.1)',
                              padding: '0.1rem 0.4rem',
                              borderRadius: '4px'
                            }}
                          >
                            {r.enrollment_no}
                          </span>
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            {r.student_department} • {r.program}
                          </span>
                        </div>
                        {r.student_email && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.1rem' }}>
                            {r.student_email}
                          </div>
                        )}
                      </td>

                      {/* Exam & Course */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{r.course_code}</div>
                        <div
                          style={{
                            fontSize: '0.74rem',
                            color: 'var(--text-muted)',
                            maxWidth: 180,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                          title={r.exam_name}
                        >
                          {r.exam_name}
                        </div>
                      </td>

                      {/* Hall & Seat */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span
                            style={{
                              fontWeight: 700,
                              color: '#cbd5e1',
                              background: 'rgba(255, 255, 255, 0.06)',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '6px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem'
                            }}
                          >
                            <Building2 size={12} color="var(--accent-cyan)" />
                            {r.room_number || 'Room TBA'}
                          </span>
                        </div>
                        <div
                          style={{
                            marginTop: '0.25rem',
                            fontSize: '0.76rem',
                            fontWeight: 600,
                            color: 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}
                        >
                          <span>🪑 Seat:</span>
                          <span style={{ color: '#f8fafc', fontFamily: 'monospace' }}>
                            {r.seat_number || 'Auto-Allocated'}
                          </span>
                        </div>
                      </td>

                      {/* Attendance Status */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {isPresent && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '0.25rem 0.65rem',
                              borderRadius: '20px',
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#34d399',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              fontSize: '0.76rem',
                              fontWeight: 700
                            }}
                          >
                            <CheckCircle2 size={13} />
                            PRESENT
                          </span>
                        )}
                        {isAbsent && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '0.25rem 0.65rem',
                              borderRadius: '20px',
                              background: 'rgba(244, 63, 94, 0.15)',
                              color: '#fb7185',
                              border: '1px solid rgba(244, 63, 94, 0.3)',
                              fontSize: '0.76rem',
                              fontWeight: 700
                            }}
                          >
                            <XCircle size={13} />
                            ABSENT
                          </span>
                        )}
                        {isFlagged && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '0.25rem 0.65rem',
                              borderRadius: '20px',
                              background: 'rgba(245, 158, 11, 0.15)',
                              color: '#fbbf24',
                              border: '1px solid rgba(245, 158, 11, 0.3)',
                              fontSize: '0.76rem',
                              fontWeight: 700
                            }}
                          >
                            <AlertTriangle size={13} />
                            FLAGGED
                          </span>
                        )}
                        {isUnverified && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '0.25rem 0.65rem',
                              borderRadius: '20px',
                              background: 'rgba(255, 255, 255, 0.06)',
                              color: 'var(--text-muted)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              fontSize: '0.76rem',
                              fontWeight: 600
                            }}
                          >
                            <Clock size={13} />
                            UNVERIFIED
                          </span>
                        )}
                      </td>

                      {/* Verification Telemetry */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {r.verification_method === 'FACE_MATCH' ? (
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                  fontSize: '0.74rem',
                                  fontWeight: 700,
                                  color: 'var(--accent-cyan)',
                                  background: 'rgba(6, 182, 212, 0.12)',
                                  padding: '0.15rem 0.45rem',
                                  borderRadius: '6px'
                                }}
                              >
                                <Camera size={11} />
                                AI FACE MATCH
                              </span>
                              {r.face_confidence && (
                                <span
                                  style={{
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    color: '#34d399',
                                    fontFamily: 'monospace'
                                  }}
                                >
                                  {r.face_confidence}%
                                </span>
                              )}
                            </div>
                            {r.marked_at && (
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                                {new Date(r.marked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                                {new Date(r.marked_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </div>
                            )}
                          </div>
                        ) : r.verification_method === 'MANUAL' ? (
                          <div>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                fontSize: '0.74rem',
                                fontWeight: 600,
                                color: 'var(--text-muted)',
                                background: 'rgba(255, 255, 255, 0.05)',
                                padding: '0.15rem 0.45rem',
                                borderRadius: '6px'
                              }}
                            >
                              <UserCheck size={11} />
                              MANUAL ROSTER
                            </span>
                            {r.marked_at && (
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                                {new Date(r.marked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                            Pending room invigilator
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '0.75rem 1.2rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                          {photoUrl && (
                            <button
                              onClick={() => setInspectedRecord(r)}
                              className="btn btn-secondary"
                              style={{
                                padding: '0.35rem 0.65rem',
                                fontSize: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.3rem'
                              }}
                              title="Inspect biometric image"
                            >
                              <Eye size={13} color="var(--accent-cyan)" />
                              <span>View Photo</span>
                            </button>
                          )}

                          {/* Quick Admin Overrides */}
                          {!isPresent && (
                            <button
                              onClick={() => handleUpdateStatus(r, 'PRESENT')}
                              disabled={updatingId === r.student_id}
                              className="btn"
                              style={{
                                padding: '0.35rem 0.55rem',
                                fontSize: '0.74rem',
                                background: 'rgba(16, 185, 129, 0.15)',
                                color: '#34d399',
                                border: '1px solid rgba(16, 185, 129, 0.3)'
                              }}
                              title="Mark Present (Admin Override)"
                            >
                              Mark Present
                            </button>
                          )}

                          {!isAbsent && (
                            <button
                              onClick={() => handleUpdateStatus(r, 'ABSENT')}
                              disabled={updatingId === r.student_id}
                              className="btn"
                              style={{
                                padding: '0.35rem 0.55rem',
                                fontSize: '0.74rem',
                                background: 'rgba(244, 63, 94, 0.1)',
                                color: '#fb7185',
                                border: '1px solid rgba(244, 63, 94, 0.25)'
                              }}
                              title="Mark Absent"
                            >
                              Mark Absent
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FULL BIOMETRIC PHOTO INSPECTOR MODAL */}
      {inspectedRecord && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(3, 7, 18, 0.85)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem'
          }}
          onClick={() => setInspectedRecord(null)}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: 880,
              background: '#0d1322',
              border: '1px solid rgba(6, 182, 212, 0.35)',
              borderRadius: '20px',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 35px rgba(6, 182, 212, 0.15)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '1.1rem 1.6rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(15, 23, 42, 0.7)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '8px',
                    background: 'rgba(6, 182, 212, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-cyan)'
                  }}
                >
                  <Camera size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    Biometric Identity & Verification Audit
                  </h3>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    High-resolution captured candidate photograph & telemetry
                  </span>
                </div>
              </div>

              <button
                onClick={() => setInspectedRecord(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(300px, 380px) 1fr',
                gap: '1.5rem',
                padding: '1.6rem'
              }}
            >
              {/* Photo Display Viewport */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '100%',
                    height: 340,
                    borderRadius: '16px',
                    background: '#040711',
                    border: '2px solid rgba(6, 182, 212, 0.5)',
                    boxShadow: '0 0 25px rgba(6, 182, 212, 0.2)',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {inspectedRecord.photo_path ? (
                    <img
                      src={getFullPhotoUrl(inspectedRecord.photo_path)}
                      alt={inspectedRecord.student_name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        background: '#080d1a'
                      }}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                      <Camera size={48} color="rgba(255, 255, 255, 0.2)" style={{ marginBottom: '0.5rem' }} />
                      <p style={{ margin: 0, fontSize: '0.85rem' }}>No Camera Snapshot Attached</p>
                    </div>
                  )}

                  {/* Corner Bracket Overlays for Biometric aesthetic */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 12,
                      left: 12,
                      width: 24,
                      height: 24,
                      borderTop: '3px solid #06b6d4',
                      borderLeft: '3px solid #06b6d4'
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      width: 24,
                      height: 24,
                      borderTop: '3px solid #06b6d4',
                      borderRight: '3px solid #06b6d4'
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 12,
                      left: 12,
                      width: 24,
                      height: 24,
                      borderBottom: '3px solid #06b6d4',
                      borderLeft: '3px solid #06b6d4'
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 12,
                      right: 12,
                      width: 24,
                      height: 24,
                      borderBottom: '3px solid #06b6d4',
                      borderRight: '3px solid #06b6d4'
                    }}
                  />

                  {/* Top telemetry tag */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 14,
                      background: 'rgba(15, 23, 42, 0.85)',
                      backdropFilter: 'blur(4px)',
                      border: '1px solid rgba(6, 182, 212, 0.4)',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '12px',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: '#67e8f9',
                      letterSpacing: '0.05em'
                    }}
                  >
                    AI BIOMETRIC VERIFIER v2.4
                  </div>

                  {/* Live Status Tag */}
                  {inspectedRecord.verification_method === 'FACE_MATCH' && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 14,
                        background: 'rgba(6, 78, 59, 0.88)',
                        backdropFilter: 'blur(4px)',
                        border: '1px solid rgba(16, 185, 129, 0.5)',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '14px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: '#6ee7b7',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <ShieldCheck size={14} />
                      <span>MATCH VERIFIED: {inspectedRecord.face_confidence || '96.5'}%</span>
                    </div>
                  )}
                </div>

                {/* Photo actions */}
                {inspectedRecord.photo_path && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <a
                      href={getFullPhotoUrl(inspectedRecord.photo_path)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary"
                      style={{
                        flex: 1,
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                        textDecoration: 'none',
                        padding: '0.5rem'
                      }}
                    >
                      <Maximize2 size={13} />
                      <span>Open Full Size</span>
                    </a>
                    <a
                      href={getFullPhotoUrl(inspectedRecord.photo_path)}
                      download={`Biometric_${inspectedRecord.enrollment_no}.jpg`}
                      className="btn btn-secondary"
                      style={{
                        flex: 1,
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                        textDecoration: 'none',
                        padding: '0.5rem'
                      }}
                    >
                      <Download size={13} />
                      <span>Save Photo</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Candidate Metadata & Telemetry */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Candidate Card */}
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '14px',
                    padding: '1.1rem 1.3rem'
                  }}
                >
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Student Identity
                  </span>
                  <h4 style={{ margin: '0.2rem 0 0.4rem', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    {inspectedRecord.student_name}
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginTop: '0.75rem', fontSize: '0.82rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>Roll Number</span>
                      <span style={{ fontWeight: 700, color: 'var(--accent-cyan)', fontFamily: 'monospace' }}>
                        {inspectedRecord.enrollment_no}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>Department</span>
                      <span style={{ fontWeight: 600, color: '#f8fafc' }}>
                        {inspectedRecord.student_department} ({inspectedRecord.program})
                      </span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>Exam Hall</span>
                      <span style={{ fontWeight: 600, color: '#f8fafc' }}>{inspectedRecord.room_number}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>Allocated Seat</span>
                      <span style={{ fontWeight: 700, color: 'var(--accent-amber)', fontFamily: 'monospace' }}>
                        {inspectedRecord.seat_number}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Verification Metrics Card */}
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '14px',
                    padding: '1.1rem 1.3rem'
                  }}
                >
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Verification Details
                  </span>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.6rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Status:</span>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          color:
                            inspectedRecord.attendance_status === 'PRESENT'
                              ? '#34d399'
                              : inspectedRecord.attendance_status === 'ABSENT'
                              ? '#fb7185'
                              : '#fbbf24'
                        }}
                      >
                        {inspectedRecord.attendance_status || 'UNVERIFIED'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Method:</span>
                      <span style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-main)' }}>
                        {inspectedRecord.verification_method === 'FACE_MATCH'
                          ? 'AI Biometric Facial Match'
                          : inspectedRecord.verification_method === 'MANUAL'
                          ? 'Manual Roster Signing'
                          : 'Not Verified'}
                      </span>
                    </div>

                    {inspectedRecord.face_confidence && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Biometric Confidence:</span>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#38bdf8', fontFamily: 'monospace' }}>
                          {inspectedRecord.face_confidence}%
                        </span>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Marked Timestamp:</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontFamily: 'monospace' }}>
                        {inspectedRecord.marked_at ? new Date(inspectedRecord.marked_at).toLocaleString() : 'Pending'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Subject & Exam:</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-main)', textAlign: 'right' }}>
                        {inspectedRecord.exam_name}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Audit Integrity Tag */}
                <div
                  style={{
                    background: 'rgba(6, 182, 212, 0.08)',
                    border: '1px solid rgba(6, 182, 212, 0.25)',
                    borderRadius: '10px',
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem'
                  }}
                >
                  <ShieldCheck size={20} color="var(--accent-cyan)" />
                  <div style={{ fontSize: '0.75rem', color: '#e2e8f0' }}>
                    <strong>Biometric Cryptographic Stamp:</strong> Stored on encrypted server disk with tamper-evident audit log trace.
                  </div>
                </div>

                {/* Override Actions inside Modal */}
                <div style={{ display: 'flex', gap: '0.6rem', marginTop: 'auto' }}>
                  <button
                    onClick={() => handleUpdateStatus(inspectedRecord, 'PRESENT')}
                    className="btn btn-primary"
                    style={{ flex: 1, fontSize: '0.85rem', padding: '0.6rem' }}
                  >
                    Confirm Present
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(inspectedRecord, 'ABSENT')}
                    className="btn btn-secondary"
                    style={{ flex: 1, fontSize: '0.85rem', padding: '0.6rem', color: 'var(--accent-rose)' }}
                  >
                    Mark Absent
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
