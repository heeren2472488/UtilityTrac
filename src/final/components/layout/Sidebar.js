import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  FiGrid, FiUsers, FiBox, FiShare2, FiTool, FiUserCheck,
  FiClipboard, FiFileText, FiAlertTriangle,
  FiBarChart2, FiShield, FiSettings, FiActivity,
  FiDollarSign, FiTrendingUp, FiRadio,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { normalizeRoles } from '../../utils/normalizeRole';
import { incidentReportService } from '../../services/api';
import './Sidebar.css';

// Role-based grouped navigation
// soon:true = page not yet implemented, shown disabled with badge
const ROLE_NAV = {
  ADMIN: [
    { section: 'Overview', items: [
      { path: '/dashboard', label: 'Dashboard', icon: FiGrid },
    ]},
    { section: 'Identity & Access', items: [
      { path: '/users',      label: 'Users & Roles',    icon: FiUsers },
      { path: '/audit-logs', label: 'Audit Logs',       icon: FiFileText },
    ]},
    { section: 'Asset Registry', items: [
      { path: '/assets',            label: 'Assets & Types',   icon: FiBox },
      { path: '/network-topology',  label: 'Network Topology', icon: FiShare2 },
    ]},
    { section: 'Operations', items: [
      { path: '/maintenance-profiles', label: 'Maintenance Profiles', icon: FiTool },
      { path: '/crews',                label: 'Crew Management',      icon: FiUserCheck },
      { path: '/work-logs',            label: 'Work Logs',            icon: FiClipboard },
    ]},
    { section: 'Reporting', items: [
      { path: '/admin/reports',         label: 'System & Billing Reports',        icon: FiBarChart2 },
      { path: '/admin/tariffs',         label: 'Tariff Management',               icon: FiDollarSign },
      { path: '/admin/regulatory',      label: 'Compliance & Regulatory Reports', icon: FiTrendingUp },
      { path: '/admin/system-settings', label: 'Platform Configuration',          icon: FiSettings },
    ]},
  ],
  PLANNER: [
    { section: 'Overview', items: [
      { path: '/dashboard', label: 'Dashboard', icon: FiGrid },
    ]},
    { section: 'Assets', items: [
      { path: '/assets', label: 'Assets (Read-only)', icon: FiBox },
    ]},
    { section: 'Maintenance Planning', items: [
      { path: '/work-logs',            label: 'Work Orders',          icon: FiClipboard },
      { path: '/maintenance-profiles', label: 'Maintenance Calendar', icon: FiTool },
    ]},
    { section: 'Resources', items: [
      { path: '/crews',     label: 'Crew Management',    icon: FiUserCheck },
      { path: '/dashboard', label: 'Outage Coordination', icon: FiAlertTriangle, soon: true },
    ]},
  ],
  TECHNICIAN: [
    { section: 'Overview', items: [
      { path: '/dashboard', label: 'Dashboard', icon: FiGrid },
    ]},
    { section: 'Field Work', items: [
      { path: '/dashboard', label: 'My Work Orders',   icon: FiClipboard,    soon: true },
      { path: '/dashboard', label: 'Asset Details',    icon: FiBox,          soon: true },
      { path: '/work-logs', label: 'Work Logs',        icon: FiFileText },
      { path: '/meter-readings', label: 'Meter Readings', icon: FiActivity },
    ]},
  ],
  CONTROLLER: [
    { section: 'Overview', items: [
      { path: '/dashboard', label: 'Dashboard', icon: FiGrid },
    ]},
    { section: 'Outage Operations', items: [
      { path: '/outage-management',    label: 'Outage Management',    icon: FiAlertTriangle },
      { path: '/incident-timeline',    label: 'Incident Timeline',    icon: FiActivity },
      { path: '/crew-dispatch',        label: 'Crew Dispatch',        icon: FiRadio },
    ]},
  ],
  CONTROL_ROOM: [
    { section: 'Overview', items: [
      { path: '/dashboard', label: 'Dashboard', icon: FiGrid },
    ]},
    { section: 'Outage Operations', items: [
      { path: '/outage-management',    label: 'Outage Management',    icon: FiAlertTriangle },
      { path: '/incident-timeline',    label: 'Incident Timeline',    icon: FiActivity },
      { path: '/crew-dispatch',        label: 'Crew Dispatch',        icon: FiRadio },
    ]},
  ],
  BILLING: [
    { section: 'Billing & Metering', items: [
      { path: '/billing?section=overview',     label: 'Meter Read Overview',              icon: FiActivity },
      { path: '/billing?section=validation',   label: 'Usage Validation & Missing Reads', icon: FiBarChart2 },
      { path: '/billing?section=estimation',   label: 'Estimation & Gap Review',          icon: FiAlertTriangle },
      { path: '/billing?section=config',       label: 'Billing Configuration',            icon: FiDollarSign },
    ]},
  ],
  REGULATORY: [
    { section: 'Overview', items: [
      { path: '/dashboard', label: 'Dashboard', icon: FiGrid },
    ]},
    { section: 'Analytics & Compliance', items: [
      { path: '/incident-management',  label: 'Incident Management',  icon: FiShield },
      { path: '/reliability-analytics', label: 'Reliability Analytics', icon: FiTrendingUp },
      { path: '/safety-reports',        label: 'Safety Reports',        icon: FiShield },
      { path: '/regulatory-reports',    label: 'Regulatory Reports',    icon: FiBarChart2 },
      { path: '/audit-logs', label: 'Audit Logs (Read)',    icon: FiFileText },
    ]},
  ],
};

