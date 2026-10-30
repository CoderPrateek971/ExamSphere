import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Mail, 
  AlertCircle, 
  X, 
  Sparkles, 
  ShieldCheck, 
  UserCheck, 
  Eye, 
  EyeOff, 
  KeyRound, 
  ShieldAlert, 
  User 
} from 'lucide-react';
import { api } from '../api';

export default function LoginModal({ isOpen, onClose, onLoginSuccess, targetRole, currentRole }) {
  const isSwitchMode = Boolean(targetRole);
  const [selectedRole, setSelectedRole] = useState(targetRole || 'ADMIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      const roleToUse = targetRole || 'ADMIN';
      setSelectedRole(roleToUse);
      if (roleToUse === 'FACULTY') {
        setEmail('faculty@examsphere.edu');
        setPassword('faculty123');
      } else {
        setEmail('admin@examsphere.edu');
        setPassword('admin123');
      }
    }
  }, [isOpen, targetRole, isSwitchMode]);

  if (!isOpen) return null;

  const handleRoleTabChange = (role) => {
    if (isSwitchMode) return; // Locked in switch verification mode
    setSelectedRole(role);
    setError(null);
    if (role === 'FACULTY') {
      setEmail('faculty@examsphere.edu');
      setPassword('faculty123');
    } else {
      setEmail('admin@examsphere.edu');
      setPassword('admin123');
    }
  };

  const handleQuickFill = (fillEmail, fillPass = 'faculty123', role = 'FACULTY') => {
    if (isSwitchMode && role !== targetRole) return;
    setSelectedRole(role);
    setEmail(fillEmail);
    setPassword(fillPass || (role === 'FACULTY' ? 'faculty123' : 'admin123'));
    setError(null);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your university email.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.login(trimmedEmail, password);
      const authenticatedUser = res?.data?.user;

      if (!authenticatedUser) {
        throw new Error('Invalid login response from server.');
      }

      // Strict Role Validation when in Switch Mode
      if (isSwitchMode && authenticatedUser.role !== targetRole) {
        setError(`Access Denied: Authenticated account has role '${authenticatedUser.role}', but '${targetRole}' credentials are required to complete this switch.`);
        setLoading(false);
        return;
      }

      api.setToken(res.data.token);
      api.setUser(authenticatedUser);
      onLoginSuccess(authenticatedUser);
      onClose();
    } catch (err) {
      console.warn('Authentication failed:', err.message);
      setError(err.message || 'Invalid email or password. Please verify your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  const activeRole = targetRole || selectedRole;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '480px', padding: '1.75rem' }}>
        <div className="modal-header" style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: activeRole === 'ADMIN' ? 'rgba(99, 102, 241, 0.18)' : 'rgba(6, 182, 212, 0.18)',
              border: `1px solid ${activeRole === 'ADMIN' ? 'rgba(99, 102, 241, 0.4)' : 'rgba(6, 182, 212, 0.4)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Lock size={18} color={activeRole === 'ADMIN' ? '#818cf8' : '#22d3ee'} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                {isSwitchMode 
                  ? `Security Check: Switch to ${targetRole === 'ADMIN' ? 'Administrator' : 'Faculty'}`
                  : 'Sign In to ExamSphere'}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem', marginBottom: 0 }}>
                {isSwitchMode
                  ? `Enter ${targetRole === 'ADMIN' ? 'Administrator' : 'Faculty'} login credentials to proceed`
                  : 'Select your university role and authenticate to access modules'}
              </p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose} title="Cancel and close"><X size={20} /></button>
        </div>

        {/* Security Alert Badge for Switch Mode */}
        {isSwitchMode && (
          <div style={{
            background: 'rgba(234, 179, 8, 0.1)',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            borderRadius: '8px',
            padding: '0.6rem 0.8rem',
            fontSize: '0.78rem',
            color: '#fef08a',
            marginBottom: '1.1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            lineHeight: 1.4
          }}>
            <ShieldAlert size={16} color="#eab308" style={{ flexShrink: 0 }} />
            <span>
              Role switching is password protected. Unauthorized users cannot switch without valid credentials.
            </span>
          </div>
        )}

        {/* Role Selector Tabs (Interactive in standard mode, locked badge in switch mode) */}
        {!isSwitchMode ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.5rem',
            background: 'rgba(0, 0, 0, 0.35)',
            padding: '0.35rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '1.25rem'
          }}>
            <button
              type="button"
              onClick={() => handleRoleTabChange('ADMIN')}
              style={{
                padding: '0.65rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: selectedRole === 'ADMIN' ? '1px solid var(--primary)' : '1px solid transparent',
                background: selectedRole === 'ADMIN' ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(168, 85, 247, 0.15))' : 'transparent',
                color: selectedRole === 'ADMIN' ? '#fff' : 'var(--text-muted)',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                transition: 'all 0.15s ease'
              }}
            >
              <ShieldCheck size={16} color={selectedRole === 'ADMIN' ? 'var(--primary)' : 'var(--text-muted)'} />
              <span>Admin Portal</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleTabChange('FACULTY')}
              style={{
                padding: '0.65rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: selectedRole === 'FACULTY' ? '1px solid var(--accent-cyan)' : '1px solid transparent',
                background: selectedRole === 'FACULTY' ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.25), rgba(59, 130, 246, 0.15))' : 'transparent',
                color: selectedRole === 'FACULTY' ? '#fff' : 'var(--text-muted)',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                transition: 'all 0.15s ease'
              }}
            >
              <Eye size={16} color={selectedRole === 'FACULTY' ? 'var(--accent-cyan)' : 'var(--text-muted)'} />
              <span>Invigilator / Faculty</span>
            </button>
          </div>
        ) : (
          <div style={{
            background: targetRole === 'ADMIN' ? 'rgba(99, 102, 241, 0.12)' : 'rgba(6, 182, 212, 0.12)',
            border: `1px solid ${targetRole === 'ADMIN' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(6, 182, 212, 0.3)'}`,
            borderRadius: '8px',
            padding: '0.65rem 0.85rem',
            fontSize: '0.8rem',
            color: '#e2e8f0',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {targetRole === 'ADMIN' ? (
                <ShieldCheck size={16} color="#818cf8" />
              ) : (
                <Eye size={16} color="#22d3ee" />
              )}
              <span>Switching to: <strong>{targetRole === 'ADMIN' ? 'Administrator' : 'Faculty Invigilator'}</strong></span>
            </div>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '0.2rem 0.5rem',
              borderRadius: '6px',
              background: targetRole === 'ADMIN' ? 'rgba(99, 102, 241, 0.25)' : 'rgba(6, 182, 212, 0.25)',
              color: targetRole === 'ADMIN' ? '#a5b4fc' : '#67e8f9',
              border: `1px solid ${targetRole === 'ADMIN' ? 'rgba(99, 102, 241, 0.4)' : 'rgba(6, 182, 212, 0.4)'}`
            }}>
              REQUIRED
            </span>
          </div>
        )}

        {/* Portal Role Description Banner */}
        {!isSwitchMode && (
          <div style={{
            padding: '0.65rem 0.85rem',
            borderRadius: 'var(--radius-sm)',
            background: selectedRole === 'ADMIN' ? 'rgba(99, 102, 241, 0.08)' : 'rgba(6, 182, 212, 0.08)',
            border: `1px solid ${selectedRole === 'ADMIN' ? 'rgba(99, 102, 241, 0.25)' : 'rgba(6, 182, 212, 0.25)'}`,
            fontSize: '0.76rem',
            color: selectedRole === 'ADMIN' ? '#a5b4fc' : '#67e8f9',
            marginBottom: '1.25rem',
            lineHeight: 1.4
          }}>
            {selectedRole === 'ADMIN' ? (
              <span>
                🛡️ <strong>Admin Access:</strong> Master Data, Anti-Cheating Seating Allocation, Duty Balancing & Incident Logs.
              </span>
            ) : (
              <span>
                👁️ <strong>Invigilator Access:</strong> View Assigned Duties, Verify Student Identities & Record Live Attendance (Module 7).
              </span>
            )}
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div style={{ 
            background: 'rgba(244,63,94,0.15)', 
            border: '1px solid rgba(244,63,94,0.35)', 
            color: '#f87171', 
            padding: '0.75rem', 
            borderRadius: '8px', 
            fontSize: '0.84rem', 
            marginBottom: '1.25rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem' 
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={handleLogin}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Mail size={14} color="#94a3b8" />
              {activeRole === 'ADMIN' ? 'Administrator Email' : 'Faculty / Invigilator Email'}
            </label>
            <input
              type="email"
              className="form-control"
              placeholder={activeRole === 'ADMIN' ? 'admin@examsphere.edu' : 'faculty@examsphere.edu'}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus={!isSwitchMode}
              style={{ width: '100%', padding: '0.6rem 0.85rem' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <KeyRound size={14} color="#94a3b8" />
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: showPassword ? 'var(--primary)' : 'var(--text-muted)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '2px 4px'
                }}
              >
                {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                <span>{showPassword ? 'Hide' : 'Show'}</span>
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                placeholder={`Enter ${activeRole === 'ADMIN' ? 'Admin' : 'Faculty'} password`}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus={isSwitchMode}
                style={{ width: '100%', padding: '0.6rem 2.4rem 0.6rem 0.85rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                title={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: showPassword ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div style={{ marginTop: '0.35rem', fontSize: '0.74rem', color: 'var(--text-dim)', display: 'flex', justifyContent: 'space-between' }}>
              <span>
                {activeRole === 'ADMIN'
                  ? 'Default Admin: admin123'
                  : 'Default Faculty password: faculty123'}
              </span>
              <button
                type="button"
                onClick={() => setPassword(activeRole === 'ADMIN' ? 'admin123' : 'faculty123')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-cyan)',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '0.74rem',
                  textDecoration: 'underline'
                }}
              >
                Auto-fill
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem' }}>
            {isSwitchMode && (
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={onClose}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                flex: 2,
                justifyContent: 'center',
                padding: '0.75rem',
                fontWeight: 700,
                background: activeRole === 'ADMIN' ? 'var(--primary)' : 'var(--accent-cyan)',
                borderColor: activeRole === 'ADMIN' ? 'var(--primary)' : 'var(--accent-cyan)'
              }}
              disabled={loading}
            >
              {loading
                ? 'Verifying Credentials...'
                : isSwitchMode
                ? `Verify & Switch to ${targetRole === 'ADMIN' ? 'Admin Portal' : 'Invigilator Portal'}`
                : `Sign In to ${selectedRole === 'ADMIN' ? 'Admin Portal' : 'Invigilator Portal'}`}
            </button>
          </div>
        </form>

        {/* Quick Demo Accounts Selection */}
        <div style={{ marginTop: '1.35rem', paddingTop: '1.15rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-dim)', fontWeight: 700, marginBottom: '0.5rem', textAlign: 'center' }}>
            Quick Demo Accounts
          </div>

          {activeRole === 'ADMIN' ? (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => handleQuickFill('admin@examsphere.edu', 'admin123', 'ADMIN')}
                style={{
                  background: 'rgba(99, 102, 241, 0.1)',
                  border: '1px dashed rgba(99, 102, 241, 0.4)',
                  color: '#a5b4fc',
                  padding: '0.45rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <Sparkles size={13} />
                <span>Fill Admin: admin@examsphere.edu</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <button
                type="button"
                onClick={() => handleQuickFill('faculty@examsphere.edu', 'faculty123', 'FACULTY')}
                style={{
                  background: 'rgba(6, 182, 212, 0.15)',
                  border: '1px solid rgba(6, 182, 212, 0.5)',
                  color: '#67e8f9',
                  padding: '0.45rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.76rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span>⭐ <strong>Default Faculty:</strong> Dr. Shilpa Mahajan</span>
                <code style={{ fontSize: '0.72rem', opacity: 0.95, background: 'rgba(0,0,0,0.3)', padding: '2px 5px', borderRadius: '3px' }}>faculty@examsphere.edu</code>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('nishtha.gupta.24cse@bmu.edu.in', 'faculty123', 'FACULTY')}
                style={{
                  background: 'rgba(6, 182, 212, 0.1)',
                  border: '1px dashed rgba(6, 182, 212, 0.35)',
                  color: '#67e8f9',
                  padding: '0.45rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.76rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span>👩‍🏫 Prof. Nishtha Gupta (CSE)</span>
                <code style={{ fontSize: '0.72rem', opacity: 0.85 }}>nishtha.gupta.24cse@bmu.edu.in</code>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('prateek.garg.24cse@bmu.edu.in', 'faculty123', 'FACULTY')}
                style={{
                  background: 'rgba(6, 182, 212, 0.1)',
                  border: '1px dashed rgba(6, 182, 212, 0.35)',
                  color: '#67e8f9',
                  padding: '0.45rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.76rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span>👨‍🏫 Prof. Prateek Garg (CSE)</span>
                <code style={{ fontSize: '0.72rem', opacity: 0.85 }}>prateek.garg.24cse@bmu.edu.in</code>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('riwan.bhati.24cse@bmu.edu.in', 'faculty123', 'FACULTY')}
                style={{
                  background: 'rgba(6, 182, 212, 0.1)',
                  border: '1px dashed rgba(6, 182, 212, 0.35)',
                  color: '#67e8f9',
                  padding: '0.45rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.76rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span>👨‍🏫 Prof. Riwan Bhati (CSE)</span>
                <code style={{ fontSize: '0.72rem', opacity: 0.85 }}>riwan.bhati.24cse@bmu.edu.in</code>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('nischay.mehta.24cse@bmu.edu.in', 'faculty123', 'FACULTY')}
                style={{
                  background: 'rgba(6, 182, 212, 0.1)',
                  border: '1px dashed rgba(6, 182, 212, 0.35)',
                  color: '#67e8f9',
                  padding: '0.45rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.76rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span>👨‍🏫 Prof. Nischay Mehta (CSE)</span>
                <code style={{ fontSize: '0.72rem', opacity: 0.85 }}>nischay.mehta.24cse@bmu.edu.in</code>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
