import React from 'react';
import { ShieldCheck, LogOut, Layers } from 'lucide-react';

export default function Navbar({ user, onLogout }) {
  return (
    <header className="app-header">
      <div className="brand-section">
        <div className="brand-logo">
          <Layers size={22} />
        </div>
        <div className="brand-text">
          <h1>ExamSphere</h1>
          <p>Administrator Control Center</p>
        </div>
      </div>

      <div className="header-actions">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#10b981', marginRight: '0.5rem' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }}></span>
          Backend :5000 Live
        </div>

        <div className="user-badge">
          <ShieldCheck size={16} color="#6366f1" />
          <span>{user?.name || 'Administrator'}</span>
          <span className="role-pill admin">ADMIN</span>
        </div>

        <button className="btn btn-secondary" onClick={onLogout} title="Log Out">
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