// Pick the nav structure for the user's primary role
function getNavSections(userRoles) {
  const normalized = normalizeRoles(userRoles);
  const priority = ['ADMIN', 'PLANNER', 'TECHNICIAN', 'CONTROLLER', 'CONTROL_ROOM', 'BILLING', 'REGULATORY'];
  for (const role of priority) {
    if (normalized.includes(role)) return ROLE_NAV[role] || [];
  }
  return [{ section: 'Overview', items: [{ path: '/dashboard', label: 'Dashboard', icon: FiGrid }] }];
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(true);
  const [hoverExpanded, setHoverExpanded] = useState(false);
  const [pendingIncidents, setPendingIncidents] = useState(0);
  const userRoles = user?.roles || [];
  const navSections = getNavSections(userRoles);
  const isAdmin = userRoles.includes('ADMIN');

  useEffect(() => {
    if (!isAdmin) return;
    const fetchPending = async () => {
      try {
        const res = await incidentReportService.getAll();
        const incidents = res?.data?.data ?? [];
        const pending = (Array.isArray(incidents) ? incidents : []).filter(
          (i) => i.status === 'DRAFT' || i.status === 'SUBMITTED'
        ).length;
        setPendingIncidents(pending);
      } catch {
        setPendingIncidents(0);
      }
    };
    fetchPending();
    const interval = setInterval(fetchPending, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [isAdmin]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isCollapsedView = collapsed && !hoverExpanded;

  useEffect(() => {
    const offset = isCollapsedView ? '64px' : '260px';
    document.documentElement.style.setProperty('--layout-sidebar-offset', offset);

    return () => {
      document.documentElement.style.setProperty('--layout-sidebar-offset', '260px');
    };
  }, [isCollapsedView]);

  const isItemActive = (itemPath, navIsActive) => {
    if (!itemPath) return false;

    if (itemPath.includes('?')) {
      const [pathOnly, queryString] = itemPath.split('?');
      if (location.pathname !== pathOnly) return false;
      const expected = new URLSearchParams(queryString || '');
      const current = new URLSearchParams(location.search || '');
      for (const [k, v] of expected.entries()) {
        if (current.get(k) !== v) return false;
      }
      return true;
    }

    if (itemPath === '/billing') {
      const section = new URLSearchParams(location.search || '').get('section');
      return location.pathname === '/billing' && !section;
    }

    return navIsActive;
  };

  return (
    <aside
      className={`sidebar ${collapsed ? 'collapsed' : ''} ${hoverExpanded ? 'hover-expanded' : ''}`}
      onMouseEnter={() => collapsed && setHoverExpanded(true)}
      onMouseLeave={() => setHoverExpanded(false)}
    >
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-icon">⬡</span>
          {!isCollapsedView && (
            <span className="logo-text">
              <span className="holi-U">U</span>
              <span className="holi-t">t</span>
              <span className="holi-i">i</span>
              <span className="holi-l">l</span>
              <span className="holi-i2">i</span>
              <span className="holi-T">T</span>
              <span className="holi-r">r</span>
              <span className="holi-a">a</span>
              <span className="holi-c">c</span>
              <span className="holi-k">k</span>
            </span>
          )}
        </div>
        <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      {/* Incident Alert Badge */}
      {isAdmin && pendingIncidents > 0 && !isCollapsedView && (
        <div style={{
          margin: '12px 12px 4px',
          padding: '10px 12px',
          background: 'rgba(248,113,113,0.15)',
          border: '1px solid rgba(248,113,113,0.3)',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: '600',
          color: '#f87171',
          textAlign: 'center',
          cursor: 'pointer',
        }} onClick={() => navigate('/incident-management')}>
          🔔 {pendingIncidents} Pending Incident{pendingIncidents !== 1 ? 's' : ''}
        </div>
      )}

      <nav className="sidebar-nav">
        {navSections.map(section => (
          <div key={section.section} className="nav-section">
            {!isCollapsedView && (
              <div className="nav-section-label">{section.section}</div>
            )}
            {section.items.map(item =>
              item.soon ? (
                <div
                  key={item.label}
                  className="nav-item nav-item-soon"
                  title={isCollapsedView ? `${item.label} (coming soon)` : ''}
                >
                  <span className="nav-icon"><item.icon /></span>
                  {!isCollapsedView && (
                    <>
                      <span className="nav-label">{item.label}</span>
                      <span className="nav-soon">soon</span>
                    </>
                  )}
                </div>
              ) : (
                <NavLink
                  key={item.path + item.label}
                  to={item.path}
                  className={({ isActive }) => `nav-item ${isItemActive(item.path, isActive) ? 'active' : ''}`}
                  title={isCollapsedView ? item.label : ''}
                  onClick={(e) => {
                    if (isCollapsedView) {
                      e.preventDefault();
                      setCollapsed(false);
                      setHoverExpanded(true);
                    }
                  }}
                >
                  <span className="nav-icon"><item.icon /></span>
                  {!isCollapsedView && <span className="nav-label">{item.label}</span>}
                </NavLink>
              )
            )}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="avatar">{user?.username?.[0]?.toUpperCase() || 'U'}</div>
          {!isCollapsedView && (
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
