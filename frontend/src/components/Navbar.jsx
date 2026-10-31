import React from 'react';
import { LogOut, Layers } from 'lucide-react';

export default function Navbar({
  user,
  onLogout,
}) {
  return (
    <header className="app-header">
      <div className="brand-section">
        <div className="brand-logo">
          <Layers size={22} />
        </div>

        <div className="brand-text">
          <h1>ExamSphere</h1>
          <p>Examination management</p>
        </div>
      </div>

      <div className="header-actions">
        {user ? (
          <>
            <div className="header-user">
              <span>{user.name || 'User'}</span>
              <span className="header-role">{user.role || 'USER'}</span>
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
        ) : null}
      </div>
    </header>
  );
}

