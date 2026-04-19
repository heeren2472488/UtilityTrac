import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './final/context/AuthContext.js';
import { normalizeRoles } from './final/utils/normalizeRole.js';

import Sidebar from './final/components/layout/Sidebar.js';

import LoginPage from './final/pages/LoginPage.jsx';
import DashboardPage from './final/pages/DashboardPage.jsx';
import UsersPage from './final/pages/UsersPage.jsx';
import AssetsPage from './final/pages/AssetsPage.jsx';
import NetworkTopologyPage from './final/pages/NetworkTopologyPage.jsx';
import MaintenanceProfilesPage from './final/pages/MaintenanceProfilesPage.jsx';
import CrewPage from './final/pages/CrewPage.js';
import WorkLogsPage from './final/pages/WorkLogsPage.js';
import AuditLogsPage from './final/pages/AuditLogsPage.js';
import ReliabilityAnalyticsPage from './final/pages/ReliabilityAnalyticsPage.jsx';
import SafetyReportsPage from './final/pages/SafetyReportsPage.jsx';
import RegulatoryReportsPage from './final/pages/RegulatoryReportsPage.jsx';
import OutageManagementPage from './final/pages/OutageManagementPage.jsx';
import IncidentTimelinePage from './final/pages/IncidentTimelinePage.jsx';
import IncidentManagementPage from './final/pages/IncidentManagementPage.jsx';
import CrewDispatchPage from './final/pages/CrewDispatchPage.jsx';
import MeterReadingsPage from './final/pages/MeterReadingsPage.jsx';
import HomePage from './final/pages/HomePage.jsx';
import AdminDashboard from './final/components/dashboards/AdminDashboard.jsx';
import AdminTariffManagementPage from './final/pages/AdminTariffManagementPage.jsx';
import AdminReportingPage from './final/pages/AdminReportingPage.jsx';
import AdminRegulatoryReportsPage from './final/pages/AdminRegulatoryReportsPage.jsx';
import AdminSystemSettingsPage from './final/pages/AdminSystemSettingsPage.jsx';

import BillingDashboard from './final/components/dashboards/BillingDashboard.jsx';
import ControllerDashboard from './final/components/dashboards/ControllerDashboard.jsx';
import PlannerDashboard from './final/components/dashboards/PlannerDashboard.jsx';
import RegulatoryDashboard from './final/components/dashboards/RegulatoryDashboard.jsx';
import TechnicianDashboard from './final/components/dashboards/TechnicianDashboard.jsx';

import { ThemeProvider } from './final/context/ThemeContext.js';
import './App.css';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading…</div>;
  return user ? children : <Navigate to="/login" replace />;
}

function RoleRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading…</div>;
  const roles = normalizeRoles(user?.roles || []);
  const isAllowed = allowedRoles.some(role => roles.includes(role));
  return isAllowed ? children : <Navigate to="/dashboard" replace />;
}

function AppLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">

        <Routes>

          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/planner" element={<PlannerDashboard />} />
          <Route path="/technician" element={<TechnicianDashboard />} />
          <Route path="/controller" element={<ControllerDashboard />} />
          <Route path="/billing" element={<BillingDashboard />} />
          <Route path="/regulatory" element={<RegulatoryDashboard />} />
          <Route path="/admin" element={<RoleRoute allowedRoles={['ADMIN']}><AdminDashboard /></RoleRoute>} />
          <Route path="/admin/tariffs" element={<RoleRoute allowedRoles={['ADMIN']}><AdminTariffManagementPage /></RoleRoute>} />
          <Route path="/admin/reports" element={<RoleRoute allowedRoles={['ADMIN']}><AdminReportingPage /></RoleRoute>} />
          <Route path="/admin/regulatory" element={<RoleRoute allowedRoles={['ADMIN']}><AdminRegulatoryReportsPage /></RoleRoute>} />
          <Route path="/admin/system-settings" element={<RoleRoute allowedRoles={['ADMIN']}><AdminSystemSettingsPage /></RoleRoute>} />
          
          
          {/* IAM Pages */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/users" element={<RoleRoute allowedRoles={['ADMIN']}><UsersPage /></RoleRoute>} />
          <Route path="/assets" element={<RoleRoute allowedRoles={['ADMIN', 'PLANNER']}><AssetsPage /></RoleRoute>} />
          <Route path="/network-topology" element={<RoleRoute allowedRoles={['ADMIN']}><NetworkTopologyPage /></RoleRoute>} />
          <Route path="/maintenance-profiles" element={<RoleRoute allowedRoles={['ADMIN', 'PLANNER']}><MaintenanceProfilesPage /></RoleRoute>} />
          <Route path="/crews" element={<RoleRoute allowedRoles={['ADMIN', 'PLANNER']}><CrewPage /></RoleRoute>} />
          <Route path="/work-logs" element={<RoleRoute allowedRoles={['ADMIN', 'PLANNER', 'TECHNICIAN']}><WorkLogsPage /></RoleRoute>} />
          <Route path="/work-orders/:workOrderId/work-logs" element={<RoleRoute allowedRoles={['ADMIN', 'PLANNER', 'TECHNICIAN']}><WorkLogsPage /></RoleRoute>} />
          <Route path="/meter-readings" element={<RoleRoute allowedRoles={['TECHNICIAN']}><MeterReadingsPage /></RoleRoute>} />
          <Route path="/audit-logs" element={<RoleRoute allowedRoles={['ADMIN', 'REGULATORY']}><AuditLogsPage /></RoleRoute>} />
          <Route path="/reliability-analytics" element={<RoleRoute allowedRoles={['REGULATORY']}><ReliabilityAnalyticsPage /></RoleRoute>} />
          <Route path="/safety-reports" element={<RoleRoute allowedRoles={['REGULATORY']}><SafetyReportsPage /></RoleRoute>} />
          <Route path="/regulatory-reports" element={<RoleRoute allowedRoles={['REGULATORY']}><RegulatoryReportsPage /></RoleRoute>} />
          <Route path="/outage-management" element={<RoleRoute allowedRoles={['CONTROL_ROOM', 'CONTROLLER']}><OutageManagementPage /></RoleRoute>} />
          <Route path="/incident-timeline" element={<RoleRoute allowedRoles={['CONTROL_ROOM', 'CONTROLLER']}><IncidentTimelinePage /></RoleRoute>} />
          <Route path="/incident-management" element={<RoleRoute allowedRoles={['REGULATORY', 'ADMIN']}><IncidentManagementPage /></RoleRoute>} />
          <Route path="/crew-dispatch" element={<RoleRoute allowedRoles={['CONTROL_ROOM', 'CONTROLLER']}><CrewDispatchPage /></RoleRoute>} />

        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
           <Route path="/" element={<HomePage />} />

          {/* PUBLIC LOGIN */}
          <Route path="/login" element={<LoginPage />} />

          {/* PROTECTED AREA */}
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <AppLayout />
              </PrivateRoute>
            }
          />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  );
}