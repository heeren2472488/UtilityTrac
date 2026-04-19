import React from 'react';
import { useAuth } from '../context/AuthContext';
import { normalizeRoles } from '../utils/normalizeRole';
import PlannerDashboard from '../components/dashboards/PlannerDashboard';
import AdminDashboard from '../components/dashboards/AdminDashboard';
import TechnicianDashboard from '../components/dashboards/TechnicianDashboard';
import ControllerDashboard from '../components/dashboards/ControllerDashboard';
import BillingDashboard from '../components/dashboards/BillingDashboard';
import RegulatoryDashboard from '../components/dashboards/RegulatoryDashboard';
import ControlRoomDashboard from '../components/dashboards/ControlRoomDashboard';
import './DashboardPage.css';

export function StatCard({ label, value, icon, color }) {
  return (
    <div className={`stat-card ${color || ''}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-body">
        <span className="stat-label">{label}</span>
        <span className="stat-value">{value}</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const userRoles = normalizeRoles(user?.roles || []);

  // Get display name from user object (try name, then username, then email)
  const displayName = user?.name || user?.username || user?.email?.split('@')[0] || 'User';
  
  // Get primary role for display
  const primaryRole = userRoles.length > 0 ? userRoles[0] : 'User';
  const formattedRole = primaryRole
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  // Determine which dashboard to show based on user role
  const getDashboardComponent = () => {
    if (userRoles.includes('ADMIN')) return <AdminDashboard />;
    if (userRoles.includes('PLANNER')) return <PlannerDashboard />;
    if (userRoles.includes('TECHNICIAN')) return <TechnicianDashboard />;
    if (userRoles.includes('CONTROLLER')) return <ControllerDashboard />;
    if (userRoles.includes('BILLING')) return <BillingDashboard />;
    if (userRoles.includes('REGULATORY')) return <RegulatoryDashboard />;
    if (userRoles.includes('CONTROL_ROOM')) return <ControlRoomDashboard />;
    
    return <AdminDashboard />;
  };

  return (
    <div className="page">
      
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">
            Welcome back, <span className="user-name-highlight">{displayName}</span> <span className="role-badge-inline">{formattedRole}</span>
          </div>
        </div>
      </div>

      {getDashboardComponent()}
    </div>
  );
}
