import React, { useState, useEffect } from 'react';
import { Mail, Send, X, AlertCircle, CheckCircle2, Settings, ExternalLink, Sparkles, User, Info, ChevronDown, ChevronUp, Key } from 'lucide-react';
import emailjs from '@emailjs/browser';
import { EMAILJS_CONFIG } from '../../config/emailjsConfig';
import { emailService } from '../../services/emailService';
import { api } from '../../api';

export default function SendFacultyEmailModal({ isOpen, onClose, onSuccess }) {
  // Do not select any option by default; start with empty fields
  const [recipientEmail, setRecipientEmail] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [examName, setExamName] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  
  const [facultyList, setFacultyList] = useState([]);
  const [roomList, setRoomList] = useState([]);
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [deliveryResult, setDeliveryResult] = useState(null);

  // 3-Channel EmailJS Configuration (Stored in localStorage and falls back to shared emailjsConfig.js)
  const [emailJsConfig, setEmailJsConfig] = useState(() => emailService.getAllConfig());
  const [showConfig, setShowConfig] = useState(false);
  const [configSavedNotice, setConfigSavedNotice] = useState(false);

  const isEmailJsReady = Boolean(
    emailJsConfig.publicKey?.trim() &&
    emailJsConfig.faculty?.serviceId?.trim() && 
    emailJsConfig.faculty?.templateId?.trim()
  );

  // Clear form selections and fetch real records every time modal opens
  useEffect(() => {
    if (isOpen) {
      setRecipientEmail('');
      setRoomNumber('');
      setExamName('');
      setSubject('');
      setMessage('');
      setError(null);
      setDeliveryResult(null);

      api.getEntities('faculty')
        .then(res => setFacultyList(Array.isArray(res.data) ? res.data : []))
        .catch(() => setFacultyList([]));
        
      api.getEntities('rooms')
        .then(res => setRoomList(Array.isArray(res.data) ? res.data : []))
        .catch(() => setRoomList([]));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectSample = (sample) => {
    setRecipientEmail(sample.email);
    if (roomNumber) {
      setSubject(`URGENT: Visit Room ${roomNumber} - Examination Consultation`);
    }
  };

  const handleSelectRoom = (r) => {
    setRoomNumber(r);
    setSubject(`URGENT: Visit Room ${r} - Examination Consultation`);
  };

  const handleSaveEmailJsKeys = (e) => {
    e.preventDefault();
    emailService.saveAllConfig(emailJsConfig);
    setConfigSavedNotice(true);
    setTimeout(() => setConfigSavedNotice(false), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setDeliveryResult(null);

    if (!recipientEmail.trim() || !roomNumber.trim()) {
      setError('Please select or enter both a recipient faculty email and the required room number.');
      return;
    }

    setSubmitting(true);
    try {
      const emailSubject = subject.trim() || `[ExamSphere URGENT] Visit Room ${roomNumber.trim()} - Faculty Examination Request`;
      const emailBody = message.trim() || `Please visit Room ${roomNumber.trim()} immediately for examination clarification.`;

      let emailJsDispatched = false;
      let emailJsError = null;

      // 1. Dispatch directly via EmailJS using dedicated FACULTY service & template
      const facConfig = emailService.getConfig('FACULTY');
      if (facConfig.serviceId && facConfig.templateId && facConfig.publicKey) {
        try {
          const templateParams = {
            // Direct matches to EmailJS Template variables ({{title}}, {{name}}, {{time}}, {{message}}, {{to_email}}, {{from_name}}, {{from_email}})
            title: emailSubject,
            subject: emailSubject,
            name: recipientEmail.split('@')[0],
            time: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
            date: new Date().toLocaleDateString('en-US'),
            message: emailBody,
            to_email: recipientEmail.trim(),
            recipient_email: recipientEmail.trim(),
            email: recipientEmail.trim(),
            user_email: recipientEmail.trim(),
            from_name: 'ExamSphere Controller Admin',
            from_email: 'admin@examsphere.edu',

            // Domain aliases
            to_name: recipientEmail.split('@')[0],
            room_number: roomNumber.trim(),
            room: roomNumber.trim(),
            exam_name: examName.trim() || 'Scheduled Examination',
            exam: examName.trim() || 'Scheduled Examination'
          };

          await emailjs.send(
            facConfig.serviceId.trim(),
            facConfig.templateId.trim(),
            templateParams,
            facConfig.publicKey.trim()
          );
          emailJsDispatched = true;
        } catch (ejsErr) {
          console.error('EmailJS direct send error:', ejsErr);
          emailJsError = ejsErr?.text || ejsErr?.message || 'EmailJS dispatch failed.';
        }
      }

      // 2. Also record notification in backend database for history and audit stream
      const res = await api.sendFacultyEmail({
        recipientEmail: recipientEmail.trim(),
        roomNumber: roomNumber.trim(),
        examName: examName.trim(),
        subject: emailSubject,
        message: emailBody
      });

      if (emailJsDispatched) {
        setDeliveryResult({
          success: true,
          provider: 'EmailJS',
          status: 'SENT',
          recipientEmail: recipientEmail.trim(),
          roomNumber: roomNumber.trim()
        });
      } else if (emailJsError) {
        setError(`EmailJS Delivery Failed: ${emailJsError}. Please check your Service ID, Template ID, and Public Key.`);
        setShowConfig(true);
      } else {
        // Keys not set yet
        setDeliveryResult({
          success: true,
          provider: 'EmailJS',
          status: 'PENDING_CONFIG',
          recipientEmail: recipientEmail.trim(),
          roomNumber: roomNumber.trim()
        });
        setShowConfig(true);
      }

      if (onSuccess) onSuccess(res);
    } catch (err) {
      setError(err.message || 'Failed to dispatch email.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, padding: '1rem'
    }}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{
          background: 'var(--bg-card, #0f172a)',
          border: '1px solid var(--border-color, #1e293b)',
          borderRadius: '14px',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-color, #1e293b)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(90deg, rgba(2, 132, 199, 0.12), rgba(99, 102, 241, 0.08))'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #0284c7, #2563eb)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 16px rgba(2, 132, 199, 0.4)'
            }}>
              <Mail size={20} color="#fff" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
                Send Real Email to Faculty
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                Powered by EmailJS &bull; Dispatches real notifications highlighting required room
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowConfig(!showConfig)}
              title="EmailJS Settings"
              style={{
                fontSize: '0.78rem',
                padding: '0.4rem 0.75rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: isEmailJsReady ? '#38bdf8' : '#f59e0b',
                borderColor: isEmailJsReady ? 'rgba(56, 189, 248, 0.4)' : 'rgba(245, 158, 11, 0.4)'
              }}
            >
              <Settings size={14} />
              <span>{isEmailJsReady ? 'EmailJS: Ready' : 'EmailJS: Setup Needed'}</span>
            </button>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              style={{ padding: '0.4rem', borderRadius: '8px' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div style={{ padding: '1.5rem' }}>
          {/* EmailJS Configuration Drawer */}
          {showConfig && (
            <div style={{
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              borderRadius: '10px',
              padding: '1.25rem',
              marginBottom: '1.5rem',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#38bdf8', fontWeight: 700, fontSize: '0.9rem' }}>
                  <Key size={16} />
                  <span>EmailJS.com Credentials Setup</span>
                </div>
                <a
                  href="https://dashboard.emailjs.com/admin"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: '0.78rem',
                    color: '#94a3b8',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <span>Open EmailJS Dashboard</span>
                  <ExternalLink size={12} />
                </a>
              </div>

              <p style={{ margin: '0 0 1rem', fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.5 }}>
                Enter your free EmailJS keys to deliver live emails directly into real faculty inboxes (like <code>@bmu.edu.in</code>).
              </p>

              {configSavedNotice && (
                <div style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid #10b981',
                  color: '#34d399',
                  fontSize: '0.8rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}>
                  <CheckCircle2 size={16} />
                  <span>EmailJS credentials saved! You can now send real emails.</span>
                </div>
              )}

              <form onSubmit={handleSaveEmailJsKeys}>
                {/* Public Keys Grid */}
                <div style={{ marginBottom: '1rem', background: 'rgba(0, 0, 0, 0.25)', padding: '0.85rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', marginBottom: '0.3rem' }}>
                        🔑 Public Key (Faculty & Doubt Support) <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={emailJsConfig.facultyAndDoubtPublicKey || emailJsConfig.publicKey || ''}
                        onChange={(e) => setEmailJsConfig({
                          ...emailJsConfig,
                          facultyAndDoubtPublicKey: e.target.value,
                          publicKey: e.target.value
                        })}
                        placeholder="e.g. D3VVFUSreFR_UXg3o"
                        required
                        style={{
                          width: '100%',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '6px',
                          background: '#1e293b',
                          border: '1px solid #334155',
                          color: '#fff',
                          fontSize: '0.82rem'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#34d399', marginBottom: '0.3rem' }}>
                        🔑 Separate Public Key (Students) <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={emailJsConfig.studentPublicKey || ''}
                        onChange={(e) => setEmailJsConfig({
                          ...emailJsConfig,
                          studentPublicKey: e.target.value
                        })}
                        placeholder="e.g. your_student_public_key"
                        required
                        style={{
                          width: '100%',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '6px',
                          background: '#1e293b',
                          border: '1px solid #334155',
                          color: '#fff',
                          fontSize: '0.82rem'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* 1. Faculty Service & Template */}
                <div style={{ marginBottom: '1rem', background: 'rgba(59, 130, 246, 0.08)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#60a5fa', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span>🧑‍🏫 1. Faculty Notifications & Duty Roster</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.25rem' }}>
                        Faculty Service ID <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={emailJsConfig.faculty?.serviceId || ''}
                        onChange={(e) => setEmailJsConfig({
                          ...emailJsConfig,
                          faculty: { ...(emailJsConfig.faculty || {}), serviceId: e.target.value }
                        })}
                        placeholder="e.g. service_faculty"
                        required
                        style={{
                          width: '100%',
                          padding: '0.45rem 0.65rem',
                          borderRadius: '6px',
                          background: '#1e293b',
                          border: '1px solid #334155',
                          color: '#fff',
                          fontSize: '0.8rem'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.25rem' }}>
                        Faculty Template ID <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={emailJsConfig.faculty?.templateId || ''}
                        onChange={(e) => setEmailJsConfig({
                          ...emailJsConfig,
                          faculty: { ...(emailJsConfig.faculty || {}), templateId: e.target.value }
                        })}
                        placeholder="e.g. template_faculty"
                        required
                        style={{
                          width: '100%',
                          padding: '0.45rem 0.65rem',
                          borderRadius: '6px',
                          background: '#1e293b',
                          border: '1px solid #334155',
                          color: '#fff',
                          fontSize: '0.8rem'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Students Service & Template */}
                <div style={{ marginBottom: '1rem', background: 'rgba(16, 185, 129, 0.08)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#34d399', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span>🎓 2. Student Seating Allotment & Hall Ticket</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.25rem' }}>
                        Students Service ID <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={emailJsConfig.students?.serviceId || ''}
                        onChange={(e) => setEmailJsConfig({
                          ...emailJsConfig,
                          students: { ...(emailJsConfig.students || {}), serviceId: e.target.value }
                        })}
                        placeholder="e.g. service_students"
                        required
                        style={{
                          width: '100%',
                          padding: '0.45rem 0.65rem',
                          borderRadius: '6px',
                          background: '#1e293b',
                          border: '1px solid #334155',
                          color: '#fff',
                          fontSize: '0.8rem'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.25rem' }}>
                        Students Template ID <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={emailJsConfig.students?.templateId || ''}
                        onChange={(e) => setEmailJsConfig({
                          ...emailJsConfig,
                          students: { ...(emailJsConfig.students || {}), templateId: e.target.value }
                        })}
                        placeholder="e.g. template_students"
                        required
                        style={{
                          width: '100%',
                          padding: '0.45rem 0.65rem',
                          borderRadius: '6px',
                          background: '#1e293b',
                          border: '1px solid #334155',
                          color: '#fff',
                          fontSize: '0.8rem'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Doubt Support Service & Template */}
                <div style={{ marginBottom: '1.25rem', background: 'rgba(234, 179, 8, 0.08)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(234, 179, 8, 0.25)' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#facc15', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span>❓ 3. Doubt Support & Emergency Room Dispatch</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.25rem' }}>
                        Doubt Support Service ID <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={emailJsConfig.doubtSupport?.serviceId || ''}
                        onChange={(e) => setEmailJsConfig({
                          ...emailJsConfig,
                          doubtSupport: { ...(emailJsConfig.doubtSupport || {}), serviceId: e.target.value }
                        })}
                        placeholder="e.g. service_doubts"
                        required
                        style={{
                          width: '100%',
                          padding: '0.45rem 0.65rem',
                          borderRadius: '6px',
                          background: '#1e293b',
                          border: '1px solid #334155',
                          color: '#fff',
                          fontSize: '0.8rem'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.25rem' }}>
                        Doubt Support Template ID <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={emailJsConfig.doubtSupport?.templateId || ''}
                        onChange={(e) => setEmailJsConfig({
                          ...emailJsConfig,
                          doubtSupport: { ...(emailJsConfig.doubtSupport || {}), templateId: e.target.value }
                        })}
                        placeholder="e.g. template_doubts"
                        required
                        style={{
                          width: '100%',
                          padding: '0.45rem 0.65rem',
                          borderRadius: '6px',
                          background: '#1e293b',
                          border: '1px solid #334155',
                          color: '#fff',
                          fontSize: '0.8rem'
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    Aliases automatically supported: <code>to_email</code>, <code>to_name</code>, <code>room_number</code>, <code>seat_number</code>, <code>exam_name</code>, <code>message</code>
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ fontSize: '0.8rem', padding: '0.45rem 1rem', background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)' }}
                  >
                    Save 3-Channel EmailJS Keys
                  </button>
                </div>
              </form>
            </div>
          )}

          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444',
              color: '#fca5a5', padding: '0.75rem 1rem', borderRadius: '8px',
              marginBottom: '1.25rem', fontSize: '0.85rem'
            }}>
              <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {deliveryResult && (
            <div style={{
              background: deliveryResult.status === 'SENT' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
              border: deliveryResult.status === 'SENT' ? '1px solid #10b981' : '1px solid #f59e0b',
              borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem'
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                color: deliveryResult.status === 'SENT' ? '#34d399' : '#fbbf24',
                fontWeight: 700, fontSize: '0.95rem'
              }}>
                <CheckCircle2 size={20} />
                <span>
                  {deliveryResult.status === 'SENT' 
                    ? 'Real Email Dispatched via EmailJS!' 
                    : 'Notification Recorded (EmailJS Setup Pending)'}
                </span>
              </div>
              <p style={{ margin: '0.5rem 0 0.5rem', fontSize: '0.83rem', color: '#e2e8f0', lineHeight: 1.5 }}>
                Target: <strong>{deliveryResult.recipientEmail}</strong> &bull; Required Visit: <strong>Room {deliveryResult.roomNumber}</strong>.
              </p>
              {deliveryResult.status === 'SENT' ? (
                <div style={{ fontSize: '0.78rem', color: '#86efac' }}>
                  ✓ Successfully sent through EmailJS directly to the recipient's live inbox.
                </div>
              ) : (
                <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                  ℹ️ Click <strong>"EmailJS: Setup Needed"</strong> above to enter your free EmailJS Service ID, Template ID, and Public Key for live inbox delivery.
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Quick-Pick Live Faculty Emails */}
            {facultyList.length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem' }}>
                  Quick-Select Registered Faculty / Scholar:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: '110px', overflowY: 'auto' }}>
                  {facultyList.slice(0, 10).map((s) => {
                    const isSelected = Boolean(recipientEmail) && recipientEmail.toLowerCase() === s.email?.toLowerCase();
                    return (
                      <button
                        key={s.id || s.email}
                        type="button"
                        onClick={() => handleSelectSample(s)}
                        style={{
                          padding: '0.35rem 0.75rem',
                          fontSize: '0.78rem',
                          borderRadius: '20px',
                          border: isSelected ? '1px solid #38bdf8' : '1px solid var(--border-color, #334155)',
                          background: isSelected ? 'rgba(56, 189, 248, 0.2)' : 'rgba(30, 41, 59, 0.7)',
                          color: isSelected ? '#38bdf8' : '#cbd5e1',
                          cursor: 'pointer',
                          fontWeight: isSelected ? 700 : 500,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {s.name} ({s.email ? s.email.split('@')[0] : s.department})
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recipient Email Input */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.4rem' }}>
                Recipient Faculty Email Address <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="Select registered faculty above or enter email"
                required
                style={{
                  width: '100%',
                  padding: '0.65rem 0.9rem',
                  borderRadius: '8px',
                  background: 'var(--bg-input, #1e293b)',
                  border: '1px solid var(--border-color, #334155)',
                  color: '#fff',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            {/* Required Room Number Selection */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.4rem' }}>
                Required Room to Visit <span style={{ color: '#ef4444' }}>*</span>
              </label>
              {roomList.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.5rem' }}>
                  {roomList.slice(0, 8).map((r) => {
                    const rNum = r.room_number;
                    const isRoomSelected = Boolean(roomNumber) && roomNumber === rNum;
                    return (
                      <button
                        key={r.id || rNum}
                        type="button"
                        onClick={() => handleSelectRoom(rNum)}
                        style={{
                          padding: '0.4rem 0.75rem',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          borderRadius: '8px',
                          border: isRoomSelected ? '2px solid #ef4444' : '1px solid var(--border-color, #334155)',
                          background: isRoomSelected ? 'rgba(239, 68, 68, 0.2)' : 'rgba(30, 41, 59, 0.5)',
                          color: isRoomSelected ? '#fca5a5' : '#cbd5e1',
                          cursor: 'pointer'
                        }}
                      >
                        {rNum}
                      </button>
                    );
                  })}
                </div>
              )}
              <input
                type="text"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder="Select room above or enter room number (e.g. NB214, GA205)"
                required
                style={{
                  width: '100%',
                  padding: '0.5rem 0.8rem',
                  borderRadius: '6px',
                  background: 'var(--bg-input, #1e293b)',
                  border: '1px solid var(--border-color, #334155)',
                  color: '#fff',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            {/* Examination Context */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.4rem' }}>
                Examination Context
              </label>
              <input
                type="text"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                placeholder="Optional: e.g. CSE3002 Final Examination"
                style={{
                  width: '100%',
                  padding: '0.55rem 0.85rem',
                  borderRadius: '8px',
                  background: 'var(--bg-input, #1e293b)',
                  border: '1px solid var(--border-color, #334155)',
                  color: '#fff',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            {/* Email Message Content */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.4rem' }}>
                Instructions / Message for Faculty
              </label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Optional: Enter details on what clarification is needed..."
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  background: 'var(--bg-input, #1e293b)',
                  border: '1px solid var(--border-color, #334155)',
                  color: '#fff',
                  fontSize: '0.85rem',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Live Room Number Highlight Preview Card */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.8)',
              border: '2px dashed rgba(239, 68, 68, 0.5)',
              borderRadius: '10px',
              padding: '1rem',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#94a3b8', fontWeight: 700 }}>
                Recipient Will See Required Room In Email:
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: roomNumber ? '#ef4444' : '#64748b', margin: '0.35rem 0' }}>
                {roomNumber ? `Room ${roomNumber}` : '(No Room Selected Yet)'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Subject: [ExamSphere URGENT] Visit {roomNumber ? `Room ${roomNumber}` : 'Assigned Room'}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
                style={{
                  background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Send size={16} />
                <span>{submitting ? 'Dispatching via EmailJS...' : 'Send Real Email Now'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
