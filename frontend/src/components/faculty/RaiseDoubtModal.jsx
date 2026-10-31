import React, { useState, useEffect } from 'react';
import { 
  X, HelpCircle, Send, AlertTriangle, CheckCircle2, 
  Mail, Clock, User, Building, BookOpen, ShieldAlert 
} from 'lucide-react';
import { api } from '../../api';

export default function RaiseDoubtModal({
  isOpen,
  onClose,
  onSuccess,
  currentExam = null,
  currentRoom = null,
  invigilatorUser = null,
  initialStudent = null
}) {
  const [exams, setExams] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [students, setStudents] = useState([]);

  const [formData, setFormData] = useState({
    examId: '',
    roomId: '',
    studentId: '',
    studentRoll: '',
    studentName: '',
    facultyId: '',
    urgency: 'HIGH',
    questionText: ''
  });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Load master data when modal opens
  useEffect(() => {
    if (!isOpen) return;

    setError(null);
    const loadPrerequisites = async () => {
      setLoading(true);
      try {
        const [eRes, rRes, fRes, sRes] = await Promise.all([
          api.getExams().catch(() => ({ data: [] })),
          api.getEntities('rooms').catch(() => ({ data: [] })),
          api.getEntities('faculty').catch(() => ({ data: [] })),
          api.getEntities('students').catch(() => ({ data: [] }))
        ]);

        const examData = eRes.data || [];
        const roomData = rRes.data || [];
        const facData = fRes.data || [];
        const studData = sRes.data || [];

        setExams(examData);
        setRooms(roomData);
        setFacultyList(facData);
        setStudents(studData);

        // Pre-select defaults
        const defaultExamId = currentExam?.id || currentExam?.exam_id || (examData[0] ? examData[0].id : '');
        const defaultRoomId = currentRoom?.id || currentRoom?.room_id || (roomData[0] ? roomData[0].id : '');
        const selectedExam = examData.find(e => String(e.id) === String(defaultExamId));
        const defaultFacultyId = selectedExam?.course_coordinator_id || (facData[0] ? facData[0].id : '');
        const defaultStudent = initialStudent || studData[0] || null;

        setFormData({
          examId: defaultExamId,
          roomId: defaultRoomId,
          studentId: defaultStudent ? (defaultStudent.id || defaultStudent.student_id) : '',
          studentRoll: defaultStudent ? (defaultStudent.enrollment_no || defaultStudent.student_roll) : '',
          studentName: defaultStudent ? (defaultStudent.name || defaultStudent.student_name) : '',
          facultyId: defaultFacultyId,
          urgency: 'HIGH',
          questionText: ''
        });
      } catch (err) {
        setError('Failed to load exam master data for doubt routing.');
      } finally {
        setLoading(false);
      }
    };

    loadPrerequisites();
  }, [isOpen, currentExam, currentRoom, initialStudent]);

  // When student selection changes
  const handleStudentSelect = (studentId) => {
    const st = students.find(s => String(s.id) === String(studentId));
    setFormData(prev => ({
      ...prev,
      studentId,
      studentRoll: st ? st.enrollment_no : prev.studentRoll,
      studentName: st ? st.name : prev.studentName
    }));
  };

  // When exam selection changes, auto-route to designated course instructor
  const handleExamChange = (newExamId) => {
    const selected = exams.find(e => String(e.id) === String(newExamId));
    setFormData(prev => ({
      ...prev,
      examId: newExamId,
      facultyId: selected?.course_coordinator_id || prev.facultyId
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.examId || !formData.roomId || !formData.facultyId || !formData.questionText.trim()) {
      setError('Please fill in all required fields (Exam, Room, Faculty, and Doubt Text).');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        examId: Number(formData.examId),
        roomId: Number(formData.roomId),
        studentId: formData.studentId ? Number(formData.studentId) : null,
        studentRoll: formData.studentRoll ? formData.studentRoll.trim() : null,
        facultyId: Number(formData.facultyId),
        questionText: formData.questionText.trim(),
        urgency: formData.urgency,
        invigilatorId: invigilatorUser?.faculty_id || null,
        invigilatorName: invigilatorUser?.name || 'Room Invigilator'
      };

      const res = await api.createDoubtRequest(payload);
      onSuccess?.(res);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit student doubt request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div 
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '650px',
          background: 'linear-gradient(145deg, #182234 0%, #0f172a 100%)',
          border: '1px solid rgba(6, 182, 212, 0.35)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 35px rgba(6, 182, 212, 0.15)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(6, 182, 212, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(6, 182, 212, 0.3)'
            }}>
              <HelpCircle size={22} color="#06b6d4" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
                  Forward Student Doubt to Faculty
                </h3>
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  padding: '0.15rem 0.45rem',
                  borderRadius: '6px',
                  background: 'rgba(6, 182, 212, 0.2)',
                  color: '#38bdf8',
                  border: '1px solid rgba(6, 182, 212, 0.3)'
                }}>
                  Live Exam Hall
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                Routes question to subject faculty & immediately triggers automated email notification
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="btn btn-secondary" 
            style={{ padding: '0.4rem', borderRadius: '8px', border: 'none', background: 'transparent' }}
          >
            <X size={18} color="var(--text-muted)" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          {error && (
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#f43f5e',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Email Notification Banner Info */}
          <div style={{
            background: 'rgba(6, 182, 212, 0.08)',
            border: '1px solid rgba(6, 182, 212, 0.25)',
            borderRadius: '10px',
            padding: '0.85rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <Mail size={20} color="#38bdf8" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
              <strong style={{ color: '#38bdf8' }}>Automated Email Dispatch:</strong> When submitted, an official high-priority email alert will be immediately sent to the selected subject faculty's institutional email address.
            </div>
          </div>

          {/* Row 1: Exam & Room */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.4rem' }}>
                Active Examination *
              </label>
              <select
                className="input-field"
                value={formData.examId}
                onChange={(e) => handleExamChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.85rem'
                }}
              >
                {exams.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.exam_name} ({e.course_code || 'Exam'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.4rem' }}>
                Examination Hall / Room *
              </label>
              <select
                className="input-field"
                value={formData.roomId}
                onChange={(e) => setFormData(prev => ({ ...prev, roomId: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.85rem'
                }}
              >
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>
                    Room {r.room_number} ({r.building || 'Campus'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Student & Urgency */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.4rem' }}>
                Student Raising Doubt *
              </label>
              <select
                className="input-field"
                value={formData.studentId}
                onChange={(e) => handleStudentSelect(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.85rem'
                }}
              >
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.enrollment_no} - {s.department})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.4rem' }}>
                Priority / Urgency *
              </label>
              <select
                className="input-field"
                value={formData.urgency}
                onChange={(e) => setFormData(prev => ({ ...prev, urgency: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.85rem'
                }}
              >
                <option value="CRITICAL">🔴 CRITICAL (Blocking Paper)</option>
                <option value="HIGH">🟡 HIGH (Question Ambiguity)</option>
                <option value="NORMAL">🟢 NORMAL (Clarification)</option>
              </select>
            </div>
          </div>

          {/* Row 3: Target Subject Faculty */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.4rem' }}>
              Subject Faculty Recipient (Will receive email notification) *
            </label>
            <select
              className="input-field"
              value={formData.facultyId}
              onChange={(e) => setFormData(prev => ({ ...prev, facultyId: e.target.value }))}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.85rem'
              }}
            >
              {facultyList.map(f => {
                const currentExamObj = exams.find(e => String(e.id) === String(formData.examId));
                const isInstructor = currentExamObj && (Number(currentExamObj.course_coordinator_id) === Number(f.id));
                return (
                  <option key={f.id} value={f.id}>
                    {f.name} — {f.email} ({f.department}) {isInstructor ? '⭐ (Designated Course Instructor)' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Row 4: Question / Doubt Text */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.4rem' }}>
              Student's Question / Paper Doubt Description *
            </label>
            <textarea
              className="input-field"
              rows={4}
              value={formData.questionText}
              onChange={(e) => setFormData(prev => ({ ...prev, questionText: e.target.value }))}
              placeholder="e.g. Question 3(b): Missing thermal conductivity value k for steel plate. Clarify if k = 45 W/mK should be assumed..."
              style={{
                width: '100%',
                padding: '0.75rem 0.85rem',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.85rem',
                lineHeight: 1.5,
                resize: 'vertical'
              }}
            />
          </div>

          {/* Forwarding Invigilator Signature */}
          <div style={{
            fontSize: '0.74rem',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}>
            <User size={13} color="#06b6d4" />
            <span>Forwarding Invigilator: <strong>{invigilatorUser?.name || 'Exam Hall Invigilator'}</strong></span>
          </div>

          {/* Footer Actions */}
          <div style={{
            paddingTop: '0.5rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '0.75rem'
          }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
              style={{ fontSize: '0.85rem', padding: '0.55rem 1rem' }}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || !formData.questionText.trim()}
              style={{
                fontSize: '0.85rem',
                padding: '0.55rem 1.25rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)'
              }}
            >
              {submitting ? (
                <>
                  <div className="spinner" style={{ width: '14px', height: '14px' }}></div>
                  <span>Routing & Dispatching Email...</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>Send Doubt & Dispatch Email</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
