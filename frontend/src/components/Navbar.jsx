import React from 'react';
import {
  ShieldCheck,
  LogIn,
  LogOut,
  Layers,
  UserCheck
} from 'lucide-react';

export default function Navbar({
  user,
  onOpenLogin,
  onLogout,
  activeTab,
  setActiveTab
}) {
  const isFaculty = user?.role === 'FACULTY';

  return (
    <header className="app-header">
      <div className="brand-section">
        <div className="brand-logo">
          <Layers size={22} />
        </div>

        <div className="brand-text">
          <h1>ExamSphere</h1>
          <p>Automated Exam Management System</p>
        </div>
      </div>

      <div className="header-actions">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.8rem',
            color: '#10b981',
            marginRight: '0.5rem'
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#10b981',
              display: 'inline-block',
              boxShadow: '0 0 8px #10b981'
            }}
          />
          System Online
        </div>

        {user ? (
          <>
            {/* Current user and role */}
            <div
              className="user-badge"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {isFaculty ? (
                <UserCheck size={16} color="#38bdf8" />
              ) : (
                <ShieldCheck size={16} color="#6366f1" />
              )}

              <span style={{ fontWeight: 600 }}>
                {user.name || 'User'}
              </span>

              <span
                className="badge"
                style={{
                  fontSize: '0.68rem',
                  padding: '0.15rem 0.45rem',
                  background: isFaculty
                    ? 'rgba(56, 189, 248, 0.2)'
                    : 'rgba(99, 102, 241, 0.2)',
                  color: isFaculty ? '#38bdf8' : '#a5b4fc',
                  border: `1px solid ${
                    isFaculty
                      ? 'rgba(56, 189, 248, 0.4)'
                      : 'rgba(99, 102, 241, 0.4)'
                  }`,
                  fontWeight: 800
                }}
              >
                {user.role || 'USER'}
              </span>
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={onLogout}
              title="Log Out"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </>
        ) : (
          <button
            type="button"
            className="btn btn-primary"
            onClick={onOpenLogin}
          >
            <LogIn size={16} />
            <span>Login / Select Role</span>
          </button>
        )}
      </div>
    </header>
  );
}

