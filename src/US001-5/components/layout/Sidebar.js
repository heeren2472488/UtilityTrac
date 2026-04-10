import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  FiGrid,
  FiUsers,
  FiBox,
  FiShare2,
  FiTool,
  FiUserCheck,
  FiClipboard,
  FiFileText,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: FiGrid, roles: ['ADMIN', 'PLANNER', 'TECHNICIAN', 'CONTROLLER', 'BILLING', 'REGULATORY', 'CONTROL_ROOM'] },
  { path: '/users', label: 'Users & Roles', icon: FiUsers, roles: ['ADMIN'] },
  { path: '/assets', label: 'Asset Management', icon: FiBox, roles: ['ADMIN', 'PLANNER'] },
  { path: '/network-topology', label: 'Network Topology', icon: FiShare2, roles: ['ADMIN'] },
  { path: '/maintenance-profiles', label: 'Maintenance Profiles', icon: FiTool, roles: ['ADMIN', 'PLANNER'] },
  { path: '/crews', label: 'Crew', icon: FiUserCheck, roles: ['ADMIN', 'PLANNER'] },
  { path: '/work-logs', label: 'Work Logs', icon: FiClipboard, roles: ['ADMIN', 'TECHNICIAN', 'PLANNER'] },
  { path: '/audit-logs', label: 'Audit Logs', icon: FiFileText, roles: ['ADMIN'] },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const userRoles = user?.roles || [];
  const allowedItems = NAV_ITEMS.filter(item => item.roles?.some(role => userRoles.includes(role)));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-icon">⬡</span>
          {!collapsed && <span className="logo-text">UtiliTrack<span className="logo-sub">IAM</span></span>}
        </div>
        <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      <nav className="sidebar-nav">
        {allowedItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            title={collapsed ? item.label : ''}
          >
            <span className="nav-icon"><item.icon /></span>
            {!collapsed && <span className="nav-label">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="avatar">{user?.username?.[0]?.toUpperCase() || 'U'}</div>
          {!collapsed && (
            <div className="user-meta">
              <span className="user-name">{user?.username || 'Admin'}</span>
              <span className="user-role">{user?.roles?.[0] || 'ADMIN'}</span>
            </div>
          )}
        </div>
        <button className="logout-btn" onClick={handleLogout} title="Logout">⏻</button>
      </div>
    </aside>
  );
}
