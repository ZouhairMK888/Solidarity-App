import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('solidarity_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global response error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('solidarity_token');
      localStorage.removeItem('solidarity_user');
      // Avoid redirect loop on auth pages
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// ─── Campaigns ───────────────────────────────────────────────────────────────
export const campaignAPI = {
  getAll: (params) => api.get('/campaigns', { params }),
  getById: (id) => api.get(`/campaigns/${id}`),
  getMissions: (id) => api.get(`/campaigns/${id}/missions`),
  getMissionTasks: (campaignId, missionId) => api.get(`/campaigns/${campaignId}/missions/${missionId}/tasks`),
  create: (data) => api.post('/campaigns', data),
  update: (id, data) => api.put(`/campaigns/${id}`, data),
  remove: (id) => api.delete(`/campaigns/${id}`),
  getManageable: () => api.get('/campaigns/manage'),
  updateStatus: (id, data) => api.patch(`/campaigns/${id}/status`, data),
  createMission: (campaignId, data) => api.post(`/campaigns/${campaignId}/missions`, data),
  updateMission: (campaignId, missionId, data) => api.put(`/campaigns/${campaignId}/missions/${missionId}`, data),
  updateMissionStatus: (campaignId, missionId, data) => api.patch(`/campaigns/${campaignId}/missions/${missionId}/status`, data),
  removeMission: (campaignId, missionId) => api.delete(`/campaigns/${campaignId}/missions/${missionId}`),
  createMissionTask: (campaignId, missionId, data) => api.post(`/campaigns/${campaignId}/missions/${missionId}/tasks`, data),
  updateMissionTask: (campaignId, missionId, taskId, data) => api.put(`/campaigns/${campaignId}/missions/${missionId}/tasks/${taskId}`, data),
  removeMissionTask: (campaignId, missionId, taskId) => api.delete(`/campaigns/${campaignId}/missions/${missionId}/tasks/${taskId}`),
  applyToMission: (campaignId, missionId, data = {}) => api.post(`/campaigns/${campaignId}/missions/${missionId}/apply`, data),
  applyToOrganize: (campaignId, data = {}) => api.post(`/campaigns/${campaignId}/organizer-applications`, data),
  getOrganizerApplications: (params) => api.get('/campaigns/organizer-applications/manage', { params }),
  reviewOrganizerApplication: (id, data) => api.patch(`/campaigns/organizer-applications/${id}/status`, data),
  createDonation: (campaignId, data) => api.post(`/campaigns/${campaignId}/donations`, data),
};

export const donationAPI = {
  getManageable: (params) => api.get('/campaigns/donations/manage', { params }),
  update: (id, data) => api.put(`/campaigns/donations/${id}`, data),
  updateStatus: (id, data) => api.patch(`/campaigns/donations/${id}/status`, data),
  remove: (id) => api.delete(`/campaigns/donations/${id}`),
};

export const adminAPI = {
  getOverview: () => api.get('/admin/overview'),
  getUsers: (params) => api.get('/admin/users', { params }),
  getMissionApplications: (params) => api.get('/admin/mission-applications', { params }),
  getMissionTaskBoard: (missionId) => api.get(`/admin/missions/${missionId}/task-board`),
  createOrganizer: (data) => api.post('/admin/organizers', data),
  reviewMissionApplication: (id, data) => api.patch(`/admin/mission-applications/${id}/status`, data),
  updateMissionTaskAssignment: (missionId, assignmentId, data) => api.patch(`/admin/missions/${missionId}/assignments/${assignmentId}`, data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  updateUserStatus: (id, data) => api.patch(`/admin/users/${id}/status`, data),
  updateUserRole: (id, data) => api.patch(`/admin/users/${id}/role`, data),
};

export const notificationAPI = {
  getMine: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
};

export const assistantAPI = {
  chat: (messages) => api.post('/assistant/chat', { messages }),
};

export default api;
