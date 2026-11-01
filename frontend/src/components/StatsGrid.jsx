import React from 'react';
import { Users, GraduationCap, BookOpen, Building2, CalendarCheck } from 'lucide-react';

export default function StatsGrid({ stats }) {
  const cards = [
    {
      title: 'Students',
      value: stats?.students ?? 0,
      footer: 'Enrolled',
      icon: Users,
      color: '#edf2f7',
      iconColor: '#345c8c'
    },
    {
      title: 'Faculty',
      value: stats?.faculty ?? 0,
      footer: 'Available for duties',
      icon: GraduationCap,
      color: '#edf2f7',
      iconColor: '#345c8c'
    },
    {
      title: 'Courses',
      value: stats?.courses ?? 0,
      footer: 'In the catalogue',
      icon: BookOpen,
      color: '#edf2f7',
      iconColor: '#345c8c'
    },
    {
      title: 'Rooms',
      value: stats?.rooms ?? 0,
      footer: 'Available for exams',
      icon: Building2,
      color: '#edf2f7',
      iconColor: '#345c8c'
    },
    {
      title: 'Exams',
      value: stats?.exams ?? 0,
      footer: 'Scheduled',
      icon: CalendarCheck,
      color: '#edf2f7',
      iconColor: '#345c8c'
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
