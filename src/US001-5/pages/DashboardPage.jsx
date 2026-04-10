import React, { useEffect, useState } from 'react';
import { userService, assetService, crewService, auditService } from '../services/api';
import { FiUsers, FiBox, FiUserCheck, FiFileText } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';
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
  const [stats, setStats] = useState({ users: 0, assets: 0, crews: 0, logs: 0 });
  const [recentLogs, setRecentLogs] = useState([]);

  useEffect(() => {
    Promise.allSettled([
      userService.getAll({ page: 0, size: 1 }),
      assetService.getAll({ page: 0, size: 1 }),
      crewService.getAll({ page: 0, size: 1 }),
      auditService.getLogs({ page: 0, size: 5 }),
    ]).then(([u, a, c, l]) => {
      setStats({
        users:
          u.status === 'fulfilled'
            ? u.value.data?.data?.totalElements ?? 0
            : 0,
        assets:
          a.status === 'fulfilled'
            ? a.value.data?.data?.totalElements ?? 0
            : 0,
        crews:
          c.status === 'fulfilled'
            ? c.value.data?.data?.totalElements ?? 0
            : 0,
        logs:
          l.status === 'fulfilled'
            ? l.value.data?.data?.totalElements ?? 0
            : 0,
      });

      if (l.status === 'fulfilled') {
        setRecentLogs(l.value.data?.data?.content ?? []);
      }
    });
  }, []);

  // Determine which dashboard to show based on user role
  const getDashboardComponent = () => {
    const userRoles = user?.roles || [];
    
    if (userRoles.includes('PLANNER')) return <PlannerDashboard />;
    if (userRoles.includes('ADMIN')) return <AdminDashboard />;
    if (userRoles.includes('TECHNICIAN')) return <TechnicianDashboard />;
    if (userRoles.includes('CONTROLLER')) return <ControllerDashboard />;
    if (userRoles.includes('BILLING')) return <BillingDashboard />;
    if (userRoles.includes('REGULATORY')) return <RegulatoryDashboard />;
    if (userRoles.includes('CONTROL_ROOM')) return <ControlRoomDashboard />;
    
    return <AdminDashboard />;
  };

  // Check if user is planner to show navbar instead of sidebar content
  const isPlannerRole = user?.roles?.includes('PLANNER');

  // Prevent planners from accessing admin functions
  const hasAdminAccess = user?.roles?.includes('ADMIN');
  const shouldShowAdminStats = !isPlannerRole && hasAdminAccess;

  return (
    <div className="page">
      {isPlannerRole && <Navbar />}
      
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">Welcome back, {user?.username || 'User'}</div>
        </div>
      </div>

      {getDashboardComponent()}
      {shouldShowAdminStats && (
        <>
          <div className="stats-grid">
            <StatCard label="Users" value={stats.users} icon={<FiUsers />} color="accent" />
            <StatCard label="Assets" value={stats.assets} icon={<FiBox />} color="success" />
            <StatCard label="Crews" value={stats.crews} icon={<FiUserCheck />} color="warning" />
            <StatCard label="Audit Logs" value={stats.logs} icon={<FiFileText />} />
          </div>

          <div className="card">
            {recentLogs.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">▤</div>
                No audit logs yet. Activity will appear here.
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>User</th>
                      <th>Entity</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentLogs.map((log, i) => (
                      <tr key={log.id || i}>
                        <td><span className="badge badge-blue">{log.action || '—'}</span></td>
                        <td>{log.performedBy || log.username || '—'}</td>
                        <td>{log.entityType || '—'}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                          {log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
