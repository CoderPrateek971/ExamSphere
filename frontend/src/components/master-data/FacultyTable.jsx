import React from 'react';
import { Trash2 } from 'lucide-react';

export default function FacultyTable({ data, loading, onDelete }) {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2.5rem', color: '#9ca3af' }}>
        Loading faculty records...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2.5rem', color: '#6b7280' }}>
        No faculty found. Click <strong>"Upload FACULTY CSV"</strong> above to import.
      </div>
    );
  }

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Faculty Code</th>
          <th>Name</th>
          <th>Email Address</th>
          <th>Department</th>
          <th>Designation</th>
          <th>Seniority</th>
          <th>Max Duties</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {data.map((item) => (
          <tr key={item.id}>
            <td><span className="badge badge-emerald">{item.faculty_code}</span></td>
            <td style={{ fontWeight: 600 }}>{item.name}</td>
            <td>{item.email}</td>
            <td>{item.department}</td>
            <td>{item.designation}</td>
            <td>Lvl {item.seniority_level}</td>
            <td>{item.max_duties}</td>
            <td>
              <button
                className="btn btn-danger"
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
                onClick={() => onDelete(item.id)}
                title="Delete Faculty"
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
