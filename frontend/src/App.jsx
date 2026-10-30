import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import StatsGrid from './components/StatsGrid';
import MasterDataView from './components/MasterDataView';
import SeatingAllocationView from './components/SeatingAllocationView';
import AuditLogsView from './components/AuditLogsView';
import DevSandboxView from './components/DevSandboxView';
import ExamSchedulingView from './components/scheduling/ExamSchedulingView';
import FacultyDutyWorkloadView from './components/duty-management/FacultyDutyWorkloadView';
import ExamIncidentManagementView from './components/incident-management/ExamIncidentManagementView';
import InvigilatorPortalView from './components/InvigilatorPortalView';
import FacultyPortalView from './components/faculty/FacultyPortalView';
import PortalLoginView from './components/PortalLoginView';
import AdminAttendanceView from './components/AdminAttendanceView';
import AnalyticsReportsView from './components/AnalyticsReportsView';
import LoginModal from './components/LoginModal';
import { api } from './api';
import { Database, ShieldAlert, Cpu, Users, Gavel, FileText, Grid, Eye, LogOut, UserCheck, Camera, Calendar, HelpCircle, ArrowRight, CheckCircle2, BarChart3 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [switchTargetRole, setSwitchTargetRole] = useState(null);
  const [activeTab, setActiveTab] = useState('master-data');
  const [facultyTab, setFacultyTab] = useState('invigilation');
  const [stats, setStats] = useState({
    students: 0,
    faculty: 0,
    courses: 0,
    rooms: 0,
    exams: 0,
    seatingCount: 0,
    dutyCount: 0,
    incidentCount: 0
  });

  const loadStats = async () => {
    try {
      const res = await api.getSystemSummary();
      if (res.data) {
        setStats(res.data);
      }
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
    } else {
      // Default to admin session for instant out-of-the-box exploration
      const initialUser = {
        id: 1,
        name: 'Exam Controller Admin',
        email: 'admin@examsphere.edu',
        role: 'ADMIN',
        department: 'Examination Cell'
      };
      setUser(initialUser);
      api.setUser(initialUser);
      api.setToken('demo-jwt-token-active');
      loadStats();
    }
  }, []);

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    setSwitchTargetRole(null);
    setIsLoginOpen(false);
    if (loggedInUser.role === 'ADMIN') {
      loadStats();
    }
    setActiveTab(loggedInUser.role === 'ADMIN' ? 'master-data' : 'doubts');
    setFacultyTab('doubts');
  };

  const handleLogout = () => {
    api.removeToken();
    setUser(null);
    setSwitchTargetRole(null);
    setIsLoginOpen(false);
  };

  // Role switch handler: Open credentials login modal when switching to Faculty
  const handleRequestSwitchRole = (targetRole) => {
    if (targetRole === 'ADMIN') {
      const adminUser = {
        id: 1,
        name: 'Exam Controller Admin',
        email: 'admin@examsphere.edu',
        role: 'ADMIN',
        department: 'Examination Cell'
      };
      setUser(adminUser);
      api.setUser(adminUser);
      loadStats();
      return;
    }
    setSwitchTargetRole(targetRole);
    setIsLoginOpen(true);
  };

  // 1. MUST LOG IN FIRST: If unauthenticated, show dedicated PortalLoginView
  if (!user) {
    return (
      <>
        <PortalLoginView onLoginSuccess={handleLoginSuccess} />
        <LoginModal
          isOpen={isLoginOpen}
          onClose={() => {
            setIsLoginOpen(false);
            setSwitchTargetRole(null);
          }}
          onLoginSuccess={handleLoginSuccess}
          targetRole={switchTargetRole}
          currentRole={null}
        />
      </>
    );
  }

  // 2. TEACHER / INVIGILATOR PORTAL: Dedicated workspace for faculty/invigilators
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

            <button
              className="btn btn-secondary"
              onClick={() => handleRequestSwitchRole('ADMIN')}
              title="Switch to Admin Portal"
              style={{ marginRight: '0.5rem' }}
            >
              <span>Admin Portal</span>
            </button>

            <button className="btn btn-secondary" onClick={handleLogout} title="Sign Out">
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </header>

        <main className="main-content" style={{ maxWidth: '1400px', margin: '0 auto', width: '100%', padding: '1.5rem 2rem' }}>
          <div className="nav-tabs" style={{ marginBottom: '1.5rem' }}>
            <button
              className={`tab-btn ${facultyTab === 'doubts' ? 'active' : ''}`}
              onClick={() => setFacultyTab('doubts')}
            >
              <HelpCircle size={16} />
              <span>Faculty Portal & Doubt Resolution (Module 6)</span>
            </button>

            <button
              className={`tab-btn ${facultyTab === 'invigilation' ? 'active' : ''}`}
              onClick={() => setFacultyTab('invigilation')}
            >
              <Eye size={16} />
              <span>Invigilation & Attendance (Module 7)</span>
            </button>

            <button
              className={`tab-btn ${facultyTab === 'incident' ? 'active' : ''}`}
              onClick={() => setFacultyTab('incident')}
            >
              <FileText size={16} />
              <span>Submit Cheating Report (Module 8)</span>
            </button>
          </div>

          {facultyTab === 'doubts' && (
            <FacultyPortalView user={user} />
          )}

          {facultyTab === 'invigilation' && (
            <InvigilatorPortalView user={user} onLogout={handleLogout} />
          )}

          {facultyTab === 'incident' && (
            <ExamIncidentManagementView user={user} />
          )}
        </main>

        <LoginModal
          isOpen={isLoginOpen}
          onClose={() => {
            setIsLoginOpen(false);
            setSwitchTargetRole(null);
          }}
          onLoginSuccess={handleLoginSuccess}
          targetRole={switchTargetRole}
          currentRole={user?.role}
        />
      </div>
    );
  }

  // Workflow steps definition
  const WORKFLOW_STEPS = [
    { id: 'master-data', label: '1. Master Data', count: stats.courses > 0 ? `${stats.courses} Crs` : 'Empty', icon: Database },
    { id: 'scheduling', label: '2. Scheduling', count: stats.exams > 0 ? `${stats.exams} Exams` : 'Pending', icon: Calendar },
    { id: 'seating', label: '3. Seating', count: (stats.seatingCount || 0) > 0 ? `${stats.seatingCount} Placed` : 'Ready', icon: Grid },
    { id: 'duty-management', label: '4. Faculty Duty', count: (stats.dutyCount || 0) > 0 ? `${stats.dutyCount} Duties` : 'Roster', icon: Users },
    { id: 'attendance', label: '5. Attendance', count: 'Live Hall', icon: Camera },
    { id: 'incident-management', label: '6. Cheating (UFM)', count: (stats.incidentCount || 0) > 0 ? `${stats.incidentCount} Cases` : 'Reports', icon: FileText }
  ];

  // 3. ADMINISTRATOR CONTROL PANEL: All administrator modules in end-to-end lifecycle order
  return (
    <div className="app-shell">
      <Navbar
        user={user}
        onOpenLogin={() => {
          setSwitchTargetRole(null);
          setIsLoginOpen(true);
        }}
        onLogout={handleLogout}
        onSwitchRole={handleRequestSwitchRole}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="main-content">
        <StatsGrid stats={stats} />

        {/* Global End-to-End Workflow Pipeline Tracker */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '0.65rem 1rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          overflowX: 'auto',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 'max-content' }}>
            <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af', fontWeight: 700, marginRight: '0.5rem' }}>
              Exam Lifecycle Pipeline:
            </span>

            {WORKFLOW_STEPS.map((step, idx) => {
              const StepIcon = step.icon;
              const isActive = activeTab === step.id;
              return (
                <React.Fragment key={step.id}>
                  <button
                    onClick={() => setActiveTab(step.id)}
                    style={{
                      background: isActive ? 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(6,182,212,0.25))' : 'rgba(255,255,255,0.03)',
                      border: isActive ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '8px',
                      padding: '0.4rem 0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      cursor: 'pointer',
                      color: isActive ? '#fff' : '#9ca3af',
                      fontSize: '0.8rem',
                      fontWeight: isActive ? 700 : 500,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <StepIcon size={14} color={isActive ? '#818cf8' : '#6b7280'} />
                    <span>{step.label}</span>
                    <span style={{
                      fontSize: '0.68rem',
                      padding: '0.15rem 0.4rem',
                      borderRadius: '4px',
                      background: isActive ? '#6366f1' : 'rgba(255,255,255,0.08)',
                      color: isActive ? '#fff' : '#d1d5db'
                    }}>
                      {step.count}
                    </span>
                  </button>

                  {idx < WORKFLOW_STEPS.length - 1 && (
                    <ArrowRight size={13} color="rgba(255,255,255,0.25)" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Primary Admin Navigation Tabs in Sequential Lifecycle Order */}
        <div className="nav-tabs">
          {/* Step 1: Master Data */}
          <button
            className={`tab-btn ${activeTab === 'master-data' ? 'active' : ''}`}
            onClick={() => setActiveTab('master-data')}
          >
            <Database size={16} />
            <span>Step 1: Resource & Master Data</span>
          </button>

          {/* Step 2: Exam Scheduling & Timetable */}
          <button
            className={`tab-btn ${activeTab === 'scheduling' ? 'active' : ''}`}
            onClick={() => setActiveTab('scheduling')}
          >
            <Calendar size={16} />
            <span>Step 2: Exam Scheduling (Timetable)</span>
          </button>

          {/* Step 3: Smart Room & Seating Allocation */}
          <button
            className={`tab-btn ${activeTab === 'seating' ? 'active' : ''}`}
            onClick={() => setActiveTab('seating')}
          >
            <Grid size={16} />
            <span>Step 3: Smart Seating Allocation</span>
          </button>

          {/* Step 4: Faculty Duty & Workload Management */}
          <button
            className={`tab-btn ${activeTab === 'duty-management' ? 'active' : ''}`}
            onClick={() => setActiveTab('duty-management')}
          >
            <Users size={16} />
            <span>Step 4: Faculty Duty & Workload</span>
          </button>

          {/* Step 5: Exam Attendance & Photos */}
          <button
            className={`tab-btn ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => setActiveTab('attendance')}
          >
            <Camera size={16} />
            <span>Step 5: Exam Attendance & Photos</span>
          </button>

          {/* Step 6: Exam-Day Incident Management */}
          <button
            className={`tab-btn ${activeTab === 'incident-management' ? 'active' : ''}`}
            onClick={() => setActiveTab('incident-management')}
          >
            <FileText size={16} />
            <span>Step 6: Cheating & Incidents (UFM)</span>
          </button>

          {/* Module 10: Analytics & Reports */}
          <button
            className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <BarChart3 size={16} />
            <span>Analytics & Reports (Module 10)</span>
          </button>

          {/* Module 11: Audit Trail & Security */}
          <button
            className={`tab-btn ${activeTab === 'audit-logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit-logs')}
          >
            <ShieldAlert size={16} />
            <span>Audit Trail & Security</span>
          </button>

          {/* Dev Hub: Modules Hub */}
          <button
            className={`tab-btn ${activeTab === 'dev-hub' ? 'active' : ''}`}
            onClick={() => setActiveTab('dev-hub')}
          >
            <Cpu size={16} />
            <span>System Modules Hub</span>
          </button>
        </div>

        {/* Dynamic Tab Views with Integrated Inter-Page Workflow Handlers */}
        {activeTab === 'master-data' && (
          <MasterDataView 
            user={user} 
            onDataChange={loadStats} 
            onNavigateToStep={setActiveTab} 
          />
        )}

        {activeTab === 'scheduling' && (
          <ExamSchedulingView 
            user={user} 
            onNavigateToStep={setActiveTab} 
          />
        )}

        {activeTab === 'seating' && (
          <SeatingAllocationView 
            user={user} 
            onNavigateToStep={setActiveTab} 
          />
        )}

        {activeTab === 'duty-management' && (
          <FacultyDutyWorkloadView 
            user={user} 
            onNavigateToStep={setActiveTab} 
          />
        )}

        {activeTab === 'attendance' && (
          <AdminAttendanceView 
            user={user} 
            onNavigateToStep={setActiveTab} 
          />
        )}

        {activeTab === 'incident-management' && (
          <ExamIncidentManagementView 
            user={user} 
            onNavigateToStep={setActiveTab} 
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsReportsView user={user} />
        )}

        {activeTab === 'audit-logs' && (
          <AuditLogsView />
        )}

        {activeTab === 'dev-hub' && (
          <DevSandboxView />
        )}
      </main>

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => {
          setIsLoginOpen(false);
          setSwitchTargetRole(null);
        }}
        onLoginSuccess={handleLoginSuccess}
        targetRole={switchTargetRole}
        currentRole={user?.role}
      />
    </div>
  );
}
