import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle, AlertCircle, X, FileSpreadsheet } from 'lucide-react';
import { api } from '../api';

export default function CSVUploadModal({ isOpen, onClose, entityType, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const validExtensions = ['.csv', '.xlsx', '.xls'];

  const validateAndSetFile = (selected) => {
    if (!selected) return;
    const ext = '.' + selected.name.split('.').pop().toLowerCase();
    if (!validExtensions.includes(ext)) {
      setError('Only Excel (.xlsx, .xls) and CSV (.csv) files are supported.');
      setFile(null);
      return;
    }
    setError(null);
    setFile(selected);
    setResult(null);
  };

  const handleFileChange = (e) => {
    const selected = e.target.files && e.target.files[0];
    validateAndSetFile(selected);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const selected = e.dataTransfer.files && e.dataTransfer.files[0];
    validateAndSetFile(selected);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setIsDragging(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a CSV or Excel file to upload.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.uploadCSV(entityType, file);
      if (res.summary && res.summary.failedRowsCount > 0 && res.summary.insertedOrUpdated === 0) {
        const firstErr = res.summary.errors?.[0]?.error || 'Failed to ingest records due to missing required field(s).';
        setError(firstErr);
        return;
      }
      setResult(res.summary);
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      console.error('Spreadsheet upload error:', err);
      setError(err.message || 'Spreadsheet ingestion failed. Please verify column headers and data format.');
    } finally {
      setLoading(false);
    }
  };

  const isExcel = file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'));

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <div>
            <h3>Bulk Spreadsheet Ingestion</h3>
            <p style={{ fontSize: '0.82rem', color: '#9ca3af' }}>
              Upload master records for <strong style={{ color: '#818cf8', textTransform: 'capitalize' }}>{entityType}</strong> in Excel (.xlsx) or CSV (.csv)
            </p>
            <div style={{ marginTop: '0.4rem', fontSize: '0.73rem', color: '#94a3b8', background: 'rgba(255, 255, 255, 0.04)', padding: '0.3rem 0.6rem', borderRadius: '6px' }}>
              <span>Required schema: </span>
              <strong style={{ color: '#a5b4fc', fontFamily: 'monospace' }}>
                {entityType === 'students' && 'enrollment_no, name, email, department, semester, program, enrolled_courses'}
                {entityType === 'faculty' && 'faculty_code, name, email, department, designation, max_duties'}
                {entityType === 'courses' && 'course_code, course_name, department, semester, difficulty_level'}
                {entityType === 'rooms' && 'room_number, building, capacity, rows_count, cols_count'}
              </strong>
            </div>
          </div>
          <button className="close-btn" onClick={handleClose}><X size={20} /></button>
        </div>

        {error && (
          <div style={{ background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)', color: '#f43f5e', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
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
            {result.errors && result.errors.length > 0 && (
              <div style={{ marginTop: '0.75rem', marginBottom: '1rem', textAlign: 'left', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', padding: '0.6rem 0.85rem', borderRadius: '8px', fontSize: '0.76rem', color: '#fb7185' }}>
                <div style={{ fontWeight: 700, marginBottom: '0.3rem' }}>Row Ingestion Warnings:</div>
                {result.errors.slice(0, 3).map((errItem, i) => (
                  <div key={i} style={{ marginBottom: '0.2rem' }}>• Row {errItem.rowNumber}: {errItem.error}</div>
                ))}
                {result.errors.length > 3 && <div>...and {result.errors.length - 3} more row(s) skipped.</div>}
              </div>
            )}
            <button className="btn btn-primary" onClick={handleClose} style={{ marginTop: '0.5rem' }}>
              Done & View Records
            </button>
          </div>
        ) : (
          <>
            <div
              className="dropzone"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              style={{
                border: isDragging ? '2px dashed #6366f1' : file ? '2px solid rgba(16, 185, 129, 0.5)' : '2px dashed rgba(255, 255, 255, 0.15)',
                background: isDragging ? 'rgba(99, 102, 241, 0.1)' : file ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                padding: '2rem 1rem',
                borderRadius: '12px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {file ? (
                isExcel ? (
                  <FileSpreadsheet size={44} color="#10b981" style={{ margin: '0 auto 0.75rem auto' }} />
                ) : (
                  <FileText size={44} color="#34d399" style={{ margin: '0 auto 0.75rem auto' }} />
                )
              ) : (
                <UploadCloud size={44} color="#6366f1" style={{ margin: '0 auto 0.75rem auto' }} />
              )}
              <div style={{ fontWeight: 700, fontSize: '0.98rem', color: file ? '#34d399' : '#e2e8f0' }}>
                {file ? file.name : 'Click to select or drag & drop file'}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '0.35rem' }}>
                {file ? `${(file.size / 1024).toFixed(1)} KB — Ready to upload` : 'Supports CSV (.csv) and Excel (.xlsx, .xls) spreadsheets'}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </div>

            {file && (
              <div style={{ marginTop: '0.85rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#fb7185',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  Clear file
                </button>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={handleClose}>Cancel</button>
              <button
                className="btn btn-primary"
                disabled={!file || loading}
                onClick={handleUpload}
                style={{
                  opacity: (!file || loading) ? 0.6 : 1,
                  cursor: (!file || loading) ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Processing Spreadsheet...' : `Ingest ${entityType.toUpperCase()}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
