import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import StatsGrid from './components/StatsGrid';
import MasterDataView from './components/MasterDataView';
import SeatingAllocationView from './components/SeatingAllocationView';
import AuditLogsView from './components/AuditLogsView';
import DevSandboxView from './components/DevSandboxView';
import InvigilatorPortalView from './components/InvigilatorPortalView';
import PortalLoginView from './components/PortalLoginView';
import AdminAttendanceView from './components/AdminAttendanceView';
import { api } from './api';
import { Database, ShieldAlert, Cpu, Grid, Eye, LogOut, UserCheck, Camera } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('master-data');
  const [stats, setStats] = useState({ students: 0, faculty: 0, courses: 0, rooms: 0, exams: 0 });

  const loadStats = async () => {
    try {
      const res = await api.getSystemSummary();
      setStats(res.data);
    } catch (err) {
      console.log('Stats fetch note:', err.message);
    }
  };

  useEffect(() => {
    // Check saved user session
    const savedUser = api.getUser();
    if (savedUser && api.getToken()) {
      setUser(savedUser);
      if (savedUser.role === 'ADMIN') {
        loadStats();
      }
    }
  }, []);

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    if (loggedInUser.role === 'ADMIN') {
      loadStats();
    }
  };

  const handleLogout = () => {
    api.removeToken();
    setUser(null);
  };

  // 1. MUST LOG IN FIRST: If unauthenticated, show dedicated PortalLoginView
  if (!user) {
    return <PortalLoginView onLoginSuccess={handleLoginSuccess} />;
  }

  // 2. TEACHER / INVIGILATOR PORTAL: Completely separate portal, NOT under admin page
  if (user.role === 'FACULTY') {
    return (
      <div className="app-shell">
        <header className="app-header">
          <div className="brand-section">
            <div
              className="brand-logo"
              style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', boxShadow: '0 0 20px rgba(6, 182, 212, 0.35)' }}
            >
              <Eye size={22} color="#fff" />
            </div>
            <div className="brand-text">
              <h1>ExamSphere</h1>
              <p>Teacher Invigilation Portal</p>
            </div>
          </div>

          <div className="header-actions">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#10b981', marginRight: '0.5rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }}></span>
              Connected
            </div>

            <div className="user-badge" style={{ borderColor: 'rgba(6, 182, 212, 0.4)' }}>
              <UserCheck size={16} color="var(--accent-cyan)" />
              <div>
                <strong>{user.name}</strong>
                {user.department && (
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginLeft: '0.35rem' }}>
                    ({user.department})
                  </span>
                )}
              </div>
              <span
                className="role-pill"
                style={{
                  background: 'rgba(6, 182, 212, 0.2)',
                  color: '#67e8f9',
                  border: '1px solid rgba(6, 182, 212, 0.4)'
                }}
              >
                TEACHER
              </span>
            </div>

            <button className="btn btn-secondary" onClick={handleLogout} title="Sign Out">
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </header>

        <main className="main-content" style={{ maxWidth: '1400px', margin: '0 auto', width: '100%', padding: '1.5rem 2rem' }}>
          <InvigilatorPortalView user={user} onLogout={handleLogout} />
        </main>
      </div>
    );
  }

  // 3. ADMINISTRATOR CONTROL PANEL: All admin pages (Resource Data, Smart Seating, Audit Logs, Dev Hub)
  // Invigilator portal is NOT under this admin page!
  return (
    <div className="app-shell">
      <Navbar
        user={user}
        onLogout={handleLogout}
      />

      <main className="main-content">
        <StatsGrid stats={stats} />

        {/* Primary Admin Navigation Tabs */}
        <div className="nav-tabs">
          <button
            className={`tab-btn ${activeTab === 'master-data' ? 'active' : ''}`}
            onClick={() => setActiveTab('master-data')}
          >
            <Database size={16} />
            <span>Resource & Data (Module 2)</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'seating' ? 'active' : ''}`}
            onClick={() => setActiveTab('seating')}
          >
            <Grid size={16} />
            <span>Smart Seating (Module 4)</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => setActiveTab('attendance')}
          >
            <Camera size={16} />
            <span>Exam Attendance & Photos (Module 7)</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'audit-logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit-logs')}
          >
            <ShieldAlert size={16} />
            <span>System Audit Trail (Module 11)</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'dev-hub' ? 'active' : ''}`}
            onClick={() => setActiveTab('dev-hub')}
          >
            <Cpu size={16} />
            <span>Modules Hub (10 Modules)</span>
          </button>
        </div>

        {/* Admin Views */}
        {activeTab === 'master-data' && (
          <MasterDataView user={user} onDataChange={loadStats} />
        )}

        {activeTab === 'seating' && (
          <SeatingAllocationView user={user} />
        )}

        {activeTab === 'attendance' && (
          <AdminAttendanceView user={user} />
        )}

        {activeTab === 'audit-logs' && (
          <AuditLogsView />
        )}

        {activeTab === 'dev-hub' && (
          <DevSandboxView />
        )}
      </main>
    </div>
  );
}
