import React from 'react';
import { CheckCircle2, Clock, Terminal, Cpu, Users, Bell, FileSpreadsheet, AlertTriangle } from 'lucide-react';

export default function DevSandboxView() {
  const modules = [
    {
      id: '1',
      name: 'Authentication & Role Management',
      description: 'Login, JWT authentication, role-based access for Admin, Faculty, Invigilator and Student.',
      status: 'COMPLETED & LIVE',
      endpoints: ['POST /api/auth/login', 'POST /api/auth/register', 'GET /api/auth/me'],
      icon: CheckCircle2,
      color: '#10b981'
    },
    {
      id: '2',
      name: 'Resource & Data Management',
      description: 'Student, faculty, course and room CRUD operations; CSV bulk upload and data validation.',
      status: 'COMPLETED & LIVE',
      endpoints: ['GET/POST /api/master-data/:type', 'POST /api/master-data/upload-csv/:type'],
      icon: CheckCircle2,
      color: '#10b981'
    },
    {
      id: '3',
      name: 'Exam Scheduling',
      description: 'Create examinations, generate timetables and detect scheduling conflicts.',
      status: 'Ready for Implementation',
      endpoints: ['GET /api/scheduling/exams', 'POST /api/scheduling/generate', 'GET /api/scheduling/conflicts'],
      icon: Clock,
      color: '#06b6d4'
    },
    {
      id: '4',
      name: 'Smart Room & Seating Allocation',
      description: 'Allocate rooms based on capacity, assign student seats and apply anti-cheating seating rules.',
      status: 'Ready for Implementation',
      endpoints: ['POST /api/seating/allocate', 'GET /api/seating/exam/:examId', 'GET /api/seating/room/:roomId/grid'],
      icon: Clock,
      color: '#06b6d4'
    },
    {
      id: '5',
      name: 'Faculty Duty & Workload Management',
      description: 'Assign invigilators to rooms and time slots, check faculty availability and balance workloads.',
      status: 'COMPLETED & LIVE',
      endpoints: ['POST /api/duty/auto-allocate', 'GET /api/duty/roster', 'GET /api/duty/workload-stats'],
      icon: CheckCircle2,
      color: '#10b981'
    },
    {
      id: '6',
      name: 'Faculty Portal & Doubt Resolution',
      description: 'Allow faculty to view examination schedules and assigned duties, receive student doubt requests and respond to them.',
      status: 'Ready for Implementation',
      endpoints: ['GET /api/faculty/duties', 'GET /api/doubts/stream', 'PUT /api/doubts/:id/resolve'],
      icon: Clock,
      color: '#06b6d4'
    },
    {
      id: '7',
      name: 'Invigilator Portal & Attendance',
      description: 'View assigned duties, verify student identities, perform camera-based face matching and record attendance.',
      status: 'Ready for Implementation',
      endpoints: ['GET /api/invigilator/students', 'POST /api/attendance/verify'],
      icon: Clock,
      color: '#06b6d4'
    },
    {
      id: '8',
      name: 'Exam-Day Incident Management',
      description: 'Submit Unfair Means (UFM) reports with photo evidence and written statements, manage incident records and find substitute invigilators.',
      status: 'Ready for Implementation',
      endpoints: ['POST /api/ufm/report', 'POST /api/doubts/ping', 'POST /api/substitute/find'],
      icon: Clock,
      color: '#06b6d4'
    },
    {
      id: '9',
      name: 'Notification & Alert System',
      description: 'Send student examination and seating emails, faculty duty notifications and emergency alerts; track notification status.',
      status: 'Ready for Implementation',
      endpoints: ['POST /api/notifications/hall-ticket', 'POST /api/notifications/duty-alert'],
      icon: Clock,
      color: '#8b5cf6'
    },
    {
      id: '10',
      name: 'Analytics & Reports',
      description: 'Generate attendance statistics, room utilization reports, faculty workload reports and UFM summaries for administrators.',
      status: 'Ready for Implementation',
      endpoints: ['GET /api/analytics/room-utilization', 'GET /api/analytics/attendance-stats'],
      icon: Clock,
      color: '#8b5cf6'
    }
  ];

  return (
    <div className="panel-card">
      <div className="panel-header">
        <div className="panel-title">
          <h2>System Architecture & Modules Hub</h2>
          <p>Official 10-module system specifications, status, and API contracts</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        {modules.map((m) => {
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
                gap: '0.85rem'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#a5b4fc' }}>Module {m.id}</span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.5rem',
                      borderRadius: '6px',
                      background: m.status.includes('LIVE') ? 'rgba(16,185,129,0.15)' : 'rgba(6,182,212,0.12)',
                      color: m.status.includes('LIVE') ? '#34d399' : '#22d3ee',
                      border: `1px solid ${m.status.includes('LIVE') ? 'rgba(16,185,129,0.3)' : 'rgba(6,182,212,0.25)'}`
                    }}
                  >
                    {m.status}
                  </span>
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#f3f4f6' }}>{m.name}</h4>
                <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.4rem', lineHeight: '1.4' }}>
                  {m.description}
                </p>
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
