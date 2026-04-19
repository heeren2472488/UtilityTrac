import api from './api';

export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  requestPasswordReset: (email) => api.post('/auth/forgot-password', { email }),
};

export const userService = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  create: (user) => api.post('/users', user),
  update: (id, user) => api.put(`/users/${id}`, user),
  delete: (id) => api.delete(`/users/${id}`),
  assignRole: (userId, roleId) => api.post(`/users/${userId}/roles/${roleId}`),
  removeRole: (userId, roleId) => api.delete(`/users/${userId}/roles/${roleId}`),
};

export const roleService = {
  getAll: () => api.get('/roles'),
  getById: (id) => api.get(`/roles/${id}`),
  create: (role) => api.post('/roles', role),
  update: (id, role) => api.put(`/roles/${id}`, role),
  delete: (id) => api.delete(`/roles/${id}`),
};

export const auditService = {
  getLogs: (params) => api.get('/audit-logs', { params }),
  getByUser: (userId) => api.get(`/audit-logs/user/${userId}`),
};

export const crewService = {
  getAll: () => api.get('/crew-assignments'),
  assign: (data) => api.post('/crew-assignments', data),
  update: (id, data) => api.put(`/crew-assignments/${id}`, data),
  delete: (id) => api.delete(`/crew-assignments/${id}`),
};

export const workLogService = {
  getAll: () => api.get('/work-logs'),
  create: (data) => api.post('/work-logs', data),
  getByUser: (userId) => api.get(`/work-logs/user/${userId}`),
};
