import React from 'react';
import { Trash2 } from 'lucide-react';

export default function CoursesTable({ data, loading, onDelete }) {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2.5rem', color: '#9ca3af' }}>
        Loading courses...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2.5rem', color: '#6b7280' }}>
        No courses found. Click <strong>"Upload COURSES CSV"</strong> above to import.
      </div>
    );
  }

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Course Code</th>
          <th>Course Name</th>
          <th>Department</th>
          <th>Semester</th>
          <th>Difficulty (1-5)</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {data.map((item) => (
          <tr key={item.id}>
            <td><span className="badge badge-indigo">{item.course_code}</span></td>
            <td style={{ fontWeight: 600 }}>{item.course_name}</td>
            <td>{item.department}</td>
            <td>Sem {item.semester}</td>
            <td><span className="badge badge-amber">{item.difficulty_level} / 5</span></td>
            <td>
              <button
                className="btn btn-danger"
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
                onClick={() => onDelete(item.id)}
                title="Delete Course"
              >
                <Trash2 size={13} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
