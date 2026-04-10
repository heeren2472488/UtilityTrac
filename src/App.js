import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './US001-5/context/AuthContext';

import Sidebar from './US001-5/components/layout/Sidebar';

import LoginPage from './US001-5/pages/LoginPage.jsx';
import DashboardPage from './US001-5/pages/DashboardPage.jsx';
import UsersPage from './US001-5/pages/UsersPage.jsx';
import AssetsPage from './US001-5/pages/AssetsPage.jsx';
import NetworkTopologyPage from './US001-5/pages/NetworkTopologyPage.jsx';
import MaintenanceProfilesPage from './US001-5/pages/MaintenanceProfilesPage.jsx';
import CrewPage from './US001-5/pages/CrewPage.js';
import WorkLogsPage from './US001-5/pages/WorkLogsPage';
import AuditLogsPage from './US001-5/pages/AuditLogsPage';
import HomePage from './US001-5/pages/HomePage.jsx';
import AdminDashboard from './US001-5/components/dashboards/AdminDashboard';

import BillingDashboard from './US001-5/components/dashboards/BillingDashboard';
import ControllerDashboard from './US001-5/components/dashboards/ControllerDashboard';
import PlannerDashboard from './US001-5/components/dashboards/PlannerDashboard';
import RegulatoryDashboard from './US001-5/components/dashboards/RegulatoryDashboard';
import TechnicianDashboard from './US001-5/components/dashboards/TechnicianDashboard';

import './App.css';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading…</div>;
  return user ? children : <Navigate to="/login" replace />;
}

function RoleRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading…</div>;
  const roles = user?.roles || [];
  const isAllowed = allowedRoles.some(role => roles.includes(role));
  return isAllowed ? children : <Navigate to="/dashboard" replace />;
}

function AppLayout() {
  const { user } = useAuth();
  const roles = user?.roles || [];
  const isPlannerOnly = roles.includes('PLANNER') && !roles.includes('ADMIN');

  return (
    <div className="app-shell">
      {!isPlannerOnly && <Sidebar />}
      <main className={`main-content ${isPlannerOnly ? 'no-sidebar' : ''}`}>

        <Routes>

          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/planner" element={<PlannerDashboard />} />
          <Route path="/technician" element={<TechnicianDashboard />} />
          <Route path="/controller" element={<ControllerDashboard />} />
          <Route path="/billing" element={<BillingDashboard />} />
          <Route path="/regulatory" element={<RegulatoryDashboard />} />
          <Route path="/admin" element={<RoleRoute allowedRoles={['ADMIN']}><AdminDashboard /></RoleRoute>} />
          
          
          {/* IAM Pages */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/users" element={<RoleRoute allowedRoles={['ADMIN']}><UsersPage /></RoleRoute>} />
          <Route path="/assets" element={<RoleRoute allowedRoles={['ADMIN', 'PLANNER']}><AssetsPage /></RoleRoute>} />
          <Route path="/network-topology" element={<RoleRoute allowedRoles={['ADMIN']}><NetworkTopologyPage /></RoleRoute>} />
          <Route path="/maintenance-profiles" element={<RoleRoute allowedRoles={['ADMIN', 'PLANNER']}><MaintenanceProfilesPage /></RoleRoute>} />
          <Route path="/crews" element={<RoleRoute allowedRoles={['ADMIN', 'PLANNER']}><CrewPage /></RoleRoute>} />
          <Route path="/work-logs" element={<RoleRoute allowedRoles={['ADMIN', 'PLANNER', 'TECHNICIAN']}><WorkLogsPage /></RoleRoute>} />
          <Route path="/work-orders/:workOrderId/work-logs" element={<RoleRoute allowedRoles={['ADMIN', 'PLANNER', 'TECHNICIAN']}><WorkLogsPage /></RoleRoute>} />
          <Route path="/audit-logs" element={<RoleRoute allowedRoles={['ADMIN']}><AuditLogsPage /></RoleRoute>} />

        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
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
  );
}