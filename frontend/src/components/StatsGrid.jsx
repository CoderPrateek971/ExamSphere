import React from 'react';
import { Users, GraduationCap, BookOpen, Building2, CalendarCheck } from 'lucide-react';

export default function StatsGrid({ stats }) {
  const cards = [
    {
      title: 'Enrolled Students',
      value: stats?.students ?? 0,
      footer: 'Active Candidate Master',
      icon: Users,
      color: 'rgba(99, 102, 241, 0.2)',
      iconColor: '#818cf8'
    },
    {
      title: 'Faculty / Invigilators',
      value: stats?.faculty ?? 0,
      footer: 'Eligible for Duty Assignment',
      icon: GraduationCap,
      color: 'rgba(16, 185, 129, 0.2)',
      iconColor: '#34d399'
    },
    {
      title: 'Active Courses',
      value: stats?.courses ?? 0,
      footer: 'With Difficulty Weights',
      icon: BookOpen,
      color: 'rgba(6, 182, 212, 0.2)',
      iconColor: '#38bdf8'
    },
    {
      title: 'Exam Rooms',
      value: stats?.rooms ?? 0,
      footer: 'Mapped Physical Capacity',
      icon: Building2,
      color: 'rgba(245, 158, 11, 0.2)',
      iconColor: '#fbbf24'
    },
    {
      title: 'Scheduled Exams',
      value: stats?.exams ?? 0,
      footer: 'Timetable Status',
      icon: CalendarCheck,
      color: 'rgba(244, 63, 94, 0.2)',
      iconColor: '#fb7185'
    }
  ];

  return (
    <div className="stats-grid">
      {cards.map((c, i) => {
        const IconComponent = c.icon;
        return (
          <div key={i} className="stat-card">
            <div className="stat-card-header">
              <span className="stat-title">{c.title}</span>
              <div className="stat-icon" style={{ background: c.color }}>
                <IconComponent size={20} color={c.iconColor} />
              </div>
            </div>
            <div className="stat-value">{c.value}</div>
            <div className="stat-card-footer">{c.footer}</div>
          </div>
        );
      })}
    </div>
  );
}
