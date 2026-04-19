import axios from 'axios';

/* =====================================================
   BASE URLS
   (Adjust ports/domains for prod)
===================================================== */
const IAM_BASE_URL = 'http://localhost:8081/api/iam';
const CORE_BASE_URL = 'http://localhost:8081/api';
const MAINTENANCE_BASE_URL = 'http://localhost:8081/v1/us008';
const OUTAGE_BASE_URL = 'http://localhost:8081/v1/outages';

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

const outageApi = axios.create({
  baseURL: OUTAGE_BASE_URL,
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

[iamApi, coreApi, maintenanceApi, outageApi].forEach((api) => {
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

[iamApi, coreApi, maintenanceApi, outageApi].forEach((api) => {
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
    iamApi.get('/assets', { params }),

  getById: (id) =>
    iamApi.get(`/assets/${id}`),

  create: (data) =>
    iamApi.post('/assets', data),

  update: (id, data) =>
    iamApi.put(`/assets/${id}`, data),

  delete: (id) =>
    iamApi.delete(`/assets/${id}`),

  assign: (assetId, userId) =>
    iamApi.post(`/assets/${assetId}/assign`, { userId }),

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
  getAll: () =>
    coreApi.get('/work-logs'),

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

/* =====================================================
   METER READS SERVICE — FIELD TECHNICIAN
   /api/meter-reads/*
===================================================== */
export const meterReadService = {
  getAllMeters: () =>
    coreApi.get('/meter-reads/meters'),

  getAll: () =>
    coreApi.get('/meter-reads'),

  createManual: (readings) =>
    coreApi.post('/meter-reads/manual', readings),

  getById: (id) =>
    coreApi.get(`/meter-reads/${id}`),

  getByMeter: (meterId) =>
    coreApi.get(`/meter-reads/meter/${meterId}`),

  getByMeterRange: (meterId, params) =>
    coreApi.get(`/meter-reads/meter/${meterId}/range`, { params }),

  importBatch: (data) =>
    coreApi.post('/meter-reads/batch/import', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getBatch: () =>
    coreApi.get('/meter-reads/batch'),

  getBatchById: (id) =>
    coreApi.get(`/meter-reads/batch/${id}`),

  getMissing: () =>
    coreApi.get('/meter-reads/missing'),

  getMissingSummary: () =>
    coreApi.get('/meter-reads/missing/summary'),

  markMissing: (id) =>
    coreApi.patch(`/meter-reads/${id}/mark-missing`),

  overrideEstimate: (id, data) =>
    coreApi.patch(`/meter-reads/${id}/override`, data),

  updateReading: (id, data) =>
    coreApi.put(`/meter-reads/${id}`, data),
};

export const meterService = {
  getAllMeters: () =>
    coreApi.get('/meter-reads/meters'),
};

/* =====================================================
   TARIFF SERVICE — ADMIN BILLING REFS
   /api/tariff/*
===================================================== */
export const tariffService = {
  add: (data) =>
    coreApi.post('/tariff/add', data),

  getAll: () =>
    coreApi.get('/tariff'),

  calculate: (billingPeriod, data) =>
    coreApi.post(`/tariff/calculate/${encodeURIComponent(billingPeriod)}`, data),
};

/* =====================================================
   USAGE AGGREGATES SERVICE — BILLING
   /api/usage-aggregates/*
===================================================== */
export const usageAggregateService = {
  aggregate: (params) =>
    coreApi.post('/usage-aggregates/aggregate', null, { params }),

  getBillingReady: () =>
    coreApi.get('/usage-aggregates/billing-ready'),

  getByCustomerId: (customerId) =>
    coreApi.get(`/usage-aggregates/customer/${encodeURIComponent(customerId)}`),

  getReport: (params) =>
    coreApi.get('/usage-aggregates/report', { params }),

  getSummary: () =>
    coreApi.get('/usage-aggregates/summary'),
};

/* =====================================================
   CREW DISPATCH SERVICE — CONTROL ROOM OPERATOR
   /v1/crew-dispatches/*
===================================================== */
const crewDispatchApi = axios.create({
  baseURL: 'http://localhost:8081/v1/crew-dispatches',
  headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
});
[crewDispatchApi].forEach((api) => {
  api.interceptors.request.use(attachToken, (e) => Promise.reject(e));
  api.interceptors.response.use((r) => r, handleUnauthorized);
});

export const crewDispatchService = {
  dispatch:       (data)     => crewDispatchApi.post('', data),
  getById:        (id)       => crewDispatchApi.get(`/${id}`),
  getActive:      ()         => crewDispatchApi.get('/active'),
  getByOutage:    (outageId) => crewDispatchApi.get(`/outage/${outageId}`),
  getByStatus:    (status)   => crewDispatchApi.get(`/status/${status}`),
  getByCrew:      (crewId)   => crewDispatchApi.get(`/crew/${crewId}`),
};

/* =====================================================
   INCIDENT REPORTS SERVICE — CONTROL ROOM OPERATOR
   /v1/incident-reports/*
===================================================== */
const incidentReportApi = axios.create({
  baseURL: 'http://localhost:8081/v1/incident-reports',
  headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
});
[incidentReportApi].forEach((api) => {
  api.interceptors.request.use(attachToken, (e) => Promise.reject(e));
  api.interceptors.response.use((r) => r, handleUnauthorized);
});

export const incidentReportService = {
  create:  (data)  => incidentReportApi.post('', data),
  getAll:  ()      => incidentReportApi.get(''),
  getById: (id)    => incidentReportApi.get(`/${id}`),
  approve: (id)    => incidentReportApi.post(`/${id}/approve`),
  reject:  (id)    => incidentReportApi.post(`/${id}/reject`),
};

/* =====================================================
   ANALYTICS SERVICE — REGULATORY ANALYST
   /api/v1/analytics/*
===================================================== */
export const analyticsService = {
  getReliability: () =>
    coreApi.get('/v1/analytics/reliability'),

  createReliability: (data) =>
    coreApi.post('/v1/analytics/reliability', data),

  getSafety: () =>
    coreApi.get('/v1/analytics/safety'),

  createSafety: (data) =>
    coreApi.post('/v1/analytics/safety', data),

  getReports: () =>
    coreApi.get('/v1/analytics/reports'),

  createReportDraft: (data) =>
    coreApi.post('/v1/analytics/reports/draft', data),

  submitReport: (reportId, data) =>
    coreApi.put(`/v1/analytics/reports/${encodeURIComponent(reportId)}/submit`, data),
};

/* =====================================================
   NOTIFICATION SERVICE — CREW ASSIGNMENT
   /api/v1/notifications/*
===================================================== */
export const notificationService = {
  triggerCrewAssignment: (data) =>
    coreApi.post('/v1/notifications/trigger/crew-assignment', data),

  getUserNotifications: (crewUserId) =>
    coreApi.get(`/v1/notifications/user/${encodeURIComponent(crewUserId)}`),

  getUnreadUserNotifications: (crewUserId) =>
    coreApi.get(`/v1/notifications/user/${encodeURIComponent(crewUserId)}/unread`),

  markRead: (notificationId) =>
    coreApi.patch(`/v1/notifications/${encodeURIComponent(notificationId)}/read`),

  dismiss: (notificationId) =>
    coreApi.patch(`/v1/notifications/${encodeURIComponent(notificationId)}/dismiss`),
};

/* =====================================================
   OUTAGES SERVICE — CONTROL ROOM OPERATOR
   /v1/outages/*
===================================================== */
export const outageService = {
  logOutage: (data) =>
    outageApi.post('/log', data),

  getByStatus: (status, params) =>
    outageApi.get(`/status/${status}`, { params }),

  getByRegion: (region) =>
    outageApi.get(`/region/${encodeURIComponent(region)}`),

  getUnresolved: () =>
    outageApi.get('/unresolved'),
};