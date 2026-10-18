import React, { useState } from 'react';
import { 
  X, CheckCircle2, AlertTriangle, Send, Navigation, 
  Clock, User, BookOpen, Building, MessageSquare, ShieldCheck 
} from 'lucide-react';
import { api } from '../../api';

export default function ResolveDoubtModal({
  isOpen,
  onClose,
  onSuccess,
  doubt = null
}) {
  const [actionType, setActionType] = useState('RESOLVED'); // 'RESOLVED' | 'VISITED' | 'ACCEPTED'
  const [responseText, setResponseText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !doubt) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (actionType === 'RESOLVED' && !responseText.trim()) {
      setError('Please provide written clarification text before resolving.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.resolveDoubtRequest(doubt.id, {
        responseText: responseText.trim(),
        actionType
      });
      onSuccess?.(res);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update doubt resolution status.');
    } finally {
      setSubmitting(false);
    }
  };

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
          maxWidth: '620px',
          background: 'linear-gradient(145deg, #182234 0%, #0f172a 100%)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 35px rgba(16, 185, 129, 0.15)',
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
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              <CheckCircle2 size={22} color="#10b981" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
                  Resolve Student Doubt #{doubt.id}
                </h3>
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  padding: '0.15rem 0.45rem',
                  borderRadius: '6px',
                  background: doubt.urgency === 'CRITICAL' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                  color: doubt.urgency === 'CRITICAL' ? '#f43f5e' : '#facc15',
                  border: '1px solid currentColor'
                }}>
                  {doubt.urgency || 'HIGH'} PRIORITY
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                Room {doubt.room_number} • {doubt.course_code} - {doubt.exam_name}
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

        {/* Content Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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

          {/* Student Question Box */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(6, 182, 212, 0.25)',
            borderRadius: '10px',
            padding: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
                Student Inquiry / Question Raised:
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Raised by {doubt.student_name} (Roll: {doubt.student_roll})
              </div>
            </div>
            <div style={{
              fontSize: '0.92rem',
              color: '#f8fafc',
              lineHeight: 1.5,
              background: 'rgba(0, 0, 0, 0.25)',
              padding: '0.75rem 0.85rem',
              borderRadius: '6px',
              borderLeft: '3px solid #06b6d4',
              fontStyle: 'italic'
            }}>
              "{doubt.question_text}"
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Forwarded from <strong>Room {doubt.room_number}</strong> by Invigilator: <strong>{doubt.invigilator_name || 'Hall Invigilator'}</strong>
            </div>
          </div>

          {/* Action Choice Selection */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.5rem' }}>
              Select Faculty Response Action:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem' }}>
              <button
                type="button"
                className="btn"
                onClick={() => setActionType('RESOLVED')}
                style={{
                  padding: '0.65rem 0.5rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.35rem',
                  borderRadius: '8px',
                  background: actionType === 'RESOLVED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${actionType === 'RESOLVED' ? '#10b981' : 'var(--border-subtle)'}`,
                  color: actionType === 'RESOLVED' ? '#34d399' : 'var(--text-muted)'
                }}
              >
                <MessageSquare size={16} />
                <span>Provide Clarification</span>
              </button>

              <button
                type="button"
                className="btn"
                onClick={() => setActionType('VISITED')}
                style={{
                  padding: '0.65rem 0.5rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.35rem',
                  borderRadius: '8px',
                  background: actionType === 'VISITED' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${actionType === 'VISITED' ? '#06b6d4' : 'var(--border-subtle)'}`,
                  color: actionType === 'VISITED' ? '#38bdf8' : 'var(--text-muted)'
                }}
              >
                <Navigation size={16} />
                <span>Visit Exam Hall</span>
              </button>

              <button
                type="button"
                className="btn"
                onClick={() => setActionType('ACCEPTED')}
                style={{
                  padding: '0.65rem 0.5rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.35rem',
                  borderRadius: '8px',
                  background: actionType === 'ACCEPTED' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${actionType === 'ACCEPTED' ? '#eab308' : 'var(--border-subtle)'}`,
                  color: actionType === 'ACCEPTED' ? '#facc15' : 'var(--text-muted)'
                }}
              >
                <Clock size={16} />
                <span>Reviewing Paper</span>
              </button>
            </div>
          </div>

          {/* Response Text Input */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.4rem' }}>
              {actionType === 'RESOLVED' 
                ? 'Official Answer / Clarification Instructions (Broadcasted to Hall) *'
                : 'Faculty Remarks / Estimated Arrival Time (Optional)'}
            </label>
            <textarea
              className="input-field"
              rows={4}
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder={
                actionType === 'RESOLVED'
                  ? 'e.g. Official Clarification: Assume thermal conductivity k = 45 W/mK for low-carbon steel. Proceed with steady-state 1D heat conduction equation...'
                  : actionType === 'VISITED'
                  ? 'e.g. Visiting Room R-101 immediately. Arriving in 2-3 minutes with original question paper solution key...'
                  : 'e.g. Acknowledged by faculty. Reviewing question formulation...'
              }
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
              disabled={submitting || (actionType === 'RESOLVED' && !responseText.trim())}
              style={{
                fontSize: '0.85rem',
                padding: '0.55rem 1.25rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: actionType === 'VISITED' 
                  ? 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)' 
                  : 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              }}
            >
              {submitting ? (
                <>
                  <div className="spinner" style={{ width: '14px', height: '14px' }}></div>
                  <span>Updating Hall Status...</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>
                    {actionType === 'RESOLVED' ? 'Submit Official Clarification' : actionType === 'VISITED' ? 'Signal Room Visit En Route' : 'Acknowledge Inquiry'}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
