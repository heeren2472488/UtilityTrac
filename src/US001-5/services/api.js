import axios from 'axios';

/* =====================================================
   BASE URLS
   (Adjust ports/domains for prod)
===================================================== */
const IAM_BASE_URL = 'http://localhost:8081/api/iam';
const CORE_BASE_URL = 'http://localhost:8081/api';
const MAINTENANCE_BASE_URL = 'http://localhost:8081/v1/us008';

/* =====================================================
   AXIOS INSTANCES
===================================================== */
const iamApi = axios.create({
  baseURL: IAM_BASE_URL,
  headers: { 
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  },
});

const coreApi = axios.create({
  baseURL: CORE_BASE_URL,
  headers: { 
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  },
});

const maintenanceApi = axios.create({
  baseURL: MAINTENANCE_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  },
});

/* =====================================================
   REQUEST INTERCEPTOR — ATTACH JWT
===================================================== */
const attachToken = (config) => {
  const token = localStorage.getItem('iam_token');

  const skipToken =
    config.url.includes('/login') ||
    config.url.includes('/register') ||
    config.url.includes('/forgot-password') ||
    config.url.includes('/reset-password');

  if (token && !skipToken) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
};

[iamApi, coreApi, maintenanceApi].forEach((api) => {
  api.interceptors.request.use(attachToken, (error) =>
    Promise.reject(error)
  );
});

/* =====================================================
   RESPONSE INTERCEPTOR — HANDLE 401
===================================================== */
const handleUnauthorized = (error) => {
  if (error.response?.status === 401) {
    localStorage.removeItem('iam_token');
    localStorage.removeItem('iam_user');
    window.dispatchEvent(new Event('session-expired'));
  }
  return Promise.reject(error);
};

[iamApi, coreApi, maintenanceApi].forEach((api) => {
  api.interceptors.response.use(
    (response) => response,
    handleUnauthorized
  );
});

/* =====================================================
   AUTH — US002
   /api/iam/*
===================================================== */
export const authService = {
  login: (credentials) =>
    iamApi.post('/login', credentials),

  logout: () => {
    localStorage.removeItem('iam_token');
    localStorage.removeItem('iam_user');
    window.dispatchEvent(new Event('session-expired'));
  },
};

/* =====================================================
   PASSWORD MANAGEMENT — US003
   /api/iam/*
===================================================== */
export const passwordService = {
  forgotPassword: (email) =>
    iamApi.post('/forgot-password', { email }),

  resetPassword: (token, newPassword) =>
    iamApi.post('/reset-password', { token, newPassword }),

  changePassword: (data) =>
    iamApi.post('/change-password', data),
};

/* =====================================================
   USERS & ROLES — US001
   /api/iam/*
===================================================== */
export const userService = {
  getAll: (params) =>
    iamApi.get('/users', { params }),

  getById: (id) =>
    iamApi.get(`/users/${id}`),

  create: (data) =>
    iamApi.post('/users', data),

  update: (id, data) =>
    iamApi.put(`/users/${id}`, data),

  delete: (id) =>
    iamApi.delete(`/users/${id}`),

  assignRoles: (userId, roleNames) =>
    iamApi.post(`/users/${userId}/roles`, { roleNames }),

  removeRoles: (userId, roleNames) =>
    iamApi.delete(`/users/${userId}/roles`, {
      data: { roleNames },
    }),
};

export const roleService = {
  getAll: (params) =>
    iamApi.get('/roles', { params }),

  getById: (id) =>
    iamApi.get(`/roles/${id}`),

  create: (data) =>
    iamApi.post('/roles', data),
};

/* =====================================================
   AUDIT LOGS — US004
   /api/iam/*
===================================================== */
export const auditService = {
  getLogs: (params) =>
    iamApi.get('/audit-logs', { params }),
};

/* =====================================================
   ASSETS — US005
   /api/*
===================================================== */
export const assetService = {
  getAll: (params) =>
    coreApi.get('/assets', { params }),

  getById: (id) =>
    coreApi.get(`/assets/${id}`),

  create: (data) =>
    coreApi.post('/assets', data),

  update: (id, data) =>
    coreApi.put(`/assets/${id}`, data),

  delete: (id) =>
    coreApi.delete(`/assets/${id}`),

  assign: (assetId, userId) =>
    coreApi.post(`/assets/${assetId}/assign`, { userId }),

  getHierarchy: () =>
    coreApi.get('/assets/hierarchy'),

  getHierarchyById: (id) =>
    coreApi.get(`/assets/hierarchy/${id}`),

  getHierarchyRoots: () =>
    coreApi.get('/assets/hierarchy/roots'),

  getHierarchyChildren: (id) =>
    coreApi.get(`/assets/hierarchy/${id}/children`),
};

