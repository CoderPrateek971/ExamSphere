// Base API Client for ExamSphere
const API_BASE = 'http://localhost:5000/api';

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
  }
};
