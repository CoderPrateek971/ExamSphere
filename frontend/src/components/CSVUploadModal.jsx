import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle, AlertCircle, X, FileSpreadsheet, Download } from 'lucide-react';
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
      setResult(res.summary);
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      console.error('Spreadsheet upload error:', err);
      setError(err.message || 'Spreadsheet ingestion failed. Please verify column headers and data format.');
    } finally {
      setLoading(false);
    }
  };

  const downloadSampleTemplate = () => {
    const templates = {
      courses: 'course_code,course_name,department,semester,difficulty_level\nCSE3005,Software Engineering,CSE,4,3\nCSE3002,Database Management Systems,CSE,4,4\nECE2001,Digital Electronics,ECE,4,4\nME1001,Thermodynamics,ME,4,5',
      rooms: 'room_number,building,capacity,rows_count,cols_count\nE2-101,E2,30,5,6\nE2-102,E2,30,5,6\nE2-201,E2,40,5,8\nAUD-HALL,Main Block,80,8,10',
      faculty: 'faculty_code,name,email,department,designation,max_duties\nFAC101,Dr. Shilpa Mahajan,shilpa.mahajan@bmu.edu.in,CSE,Associate Professor,4\nFAC102,Dr. Nishtha Phutela,nishtha.phutela@bmu.edu.in,CSE,Assistant Professor,5\nFAC103,Dr. Harsh Taneja,harsh.taneja@bmu.edu.in,ECE,Associate Professor,4\nFAC104,Dr. Sukhandeep Kaur,sukhandeep.kaur@bmu.edu.in,ME,Assistant Professor,5',
      students: 'enrollment_no,name,email,department,semester,program,enrolled_courses\n240101,Aarav Sharma,aarav.sharma@bmu.edu.in,CSE,4,B.Tech,"CSE3005, CSE3002"\n240102,Ananya Verma,ananya.verma@bmu.edu.in,CSE,4,B.Tech,"CSE3005, CSE3002"\n240103,Rohan Gupta,rohan.gupta@bmu.edu.in,ECE,4,B.Tech,"ECE2001, CSE3005"\n240104,Pooja Patel,pooja.patel@bmu.edu.in,ECE,4,B.Tech,"ECE2001, CSE3005"'
    };
    const content = templates[entityType] || templates.courses;
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${entityType}_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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

            {/* Template Download Reference Button */}
            <div style={{ marginTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={downloadSampleTemplate}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#818cf8',
                  fontSize: '0.78rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline'
                }}
              >
                <Download size={13} />
                <span>Download sample {entityType}.csv template</span>
              </button>

              {file && (
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
              )}
            </div>

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
