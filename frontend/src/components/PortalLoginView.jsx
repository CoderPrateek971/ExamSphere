import React, { useState } from 'react';
import {
  Shield,
  Eye,
  Lock,
  Mail,
  AlertCircle,
  Sparkles,
  Layers,
  ArrowRight,
  CheckCircle2,
  Users,
  GraduationCap
} from 'lucide-react';
import { api } from '../api';

export default function PortalLoginView({ onLoginSuccess }) {
  const [selectedPortal, setSelectedPortal] = useState('TEACHER'); // 'TEACHER' or 'ADMIN'
  const [email, setEmail] = useState('professor@examsphere.edu');
  const [password, setPassword] = useState('professor123');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePortalSwitch = (portal) => {
    setSelectedPortal(portal);
    setError(null);
    if (portal === 'ADMIN') {
      setEmail('admin@examsphere.edu');
      setPassword('admin123');
    } else {
      setEmail('professor@examsphere.edu');
      setPassword('professor123');
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
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillTeacher = (teacherEmail, teacherPass = 'faculty123') => {
    setSelectedPortal('TEACHER');
    setEmail(teacherEmail);
    setPassword(teacherPass);
    setError(null);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
        background: 'radial-gradient(ellipse at top, #0d1527 0%, #080c14 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background Glow Orbs */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          left: '20%',
          width: '500px',
          height: '500px',
          background: selectedPortal === 'TEACHER' ? 'rgba(6, 182, 212, 0.12)' : 'rgba(99, 102, 241, 0.12)',
          borderRadius: '50%',
          filter: 'blur(120px)',
          pointerEvents: 'none',
          transition: 'all 0.5s ease'
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-10%',
          right: '20%',
          width: '450px',
          height: '450px',
          background: 'rgba(139, 92, 246, 0.08)',
          borderRadius: '50%',
          filter: 'blur(120px)',
          pointerEvents: 'none'
        }}
      />

      {/* Main Header / Brand */}
      <div style={{ textAlign: 'center', marginBottom: '2rem', zIndex: 1 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '0.75rem'
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 25px rgba(99, 102, 241, 0.4)'
            }}
          >
            <Layers size={24} color="#fff" />
          </div>
          <h1
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              margin: 0,
              background: 'linear-gradient(120deg, #ffffff 40%, #a5b4fc)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            ExamSphere
          </h1>
        </div>
        <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Automated Examination Management & Teacher Invigilation Portal
        </p>
      </div>

      {/* Portal Selection Cards (Teacher Login vs Admin Login) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
          maxWidth: '680px',
          width: '100%',
          marginBottom: '1.5rem',
          zIndex: 1
        }}
      >
        {/* Teacher / Invigilator Option */}
        <div
          onClick={() => handlePortalSwitch('TEACHER')}
          style={{
            cursor: 'pointer',
            padding: '1.25rem 1.35rem',
            borderRadius: 'var(--radius-md)',
            background:
              selectedPortal === 'TEACHER'
                ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.16), rgba(59, 130, 246, 0.08))'
                : 'rgba(17, 24, 39, 0.65)',
            border: `2px solid ${selectedPortal === 'TEACHER' ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
            boxShadow: selectedPortal === 'TEACHER' ? '0 0 25px rgba(6, 182, 212, 0.25)' : 'none',
            transition: 'all 0.25s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: selectedPortal === 'TEACHER' ? 'rgba(6, 182, 212, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Eye size={20} color={selectedPortal === 'TEACHER' ? 'var(--accent-cyan)' : 'var(--text-dim)'} />
            </div>
            {selectedPortal === 'TEACHER' && (
              <span className="badge badge-cyan" style={{ fontSize: '0.7rem', fontWeight: 800 }}>
                SELECTED
              </span>
            )}
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.25rem 0' }}>
            Teacher / Invigilator Login
          </h3>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
            Sign in to view your individual classroom duties, verify student identities & mark attendance.
          </p>
        </div>

        {/* Administrator Option */}
        <div
          onClick={() => handlePortalSwitch('ADMIN')}
          style={{
            cursor: 'pointer',
            padding: '1.25rem 1.35rem',
            borderRadius: 'var(--radius-md)',
            background:
              selectedPortal === 'ADMIN'
                ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.16), rgba(168, 85, 247, 0.08))'
                : 'rgba(17, 24, 39, 0.65)',
            border: `2px solid ${selectedPortal === 'ADMIN' ? 'var(--primary)' : 'var(--border-subtle)'}`,
            boxShadow: selectedPortal === 'ADMIN' ? '0 0 25px rgba(99, 102, 241, 0.25)' : 'none',
            transition: 'all 0.25s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: selectedPortal === 'ADMIN' ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Shield size={20} color={selectedPortal === 'ADMIN' ? 'var(--primary)' : 'var(--text-dim)'} />
            </div>
            {selectedPortal === 'ADMIN' && (
              <span className="badge badge-indigo" style={{ fontSize: '0.7rem', fontWeight: 800 }}>
                SELECTED
              </span>
            )}
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.25rem 0' }}>
            Administrator Login
          </h3>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
            Sign in for master data, anti-cheating seating allocation engine, audit trails & system control.
          </p>
        </div>
      </div>

      {/* Login Form Container Card */}
      <div
        className="card"
        style={{
          maxWidth: '520px',
          width: '100%',
          padding: '2rem',
          background: 'rgba(17, 24, 39, 0.85)',
          backdropFilter: 'blur(16px)',
          border: `1px solid ${selectedPortal === 'TEACHER' ? 'rgba(6, 182, 212, 0.3)' : 'rgba(99, 102, 241, 0.3)'}`,
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
          zIndex: 1
        }}
      >
        <div style={{ marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            {selectedPortal === 'TEACHER' ? 'Teacher Invigilator Portal' : 'Administrator Control Panel'}
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {selectedPortal === 'TEACHER'
              ? 'Enter your institutional faculty email to view your individual exam duties.'
              : 'Enter your administrator credentials to manage examination operations.'}
          </p>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#f43f5e',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.82rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem', display: 'block' }}>
              {selectedPortal === 'TEACHER' ? 'Faculty / Teacher Email' : 'Administrator Email'}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="form-control"
                placeholder={selectedPortal === 'TEACHER' ? 'teacher@bmu.edu.in' : 'admin@examsphere.edu'}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 0.85rem' }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.35rem' }}>
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
              style={{ width: '100%', padding: '0.65rem 0.85rem' }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '0.8rem',
              fontSize: '0.92rem',
              fontWeight: 700,
              background: selectedPortal === 'TEACHER' ? 'linear-gradient(135deg, #06b6d4, #3b82f6)' : 'var(--primary)',
              borderColor: selectedPortal === 'TEACHER' ? '#06b6d4' : 'var(--primary)',
              boxShadow: selectedPortal === 'TEACHER' ? '0 0 20px rgba(6, 182, 212, 0.4)' : '0 0 20px var(--primary-glow)'
            }}
            disabled={loading}
          >
            {loading ? (
              'Authenticating...'
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>Sign In to {selectedPortal === 'TEACHER' ? 'Teacher Portal' : 'Admin Portal'}</span>
                <ArrowRight size={16} />
              </span>
            )}
          </button>
        </form>

        {/* Quick Demo Credential Buttons */}
        <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-dim)', fontWeight: 700, marginBottom: '0.65rem', textAlign: 'center' }}>
            {selectedPortal === 'TEACHER' ? 'Quick Login as Individual Teacher' : 'Quick Demo Administrator'}
          </div>

          {selectedPortal === 'TEACHER' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <button
                type="button"
                onClick={() => fillTeacher('professor@examsphere.edu', 'professor123')}
                style={{
                  background: 'rgba(6, 182, 212, 0.14)',
                  border: '1px solid rgba(6, 182, 212, 0.5)',
                  color: '#67e8f9',
                  padding: '0.55rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 0 12px rgba(6, 182, 212, 0.2)'
                }}
              >
                <span>⭐ 👨‍🏫 <strong>Prof. Vikram Malhotra</strong> (Chief Invigilator, CSE)</span>
                <span style={{ fontSize: '0.72rem', opacity: 0.95, fontFamily: 'monospace' }}>professor@examsphere.edu / professor123</span>
              </button>

              <button
                type="button"
                onClick={() => fillTeacher('rajesh.sharma@bmu.edu.in', 'faculty123')}
                style={{
                  background: 'rgba(6, 182, 212, 0.08)',
                  border: '1px dashed rgba(6, 182, 212, 0.35)',
                  color: '#67e8f9',
                  padding: '0.5rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>👨‍🏫 <strong>Dr. Rajesh Sharma</strong> (Professor, CSE)</span>
                <span style={{ fontSize: '0.72rem', opacity: 0.85 }}>rajesh.sharma@bmu.edu.in</span>
              </button>

              <button
                type="button"
                onClick={() => fillTeacher('priya.nair@bmu.edu.in', 'faculty123')}
                style={{
                  background: 'rgba(6, 182, 212, 0.08)',
                  border: '1px dashed rgba(6, 182, 212, 0.35)',
                  color: '#67e8f9',
                  padding: '0.5rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>👩‍🏫 <strong>Dr. Priya Nair</strong> (Assoc Prof, ECE)</span>
                <span style={{ fontSize: '0.72rem', opacity: 0.85 }}>priya.nair@bmu.edu.in</span>
              </button>

              <button
                type="button"
                onClick={() => fillTeacher('amit.verma@bmu.edu.in', 'faculty123')}
                style={{
                  background: 'rgba(6, 182, 212, 0.08)',
                  border: '1px dashed rgba(6, 182, 212, 0.35)',
                  color: '#67e8f9',
                  padding: '0.5rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>👨‍🏫 <strong>Prof. Amit Verma</strong> (Asst Prof, CSE)</span>
                <span style={{ fontSize: '0.72rem', opacity: 0.85 }}>amit.verma@bmu.edu.in</span>
              </button>

              <button
                type="button"
                onClick={() => fillTeacher('sunita.rao@bmu.edu.in', 'faculty123')}
                style={{
                  background: 'rgba(6, 182, 212, 0.08)',
                  border: '1px dashed rgba(6, 182, 212, 0.35)',
                  color: '#67e8f9',
                  padding: '0.5rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>👩‍🏫 <strong>Dr. Sunita Rao</strong> (Asst Prof, ME)</span>
                <span style={{ fontSize: '0.72rem', opacity: 0.85 }}>sunita.rao@bmu.edu.in</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@examsphere.edu');
                  setPassword('admin123');
                  setError(null);
                }}
                style={{
                  background: 'rgba(99, 102, 241, 0.12)',
                  border: '1px dashed rgba(99, 102, 241, 0.4)',
                  color: '#a5b4fc',
                  padding: '0.55rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem'
                }}
              >
                <Sparkles size={14} />
                <span>Fill Admin: admin@examsphere.edu / admin123</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
