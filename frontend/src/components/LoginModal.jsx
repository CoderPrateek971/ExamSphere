import React, { useState } from 'react';
import { Lock, Mail, AlertCircle, X, Sparkles, Shield, UserCheck, Eye, CheckCircle2 } from 'lucide-react';
import { api } from '../api';

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [selectedRole, setSelectedRole] = useState('ADMIN'); // 'ADMIN' or 'FACULTY'
  const [email, setEmail] = useState('admin@examsphere.edu');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSelectRole = (role) => {
    setSelectedRole(role);
    setError(null);
    if (role === 'ADMIN') {
      setEmail('admin@examsphere.edu');
      setPassword('admin123');
    } else {
      setEmail('rajesh.sharma@bmu.edu.in');
      setPassword('faculty123');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.login(email, password);
      api.setToken(res.data.token);
      api.setUser(res.data.user);
      onLoginSuccess(res.data.user);
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillFaculty = (facultyEmail, facultyPass = 'faculty123') => {
    setSelectedRole('FACULTY');
    setEmail(facultyEmail);
    setPassword(facultyPass);
    setError(null);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '480px', padding: '1.75rem' }}>
        <div className="modal-header" style={{ marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Sign In to ExamSphere
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Choose your portal role to access dedicated examination tools
            </p>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Portal Role Selector (Admin vs Invigilator/Faculty) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.5rem',
            background: 'rgba(0, 0, 0, 0.35)',
            padding: '0.35rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '1.25rem'
          }}
        >
          <button
            type="button"
            onClick={() => handleSelectRole('ADMIN')}
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
              gap: '0.5rem',
              transition: 'all 0.15s ease'
            }}
          >
            <Shield size={16} color={selectedRole === 'ADMIN' ? 'var(--primary)' : 'var(--text-dim)'} />
            <span>Admin Portal</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectRole('FACULTY')}
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
              gap: '0.5rem',
              transition: 'all 0.15s ease'
            }}
          >
            <Eye size={16} color={selectedRole === 'FACULTY' ? 'var(--accent-cyan)' : 'var(--text-dim)'} />
            <span>Invigilator / Faculty</span>
          </button>
        </div>

        {/* Portal Role Description Banner */}
        <div
          style={{
            padding: '0.65rem 0.85rem',
            borderRadius: 'var(--radius-sm)',
            background: selectedRole === 'ADMIN' ? 'rgba(99, 102, 241, 0.08)' : 'rgba(6, 182, 212, 0.08)',
            border: `1px solid ${selectedRole === 'ADMIN' ? 'rgba(99, 102, 241, 0.25)' : 'rgba(6, 182, 212, 0.25)'}`,
            fontSize: '0.76rem',
            color: selectedRole === 'ADMIN' ? '#a5b4fc' : '#67e8f9',
            marginBottom: '1.25rem',
            lineHeight: 1.4
          }}
        >
          {selectedRole === 'ADMIN' ? (
            <span>
              🛡️ <strong>Admin Access:</strong> Master Data, Anti-Cheating Seating Allocation (Module 4), System Audit Logs & Configuration.
            </span>
          ) : (
            <span>
              👁️ <strong>Invigilator Access:</strong> View Assigned Duties, Verify Student Identities & Record Live Attendance (Module 7).
            </span>
          )}
        </div>

        {error && (
          <div style={{ background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)', color: '#f43f5e', padding: '0.75rem', borderRadius: '8px', fontSize: '0.82rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={17} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem', display: 'block' }}>
              {selectedRole === 'ADMIN' ? 'Administrator Email' : 'Faculty / Invigilator Email'}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="form-control"
                placeholder={selectedRole === 'ADMIN' ? 'admin@examsphere.edu' : 'faculty@bmu.edu.in'}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.85rem' }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem', display: 'block' }}>
              Password
            </label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '0.6rem 0.85rem' }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '0.75rem',
              fontWeight: 700,
              background: selectedRole === 'ADMIN' ? 'var(--primary)' : 'var(--accent-cyan)',
              borderColor: selectedRole === 'ADMIN' ? 'var(--primary)' : 'var(--accent-cyan)'
            }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : `Sign In to ${selectedRole === 'ADMIN' ? 'Admin Portal' : 'Invigilator Portal'}`}
          </button>
        </form>

        {/* Quick Demo Accounts Selection */}
        <div style={{ marginTop: '1.35rem', paddingTop: '1.15rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-dim)', fontWeight: 700, marginBottom: '0.5rem', textAlign: 'center' }}>
            Quick Demo Accounts
          </div>

          {selectedRole === 'ADMIN' ? (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@examsphere.edu');
                  setPassword('admin123');
                  setError(null);
                }}
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
                <span>Fill Admin: admin@examsphere.edu / admin123</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <button
                type="button"
                onClick={() => fillFaculty('rajesh.sharma@bmu.edu.in', 'faculty123')}
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
                <span>👨‍🏫 Dr. Rajesh Sharma (CSE Prof)</span>
                <code style={{ fontSize: '0.72rem', opacity: 0.8 }}>rajesh.sharma@bmu.edu.in</code>
              </button>

              <button
                type="button"
                onClick={() => fillFaculty('priya.nair@bmu.edu.in', 'faculty123')}
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
                <span>👩‍🏫 Dr. Priya Nair (ECE Assoc Prof)</span>
                <code style={{ fontSize: '0.72rem', opacity: 0.8 }}>priya.nair@bmu.edu.in</code>
              </button>

              <button
                type="button"
                onClick={() => fillFaculty('invigilator@examsphere.edu', 'faculty123')}
                style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px dashed rgba(16, 185, 129, 0.35)',
                  color: '#6ee7b7',
                  padding: '0.45rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.76rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span>👁️ General Demo Invigilator</span>
                <code style={{ fontSize: '0.72rem', opacity: 0.8 }}>invigilator@examsphere.edu</code>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
