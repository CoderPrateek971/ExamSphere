import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw } from 'lucide-react';
import { api } from '../api';

export default function AuditLogsView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.getAuditLogs();
      setLogs(res.data || []);
    } catch (err) {
      console.error(err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="panel-card">
      <div className="panel-header">
        <div className="panel-title">
          <h2>System Audit Trail</h2>
          <p>Module 11: Immutable log of administrative operations, data modifications, and security events</p>
        </div>

        <button className="btn btn-secondary" onClick={fetchLogs}>
          <RefreshCw size={15} />
          <span>Refresh Logs</span>
        </button>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Admin / User</th>
              <th>Module</th>
              <th>Action</th>
              <th>Operation Details</th>
              <th>Client IP</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                  Loading audit events...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: '#6b7280' }}>
                  No audit logs recorded yet. Changes to master data will automatically log here.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontFamily: 'JetBrains Mono', fontSize: '0.78rem', color: '#9ca3af' }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {log.user_name || 'System Admin'}
                    <span style={{ fontSize: '0.72rem', color: '#6b7280', display: 'block' }}>
                      {log.user_email}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-indigo">{log.module}</span>
                  </td>
                  <td>
                    <span className="badge badge-emerald">{log.action}</span>
                  </td>
                  <td style={{ maxWidth: '300px', wordBreak: 'break-word', color: '#e5e7eb' }}>
                    {log.details}
                  </td>
                  <td style={{ fontFamily: 'JetBrains Mono', fontSize: '0.78rem', color: '#6b7280' }}>
                    {log.ip_address || '127.0.0.1'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
