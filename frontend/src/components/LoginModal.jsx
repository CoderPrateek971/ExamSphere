import React, { useState, useEffect } from 'react';
import { Lock, Mail, AlertCircle, X, UserCheck, ShieldCheck, User, KeyRound, ShieldAlert } from 'lucide-react';
import { api } from '../api';

export default function LoginModal({ isOpen, onClose, onLoginSuccess, targetRole, currentRole }) {
  const isSwitchMode = Boolean(targetRole);
  const [selectedRole, setSelectedRole] = useState(targetRole || 'ADMIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setPassword('');
      const roleToUse = targetRole || 'ADMIN';
      setSelectedRole(roleToUse);
      if (roleToUse === 'FACULTY') {
        setEmail('faculty@examsphere.edu');
      } else {
        setEmail('admin@examsphere.edu');
      }
    }
  }, [isOpen, targetRole]);

  if (!isOpen) return null;

  const handleRoleTabChange = (role) => {
    if (isSwitchMode) return; // Locked in switch verification mode
    setSelectedRole(role);
    setError(null);
    setPassword('');
    if (role === 'FACULTY') {
      setEmail('faculty@examsphere.edu');
    } else {
      setEmail('admin@examsphere.edu');
    }
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
        setError(`Access Denied: The entered account has role '${authenticatedUser.role}', but '${targetRole}' credentials are required to complete this switch.`);
        setLoading(false);
        return;
      }

      api.setToken(res.data.token);
      api.setUser(authenticatedUser);
      onLoginSuccess(authenticatedUser);
      onClose();
    } catch (err) {
      // STRICT SECURITY: Wrong credentials must block the switch!
      console.warn('Authentication failed:', err.message);
      setError(err.message || 'Invalid email or password. Please verify your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: (targetRole || selectedRole) === 'ADMIN' ? 'rgba(99, 102, 241, 0.18)' : 'rgba(56, 189, 248, 0.18)',
              border: `1px solid ${(targetRole || selectedRole) === 'ADMIN' ? 'rgba(99, 102, 241, 0.4)' : 'rgba(56, 189, 248, 0.4)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Lock size={18} color={(targetRole || selectedRole) === 'ADMIN' ? '#818cf8' : '#38bdf8'} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>
                {isSwitchMode 
                  ? `Security Check: Switch to ${targetRole === 'ADMIN' ? 'Administrator' : 'Faculty'}`
                  : 'Sign In to ExamSphere'}
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.2rem', marginBottom: 0 }}>
                {isSwitchMode
                  ? `Enter ${targetRole === 'ADMIN' ? 'Administrator' : 'Faculty'} login credentials to proceed`
                  : 'Select your university role and authenticate to access modules'}
              </p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose} title="Cancel and close"><X size={20} /></button>
        </div>

        {/* Security Alert Badge */}
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

        {/* Role Selector Tabs */}
        {!isSwitchMode ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.5rem',
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '0.35rem',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: '1.25rem'
          }}>
            <button
              type="button"
              onClick={() => handleRoleTabChange('ADMIN')}
              style={{
                padding: '0.65rem 0.75rem',
                borderRadius: '8px',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: selectedRole === 'ADMIN' ? '1px solid #6366f1' : '1px solid transparent',
                background: selectedRole === 'ADMIN' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                color: selectedRole === 'ADMIN' ? '#fff' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                transition: 'all 0.15s ease'
              }}
            >
              <ShieldCheck size={16} color={selectedRole === 'ADMIN' ? '#818cf8' : 'var(--text-muted)'} />
              <span>Administrator</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleTabChange('FACULTY')}
              style={{
                padding: '0.65rem 0.75rem',
                borderRadius: '8px',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: selectedRole === 'FACULTY' ? '1px solid #38bdf8' : '1px solid transparent',
                background: selectedRole === 'FACULTY' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                color: selectedRole === 'FACULTY' ? '#fff' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                transition: 'all 0.15s ease'
              }}
            >
              <User size={16} color={selectedRole === 'FACULTY' ? '#38bdf8' : 'var(--text-muted)'} />
              <span>Faculty / Invigilator</span>
            </button>
          </div>
        ) : (
          <div style={{
            background: targetRole === 'ADMIN' ? 'rgba(99, 102, 241, 0.12)' : 'rgba(56, 189, 248, 0.12)',
            border: `1px solid ${targetRole === 'ADMIN' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(56, 189, 248, 0.3)'}`,
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
                <User size={16} color="#38bdf8" />
              )}
              <span>Switching to: <strong>{targetRole === 'ADMIN' ? 'Administrator' : 'Faculty Invigilator'}</strong></span>
            </div>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '0.2rem 0.5rem',
              borderRadius: '6px',
              background: targetRole === 'ADMIN' ? 'rgba(99, 102, 241, 0.25)' : 'rgba(56, 189, 248, 0.25)',
              color: targetRole === 'ADMIN' ? '#a5b4fc' : '#7dd3fc',
              border: `1px solid ${targetRole === 'ADMIN' ? 'rgba(99, 102, 241, 0.4)' : 'rgba(56, 189, 248, 0.4)'}`
            }}>
              REQUIRED
            </span>
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
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Mail size={14} color="#94a3b8" />
              {(targetRole || selectedRole) === 'ADMIN' ? 'Administrator Email' : 'Faculty University Email'}
            </label>
            <input
              type="email"
              className="form-control"
              placeholder={(targetRole || selectedRole) === 'ADMIN' ? 'admin@examsphere.edu' : 'faculty@examsphere.edu'}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus={!isSwitchMode}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <KeyRound size={14} color="#94a3b8" />
              Password
            </label>
            <input
              type="password"
              className="form-control"
              placeholder={`Enter ${(targetRole || selectedRole) === 'ADMIN' ? 'Admin' : 'Faculty'} password`}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus={isSwitchMode}
            />
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
              style={{ flex: 2, justifyContent: 'center', padding: '0.7rem' }}
              disabled={loading}
            >
              {loading ? (
                'Verifying Credentials...'
              ) : isSwitchMode ? (
                `Verify & Switch to ${targetRole === 'ADMIN' ? 'Administrator' : 'Faculty'}`
              ) : (
                `Sign In as ${selectedRole === 'ADMIN' ? 'Administrator' : 'Faculty'}`
              )}
            </button>
          </div>
        </form>

        {/* Security Credentials Reference (Clean helper, strictly requiring password entry) */}
        <div style={{
          marginTop: '1.2rem',
          paddingTop: '0.9rem',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          fontSize: '0.73rem',
          color: '#94a3b8',
          lineHeight: '1.45',
          textAlign: 'center'
        }}>
          <div><strong>University Demo Credentials:</strong></div>
          <div style={{ marginTop: '0.2rem' }}>
            Admin: <code style={{ color: '#a5b4fc', background: 'rgba(99,102,241,0.15)', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>admin@examsphere.edu</code> / <code style={{ color: '#a5b4fc', background: 'rgba(99,102,241,0.15)', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>admin123</code>
          </div>
          <div style={{ marginTop: '0.2rem' }}>
            Faculty: <code style={{ color: '#7dd3fc', background: 'rgba(56,189,248,0.15)', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>faculty@examsphere.edu</code> / <code style={{ color: '#7dd3fc', background: 'rgba(56,189,248,0.15)', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>faculty123</code>
          </div>
        </div>
      </div>
    </div>
  );
}
