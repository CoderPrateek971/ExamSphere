import React from 'react';
import { Trash2 } from 'lucide-react';

export default function RoomsTable({ data, loading, onDelete }) {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2.5rem', color: '#9ca3af' }}>
        Loading examination rooms...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2.5rem', color: '#6b7280' }}>
        No rooms found. Click <strong>"Upload ROOMS CSV"</strong> above to import.
      </div>
    );
  }

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Room Number</th>
          <th>Building</th>
          <th>Floor</th>
          <th>Capacity</th>
          <th>Grid (Rows x Cols)</th>
          <th>Camera Verified</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {data.map((item) => (
          <tr key={item.id}>
            <td><span className="badge badge-cyan">{item.room_number}</span></td>
            <td>{item.building}</td>
            <td>Floor {item.floor}</td>
            <td style={{ fontWeight: 700 }}>{item.capacity} seats</td>
            <td>{item.rows_count} × {item.cols_count}</td>
            <td>{item.has_camera ? '📹 Yes' : 'No'}</td>
            <td>
              <button
                className="btn btn-danger"
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
                onClick={() => onDelete(item.id)}
                title="Delete Room"
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
