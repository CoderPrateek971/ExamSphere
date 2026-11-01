import React, { useState, useEffect } from 'react';
import { 
  X, Calendar, Clock, AlertTriangle, CheckCircle2, 
  ArrowRight, Sparkles, Layers, ShieldCheck 
} from 'lucide-react';
import { api } from '../../api';

export default function TimetableDatesSpanModal({
  isOpen,
  onClose,
  onSuccess,
  currentSpan = { startDate: '', endDate: '' },
  exams = [],
  onOpenGenerateTimetable
}) {
  const [startDate, setStartDate] = useState(currentSpan.startDate || '');
  const [endDate, setEndDate] = useState(currentSpan.endDate || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Sync state whenever modal opens or currentSpan updates
  useEffect(() => {
    if (isOpen) {
      setStartDate(currentSpan.startDate || '');
      setEndDate(currentSpan.endDate || '');
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen, currentSpan.startDate, currentSpan.endDate]);

  if (!isOpen) return null;

  // Calculate day difference
  const calcDays = () => {
    if (!startDate || !endDate) return 0;
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diffTime = e - s;
    if (diffTime < 0) return -1;
    return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const spanDays = calcDays();

  // Quick preset helper
  const applyPreset = (daysToAdd) => {
    if (!startDate) {
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
      const end = new Date(today);
      end.setDate(end.getDate() + daysToAdd);
      setEndDate(end.toISOString().split('T')[0]);
      return;
    }
    const end = new Date(startDate);
    end.setDate(end.getDate() + daysToAdd);
    setEndDate(end.toISOString().split('T')[0]);
  };

  // Check how many exams fall outside this span
  const outsideExams = exams.filter(e => {
    if (!e.exam_date) return false;
    if (startDate && e.exam_date < startDate) return true;
    if (endDate && e.exam_date > endDate) return true;
    return false;
  });

  const handleSave = async (openGeneratorAfter = false) => {
    setError(null);
    setSuccessMsg(null);

    if (!startDate || !endDate) {
      setError('Please provide both Start Date and End Date.');
      return;
    }

    if (startDate > endDate) {
      setError('Start Date cannot be after End Date.');
      return;
    }

    setSaving(true);
    try {
      const res = await api.saveDatesSpan({ startDate, endDate });
      setSuccessMsg(res.message || 'Timetable dates span updated successfully!');
      
      // Update parent component state immediately
      onSuccess?.({ startDate, endDate });

      setTimeout(() => {
        onClose();
        if (openGeneratorAfter && onOpenGenerateTimetable) {
          onOpenGenerateTimetable();
        }
      }, 500);
    } catch (err) {
      setError(err.message || 'Failed to save timetable dates span.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div 
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '560px',
          background: 'linear-gradient(145deg, #182234 0%, #0f172a 100%)',
          border: '1px solid rgba(6, 182, 212, 0.35)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px rgba(6, 182, 212, 0.15)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(6, 182, 212, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(6, 182, 212, 0.3)'
            }}>
              <Calendar size={22} color="#06b6d4" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
                  Timetable Dates Span
                </h3>
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  padding: '0.15rem 0.45rem',
                  borderRadius: '6px',
                  background: 'rgba(6, 182, 212, 0.2)',
                  color: '#38bdf8',
                  border: '1px solid rgba(6, 182, 212, 0.3)'
                }}>
                  Session Window
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                Define the overall date range for examinations in this academic session
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="btn btn-secondary" 
            style={{ padding: '0.4rem', borderRadius: '8px', border: 'none', background: 'transparent' }}
          >
            <X size={18} color="var(--text-muted)" />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && (
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#f43f5e',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#10b981',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Date Range Inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.4rem' }}>
                Session Start Date *
              </label>
              <input
                type="date"
                className="input-field"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.88rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.4rem' }}>
                Session End Date *
              </label>
              <input
                type="date"
                className="input-field"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.88rem'
                }}
              />
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600 }}>
              Quick Presets (from Start Date):
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem', borderRadius: '6px' }}
                onClick={() => applyPreset(7)}
              >
                1 Week (7 Days)
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem', borderRadius: '6px' }}
                onClick={() => applyPreset(14)}
              >
                2 Weeks (14 Days)
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem', borderRadius: '6px' }}
                onClick={() => applyPreset(21)}
              >
                3 Weeks (21 Days)
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem', borderRadius: '6px' }}
                onClick={() => applyPreset(30)}
              >
                1 Month (30 Days)
              </button>
            </div>
          </div>

          {/* Span Summary Card */}
          <div style={{
            background: 'rgba(6, 182, 212, 0.05)',
            border: '1px solid rgba(6, 182, 212, 0.2)',
            borderRadius: '10px',
            padding: '0.85rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Calculated Span Window
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.15rem' }}>
                {spanDays > 0 ? `${spanDays} Total Calendar Days` : 'Invalid Date Range'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                {startDate && endDate ? `${startDate}  to  ${endDate}` : 'Select start and end dates'}
              </div>
            </div>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              background: 'rgba(6, 182, 212, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Clock size={18} color="#06b6d4" />
            </div>
          </div>

          {/* Warning if exams fall outside */}
          {outsideExams.length > 0 && (
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              background: 'rgba(234, 179, 8, 0.1)',
              border: '1px solid rgba(234, 179, 8, 0.25)',
              color: '#facc15',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem'
            }}>
              <AlertTriangle size={16} style={{ marginTop: '0.1rem', flexShrink: 0 }} />
              <div>
                <strong>Notice:</strong> {outsideExams.length} currently scheduled examination(s) fall outside this updated range.
                You can use the <strong>timetable generator</strong> or <strong>Resolve conflicts</strong> to reschedule them within this new window.
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(255, 255, 255, 0.01)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem'
        }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={saving}
            style={{ fontSize: '0.85rem', padding: '0.55rem 1rem' }}
          >
            Cancel
          </button>

          <div style={{ display: 'flex', gap: '0.65rem' }}>
            {onOpenGenerateTimetable && (
              <button
                type="button"
                className="btn btn-secondary"
                disabled={saving || spanDays <= 0}
                onClick={() => handleSave(true)}
                style={{
                  fontSize: '0.85rem',
                  padding: '0.55rem 1rem',
                  borderColor: 'rgba(6, 182, 212, 0.4)',
                  color: '#38bdf8',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <Sparkles size={14} />
                <span>Save & Generate</span>
              </button>
            )}

            <button
              type="button"
              className="btn btn-primary"
              disabled={saving || spanDays <= 0}
              onClick={() => handleSave(false)}
              style={{
                fontSize: '0.85rem',
                padding: '0.55rem 1.25rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem'
              }}
            >
              {saving ? (
                <>
                  <div className="spinner" style={{ width: '14px', height: '14px' }}></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} />
                  <span>Save Dates Span</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
