import React from 'react';
import { 
  X, Mail, CheckCircle2, ShieldAlert, Clock, 
  ExternalLink, Copy, Check 
} from 'lucide-react';

export default function EmailNotificationModal({
  isOpen,
  onClose,
  doubt = null,
  notification = null
}) {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const recipient = notification?.recipient_email || doubt?.faculty_email || 'faculty@examsphere.edu';
  const subject = notification?.subject || `Question Paper Doubt in Room ${doubt?.room_number || 'R-101'} for Exam ${doubt?.exam_name || 'Examination'}`;
  const sentTime = notification?.sent_at || doubt?.created_at || new Date().toISOString();
  
  const emailContent = notification?.message || `
================================================================================
EXAMSPHERE EXAMINATION CONTROLLER - LIVE STUDENT DOUBT NOTIFICATION
================================================================================
Priority: ${doubt?.urgency || 'HIGH'}
Dispatched At: ${new Date(sentTime).toLocaleString()}

Dear ${doubt?.faculty_name || 'Faculty Member'},

An urgent student query / question paper clarification has been officially 
routed from Examination Hall ${doubt?.room_number || 'R-101'} by Room Invigilator ${doubt?.invigilator_name || 'Room Invigilator'}.

EXAMINATION CONTEXT:
--------------------------------------------------------------------------------
• Examination:      ${doubt?.exam_name || 'Examination'} (${doubt?.course_code || 'COURSE'})
• Examination Hall:  ${doubt?.room_number || 'R-101'} (${doubt?.room_building || 'Campus Central Block'})
• Raised By:         ${doubt?.student_name || 'Student'} (Roll No: ${doubt?.student_roll || '240101'})
• Forwarded By:      ${doubt?.invigilator_name || 'Room Invigilator'} (Invigilator on Duty)
• Current Status:    ${doubt?.status || 'PENDING'}

STUDENT DOUBT / QUESTION TEXT:
--------------------------------------------------------------------------------
"${doubt?.question_text || 'Student inquiry text...'}"

--------------------------------------------------------------------------------
INSTRUCTIONS FOR SUBJECT FACULTY:
1. Log in immediately to your ExamSphere Faculty Portal.
2. Provide an official clarification or solution to be broadcasted to Hall ${doubt?.room_number || 'R-101'}.
3. Or select "Visiting Hall / En Route" to assist the candidate in person.

System Notification ID: NOTIF-DR-${doubt?.id || 1}-${Date.now()}
================================================================================
  `.trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(`To: ${recipient}\nSubject: ${subject}\n\n${emailContent}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          maxWidth: '680px',
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
        {/* Email Header Bar */}
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
              <Mail size={22} color="#06b6d4" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
                  Institutional Email Notification
                </h3>
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  padding: '0.15rem 0.45rem',
                  borderRadius: '6px',
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}>
                  Delivered
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                Dispatched via ExamSphere Automated Notification Engine
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

        {/* Email Meta Details */}
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', background: 'rgba(0, 0, 0, 0.2)', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)', width: '70px', fontWeight: 700 }}>To:</span>
            <span style={{ color: '#38bdf8', fontWeight: 600 }}>{recipient}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)', width: '70px', fontWeight: 700 }}>Subject:</span>
            <span style={{ color: '#f8fafc', fontWeight: 700 }}>{subject}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)', width: '70px', fontWeight: 700 }}>Sent At:</span>
            <span style={{ color: 'var(--text-muted)' }}>{new Date(sentTime).toLocaleString()}</span>
          </div>
        </div>

        {/* Prominent Room to Visit Banner */}
        <div style={{
          margin: '1.25rem 1.5rem 0',
          padding: '1rem',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '2px solid #ef4444',
          borderRadius: '10px',
          textAlign: 'center',
          boxShadow: '0 4px 16px rgba(239, 68, 68, 0.2)'
        }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#fca5a5', fontWeight: 800 }}>
            Required Room to Visit for Doubt Resolution
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#ef4444', margin: '0.25rem 0' }}>
            Room {doubt?.room_number || notification?.subject?.match(/Room\s+([A-Za-z0-9\-]+)/i)?.[1] || 'E2-101'}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
            Location: {doubt?.room_building || 'Campus Academic Block'}
          </div>
        </div>

        {/* Email Body */}
        <div style={{ overflowY: 'auto', padding: '1.25rem 1.5rem', flex: 1 }}>
          <pre style={{
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '1.25rem',
            color: '#e2e8f0',
            fontFamily: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            fontSize: '0.82rem',
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            margin: 0
          }}>
            {emailContent}
          </pre>
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.01)'
        }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleCopy}
            style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
            <span>{copied ? 'Copied Content' : 'Copy Email Text'}</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            style={{ fontSize: '0.82rem', padding: '0.45rem 1.15rem' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