export const topologyService = {
  getAll: (params) =>
    coreApi.get('/topology', { params }),

  getById: (linkId) =>
    coreApi.get(`/topology/${linkId}`),

  create: (data) =>
    coreApi.post('/topology', data),

  update: (linkId, data) =>
    coreApi.patch(`/topology/${linkId}`, data),
};

export const maintenanceProfileService = {
  getAll: (params) =>
    maintenanceApi.get('/maintenance-profiles', { params }),

  getById: (id) =>
    maintenanceApi.get(`/maintenance-profiles/${id}`),

  getByAssetId: (assetId) =>
    maintenanceApi.get('/maintenance-profiles', { params: { assetId } }),

  getByType: (maintenanceType) =>
    maintenanceApi.get('/maintenance-profiles', { params: { maintenanceType } }),

  create: (data) =>
    maintenanceApi.post('/maintenance-profiles', data),
};

/* =====================================================
   CREW SERVICE — US010
   /api/crews/*
===================================================== */
export const crewService = {
  getAll: (params) =>
    coreApi.get('/work-orders/crews', { params }),

  getById: (id) =>
    coreApi.get(`/work-orders/crews/${id}`),

  create: (data) =>
    coreApi.post('/work-orders/crews', data),

  update: (crewId, data) =>
    coreApi.put(`/work-orders/crews/${crewId}`, data),

  delete: (crewId) =>
    coreApi.delete(`/work-orders/crews/${crewId}`),

  addMember: (crewId, userId) =>
    coreApi.post(`/work-orders/crews/${crewId}/members`, { userId }),

  removeMember: (crewId, userId) =>
    coreApi.delete(`/work-orders/crews/${crewId}/members/${userId}`),

  getMembers: (crewId) =>
    coreApi.get(`/work-orders/crews/${crewId}/members`),

  assignToWorkOrder: (workOrderId, crewId) =>
    coreApi.post(`/work-orders/${workOrderId}/assign-crew`, null, { params: { crewId } }),

  unassignFromWorkOrder: (workOrderId) =>
    coreApi.delete(`/work-orders/${workOrderId}/unassign-crew`),

  getAssignedCrew: (workOrderId) =>
    coreApi.get(`/work-orders/${workOrderId}/crew`),
};

/* =====================================================
   WORK ORDERS SERVICE — US009
   /api/work-orders/*
===================================================== */
export const workOrderService = {
  getAll: (params) =>
    coreApi.get('/work-orders', { params }),

  getById: (id) =>
    coreApi.get(`/work-orders/${id}`),

  create: (data) =>
    coreApi.post('/work-orders', data),

  update: (id, data) =>
    coreApi.put(`/work-orders/${id}`, data),

  delete: (id) =>
    coreApi.delete(`/work-orders/${id}`),

  changeStatus: (id, status) =>
    coreApi.patch(`/work-orders/${id}/status`, { status }),

  assignCrew: (workOrderId, crewId) =>
    coreApi.post(`/work-orders/${workOrderId}/assign-crew`, null, { params: { crewId } }),

  unassignCrew: (workOrderId) =>
    coreApi.delete(`/work-orders/${workOrderId}/unassign-crew`),

  getAssignedCrew: (workOrderId) =>
    coreApi.get(`/work-orders/${workOrderId}/crew`),

  addWorkLog: (workOrderId, data) =>
    coreApi.post(`/work-orders/${workOrderId}/work-logs`, data),

  getWorkLogs: (workOrderId) =>
    coreApi.get(`/work-orders/${workOrderId}/work-logs`),
};

/* =====================================================
   WORK LOGS SERVICE — US011
   /api/work-logs/*
===================================================== */
export const workLogService = {
  create: (workOrderId, data) =>
    coreApi.post(`/work-orders/${workOrderId}/work-logs`, data),

  getByWorkOrder: (workOrderId) =>
    coreApi.get(`/work-orders/${workOrderId}/work-logs`),

  getById: (workLogId) =>
    coreApi.get(`/work-logs/${workLogId}`),

  update: (workLogId, data) =>
    coreApi.put(`/work-logs/${workLogId}`, data),

  delete: (workLogId) =>
    coreApi.delete(`/work-logs/${workLogId}`),
};