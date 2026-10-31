import React, { useState, useEffect } from 'react';
import { 
  X, HelpCircle, Send, AlertTriangle, CheckCircle2, 
  Mail, Clock, User, Building, BookOpen, ShieldAlert, Edit3
} from 'lucide-react';
import emailjs from '@emailjs/browser';
import { EMAILJS_CONFIG } from '../../config/emailjsConfig';
import { emailService } from '../../services/emailService';
import { api } from '../../api';

export default function RaiseDoubtModal({
  isOpen,
  onClose,
  onSuccess,
  currentExam = null,
  currentRoom = null,
  invigilatorUser = null,
  initialStudent = null,
  classroomStudents = []
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
    recipientEmail: '',
    urgency: 'HIGH',
    questionText: ''
  });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const currentExamId = currentExam?.id || currentExam?.exam_id;
  const currentRoomId = currentRoom?.id || currentRoom?.room_id;
  const initialStudentId = initialStudent?.id || initialStudent?.student_id;

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

        // Ensure currentRoom is in rooms list
        let finalRooms = [...roomData];
        const cRoomId = currentRoomId;
        if (cRoomId) {
          const exists = finalRooms.some(r => String(r.id) === String(cRoomId));
          if (!exists) {
            finalRooms.unshift({
              id: cRoomId,
              room_number: currentRoom?.room_number || currentRoom?.name || cRoomId,
              building: currentRoom?.building || ''
            });
          }
        }
        setRooms(finalRooms);

        // Ensure currentExam is in exams list
        let finalExams = [...examData];
        const cExamId = currentExamId;
        if (cExamId) {
          const exists = finalExams.some(e => String(e.id) === String(cExamId));
          if (!exists) {
            finalExams.unshift({
              id: cExamId,
              exam_name: currentExam?.exam_name || currentExam?.name || `Exam #${cExamId}`,
              course_code: currentExam?.course_code || '',
              course_coordinator_id: currentExam?.course_coordinator_id
            });
          }
        }
        setExams(finalExams);

        setFacultyList(facData);

        // Prioritize classroom students if available, then fallback to master students
        let finalStudents = [];
        if (classroomStudents && classroomStudents.length > 0) {
          finalStudents = classroomStudents.map(st => ({
            id: st.student_id || st.id,
            name: st.student_name || st.name,
            enrollment_no: st.enrollment_no || st.student_roll || '',
            department: st.student_department || st.department || '',
            seat_number: st.seat_number || ''
          }));
        } else {
          finalStudents = studData;
        }
        setStudents(finalStudents);

        // Pre-select defaults matching this invigilator's duty!
        const defaultExamId = String(cExamId || (finalExams[0] ? finalExams[0].id : ''));
        const defaultRoomId = String(cRoomId || (finalRooms[0] ? finalRooms[0].id : ''));

        // Find the selected exam object to locate the designated course instructor
        const selectedExam = finalExams.find(e => String(e.id) === String(defaultExamId));

        // Resolve invigilator info so the invigilator is never confused with the recipient subject faculty
        const currentInvigId = invigilatorUser?.faculty_id || invigilatorUser?.facultyId || invigilatorUser?.id;
        const currentInvigName = invigilatorUser?.name || '';
        const eligibleFaculty = facData.filter(f => 
          (!currentInvigId || Number(f.id) !== Number(currentInvigId)) &&
          (!currentInvigName || f.name?.toLowerCase() !== currentInvigName.toLowerCase())
        );

        // Find designated course instructor for this exam
        const designatedFaculty = eligibleFaculty.find(f => 
          (selectedExam?.course_coordinator_id && Number(f.id) === Number(selectedExam.course_coordinator_id)) ||
          (selectedExam?.course_coordinator_name && f.name?.toLowerCase() === selectedExam.course_coordinator_name?.toLowerCase())
        ) || eligibleFaculty.find(f => 
          selectedExam?.department && f.department === selectedExam.department
        ) || eligibleFaculty[0] || facData[0];

        const defaultFacultyId = designatedFaculty ? String(designatedFaculty.id) : '';
        const defaultRecipientEmail = designatedFaculty?.email || '';

        // Pre-select student: initialStudent > first classroom student > first master student
        const defaultStudent = initialStudent || finalStudents[0] || null;

        setFormData({
          examId: defaultExamId,
          roomId: defaultRoomId,
          studentId: defaultStudent ? String(defaultStudent.id || defaultStudent.student_id) : '',
          studentRoll: defaultStudent ? (defaultStudent.enrollment_no || defaultStudent.student_roll || '') : '',
          studentName: defaultStudent ? (defaultStudent.name || defaultStudent.student_name || '') : '',
          facultyId: defaultFacultyId,
          recipientEmail: defaultRecipientEmail,
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
  }, [isOpen, currentExamId, currentRoomId, initialStudentId]);

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

  // When exam selection changes, auto-route to designated course instructor & pre-fill email
  const handleExamChange = (newExamId) => {
    const selected = exams.find(e => String(e.id) === String(newExamId));
    const currentInvigId = invigilatorUser?.faculty_id || invigilatorUser?.facultyId || invigilatorUser?.id;
    const currentInvigName = invigilatorUser?.name || '';
    const eligibleFaculty = facultyList.filter(f => 
      (!currentInvigId || Number(f.id) !== Number(currentInvigId)) &&
      (!currentInvigName || f.name?.toLowerCase() !== currentInvigName.toLowerCase())
    );

    const targetFac = eligibleFaculty.find(f => 
      (selected?.course_coordinator_id && Number(f.id) === Number(selected.course_coordinator_id)) ||
      (selected?.course_coordinator_name && f.name?.toLowerCase() === selected.course_coordinator_name?.toLowerCase())
    ) || eligibleFaculty.find(f => selected?.department && f.department === selected.department) || eligibleFaculty[0] || facultyList[0];

    setFormData(prev => ({
      ...prev,
      examId: newExamId,
      facultyId: targetFac ? String(targetFac.id) : prev.facultyId,
      recipientEmail: targetFac?.email || prev.recipientEmail
    }));
  };

  // When faculty selection changes, update recipient email accordingly
  const handleFacultySelect = (newFacultyId) => {
    const target = facultyList.find(f => String(f.id) === String(newFacultyId));
    setFormData(prev => ({
      ...prev,
      facultyId: newFacultyId,
      recipientEmail: target ? target.email : prev.recipientEmail
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const targetEmail = (formData.recipientEmail || '').trim();

    if (!formData.examId || !formData.roomId || !targetEmail || !formData.questionText.trim()) {
      setError('Please fill in all required fields (Exam, Room, Recipient Email, and Doubt Text).');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Direct browser EmailJS dispatch using dedicated DOUBT_SUPPORT channel
      const roomObj = rooms.find(r => String(r.id) === String(formData.roomId));
      const examObj = exams.find(e => String(e.id) === String(formData.examId));
      const roomStr = roomObj?.room_number || currentRoom?.room_number || 'Exam Hall';
      const actualInvigilatorName = invigilatorUser?.name || 'Room Invigilator';
      const actualInvigilatorId = invigilatorUser?.faculty_id || invigilatorUser?.facultyId || invigilatorUser?.id || null;
      const urgencyLabels = {
        CRITICAL: 'CRITICAL (Blocking Paper)',
        HIGH: 'HIGH (Question Ambiguity)',
        NORMAL: 'NORMAL (Clarification)'
      };
      const urgencyLabel = urgencyLabels[formData.urgency] || formData.urgency || 'HIGH';
      const emailSubject = `Question Paper Doubt in Room ${roomStr}`;
      const emailBody = `Priority / Urgency: ${urgencyLabel}\nStudent Doubt: ${formData.questionText.trim()}\n\nExam: ${examObj?.exam_name || 'Exam'}\nInvigilator: ${actualInvigilatorName}\nRequired Location: Please visit Room ${roomStr} immediately to address this question.`;

      try {
        await emailService.sendDoubtNotification({
          recipientEmail: targetEmail,
          facultyName: '',
          roomNumber: roomStr,
          examName: examObj?.exam_name || 'Scheduled Examination',
          invigilatorName: actualInvigilatorName,
          questionText: formData.questionText.trim(),
          urgency: urgencyLabel,
          subject: emailSubject,
          message: emailBody
        });
      } catch (ejsErr) {
        console.warn('Browser EmailJS dispatch warning:', ejsErr);
      }

      // 2. Submit to backend API to log in database and trigger live doubts stream
      const payload = {
        examId: Number(formData.examId),
        roomId: Number(formData.roomId),
        studentId: formData.studentId ? Number(formData.studentId) : null,
        studentRoll: formData.studentRoll ? formData.studentRoll.trim() : null,
        facultyId: Number(formData.facultyId) || null,
        recipientEmail: targetEmail,
        questionText: formData.questionText.trim(),
        urgency: formData.urgency,
        invigilatorId: actualInvigilatorId,
        invigilatorName: actualInvigilatorName
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
                  Request Doubt Support (Call Faculty)
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
                Dispatches an urgent doubt support request to the course faculty for this examination room via email and live alert
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
                    {s.name} ({s.enrollment_no}{s.seat_number ? ` • Seat ${s.seat_number}` : ''}{s.department ? ` • ${s.department}` : ''})
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
              Subject Faculty Recipient (Course Instructor) *
            </label>
            <select
              className="input-field"
              value={formData.facultyId}
              onChange={(e) => handleFacultySelect(e.target.value)}
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
              {facultyList
                .filter(f => {
                  const currentInvigId = invigilatorUser?.faculty_id || invigilatorUser?.facultyId || invigilatorUser?.id;
                  return !currentInvigId || Number(f.id) !== Number(currentInvigId);
                })
                .map(f => {
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

          {/* Row 3b: Send Email To (Pre-filled with teaching faculty email, editable to replace) */}
          <div style={{
            background: 'rgba(56, 189, 248, 0.05)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '10px',
            padding: '0.85rem 1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem', flexWrap: 'wrap', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                <Mail size={14} color="#38bdf8" />
                <span>Email To (Recipient Email Address) *</span>
              </label>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Edit3 size={11} color="#38bdf8" />
                Pre-filled with teaching faculty • Editable / Replaceable
              </span>
            </div>
            <div>
              <input
                type="email"
                className="input-field"
                value={formData.recipientEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, recipientEmail: e.target.value }))}
                placeholder="e.g. instructor@university.edu"
                required
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(56, 189, 248, 0.45)',
                  borderRadius: '8px',
                  color: '#38bdf8',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  outline: 'none'
                }}
              />
            </div>
            <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.72rem', color: '#94a3b8' }}>
              💡 Pre-filled with the teaching faculty for this subject. You can edit or replace this email if you want to notify a co-instructor, TA, or alternative address.
            </p>
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
                  <span>Dispatching Doubt Request...</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>Dispatch Doubt Support Request</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
