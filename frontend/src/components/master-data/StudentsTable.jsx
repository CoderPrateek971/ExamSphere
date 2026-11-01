import React, { useState } from 'react';
import { Trash2, Filter } from 'lucide-react';

export default function StudentsTable({ data, loading, onDelete }) {
  const [selectedSemester, setSelectedSemester] = useState('ALL');

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2.5rem', color: '#9ca3af' }}>
        Loading student records...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2.5rem', color: '#6b7280' }}>
        No students found. Click <strong>"Upload STUDENTS (.xlsx / .csv)"</strong> above to import.
      </div>
    );
  }

  // Extract unique semesters
  const uniqueSemesters = Array.from(new Set(data.map(d => d.semester).filter(Boolean))).sort((a, b) => a - b);

  const filteredStudents = selectedSemester === 'ALL'
    ? data
    : data.filter(d => Number(d.semester) === Number(selectedSemester));

  return (
    <div>
      {/* Semester Quick Filter Bar */}
      {uniqueSemesters.length > 1 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          padding: '0.4rem 0.6rem',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: '#9ca3af', fontWeight: 600, marginRight: '0.4rem' }}>
            <Filter size={13} />
            <span>Filter Semester:</span>
          </div>

          <button
            onClick={() => setSelectedSemester('ALL')}
            style={{
              background: selectedSemester === 'ALL' ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
              color: selectedSemester === 'ALL' ? '#a5b4fc' : '#9ca3af',
              border: selectedSemester === 'ALL' ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
              padding: '0.25rem 0.65rem',
              borderRadius: '6px',
              fontSize: '0.76rem',
              fontWeight: selectedSemester === 'ALL' ? 700 : 500,
              cursor: 'pointer'
            }}
          >
            All Semesters ({data.length})
          </button>

          {uniqueSemesters.map(sem => {
            const count = data.filter(d => d.semester === sem).length;
            const isSelected = selectedSemester === String(sem);
            return (
              <button
                key={sem}
                onClick={() => setSelectedSemester(String(sem))}
                style={{
                  background: isSelected ? 'rgba(6, 182, 212, 0.25)' : 'transparent',
                  color: isSelected ? '#67e8f9' : '#9ca3af',
                  border: isSelected ? '1px solid rgba(6, 182, 212, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '6px',
                  fontSize: '0.76rem',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer'
                }}
              >
                Sem {sem} ({count})
              </button>
            );
          })}
        </div>
      )}

      <table className="data-table">
        <thead>
          <tr>
            <th>Enrollment No</th>
            <th>Full Name</th>
            <th>Email Address</th>
            <th>Department</th>
            <th>Semester</th>
            <th>Enrolled Subjects</th>
            <th>Program</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredStudents.map((item) => (
            <tr key={item.id}>
              <td><span className="badge badge-indigo">{item.enrollment_no}</span></td>
              <td style={{ fontWeight: 600 }}>{item.name}</td>
              <td>{item.email}</td>
              <td><span className="badge badge-cyan">{item.department}</span></td>
              <td>
                <span style={{
                  background: 'rgba(168, 85, 247, 0.15)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  color: '#c084fc',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 700
                }}>
                  Sem {item.semester}
                </span>
              </td>
              <td>
                <span className="badge badge-emerald" style={{ fontSize: '0.74rem' }}>
                  {item.enrolled_courses || 'None'}
                </span>
              </td>
              <td>{item.program}</td>
              <td>
                <button
                  className="btn btn-danger"
                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
                  onClick={() => onDelete(item.id)}
                  title="Delete Student"
                >
                  <Trash2 size={13} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
