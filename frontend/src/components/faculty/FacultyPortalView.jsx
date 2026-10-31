import React, { useState, useEffect } from 'react';
import { 
  Users, Calendar, Clock, AlertTriangle, CheckCircle2, 
  HelpCircle, Send, Mail, Search, RefreshCw, Filter, 
  MessageSquare, Navigation, Check, ChevronRight, Eye, 
  Building, BookOpen, User, ShieldAlert, ArrowRight, 
  Plus, CheckSquare, XCircle, FileText, Sparkles, ExternalLink 
} from 'lucide-react';
import { api } from '../../api';
import ResolveDoubtModal from './ResolveDoubtModal';
import EmailNotificationModal from './EmailNotificationModal';
import RaiseDoubtModal from './RaiseDoubtModal';

export default function FacultyPortalView({ user }) {
  // Navigation tabs: 'duties' | 'doubts' | 'schedule' | 'emails'
  // Default to 'duties' so teacher immediately sees their assigned invigilation duties
  const [activeTab, setActiveTab] = useState('duties');

  // Master State for currently logged-in faculty
  const [metrics, setMetrics] = useState({
    totalDuties: 0,
    confirmedDuties: 0,
    totalExams: 0,
    totalDoubts: 0,
    pendingDoubts: 0,
    visitedDoubts: 0,
    resolvedDoubts: 0,
    emailsDispatched: 0
  });

  const [doubts, setDoubts] = useState([]);
  const [duties, setDuties] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters within the faculty's personal records
  const [doubtStatusFilter, setDoubtStatusFilter] = useState('ALL');
  const [doubtSearch, setDoubtSearch] = useState('');
  const [dutyStatusFilter, setDutyStatusFilter] = useState('ALL');
  const [scheduleDeptFilter, setScheduleDeptFilter] = useState('ALL');
  const [scheduleSearch, setScheduleSearch] = useState('');

  // Modals
  const [selectedDutyForDoubt, setSelectedDutyForDoubt] = useState(null);
  const [isRaiseDoubtModalOpen, setIsRaiseDoubtModalOpen] = useState(false);
  const [selectedDoubtForResolve, setSelectedDoubtForResolve] = useState(null);
  const [selectedDoubtForEmail, setSelectedDoubtForEmail] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [actionNotification, setActionNotification] = useState(null);

  const showNotification = (msg, isErr = false) => {
    setActionNotification({ text: msg, isErr });
    setTimeout(() => setActionNotification(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const currentEmail = user?.email || null;

      const [metricsRes, doubtsRes, dutiesRes, schedRes, notifsRes] = await Promise.all([
        api.getFacultyMetrics({ email: currentEmail }).catch(() => ({ data: {} })),
        api.getDoubtRequests({ email: currentEmail }).catch(() => ({ data: [] })),
        api.getFacultyDuties({ email: currentEmail }).catch(() => ({ data: [] })),
        api.getFacultySchedule({ email: currentEmail }).catch(() => ({ data: [] })),
        api.getFacultyNotifications({ email: currentEmail }).catch(() => ({ data: [] }))
      ]);

      if (metricsRes?.data) setMetrics(metricsRes.data);
      if (doubtsRes?.data) setDoubts(doubtsRes.data);
      if (dutiesRes?.data) setDuties(dutiesRes.data);
      if (schedRes?.data) setSchedules(schedRes.data);
      if (notifsRes?.data) setNotifications(notifsRes.data);
    } catch (err) {
      console.warn('Faculty portal load notice:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Auto-refresh doubt stream every 30 seconds
    const interval = setInterval(() => {
      loadData();
    }, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Handle duty confirmation
  const handleConfirmDuty = async (dutyId) => {
    try {
      const res = await api.updateFacultyDutyStatus(dutyId, { status: 'CONFIRMED' });
      showNotification(res.message || 'Invigilation duty confirmed successfully!');
      loadData();
    } catch (err) {
      showNotification(err.message || 'Failed to confirm duty.', true);
    }
  };

  // Filtered Doubts for this faculty
  const filteredDoubts = doubts.filter(d => {
    if (doubtStatusFilter !== 'ALL' && d.status !== doubtStatusFilter) return false;
    if (doubtSearch.trim()) {
      const q = doubtSearch.toLowerCase();
      const matchQ = (d.question_text || '').toLowerCase().includes(q);
      const matchStud = (d.student_name || '').toLowerCase().includes(q);
      const matchRoll = (d.student_roll || '').toLowerCase().includes(q);
      const matchCourse = (d.course_code || '').toLowerCase().includes(q);
      const matchRoom = (d.room_number || '').toLowerCase().includes(q);
      if (!matchQ && !matchStud && !matchRoll && !matchCourse && !matchRoom) return false;
    }
    return true;
  });

  // Filtered Duties for this faculty
  const filteredDuties = duties.filter(d => {
    if (dutyStatusFilter !== 'ALL' && d.duty_status !== dutyStatusFilter) return false;
    return true;
  });

  // Filtered Schedule
  const departments = Array.from(new Set(schedules.map(s => s.course_department))).filter(Boolean);
  const filteredSchedules = schedules.filter(s => {
    if (scheduleDeptFilter !== 'ALL' && s.course_department !== scheduleDeptFilter) return false;
    if (scheduleSearch.trim()) {
      const q = scheduleSearch.toLowerCase();
      const matchName = (s.exam_name || '').toLowerCase().includes(q);
      const matchCode = (s.course_code || '').toLowerCase().includes(q);
      if (!matchName && !matchCode) return false;
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* Action Notification Banner */}
      {actionNotification && (
        <div style={{
          background: actionNotification.isErr ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)',
          border: `1px solid ${actionNotification.isErr ? '#f43f5e' : '#10b981'}`,
          borderRadius: '10px',
          padding: '0.85rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          color: actionNotification.isErr ? '#f43f5e' : '#10b981',
          fontSize: '0.85rem'
        }}>
          {actionNotification.isErr ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          <span>{actionNotification.text}</span>
        </div>
      )}

      {/* Top Banner & Header: Displaying Logged-in Faculty Identity ONLY */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(59, 130, 246, 0.08) 100%)',
        border: '1px solid rgba(6, 182, 212, 0.25)',
        borderRadius: '16px',
        padding: '1.5rem 1.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)'
          }}>
            <User size={28} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800, color: '#f8fafc' }}>
                {user?.name || 'Faculty Member'}
              </h2>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                padding: '0.2rem 0.55rem',
                borderRadius: '6px',
                background: 'rgba(6, 182, 212, 0.2)',
                color: '#38bdf8',
                border: '1px solid rgba(6, 182, 212, 0.3)'
              }}>
                {user?.department || 'CSE'} Department
              </span>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '0.2rem 0.55rem',
                borderRadius: '6px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}>
                Invigilator Duty Active
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              Logged in as <strong style={{ color: '#38bdf8' }}>{user?.email}</strong> &bull; Viewing your assigned invigilation duties & live exam queries
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={loadData}
            disabled={loading}
            style={{ fontSize: '0.82rem', padding: '0.55rem 0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
          >
            <RefreshCw size={14} className={loading ? 'spinning' : ''} />
            <span>Sync Live</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Metrics Cards for Logged-In Faculty */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        {/* Card 1: My Assigned Duties */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          padding: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              My Assigned Duties
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#f8fafc', margin: '0.2rem 0' }}>
              {duties.length || metrics.totalDuties || 0}
              <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#10b981', marginLeft: '0.4rem' }}>
                ({duties.filter(d => d.duty_status === 'CONFIRMED').length} Confirmed)
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Examination hall supervision duties allocated to you
            </div>
          </div>
          <div style={{
            width: '44px', height: '44px', borderRadius: '10px',
            background: 'rgba(6, 182, 212, 0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Users size={22} color="#06b6d4" />
          </div>
        </div>

        {/* Card 2: Scheduled Exams */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          padding: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Departmental Examinations
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#f8fafc', margin: '0.2rem 0' }}>
              {schedules.length || metrics.totalExams || 0}
              <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#38bdf8', marginLeft: '0.4rem' }}>
                Sessions
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Active examination timetable
            </div>
          </div>
          <div style={{
            width: '44px', height: '44px', borderRadius: '10px',
            background: 'rgba(59, 130, 246, 0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Calendar size={22} color="#3b82f6" />
          </div>
        </div>

        {/* Card 3: Live Student Doubts */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          padding: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Live Student Doubts
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#f8fafc', margin: '0.2rem 0' }}>
              {doubts.filter(d => d.status === 'PENDING').length}
              <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#f59e0b', marginLeft: '0.4rem' }}>
                Pending Action
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {doubts.filter(d => d.status === 'RESOLVED').length} resolved &bull; {doubts.filter(d => d.status === 'VISITED').length} visited
            </div>
          </div>
          <div style={{
            width: '44px', height: '44px', borderRadius: '10px',
            background: 'rgba(245, 158, 11, 0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <HelpCircle size={22} color="#f59e0b" />
          </div>
        </div>

        {/* Card 4: Email Alerts Dispatched */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          padding: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Email Notifications
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#f8fafc', margin: '0.2rem 0' }}>
              {notifications.length || metrics.emailsDispatched || 0}
              <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#10b981', marginLeft: '0.4rem' }}>
                Delivered
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Automated SMTP duty and doubt dispatches
            </div>
          </div>
          <div style={{
            width: '44px', height: '44px', borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Mail size={22} color="#10b981" />
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="nav-tabs" style={{ marginBottom: '0.5rem' }}>
        <button
          className={`tab-btn ${activeTab === 'duties' ? 'active' : ''}`}
          onClick={() => setActiveTab('duties')}
        >
          <Users size={16} />
          <span>My Assigned Duties ({filteredDuties.length})</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'doubts' ? 'active' : ''}`}
          onClick={() => setActiveTab('doubts')}
        >
          <HelpCircle size={16} />
          <span>Live Doubts Stream ({filteredDoubts.length})</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          <Calendar size={16} />
          <span>Exam Schedule ({filteredSchedules.length})</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'emails' ? 'active' : ''}`}
          onClick={() => setActiveTab('emails')}
        >
          <Mail size={16} />
          <span>Email Logs ({notifications.length})</span>
        </button>
      </div>

      {/* TAB 1: Assigned Invigilation Duties (Default) */}
      {activeTab === 'duties' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Duties Controls */}
          <div style={{
            background: 'var(--bg-card, #0f172a)',
            border: '1px solid var(--border-color, #1e293b)',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>
                Your Assigned Invigilation Duties:
              </span>
              <span style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#38bdf8',
                background: 'rgba(56, 189, 248, 0.15)',
                padding: '0.2rem 0.6rem',
                borderRadius: '6px'
              }}>
                {user?.name || user?.email}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Status:</span>
              {['ALL', 'ASSIGNED', 'CONFIRMED'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setDutyStatusFilter(st)}
                  style={{
                    padding: '0.3rem 0.65rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                    background: dutyStatusFilter === st ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                    color: dutyStatusFilter === st ? '#38bdf8' : 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Duties Table */}
          {filteredDuties.length === 0 ? (
            <div style={{
              background: 'var(--bg-card, #0f172a)',
              border: '1px dashed var(--border-subtle)',
              borderRadius: '12px',
              padding: '3rem 2rem',
              textAlign: 'center',
              color: 'var(--text-muted)'
            }}>
              <Users size={36} color="#38bdf8" style={{ margin: '0 auto 0.75rem' }} />
              <h4 style={{ margin: '0 0 0.25rem', color: '#f8fafc', fontSize: '1.05rem' }}>
                No Duties Currently Assigned
              </h4>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>
                You do not have any invigilation duties scheduled at this time.
              </p>
            </div>
          ) : (
            <div style={{
              background: 'var(--bg-card, #0f172a)',
              border: '1px solid var(--border-color, #1e293b)',
              borderRadius: '12px',
              overflow: 'hidden'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border-color, #1e293b)', color: '#94a3b8' }}>
                    <th style={{ padding: '0.85rem 1rem' }}>Required Room to Report</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Examination</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Date & Time Slot</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Duty Status</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDuties.map((duty) => {
                    const isConfirmed = duty.duty_status === 'CONFIRMED';
                    return (
                      <tr 
                        key={duty.duty_id}
                        style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', transition: 'background 0.15s ease' }}
                      >
                        <td style={{ padding: '1rem' }}>
                          <span style={{
                            padding: '0.35rem 0.75rem',
                            borderRadius: '8px',
                            background: 'rgba(239, 68, 68, 0.18)',
                            border: '2px solid #ef4444',
                            color: '#fca5a5',
                            fontWeight: 900,
                            fontSize: '0.95rem',
                            display: 'inline-block',
                            letterSpacing: '0.5px'
                          }}>
                            Room {duty.room_number}
                          </span>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                            {duty.building} ({duty.room_capacity} Seats capacity)
                          </div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.92rem' }}>{duty.exam_name}</div>
                          <div style={{ fontSize: '0.78rem', color: '#38bdf8' }}>{duty.course_code} - {duty.course_name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{duty.course_department} &bull; Semester {duty.course_semester}</div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontWeight: 700, color: '#cbd5e1' }}>{duty.exam_date}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {duty.start_time?.slice(0, 5)} - {duty.end_time?.slice(0, 5)} ({duty.duration_minutes} min)
                          </div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            padding: '0.2rem 0.55rem',
                            borderRadius: '6px',
                            background: isConfirmed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                            color: isConfirmed ? '#34d399' : '#38bdf8',
                            border: `1px solid ${isConfirmed ? 'rgba(16, 185, 129, 0.4)' : 'rgba(56, 189, 248, 0.4)'}`
                          }}>
                            {duty.duty_status}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', justifyContent: 'flex-end' }}>
                            {!isConfirmed ? (
                              <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => handleConfirmDuty(duty.duty_id)}
                                style={{
                                  fontSize: '0.78rem',
                                  padding: '0.4rem 0.85rem',
                                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                }}
                              >
                                <Check size={14} style={{ marginRight: '0.3rem' }} />
                                Confirm Duty
                              </button>
                            ) : (
                              <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                <CheckCircle2 size={16} /> Confirmed
                              </span>
                            )}

                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => {
                                setSelectedDutyForDoubt(duty);
                                setIsRaiseDoubtModalOpen(true);
                              }}
                              style={{
                                fontSize: '0.78rem',
                                padding: '0.4rem 0.75rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                background: 'rgba(245, 158, 11, 0.12)',
                                border: '1px solid rgba(245, 158, 11, 0.4)',
                                color: '#fbbf24'
                              }}
                              title={`Request faculty doubt support for ${duty.exam_name} in Room ${duty.room_number}`}
                            >
                              <HelpCircle size={14} />
                              <span>Request Doubt Support</span>
                            </button>
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
      )}

      {/* TAB 2: Live Doubts Stream */}
      {activeTab === 'doubts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Controls Bar */}
          <div style={{
            background: 'var(--bg-card, #0f172a)',
            border: '1px solid var(--border-color, #1e293b)',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '260px' }}>
              <Search size={16} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search doubt text, student roll, room, or course code..."
                value={doubtSearch}
                onChange={(e) => setDoubtSearch(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  width: '100%',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Status Filter:</span>
              {['ALL', 'PENDING', 'VISITED', 'RESOLVED'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setDoubtStatusFilter(st)}
                  style={{
                    padding: '0.3rem 0.65rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                    background: doubtStatusFilter === st ? 'rgba(6, 182, 212, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                    color: doubtStatusFilter === st ? '#38bdf8' : 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Doubts Grid / Cards */}
          {filteredDoubts.length === 0 ? (
            <div style={{
              background: 'var(--bg-card, #0f172a)',
              border: '1px dashed var(--border-subtle)',
              borderRadius: '12px',
              padding: '3rem 2rem',
              textAlign: 'center',
              color: 'var(--text-muted)'
            }}>
              <CheckCircle2 size={36} color="#10b981" style={{ margin: '0 auto 0.75rem' }} />
              <h4 style={{ margin: '0 0 0.25rem', color: '#f8fafc', fontSize: '1.05rem' }}>No Active Student Doubts</h4>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>
                All student queries from examination halls for your papers have been addressed.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredDoubts.map((doubt) => {
                const isPending = doubt.status === 'PENDING';
                const isVisited = doubt.status === 'VISITED';
                const isResolved = doubt.status === 'RESOLVED';

                return (
                  <div
                    key={doubt.id}
                    style={{
                      background: 'var(--bg-card, #0f172a)',
                      border: isPending ? '1px solid rgba(239, 68, 68, 0.45)' : '1px solid var(--border-color, #1e293b)',
                      borderRadius: '14px',
                      padding: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem',
                      boxShadow: isPending ? '0 0 20px rgba(239, 68, 68, 0.08)' : 'none'
                    }}
                  >
                    {/* Top Row: Context & Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        {/* Prominent Required Room Number Badge */}
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.35rem 0.75rem',
                          borderRadius: '8px',
                          background: 'rgba(239, 68, 68, 0.18)',
                          border: '2px solid #ef4444',
                          color: '#fca5a5',
                          fontWeight: 800,
                          fontSize: '0.85rem'
                        }}>
                          <Building size={16} color="#ef4444" />
                          <span>REQUIRED TO VISIT: ROOM {doubt.room_number}</span>
                        </div>

                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>
                          {doubt.exam_name}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          ({doubt.course_code})
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px',
                          background: isPending ? 'rgba(239, 68, 68, 0.2)' : isVisited ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                          color: isPending ? '#ef4444' : isVisited ? '#f59e0b' : '#10b981',
                          border: `1px solid ${isPending ? 'rgba(239, 68, 68, 0.4)' : isVisited ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`
                        }}>
                          {doubt.status}
                        </span>

                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px',
                          background: doubt.urgency === 'CRITICAL' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                          color: doubt.urgency === 'CRITICAL' ? '#f87171' : '#38bdf8'
                        }}>
                          {doubt.urgency}
                        </span>
                      </div>
                    </div>

                    {/* Question Content Box */}
                    <div style={{
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      padding: '1rem 1.25rem'
                    }}>
                      <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#94a3b8', fontWeight: 700, marginBottom: '0.35rem' }}>
                        Student Question Query:
                      </div>
                      <p style={{ margin: 0, fontSize: '0.92rem', color: '#e2e8f0', lineHeight: 1.6, fontStyle: 'italic' }}>
                        "{doubt.question_text}"
                      </p>
                    </div>

                    {/* Resolution text if resolved */}
                    {doubt.response_text && (
                      <div style={{
                        background: 'rgba(16, 185, 129, 0.08)',
                        borderLeft: '4px solid #10b981',
                        borderRadius: '6px',
                        padding: '0.75rem 1rem'
                      }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                          Official Clarification Broadcast:
                        </div>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#d1fae5' }}>
                          {doubt.response_text}
                        </p>
                      </div>
                    )}

                    {/* Context Footer: Student, Invigilator, Action Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        <div>
                          <strong style={{ color: '#cbd5e1' }}>Candidate:</strong> {doubt.student_name} ({doubt.student_roll})
                        </div>
                        <div>
                          <strong style={{ color: '#cbd5e1' }}>Invigilator:</strong> {doubt.invigilator_name || 'Room Invigilator'}
                        </div>
                        <div>
                          <strong style={{ color: '#cbd5e1' }}>Target Faculty:</strong> {doubt.faculty_name} ({doubt.faculty_email})
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {/* View Sent Email Format Button */}
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => setSelectedDoubtForEmail(doubt)}
                          style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                          <Mail size={13} />
                          <span>View Email Sent (Room {doubt.room_number})</span>
                        </button>

                        {/* Resolve Actions */}
                        {isPending && (
                          <>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={async () => {
                                try {
                                  const res = await api.resolveDoubtRequest(doubt.id, { actionType: 'VISITED' });
                                  showNotification(res.message || 'Marked as visiting hall in person.');
                                  loadData();
                                } catch (e) {
                                  showNotification(e.message, true);
                                }
                              }}
                              style={{
                                fontSize: '0.75rem', padding: '0.35rem 0.75rem',
                                color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.4)'
                              }}
                            >
                              <span>En Route / Visiting Room {doubt.room_number}</span>
                            </button>

                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={() => setSelectedDoubtForResolve(doubt)}
                              style={{
                                fontSize: '0.75rem', padding: '0.35rem 0.85rem',
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                              }}
                            >
                              <span>Provide Clarification</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Examination Schedule */}
      {activeTab === 'schedule' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{
            background: 'var(--bg-card, #0f172a)',
            border: '1px solid var(--border-color, #1e293b)',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '240px' }}>
              <Search size={16} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search examination name or course code..."
                value={scheduleSearch}
                onChange={(e) => setScheduleSearch(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  width: '100%',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Department:</span>
              <select
                value={scheduleDeptFilter}
                onChange={(e) => setScheduleDeptFilter(e.target.value)}
                style={{
                  background: 'var(--bg-input, #1e293b)',
                  border: '1px solid var(--border-color, #334155)',
                  color: '#fff',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem'
                }}
              >
                <option value="ALL">All Departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {filteredSchedules.map((exam) => (
              <div
                key={exam.exam_id}
                style={{
                  background: 'var(--bg-card, #0f172a)',
                  border: '1px solid var(--border-color, #1e293b)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1rem', color: '#f8fafc', fontWeight: 700 }}>{exam.exam_name}</h4>
                    <span style={{ fontSize: '0.75rem', color: '#38bdf8' }}>{exam.course_code} - {exam.course_name}</span>
                  </div>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    padding: '0.15rem 0.45rem',
                    borderRadius: '4px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: '#38bdf8'
                  }}>
                    {exam.course_department} &bull; Sem {exam.course_semester}
                  </span>
                </div>

                <div style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Calendar size={14} color="#94a3b8" />
                    <span>{exam.exam_date}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Clock size={14} color="#94a3b8" />
                    <span>{exam.start_time?.slice(0, 5)} - {exam.end_time?.slice(0, 5)} ({exam.duration_minutes} min)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Building size={14} color="#94a3b8" />
                    <span>Rooms: {exam.allocated_rooms_list || 'E2-101, E2-102'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Email Notification Logs */}
      {activeTab === 'emails' && (
        <div style={{
          background: 'var(--bg-card, #0f172a)',
          border: '1px solid var(--border-color, #1e293b)',
          borderRadius: '12px',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color, #1e293b)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Mail size={18} color="#10b981" />
              <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.9rem' }}>
                Your Email Transmission & Notification Logs
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Showing last {notifications.length} email records
            </span>
          </div>

          {notifications.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No notification emails logged for your account yet.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--border-color, #1e293b)', color: '#94a3b8' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Recipient</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Subject (Room Focus)</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Dispatched At</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Preview</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((n) => (
                  <tr key={n.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#38bdf8' }}>
                      {n.recipient_email}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#f8fafc' }}>
                      {n.subject}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: '#34d399',
                        border: '1px solid rgba(16, 185, 129, 0.3)'
                      }}>
                        {n.delivery_status || 'SENT'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>
                      {new Date(n.sent_at || n.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setSelectedNotification(n)}
                        style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem' }}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modals */}
      <RaiseDoubtModal
        isOpen={isRaiseDoubtModalOpen}
        onClose={() => {
          setIsRaiseDoubtModalOpen(false);
          setSelectedDutyForDoubt(null);
        }}
        currentExam={selectedDutyForDoubt ? {
          id: selectedDutyForDoubt.exam_id,
          name: selectedDutyForDoubt.exam_name,
          exam_name: selectedDutyForDoubt.exam_name,
          course_id: selectedDutyForDoubt.course_id,
          course_coordinator_id: selectedDutyForDoubt.course_coordinator_id
        } : null}
        currentRoom={selectedDutyForDoubt ? {
          id: selectedDutyForDoubt.room_id,
          room_id: selectedDutyForDoubt.room_id,
          room_number: selectedDutyForDoubt.room_number
        } : null}
        onSuccess={() => {
          showNotification('Doubt support request submitted & email dispatched to subject faculty!');
          loadData();
        }}
      />

      <ResolveDoubtModal
        isOpen={Boolean(selectedDoubtForResolve)}
        onClose={() => setSelectedDoubtForResolve(null)}
        doubt={selectedDoubtForResolve}
        onSuccess={(updated) => {
          showNotification('Doubt resolved and room notified successfully.');
          setSelectedDoubtForResolve(null);
          loadData();
        }}
        facultyUser={user}
      />

      <EmailNotificationModal
        isOpen={Boolean(selectedDoubtForEmail || selectedNotification)}
        onClose={() => {
          setSelectedDoubtForEmail(null);
          setSelectedNotification(null);
        }}
        doubt={selectedDoubtForEmail}
        notification={selectedNotification}
      />
    </div>
  );
}
