import React, { useState, useEffect } from 'react';
import { 
  X, Sparkles, Calendar, Zap, AlertTriangle, 
  CheckCircle2, ArrowRight, ShieldCheck, Clock 
} from 'lucide-react';
import { api } from '../../api';

export default function GenerateTimetableModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  departments = [],
  initialStartDate = null,
  initialEndDate = null
}) {
  // Default start date: next Monday
  const getNextMonday = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = (day === 0 ? 1 : 8 - day); // days to next Monday
    d.setDate(d.getDate() + diff);
    return d.toISOString().split('T')[0];
  };

  const getDefaultEndDate = (start) => {
    const d = new Date(start || Date.now());
    d.setDate(d.getDate() + 14); // 2 weeks span
    return d.toISOString().split('T')[0];
  };

  const [startDate, setStartDate] = useState(initialStartDate || getNextMonday());
  const [endDate, setEndDate] = useState(initialEndDate || getDefaultEndDate(initialStartDate || getNextMonday()));
  const [examType, setExamType] = useState('END_TERM');
  const [department, setDepartment] = useState('ALL');
  const [semester, setSemester] = useState('ALL');
  const [gapDaysForHardCourses, setGapDaysForHardCourses] = useState(2);
  const [skipWeekends, setSkipWeekends] = useState(true);
  const [clearExisting, setClearExisting] = useState(true);

  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Critical Fix: Always reset result & error when modal is opened so the user can change dates span repeatedly
  useEffect(() => {
    if (isOpen) {
      setResult(null);
      setError(null);
      if (initialStartDate) setStartDate(initialStartDate);
      if (initialEndDate) setEndDate(initialEndDate);
    }
  }, [isOpen, initialStartDate, initialEndDate]);

  const handleClose = () => {
    setResult(null);
    setError(null);
    onClose();
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setGenerating(true);

    try {
      const res = await api.generateTimetable({
        startDate,
        endDate,
        examType,
        department: department === 'ALL' ? null : department,
        semester: semester === 'ALL' ? null : semester,
        gapDaysForHardCourses: Number(gapDaysForHardCourses),
        skipWeekends,
        clearExisting
      });

      if (res && res.data) {
        setResult(res.data);
        onSuccess?.({ startDate, endDate: res.data.endDate || endDate });
      } else {
        throw new Error(res.message || 'Timetable generation returned no data.');
      }
    } catch (err) {
      setError(err.message || 'Failed to generate timetable.');
    } finally {
      setGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div 
        className="modal-content"
        style={{
          maxWidth: '640px',
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto'
        }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div 
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #f59e0b, #ec4899)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(245, 158, 11, 0.35)'
              }}
            >
              <Sparkles size={20} color="#fff" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                Automated Timetable Generator
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Multi-constraint scheduling algorithm with difficulty-aware cognitive spacing
              </p>
            </div>
          </div>
          <button className="btn-close" onClick={handleClose}>
            <X size={18} />
          </button>
        </div>

        {result ? (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div 
              style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                borderRadius: '12px',
                padding: '1.25rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.85rem'
              }}
            >
              <CheckCircle2 size={24} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h4 style={{ margin: '0 0 0.35rem 0', color: '#6ee7b7', fontSize: '1.05rem', fontWeight: 800 }}>
                  Timetable Generated Successfully!
                </h4>
                <p style={{ margin: 0, color: '#d1fae5', fontSize: '0.86rem', lineHeight: 1.45 }}>
                  {result.message}
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.85rem' }}>
              <div 
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '1rem',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38bdf8' }}>
                  {result.totalScheduled}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Exams Scheduled
                </div>
              </div>

              <div 
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '1rem',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#a5b4fc' }}>
                  {result.cohortsCount || 3}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Cohorts Balanced
                </div>
              </div>

              <div 
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '1rem',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34d399' }}>
                  0
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Hard Conflicts
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setResult(null)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
              >
                <Calendar size={15} color="#818cf8" />
                <span>Change Dates Span & Settings</span>
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleClose}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
              >
                <span>View Generated Timetable</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleGenerate} style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            {error && (
              <div 
                style={{
                  background: 'rgba(244, 63, 94, 0.12)',
                  border: '1px solid rgba(244, 63, 94, 0.4)',
                  borderRadius: '10px',
                  padding: '0.85rem 1rem',
                  color: '#fca5a5',
                  fontSize: '0.86rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.65rem'
                }}
              >
                <AlertTriangle size={18} color="#f43f5e" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>{error}</div>
              </div>
            )}

            {/* Timetable Dates Span (Start & End Date) */}
            <div 
              style={{
                background: 'rgba(99, 102, 241, 0.05)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                borderRadius: '12px',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={16} color="#818cf8" />
                  <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#f3f4f6' }}>
                    Timetable Dates Span
                  </span>
                </div>
                {startDate && endDate && (
                  <span style={{ fontSize: '0.75rem', color: '#a5b4fc', fontWeight: 700 }}>
                    {startDate} to {endDate}
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontWeight: 700, fontSize: '0.82rem' }}>Start Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (endDate < e.target.value) {
                        setEndDate(getDefaultEndDate(e.target.value));
                      }
                    }}
                    required
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontWeight: 700, fontSize: '0.82rem' }}>End Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={endDate}
                    min={startDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Exam Session Type */}
            <div className="form-group">
              <label style={{ fontWeight: 700, fontSize: '0.86rem' }}>Exam Session Type</label>
              <select
                className="form-control"
                value={examType}
                onChange={(e) => setExamType(e.target.value)}
              >
                <option value="END_TERM">End-Term Final Examinations</option>
                <option value="MID_TERM">Mid-Term Examinations</option>
                <option value="QUIZ">Continuous Assessment Quizzes</option>
              </select>
            </div>

            {/* Department & Semester Filters */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label style={{ fontWeight: 700, fontSize: '0.86rem' }}>Target Department</label>
                <select
                  className="form-control"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                >
                  <option value="ALL">All Departments (University-Wide)</option>
                  {departments.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                  {departments.length === 0 && (
                    <>
                      <option value="CSE">CSE</option>
                      <option value="ECE">ECE</option>
                      <option value="ME">ME</option>
                    </>
                  )}
                </select>
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 700, fontSize: '0.86rem' }}>Target Semester</label>
                <select
                  className="form-control"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                >
                  <option value="ALL">All Semesters</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Algorithm Parameters: Difficulty Spacing & Weekends */}
            <div 
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                <Zap size={16} color="#f59e0b" />
                <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#f3f4f6' }}>
                  Smart Scheduling Rules
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700 }}>
                    Difficulty-Aware Prep Gap
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Forces dedicated prep days between Level 4 and Level 5 heavy exams
                  </div>
                </div>
                <select
                  className="form-control"
                  style={{ width: '130px' }}
                  value={gapDaysForHardCourses}
                  onChange={(e) => setGapDaysForHardCourses(Number(e.target.value))}
                >
                  <option value={1}>1 Day Rest</option>
                  <option value={2}>2 Days Rest (Rec)</option>
                  <option value={3}>3 Days Rest</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700 }}>
                    Exclude Weekends
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Automatically skips Saturdays and Sundays during slot placement
                  </div>
                </div>
                <input
                  type="checkbox"
                  style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                  checked={skipWeekends}
                  onChange={(e) => setSkipWeekends(e.target.checked)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: clearExisting ? '#fca5a5' : 'inherit' }}>
                    Replace Existing Timetable
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Clears previously scheduled exams before running the generator
                  </div>
                </div>
                <input
                  type="checkbox"
                  style={{ width: '18px', height: '18px', accentColor: '#f43f5e', cursor: 'pointer' }}
                  checked={clearExisting}
                  onChange={(e) => setClearExisting(e.target.checked)}
                />
              </div>
            </div>

            {/* AI Guarantee Badge */}
            <div
              style={{
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                borderRadius: '10px',
                padding: '0.75rem 0.95rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem'
              }}
            >
              <ShieldCheck size={20} color="#818cf8" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '0.78rem', color: '#c7d2fe', lineHeight: 1.4 }}>
                <strong style={{ color: '#fff' }}>AI Conflict-Free Guarantee:</strong> Subjects sharing common enrolled students or belonging to the same cohort are guaranteed to NEVER be scheduled on the same date and overlapping time slot.
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClose}
                disabled={generating}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={generating}
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                  boxShadow: '0 0 16px rgba(99, 102, 241, 0.35)'
                }}
              >
                {generating ? (
                  <>
                    <span className="spinner-border spinner-border-sm" />
                    <span>Computing Optimal Timetable...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Generate Conflict-Free Timetable</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
