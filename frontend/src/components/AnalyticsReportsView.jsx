import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Building2, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Users, 
  FileSpreadsheet, 
  RefreshCw, 
  TrendingUp, 
  PieChart, 
  ShieldAlert,
  Search,
  Filter,
  Layers,
  GraduationCap
} from 'lucide-react';
import { api } from '../api';

export default function AnalyticsReportsView({ user }) {
  const [activeReport, setActiveReport] = useState('room'); // 'room' | 'attendance' | 'workload' | 'ufm'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Report Data States
  const [roomData, setRoomData] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [workloadData, setWorkloadData] = useState(null);
  const [ufmData, setUfmData] = useState(null);

  // Search/Filter states
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch report data
  const fetchActiveReportData = async (reportKey = activeReport) => {
    setLoading(true);
    setError(null);
    try {
      if (reportKey === 'room') {
        const res = await api.getRoomUtilization();
        if (res.success) setRoomData(res.data);
      } else if (reportKey === 'attendance') {
        const res = await api.getAttendanceStats();
        if (res.success) setAttendanceData(res.data);
      } else if (reportKey === 'workload') {
        const res = await api.getFacultyWorkload();
        if (res.success) setWorkloadData(res.data);
      } else if (reportKey === 'ufm') {
        const res = await api.getUFMSummary();
        if (res.success) setUfmData(res.data);
      }
    } catch (err) {
      console.error('Failed to load report data:', err);
      setError(err.message || 'Failed to fetch report data from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSearchTerm('');
    fetchActiveReportData(activeReport);
  }, [activeReport]);

  return (
    <div className="panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Module Title & Report Sub-Tabs */}
      <div className="panel-header" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.25rem', marginBottom: '0.5rem' }}>
        <div className="panel-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(6, 182, 212, 0.2))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--border-accent)'
            }}>
              <BarChart3 size={22} color="var(--accent-cyan)" />
            </div>
            <div>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Analytics & Performance Reporting
                <span className="badge badge-indigo" style={{ fontSize: '0.72rem' }}>Module 10</span>
              </h2>
              <p>Institutional exam analytics: room capacities, student attendance rates, faculty distribution & malpractice summaries.</p>
            </div>
          </div>
        </div>

        <div className="panel-controls">
          <button 
            className="btn btn-secondary" 
            onClick={() => fetchActiveReportData(activeReport)} 
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Metrics</span>
          </button>
        </div>
      </div>

      {/* Course Handout Test Case Sub-Navigation */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '0.75rem',
        background: 'rgba(15, 23, 42, 0.45)',
        padding: '0.5rem',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)'
      }}>
        <button
          className={`tab-btn ${activeReport === 'room' ? 'active' : ''}`}
          onClick={() => setActiveReport('room')}
          style={{ justifyContent: 'center', width: '100%', padding: '0.75rem 1rem' }}
        >
          <Building2 size={16} />
          <span>TC09: Room Utilization</span>
        </button>

        <button
          className={`tab-btn ${activeReport === 'attendance' ? 'active' : ''}`}
          onClick={() => setActiveReport('attendance')}
          style={{ justifyContent: 'center', width: '100%', padding: '0.75rem 1rem' }}
        >
          <CheckCircle2 size={16} />
          <span>TC10: Attendance Stats</span>
        </button>

        <button
          className={`tab-btn ${activeReport === 'workload' ? 'active' : ''}`}
          onClick={() => setActiveReport('workload')}
          style={{ justifyContent: 'center', width: '100%', padding: '0.75rem 1rem' }}
        >
          <Users size={16} />
          <span>TC11: Faculty Workload</span>
        </button>

        <button
          className={`tab-btn ${activeReport === 'ufm' ? 'active' : ''}`}
          onClick={() => setActiveReport('ufm')}
          style={{ justifyContent: 'center', width: '100%', padding: '0.75rem 1rem' }}
        >
          <ShieldAlert size={16} />
          <span>TC12: UFM Incident Summary</span>
        </button>
      </div>

      {error && (
        <div style={{
          padding: '1rem',
          background: 'rgba(244, 63, 94, 0.1)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--accent-rose)',
          fontSize: '0.88rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* REPORT 1: ROOM UTILIZATION (TC09) */}
      {/* ------------------------------------------------------------- */}
      {activeReport === 'room' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Top Metric Cards */}
          <div className="stats-grid" style={{ marginBottom: 0 }}>
            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-title">Campus Capacity</span>
                <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                  <Building2 size={18} />
                </div>
              </div>
              <div className="stat-value">{roomData?.totalCampusCapacity || 0}</div>
              <div className="stat-card-footer">Total physical exam seats configured</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-title">Allocated Seats</span>
                <div className="stat-icon" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)' }}>
                  <TrendingUp size={18} />
                </div>
              </div>
              <div className="stat-value">{roomData?.totalAllocatedSeats || 0}</div>
              <div className="stat-card-footer">Active student candidate allocations</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-title">Available Seats</span>
                <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)' }}>
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <div className="stat-value">{roomData?.availableSeats || 0}</div>
              <div className="stat-card-footer">Unused room capacity buffer</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-title">Overall Utilization</span>
                <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)' }}>
                  <PieChart size={18} />
                </div>
              </div>
              <div className="stat-value" style={{ color: (roomData?.overallUtilizationRate || 0) > 85 ? 'var(--accent-rose)' : 'var(--accent-cyan)' }}>
                {roomData?.overallUtilizationRate || 0}%
              </div>
              <div className="stat-card-footer">
                <div style={{
                  width: '100%',
                  height: '6px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '3px',
                  marginTop: '0.4rem',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${Math.min(100, roomData?.overallUtilizationRate || 0)}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, var(--accent-cyan), var(--primary))',
                    borderRadius: '3px'
                  }} />
                </div>
              </div>
            </div>
          </div>

          {/* Table Header & Search */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Room-by-Room Utilization Breakdown</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Validate seat density per hall to prevent exam hall overcrowding</p>
            </div>
            <div className="search-bar" style={{ width: '280px' }}>
              <Search size={15} />
              <input 
                type="text" 
                placeholder="Search room or building..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>
          </div>

          {/* Rooms Table */}
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Room Code</th>
                  <th>Location</th>
                  <th>Total Capacity</th>
                  <th>Allocated Seats</th>
                  <th>Utilization Rate</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {roomData?.roomBreakdown
                  ?.filter(r => 
                    r.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    r.building.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map(room => (
                    <tr key={room.id}>
                      <td style={{ fontWeight: 600, color: '#fff' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Building2 size={15} color="var(--primary)" />
                          {room.roomNumber}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: 'var(--text-muted)' }}>
                          {room.building}
                        </span>
                      </td>
                      <td>{room.capacity} seats</td>
                      <td style={{ fontWeight: 600 }}>{room.allocatedSeats}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '90px',
                            height: '6px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '3px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${Math.min(100, room.utilizationPercentage)}%`,
                              height: '100%',
                              background: room.utilizationPercentage > 85 
                                ? 'var(--accent-rose)' 
                                : room.utilizationPercentage > 50 
                                ? 'var(--accent-cyan)' 
                                : 'var(--accent-emerald)'
                            }} />
                          </div>
                          <span style={{ fontSize: '0.82rem', fontFamily: 'JetBrains Mono, monospace' }}>
                            {room.utilizationPercentage}%
                          </span>
                        </div>
                      </td>
                      <td>
                        {room.utilizationPercentage === 0 ? (
                          <span className="badge badge-cyan">Empty</span>
                        ) : room.utilizationPercentage >= 90 ? (
                          <span className="badge badge-amber" style={{ background: 'rgba(244, 63, 94, 0.15)', color: 'var(--accent-rose)' }}>Near Full</span>
                        ) : (
                          <span className="badge badge-emerald">Optimal</span>
                        )}
                      </td>
                    </tr>
                  ))}
                {(!roomData?.roomBreakdown || roomData.roomBreakdown.length === 0) && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No rooms found or data not yet loaded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* REPORT 2: ATTENDANCE STATISTICS (TC10) */}
      {/* ------------------------------------------------------------- */}
      {activeReport === 'attendance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Top Metric Cards */}
          <div className="stats-grid" style={{ marginBottom: 0 }}>
            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-title">Candidates Recorded</span>
                <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                  <Users size={18} />
                </div>
              </div>
              <div className="stat-value">{attendanceData?.totalMarkedAttendance || attendanceData?.totalEnrolledCandidates || 0}</div>
              <div className="stat-card-footer">Total candidate records processed</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-title">Marked Present</span>
                <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)' }}>
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <div className="stat-value" style={{ color: 'var(--accent-emerald)' }}>
                {attendanceData?.presentCount || 0}
              </div>
              <div className="stat-card-footer">{attendanceData?.faceVerifiedCount || 0} biometric verified</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-title">Marked Absent</span>
                <div className="stat-icon" style={{ background: 'rgba(244, 63, 94, 0.15)', color: 'var(--accent-rose)' }}>
                  <XCircle size={18} />
                </div>
              </div>
              <div className="stat-value" style={{ color: 'var(--accent-rose)' }}>
                {attendanceData?.absentCount || 0}
              </div>
              <div className="stat-card-footer">Candidates missing hall presence</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-title">Attendance Rate</span>
                <div className="stat-icon" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)' }}>
                  <TrendingUp size={18} />
                </div>
              </div>
              <div className="stat-value" style={{ color: 'var(--accent-cyan)' }}>
                {attendanceData?.attendanceRate || 0}%
              </div>
              <div className="stat-card-footer">Present vs total enrolled ratio</div>
            </div>
          </div>

          {/* Exam-by-Exam Table */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Attendance Rate by Exam Schedule</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Breakdown of student participation and no-show statistics across all exams</p>
            </div>
            <div className="search-bar" style={{ width: '280px' }}>
              <Search size={15} />
              <input 
                type="text" 
                placeholder="Search exam name..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Exam Title</th>
                  <th>Date</th>
                  <th>Total Marked</th>
                  <th>Present</th>
                  <th>Absent</th>
                  <th>Participation Rate</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {attendanceData?.examBreakdown
                  ?.filter(eb => eb.examName.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(item => (
                    <tr key={item.examId}>
                      <td style={{ fontWeight: 600, color: '#fff' }}>{item.examName}</td>
                      <td style={{ color: 'var(--text-muted)' }}>
                        {item.examDate ? new Date(item.examDate).toLocaleDateString() : 'Active Session'}
                      </td>
                      <td>{item.totalMarked} students</td>
                      <td style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>{item.present}</td>
                      <td style={{ color: item.absent > 0 ? 'var(--accent-rose)' : 'var(--text-muted)' }}>{item.absent}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '80px',
                            height: '6px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '3px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${Math.min(100, item.rate)}%`,
                              height: '100%',
                              background: item.rate >= 75 ? 'var(--accent-emerald)' : 'var(--accent-amber)'
                            }} />
                          </div>
                          <span style={{ fontSize: '0.82rem', fontFamily: 'JetBrains Mono, monospace' }}>
                            {item.rate}%
                          </span>
                        </div>
                      </td>
                      <td>
                        {item.totalMarked === 0 ? (
                          <span className="badge badge-cyan">Scheduled</span>
                        ) : item.rate >= 90 ? (
                          <span className="badge badge-emerald">High Turnout</span>
                        ) : (
                          <span className="badge badge-amber">Standard</span>
                        )}
                      </td>
                    </tr>
                  ))}
                {(!attendanceData?.examBreakdown || attendanceData.examBreakdown.length === 0) && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No exam attendance data logged yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* REPORT 3: FACULTY WORKLOAD REPORT (TC11) */}
      {/* ------------------------------------------------------------- */}
      {activeReport === 'workload' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Top Metric Cards */}
          <div className="stats-grid" style={{ marginBottom: 0 }}>
            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-title">Faculty Roster</span>
                <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                  <GraduationCap size={18} />
                </div>
              </div>
              <div className="stat-value">{workloadData?.totalFacultyMembers || 0}</div>
              <div className="stat-card-footer">Registered professors in department pool</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-title">Duties Allocated</span>
                <div className="stat-icon" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)' }}>
                  <Layers size={18} />
                </div>
              </div>
              <div className="stat-value">{workloadData?.totalDutiesAssigned || 0}</div>
              <div className="stat-card-footer">Total invigilation slots filled</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-title">Average Duty Load</span>
                <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)' }}>
                  <TrendingUp size={18} />
                </div>
              </div>
              <div className="stat-value">{workloadData?.averageDutiesPerFaculty || 0}</div>
              <div className="stat-card-footer">Sessions per professor (fair balancer)</div>
            </div>
          </div>

          {/* Table Header & Search */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Faculty Duty Workload & Capacity Roster</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Assigned duties vs maximum allowable invigilation slots for compliance with academic guidelines</p>
            </div>
            <div className="search-bar" style={{ width: '280px' }}>
              <Search size={15} />
              <input 
                type="text" 
                placeholder="Search faculty name or dept..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Professor</th>
                  <th>Department & Role</th>
                  <th>Max Quota</th>
                  <th>Assigned Duties</th>
                  <th>Remaining Capacity</th>
                  <th>Load Utilization</th>
                  <th>Balance Status</th>
                </tr>
              </thead>
              <tbody>
                {workloadData?.facultyRoster
                  ?.filter(f => 
                    f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    f.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    f.facultyCode.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map(fac => (
                    <tr key={fac.id}>
                      <td>
                        <div>
                          <span style={{ fontWeight: 600, color: '#fff', display: 'block' }}>{fac.name}</span>
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontFamily: 'JetBrains Mono, monospace' }}>
                            {fac.facultyCode} &bull; {fac.email}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span style={{ color: 'var(--text-muted)' }}>{fac.department}</span>
                        <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--accent-cyan)' }}>{fac.designation}</span>
                      </td>
                      <td>{fac.maxDuties} slots</td>
                      <td style={{ fontWeight: 700, color: '#fff' }}>{fac.assignedDuties}</td>
                      <td>
                        <span style={{ color: fac.remainingCapacity === 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
                          {fac.remainingCapacity} slots left
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '80px',
                            height: '6px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '3px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${Math.min(100, fac.utilizationRate)}%`,
                              height: '100%',
                              background: fac.utilizationRate > 80 
                                ? 'var(--accent-rose)' 
                                : fac.utilizationRate > 40 
                                ? 'var(--accent-cyan)' 
                                : 'var(--accent-emerald)'
                            }} />
                          </div>
                          <span style={{ fontSize: '0.82rem', fontFamily: 'JetBrains Mono, monospace' }}>
                            {fac.utilizationRate}%
                          </span>
                        </div>
                      </td>
                      <td>
                        {fac.assignedDuties === 0 ? (
                          <span className="badge badge-cyan">Unassigned</span>
                        ) : fac.assignedDuties >= fac.maxDuties ? (
                          <span className="badge badge-amber" style={{ background: 'rgba(244, 63, 94, 0.15)', color: 'var(--accent-rose)' }}>Max Reached</span>
                        ) : (
                          <span className="badge badge-emerald">Balanced</span>
                        )}
                      </td>
                    </tr>
                  ))}
                {(!workloadData?.facultyRoster || workloadData.facultyRoster.length === 0) && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No faculty workload records available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* REPORT 4: UFM INCIDENT SUMMARY (TC12) */}
      {/* ------------------------------------------------------------- */}
      {activeReport === 'ufm' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Top Status Metric Cards */}
          <div className="stats-grid" style={{ marginBottom: 0 }}>
            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-title">Total Incidents</span>
                <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                  <ShieldAlert size={18} />
                </div>
              </div>
              <div className="stat-value">{ufmData?.totalCases || 0}</div>
              <div className="stat-card-footer">Unfair Means cases logged</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-title">Reported (Pending)</span>
                <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)' }}>
                  <AlertTriangle size={18} />
                </div>
              </div>
              <div className="stat-value" style={{ color: 'var(--accent-amber)' }}>
                {ufmData?.statusBreakdown?.REPORTED || 0}
              </div>
              <div className="stat-card-footer">Awaiting disciplinary review</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-title">Action Taken</span>
                <div className="stat-icon" style={{ background: 'rgba(244, 63, 94, 0.15)', color: 'var(--accent-rose)' }}>
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <div className="stat-value" style={{ color: 'var(--accent-rose)' }}>
                {ufmData?.statusBreakdown?.ACTION_TAKEN || 0}
              </div>
              <div className="stat-card-footer">Penalties / suspensions enforced</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-title">Dismissed / Cleared</span>
                <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)' }}>
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <div className="stat-value" style={{ color: 'var(--accent-emerald)' }}>
                {ufmData?.statusBreakdown?.DISMISSED || 0}
              </div>
              <div className="stat-card-footer">Investigated & exonerated</div>
            </div>
          </div>

          {/* Incident Log Table */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>UFM Incident Investigation Log</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Audit summary of cheating cases, room allocations and invigilator reports</p>
            </div>
            <div className="search-bar" style={{ width: '280px' }}>
              <Search size={15} />
              <input 
                type="text" 
                placeholder="Search candidate, room, or exam..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Case ID</th>
                  <th>Candidate</th>
                  <th>Exam & Room</th>
                  <th>Invigilator</th>
                  <th>Incident Description</th>
                  <th>Status</th>
                  <th>Reported Date</th>
                </tr>
              </thead>
              <tbody>
                {ufmData?.cases
                  ?.filter(c => 
                    c.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    c.enrollmentNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    c.examName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    c.roomNumber.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map(incident => (
                    <tr key={incident.id}>
                      <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                        #UFM-{incident.id}
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: '#fff', display: 'block' }}>{incident.studentName}</span>
                        <span style={{ fontSize: '0.74rem', color: 'var(--accent-cyan)', fontFamily: 'JetBrains Mono, monospace' }}>
                          {incident.enrollmentNo}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: '#fff', display: 'block' }}>{incident.examName}</span>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Room {incident.roomNumber}</span>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{incident.invigilatorName}</td>
                      <td style={{ maxWidth: '280px' }}>
                        <span style={{ 
                          fontSize: '0.82rem', 
                          color: 'var(--text-main)', 
                          display: '-webkit-box', 
                          WebkitLineClamp: 2, 
                          WebkitBoxOrient: 'vertical', 
                          overflow: 'hidden' 
                        }}>
                          {incident.incidentDetails}
                        </span>
                      </td>
                      <td>
                        {incident.status === 'REPORTED' && (
                          <span className="badge badge-amber">Reported</span>
                        )}
                        {incident.status === 'UNDER_REVIEW' && (
                          <span className="badge badge-indigo">Under Review</span>
                        )}
                        {incident.status === 'ACTION_TAKEN' && (
                          <span className="badge badge-amber" style={{ background: 'rgba(244, 63, 94, 0.15)', color: 'var(--accent-rose)' }}>Action Taken</span>
                        )}
                        {incident.status === 'DISMISSED' && (
                          <span className="badge badge-emerald">Dismissed</span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                        {new Date(incident.reportedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                {(!ufmData?.cases || ufmData.cases.length === 0) && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No UFM incidents recorded on file.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
