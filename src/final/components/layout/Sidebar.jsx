import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FiHome, FiActivity, FiBarChart3, FiUsers, FiSettings, 
  FiFileText, FiAlertCircle, FiCheckCircle, FiDollarSign,
  FiTrendingUp, FiMapPin, FiClipboard, FiShield, FiChevronDown,
  FiChevronUp, FiLogOut
} from 'react-icons/fi';
import './Sidebar.css';

const roleMenus = {
  planner: [
    { label: 'Dashboard', path: '/planner', icon: FiHome },
    { label: 'Work Orders', path: '/work-logs', icon: FiClipboard },
    { label: 'Crews', path: '/crews', icon: FiUsers },
    { label: 'Assets', path: '/assets', icon: FiMapPin },
    { label: 'Maintenance Plans', path: '/maintenance-profiles', icon: FiActivity },
  ],
  technician: [
    { label: 'Dashboard', path: '/technician', icon: FiHome },
    { label: 'Meter Readings', path: '/meter-readings', icon: FiActivity },
    { label: 'Work Logs', path: '/work-logs', icon: FiFileText },
  ],
  controller: [
    { label: 'Dashboard', path: '/controller', icon: FiHome },
    { label: 'Outage Management', path: '/outage-management', icon: FiAlertCircle },
    { label: 'Incident Timeline', path: '/incident-timeline', icon: FiTrendingUp },
    { label: 'Crew Dispatch', path: '/crew-dispatch', icon: FiUsers },
  ],
  billing: [
    { label: 'Dashboard', path: '/billing', icon: FiHome },
    { label: 'Meter Read Overview', path: '/billing', icon: FiActivity },
    { label: 'Usage Validation', path: '/billing', icon: FiAlertCircle },
    { label: 'Estimation & Gaps', path: '/billing', icon: FiCheckCircle },
    { label: 'Billing Configuration', path: '/billing', icon: FiDollarSign },
  ],
  regulatory: [
    { label: 'Dashboard', path: '/regulatory', icon: FiHome },
    { label: 'Reliability Metrics', path: '/audit-logs', icon: FiBarChart3 },
    { label: 'Safety Reports', path: '/safety-reports', icon: FiShield },
    { label: 'Regulatory Reports', path: '/regulatory-reports', icon: FiFileText },
  ],
  admin: [
    { label: 'Dashboard', path: '/admin', icon: FiHome },
    { label: 'Users & Roles', path: '/users', icon: FiUsers },
    { label: 'Assets', path: '/assets', icon: FiMapPin },
    { label: 'Audit Logs', path: '/audit-logs', icon: FiFileText },
    { label: 'System Settings', path: '/dashboard', icon: FiSettings },
  ],
};

export default function Sidebar({ role }) {
  const location = useLocation();
  const [expanded, setExpanded] = useState(true);
  const [expandedSections, setExpandedSections] = useState({});
  
  const menuItems = roleMenus[role?.toLowerCase()] || [];
  
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const toggleSection = (label) => {
    setExpandedSections(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const roleDisplay = {
    planner: { label: 'Planner', color: '#5ee6ff' },
    technician: { label: 'Field Technician', color: '#34d399' },
    controller: { label: 'Control Room', color: '#fbbf24' },
    billing: { label: 'Billing Operator', color: '#f87171' },
    regulatory: { label: 'Regulatory', color: '#a78bfa' },
    admin: { label: 'Administrator', color: '#ff6b9d' },
  };

  const currentRole = roleDisplay[role?.toLowerCase()] || { label: role, color: '#c7dcf6' };

  return (
    <aside className={`sidebar ${expanded ? '' : 'collapsed'}`}>
      {/* Header */}
      <div className="sidebar-header-enhanced">
        <div className="sidebar-logo">
          <div className="logo-icon-pulse">⬡</div>
          {expanded && (
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
        <button 
          className="toggle-btn"
          onClick={() => setExpanded(!expanded)}
          title={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? '←' : '→'}
        </button>
      </div>

      {/* Role Badge */}
      {expanded && (
        <div className="sidebar-role-badge" style={{ borderLeftColor: currentRole.color }}>
          <span className="role-dot" style={{ backgroundColor: currentRole.color }}></span>
          <span className="role-label">{currentRole.label}</span>
        </div>
      )}

      {/* Navigation */}
      <nav className="sidebar-nav-enhanced">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item-enhanced ${active ? 'active' : ''}`}
              title={expanded ? '' : item.label}
              style={active ? { borderLeftColor: currentRole.color } : {}}
            >
              <Icon className="nav-icon-enhanced" size={18} />
              {expanded && <span className="nav-label">{item.label}</span>}
              {expanded && active && <span className="nav-badge"></span>}
            </Link>
          );
        })}
      </nav>

      {/* Billing Section - Special Enhanced Treatment */}
      {role?.toLowerCase() === 'billing' && expanded && (
        <div className="billing-section-enhanced">
          <div className="section-header">
            <span className="section-title">Workflow Sections</span>
          </div>
          <div className="billing-quick-access">
            <a href="#bulk-upload" className="quick-link" title="Jump to bulk upload">
              <FiActivity size={14} />
              <span>Bulk Upload</span>
            </a>
            <a href="#batch-history" className="quick-link" title="Jump to batch history">
              <FiFileText size={14} />
              <span>Batch History</span>
            </a>
            <a href="#meter-overview" className="quick-link" title="Jump to meter overview">
              <FiBarChart3 size={14} />
              <span>Meter Data</span>
            </a>
            <a href="#missing-reads" className="quick-link" title="Jump to missing reads">
              <FiAlertCircle size={14} />
              <span>Missing Reads</span>
            </a>
            <a href="#estimation" className="quick-link" title="Jump to estimation review">
              <FiCheckCircle size={14} />
              <span>Estimation</span>
            </a>
            <a href="#billing-config" className="quick-link" title="Jump to billing config">
              <FiDollarSign size={14} />
              <span>Billing Config</span>
            </a>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="sidebar-footer-enhanced">
        {expanded && (
          <Link to="/dashboard" className="footer-link">
            <FiHome size={16} />
            <span>Main Dashboard</span>
          </Link>
        )}
        <Link to="/" className="footer-link-home" title="Home">
          <FiLogOut size={16} />
          {expanded && <span>Home</span>}
        </Link>
      </div>
    </aside>
  );
}