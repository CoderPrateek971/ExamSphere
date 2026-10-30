import React, { useState, useEffect } from 'react';
import { Search, Upload, RefreshCw, X, ArrowRight, Zap, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { api } from '../api';
import CSVUploadModal from './CSVUploadModal';
import StudentsTable from './master-data/StudentsTable';
import FacultyTable from './master-data/FacultyTable';
import CoursesTable from './master-data/CoursesTable';
import RoomsTable from './master-data/RoomsTable';

/**
 * Modular MasterDataView
 * Coordinates tabs, search filters, and delegates rendering to individual table components.
 * Real data-driven: renders uploaded records without mock fallbacks.
 */
export default function MasterDataView({ user, onDataChange, onNavigateToStep }) {
  const [activeSubTab, setActiveSubTab] = useState('courses');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [search, setSearch] = useState('');
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await api.getEntities(activeSubTab);
      if (res.data && Array.isArray(res.data)) {
        setData(res.data);
      } else {
        setData([]);
      }
    } catch (err) {
      console.warn('Backend note on fetch records:', err.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
    setSearch('');
  }, [activeSubTab, user]);

  const handleDelete = async (id) => {
    if (window.confirm(`Are you sure you want to delete this ${activeSubTab.slice(0, -1)}?`)) {
      try {
        await api.deleteEntity(activeSubTab, id);
        fetchRecords();
        if (onDataChange) onDataChange();
      } catch (err) {
        setData(prev => prev.filter(item => item.id !== id));
      }
    }
  };

  const handleSeedBmuData = async () => {
    setSeeding(true);
    setFeedback(null);
    try {
      await api.seedBmuExamData();
      await fetchRecords();
      if (onDataChange) onDataChange();
      setFeedback({ type: 'success', text: 'BMU Examination dataset (March 2026) loaded successfully! Courses, rooms, and faculty are now active.' });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to load examination dataset.' });
    } finally {
      setSeeding(false);
    }
  };

  const handleResetDatabase = async () => {
    if (!window.confirm('Are you sure you want to completely clear all data from the database? This will remove all courses, rooms, faculty, students, exams, and duties so you can start with a fresh upload.')) {
      return;
    }
    setLoading(true);
    setFeedback(null);
    try {
      const res = await api.resetDatabase();
      await fetchRecords();
      if (onDataChange) onDataChange();
      setFeedback({ type: 'success', text: res.message || 'All records successfully cleared from the database!' });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to reset database.' });
    } finally {
      setLoading(false);
    }
  };

  const filteredData = data.filter((item) => {
    const q = search.toLowerCase();
    return Object.values(item).some(val => String(val).toLowerCase().includes(q));
  });

  return (
    <div className="panel-card">
      {/* Workflow Navigation Banner */}
      <div style={{
        background: 'linear-gradient(90deg, rgba(99,102,241,0.12), rgba(6,182,212,0.12))',
        border: '1px solid rgba(99,102,241,0.25)',
        borderRadius: '10px',
        padding: '0.85rem 1.25rem',
        marginBottom: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span style={{
            background: '#6366f1',
            color: '#fff',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.8rem',
            fontWeight: 800
          }}>1</span>
          <div>
            <strong style={{ color: '#fff', fontSize: '0.95rem' }}>Step 1: Resource & Master Data Ingestion</strong>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#9ca3af' }}>
              Upload your institution's courses, rooms, faculty, and student rosters. This uploaded data automatically flows into Scheduling, Seating, and Duty allocation.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button 
            className="btn btn-secondary" 
            onClick={handleResetDatabase} 
            disabled={loading}
            style={{ borderColor: 'rgba(244, 63, 94, 0.4)', color: '#fb7185' }}
            title="Wipe all database records to start with a fresh clean state"
          >
            <Trash2 size={14} />
            <span>Clear All Data</span>
          </button>

          <button 
            className="btn btn-secondary" 
            onClick={handleSeedBmuData} 
            disabled={seeding}
            style={{ borderColor: 'rgba(245, 158, 11, 0.4)', color: '#fbbf24' }}
            title="Load real March 2026 Exam Data directly from workbook"
          >
            <Zap size={14} />
            <span>{seeding ? 'Loading Dataset...' : 'Load Builtin Exam Dataset'}</span>
          </button>

          {onNavigateToStep && (
            <button 
              className="btn btn-primary" 
              onClick={() => onNavigateToStep('scheduling')}
              style={{ fontWeight: 600 }}
            >
              <span>Proceed to Step 2: Scheduling</span>
              <ArrowRight size={15} />
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: feedback.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)',
          color: feedback.type === 'success' ? '#34d399' : '#fb7185',
          border: `1px solid ${feedback.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)'}`
        }}>
          {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{feedback.text}</span>
        </div>
      )}

      <div className="panel-header">
        <div className="panel-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h2>Resource & Master Records</h2>
            <span className="badge badge-emerald" style={{ fontSize: '0.75rem' }}>
              {data.length} {activeSubTab} loaded
            </span>
          </div>
          <p>Real uploaded records for students, faculty, courses, and exam venues</p>
        </div>

        <div className="panel-controls">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder={`Search ${activeSubTab}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                className="search-clear-btn"
                onClick={() => setSearch('')}
                title="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <button className="btn btn-secondary" onClick={fetchRecords} title="Refresh Records">
            <RefreshCw size={15} />
          </button>

          <button className="btn btn-emerald" onClick={() => setIsCSVModalOpen(true)}>
            <Upload size={15} />
            <span>Upload {activeSubTab.toUpperCase()} (.xlsx / .csv)</span>
          </button>
        </div>
      </div>

      {/* Sub tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
        {['courses', 'rooms', 'faculty', 'students'].map((type) => (
          <button
            key={type}
            onClick={() => setActiveSubTab(type)}
            style={{
              background: activeSubTab === type ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              color: activeSubTab === type ? '#a5b4fc' : '#9ca3af',
              border: activeSubTab === type ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
              padding: '0.4rem 1rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
            {type}
          </button>
        ))}
      </div>

      {/* High-Cohesion Decomposed Table Views */}
      <div className="table-wrapper">
        {data.length === 0 && !loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#9ca3af' }}>
            <p style={{ fontSize: '1rem', fontWeight: 600, color: '#e5e7eb', marginBottom: '0.5rem' }}>
              No {activeSubTab} data found in the database.
            </p>
            <p style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Upload your {activeSubTab} CSV file or click "Load Uploaded BMU Exam Dataset" to populate real records.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
              <button className="btn btn-emerald" onClick={() => setIsCSVModalOpen(true)}>
                <Upload size={14} />
                <span>Upload {activeSubTab.toUpperCase()} (.xlsx / .csv)</span>
              </button>
              <button className="btn btn-secondary" onClick={handleSeedBmuData} disabled={seeding}>
                <Zap size={14} color="#fbbf24" />
                <span>Load Uploaded BMU Exam Dataset</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {activeSubTab === 'students' && (
              <StudentsTable data={filteredData} loading={loading} onDelete={handleDelete} />
            )}
            {activeSubTab === 'faculty' && (
              <FacultyTable data={filteredData} loading={loading} onDelete={handleDelete} />
            )}
            {activeSubTab === 'courses' && (
              <CoursesTable data={filteredData} loading={loading} onDelete={handleDelete} />
            )}
            {activeSubTab === 'rooms' && (
              <RoomsTable data={filteredData} loading={loading} onDelete={handleDelete} />
            )}
          </>
        )}
      </div>

      {/* Reusable CSV Upload Modal */}
      <CSVUploadModal
        isOpen={isCSVModalOpen}
        onClose={() => setIsCSVModalOpen(false)}
        entityType={activeSubTab}
        onUploadSuccess={() => {
          fetchRecords();
          if (onDataChange) onDataChange();
        }}
      />
    </div>
  );
}
