import React, { useState, useEffect } from 'react';
import { Mail, Send, CheckCircle2, AlertCircle, X, Clock, MapPin, Calendar, Check } from 'lucide-react';
import { emailService } from '../../services/emailService';

export default function EmailDutyModal({ isOpen, onClose, duty, user, onEmailSent }) {
  const [loading, setLoading] = useState(false);
  const [statusResult, setStatusResult] = useState(null);
  const [error, setError] = useState(null);

  // Email form fields
  const [fromName, setFromName] = useState('Exam Controller Admin');
  const [fromEmail, setFromEmail] = useState('admin@examsphere.edu');
  const [toName, setToName] = useState('');
  const [toEmail, setToEmail] = useState('');
  const [customNotes, setCustomNotes] = useState('Please report to the examination control room 20 minutes before the scheduled time to collect examination papers, candidate roll lists, and answer booklets.');

  useEffect(() => {
    if (isOpen && duty) {
      setError(null);
      setStatusResult(null);
      setFromName(user?.name || 'Exam Controller Admin');
      setFromEmail(user?.email || 'admin@examsphere.edu');
      setToName(duty.faculty_name || '');
      const defaultEmail = duty.faculty_email || `${(duty.faculty_name || 'faculty').toLowerCase().replace(/[^a-z0-9]/g, '.')}@examsphere.edu`;
      setToEmail(defaultEmail);
    }
  }, [isOpen, duty, user]);

  if (!isOpen || !duty) return null;

  const handleSendEmail = async (e) => {
    e.preventDefault();
    setError(null);
    setStatusResult(null);
    setLoading(true);

    try {
      const result = await emailService.sendDutyEmail({
        from_name: fromName,
        from_email: fromEmail,
        to_name: toName,
        to_email: toEmail,
        exam_name: duty.exam_name,
        course_code: duty.course_code,
        room_number: duty.room_number,
        exam_date: duty.exam_date,
        start_time: duty.start_time,
        end_time: duty.end_time,
        message: `Dear ${toName},\n\nYou have been officially assigned as Examination Invigilator for ${duty.exam_name} (${duty.course_code}).\n\n- Examination Room: ${duty.room_number}\n- Date: ${duty.exam_date}\n- Slot Window: ${duty.start_time} to ${duty.end_time}\n\nInstructions: ${customNotes}\n\nRegards,\n${fromName}\nExamination Cell`
      });

      setStatusResult(result);
      if (onEmailSent) {
        onEmailSent(duty.id, result);
      }
    } catch (err) {
      setError(err.message || 'Failed to dispatch email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '580px' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Mail size={18} color="#38bdf8" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>
                Automated Duty Email
              </h3>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#9ca3af' }}>
                Send official examination invigilation schedule directly to teacher
              </p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Success Alert */}
        {statusResult && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            color: '#34d399',
            padding: '0.75rem',
            borderRadius: '8px',
            fontSize: '0.82rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <div>
              <strong>Email Dispatched!</strong> Duty notification was transmitted to {toEmail}.
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.35)',
            color: '#f87171',
            padding: '0.75rem',
            borderRadius: '8px',
            fontSize: '0.82rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Exam & Duty Details Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          padding: '0.9rem',
          marginBottom: '1.1rem',
          fontSize: '0.82rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            paddingBottom: '0.65rem',
            marginBottom: '0.75rem'
          }}>
            <div>
              <span style={{ fontWeight: 800, color: '#f3f4f6', fontSize: '0.95rem' }}>{duty.exam_name}</span>
              <span style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'block' }}>Code: {duty.course_code}</span>
            </div>
            <div style={{
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              padding: '0.25rem 0.6rem',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#a5b4fc',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}>
              <MapPin size={12} />
              <span>Room {duty.room_number}</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', color: '#cbd5e1', fontSize: '0.78rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Calendar size={13} color="#38bdf8" />
              <span>Date: <strong>{duty.exam_date}</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Clock size={13} color="#f87171" />
              <span>Slot: <strong>{duty.start_time} - {duty.end_time}</strong></span>
            </div>
          </div>
        </div>

        {/* Email Dispatch Form */}
        <form onSubmit={handleSendEmail}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>From (Admin Name & Email)</label>
              <input
                type="text"
                className="form-control"
                value={`${fromName} <${fromEmail}>`}
                disabled
                style={{ background: 'rgba(0,0,0,0.25)', color: '#9ca3af' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>To (Teacher University Email) *</label>
              <input
                type="email"
                className="form-control"
                required
                placeholder="teacher@examsphere.edu"
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>Custom Instructions / Notes for Invigilator</label>
            <textarea
              className="form-control"
              rows={3}
              style={{ fontSize: '0.8rem', resize: 'vertical' }}
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
            />
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ minWidth: '170px', justifyContent: 'center' }}
            >
              <Send size={15} />
              <span>{loading ? 'Transmitting...' : 'Send Automated Email'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
