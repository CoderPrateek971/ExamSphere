import React from 'react';
import { CheckCircle2, Clock, Terminal, Cpu, Users, Bell, FileSpreadsheet, AlertTriangle } from 'lucide-react';

export default function DevSandboxView() {
  const modules = [
    {
      id: 'M1',
      name: 'Authentication & Role-Based Access Control',
      member: 'Member 1 (You)',
      status: 'COMPLETED & LIVE',
      endpoints: ['POST /api/auth/login', 'POST /api/auth/register', 'GET /api/auth/me'],
      icon: CheckCircle2,
      color: '#10b981'
    },
    {
      id: 'M2',
      name: 'Master Data CRUD & Bulk CSV Ingestion',
      member: 'Member 1 (You)',
      status: 'COMPLETED & LIVE',
      endpoints: ['GET/POST /api/master-data/:type', 'POST /api/master-data/upload-csv/:type'],
      icon: CheckCircle2,
      color: '#10b981'
    },
    {
      id: 'M11',
      name: 'System Admin, Audit Logs & DB Health',
      member: 'Member 1 (You)',
      status: 'COMPLETED & LIVE',
      endpoints: ['GET /api/admin/audit-logs', 'GET /api/admin/system-summary'],
      icon: CheckCircle2,
      color: '#10b981'
    },
    {
      id: 'M3',
      name: 'Exam Scheduling & Timetable Generation',
      member: 'Member 2',
      status: 'Ready for Member 2 code',
      endpoints: ['POST /api/exams/schedule', 'GET /api/exams/conflicts'],
      icon: Clock,
      color: '#f59e0b'
    },
    {
      id: 'M4',
      name: 'Room & Anti-Cheating Seating Allocation Engine',
      member: 'Member 2',
      status: 'Ready for Member 2 code',
      endpoints: ['POST /api/allocations/seating', 'GET /api/allocations/:examId'],
      icon: Clock,
      color: '#f59e0b'
    },
    {
      id: 'M5',
      name: 'Faculty Duty Allocation & Workload Balancer',
      member: 'Member 2',
      status: 'Ready for Member 2 code',
      endpoints: ['POST /api/duty/allocate', 'GET /api/duty/faculty/:id'],
      icon: Clock,
      color: '#f59e0b'
    },
    {
      id: 'M6',
      name: 'Dynamic Hall Ticket & Seating Slips Engine',
      member: 'Member 3',
      status: 'Ready for Member 3 code',
      endpoints: ['GET /api/hall-tickets/:examId/:studentId', 'POST /api/hall-tickets/generate-bulk'],
      icon: Clock,
      color: '#06b6d4'
    },
    {
      id: 'M7',
      name: 'Invigilator Portal & Camera Attendance',
      member: 'Member 3',
      status: 'Ready for Member 3 code',
      endpoints: ['GET /api/invigilator/students', 'POST /api/attendance/verify'],
      icon: Clock,
      color: '#06b6d4'
    },
    {
      id: 'M8',
      name: 'Exam-Day Incident Management (UFM & Doubts)',
      member: 'Member 3',
      status: 'Ready for Member 3 code',
      endpoints: ['POST /api/ufm/report', 'POST /api/doubts/ping', 'POST /api/substitute/find'],
      icon: Clock,
      color: '#06b6d4'
    },
    {
      id: 'M9',
      name: 'Notification & Email Dispatcher',
      member: 'Member 4',
      status: 'Ready for Member 4 code',
      endpoints: ['POST /api/notifications/hall-ticket', 'POST /api/notifications/duty-alert'],
      icon: Clock,
      color: '#8b5cf6'
    },
    {
      id: 'M10',
      name: 'Analytics & Reporting Engine',
      member: 'Member 4',
      status: 'Ready for Member 4 code',
      endpoints: ['GET /api/analytics/room-utilization', 'GET /api/analytics/attendance-stats'],
      icon: Clock,
      color: '#8b5cf6'
    }
  ];

  return (
    <div className="panel-card">
      <div className="panel-header">
        <div className="panel-title">
          <h2>Team Architecture & Module Hub</h2>
          <p>Real-time module status across all 4 group members mapped to SRS specifications</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        {modules.map((m) => {
          const IconComp = m.icon;
          return (
            <div
              key={m.id}
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: '12px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.75rem'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#a5b4fc' }}>{m.id}</span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.5rem',
                      borderRadius: '6px',
                      background: m.status.includes('LIVE') ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                      color: m.status.includes('LIVE') ? '#34d399' : '#fbbf24',
                      border: `1px solid ${m.status.includes('LIVE') ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`
                    }}
                  >
                    {m.status}
                  </span>
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#f3f4f6' }}>{m.name}</h4>
                <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                  Assigned to: <strong style={{ color: '#e5e7eb' }}>{m.member}</strong>
                </div>
              </div>

              <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '0.6rem', borderRadius: '8px', fontSize: '0.74rem', fontFamily: 'JetBrains Mono', color: '#9ca3af' }}>
                {m.endpoints.map((ep, i) => (
                  <div key={i}>{ep}</div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
