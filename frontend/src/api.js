// Base API Client for ExamSphere
export const BACKEND_URL = 'http://localhost:5000';
const API_BASE = `${BACKEND_URL}/api`;

export const getFullPhotoUrl = (photoPath) => {
  if (!photoPath) return null;
  if (photoPath.startsWith('http://') || photoPath.startsWith('https://') || photoPath.startsWith('data:')) {
    return photoPath;
  }
  return `${BACKEND_URL}${photoPath.startsWith('/') ? '' : '/'}${photoPath}`;
};

export const api = {
  getToken() {
    return localStorage.getItem('examsphere_token');
  },
  setToken(token) {
    localStorage.setItem('examsphere_token', token);
  },
  removeToken() {
    localStorage.removeItem('examsphere_token');
    localStorage.removeItem('examsphere_user');
  },
  getUser() {
    try {
      return JSON.parse(localStorage.getItem('examsphere_user'));
    } catch {
      return null;
    }
  },
  setUser(user) {
    localStorage.setItem('examsphere_user', JSON.stringify(user));
  },

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      ...(options.headers || {})
    };

    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || `Request failed with status ${res.status}`);
    }
    return data;
  },

  // Auth
  login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },
  getMe() {
    return this.request('/auth/me');
  },

  // Master Data
  getEntities(type) {
    return this.request(`/master-data/${type}`);
  },
  deleteEntity(type, id) {
    return this.request(`/master-data/${type}/${id}`, {
      method: 'DELETE'
    });
  },
  uploadCSV(type, file) {
    const formData = new FormData();
    formData.append('file', file);
    return this.request(`/master-data/upload-csv/${type}`, {
      method: 'POST',
      body: formData
    });
  },

  // Admin & Audit
  getSystemSummary() {
    return this.request('/admin/system-summary');
  },
  getAuditLogs() {
    return this.request('/admin/audit-logs');
  },

  // Module 4: Room & Seating Allocation Engine
  getAllocationExams() {
    return this.request('/allocations/exams');
  },
  allocateSeats(payload) {
    return this.request('/allocations/seating', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  getSeatingByExam(examId) {
    return this.request(`/allocations/exam/${examId}`);
  },
  getRoomLayout(roomId, examId, strict = false) {
    const params = [];
    if (examId) params.push(`examId=${encodeURIComponent(examId)}`);
    if (strict) params.push('strict=true');
    const queryStr = params.length > 0 ? `?${params.join('&')}` : '';
    return this.request(`/allocations/room/${roomId}${queryStr}`);
  },
  clearAllocations(examId) {
    return this.request(`/allocations/exam/${examId}`, {
      method: 'DELETE'
    });
  },
  seedDemoExams() {
    return this.request('/allocations/seed-demo-exams', {
      method: 'POST'
    });
  },
  getEnrolledStudents(examId) {
    return this.request(`/allocations/enrolled-students/${examId}`);
  },
  saveManualSeating(payload) {
    return this.request('/allocations/manual-save', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  assignManualSeat(payload) {
    return this.request('/allocations/manual-seat', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  unassignManualSeat(payload) {
    return this.request('/allocations/manual-seat', {
      method: 'DELETE',
      body: JSON.stringify(payload)
    });
  },

  // Module 7: Invigilator Portal & Attendance
  getInvigilatorDuties(facultyId = null) {
    const query = facultyId ? `?faculty_id=${encodeURIComponent(facultyId)}` : '';
    return this.request(`/invigilator/duties${query}`);
  },
  confirmDuty(dutyId, status = 'CONFIRMED') {
    return this.request(`/invigilator/duties/${dutyId}/confirm`, {
      method: 'POST',
      body: JSON.stringify({ status })
    });
  },
  getDutyStudents(dutyId) {
    return this.request(`/invigilator/duties/${dutyId}/students`);
  },
  markAttendance(payload) {
    return this.request('/invigilator/attendance/mark', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  bulkMarkAttendance(payload) {
    return this.request('/invigilator/attendance/bulk', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  verifyFace(payload) {
    return this.request('/invigilator/attendance/verify-face', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  resetDutyAttendance(dutyId) {
    return this.request(`/invigilator/attendance/${dutyId}/reset`, {
      method: 'POST'
    });
  },
  seedDuties() {
    return this.request('/invigilator/seed-duties', {
      method: 'POST'
    });
  },
  getAttendanceOverview(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.examId) searchParams.append('examId', params.examId);
    if (params.roomId) searchParams.append('roomId', params.roomId);
    if (params.status) searchParams.append('status', params.status);
    if (params.method) searchParams.append('method', params.method);
    if (params.search) searchParams.append('search', params.search);
    const qs = searchParams.toString();
    return this.request(`/invigilator/attendance/overview${qs ? `?${qs}` : ''}`);
  }
};
