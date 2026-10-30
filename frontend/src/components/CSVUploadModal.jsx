import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle, AlertCircle, X, FileSpreadsheet } from 'lucide-react';
import { api } from '../api';

export default function CSVUploadModal({ isOpen, onClose, entityType, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      const ext = '.' + selected.name.split('.').pop().toLowerCase();
      const validExtensions = ['.csv', '.xlsx', '.xls'];
      if (!validExtensions.includes(ext)) {
        setError('Only Excel (.xlsx, .xls) and CSV (.csv) files are supported.');
        return;
      }
      setFile(selected);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.uploadCSV(entityType, file);
      setResult(res.summary);
      onUploadSuccess();
    } catch (err) {
      setError(err.message || 'Spreadsheet ingestion failed');
    } finally {
      setLoading(false);
    }
  };

  const isExcel = file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'));

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <div>
            <h3>Bulk Spreadsheet Ingestion</h3>
            <p style={{ fontSize: '0.82rem', color: '#9ca3af' }}>
              Upload master records for <strong style={{ color: '#818cf8', textTransform: 'capitalize' }}>{entityType}</strong> in Excel (.xlsx) or CSV (.csv)
            </p>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {error && (
          <div style={{ background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)', color: '#f43f5e', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {result ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <CheckCircle size={48} color="#10b981" style={{ margin: '0 auto 1rem auto' }} />
            <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Ingestion Completed!</h4>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', margin: '1rem 0' }}>
              <div style={{ background: 'rgba(16,185,129,0.1)', padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.3)' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399' }}>{result.insertedOrUpdated}</div>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Inserted / Updated</div>
              </div>
              <div style={{ background: 'rgba(244,63,94,0.1)', padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid rgba(244,63,94,0.3)' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fb7185' }}>{result.failedRowsCount}</div>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Errors</div>
              </div>
            </div>
            {result.sheetSummary && (
              <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: '1rem' }}>
                Sheets processed: {result.sheetSummary.courses} courses, {result.sheetSummary.rooms} rooms, {result.sheetSummary.faculty} faculty.
              </div>
            )}
            <button className="btn btn-primary" onClick={onClose} style={{ marginTop: '0.5rem' }}>
              Done & View Records
            </button>
          </div>
        ) : (
          <>
            <div
              className="dropzone"
              onClick={() => fileInputRef.current?.click()}
            >
              {isExcel ? (
                <FileSpreadsheet size={40} color="#10b981" style={{ margin: '0 auto 0.75rem auto' }} />
              ) : (
                <UploadCloud size={40} color="#6366f1" style={{ margin: '0 auto 0.75rem auto' }} />
              )}
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                {file ? file.name : 'Click to select Excel (.xlsx) or CSV (.csv) file'}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: '0.3rem' }}>
                {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Supports Microsoft Excel (.xlsx, .xls) and standard CSV files'}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button
                className="btn btn-primary"
                disabled={!file || loading}
                onClick={handleUpload}
              >
                {loading ? 'Processing Spreadsheet...' : 'Ingest to Database'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
