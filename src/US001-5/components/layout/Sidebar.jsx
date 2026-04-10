import React from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';

export default function Sidebar({ role }) {
  const menus = {
    planner: [
      { label: 'Work Orders', path: '/planner/work-orders' },
      { label: 'Crew Management', path: '/planner/crews' },
      { label: 'Asset Registry', path: '/planner/assets' },
      { label: 'Maintenance Plans', path: '/planner/plans' },
      { label: 'Reports', path: '/planner/reports' },
    ],
    technician: [
      { label: 'My Assignments', path: '/technician/assignments' },
      { label: 'Inspections', path: '/technician/inspections' },
      { label: 'Asset Updates', path: '/technician/updates' },
      { label: 'Work Logs', path: '/technician/logs' },
      { label: 'Safety Checklist', path: '/technician/safety' },
    ],
    controller: [
      { label: 'Outage Map', path: '/controller/map' },
      { label: 'Incident Reports', path: '/controller/incidents' },
      { label: 'Dispatch Queue', path: '/controller/dispatch' },
      { label: 'Restoration Tracking', path: '/controller/restoration' },
      { label: 'Alerts', path: '/controller/alerts' },
    ],
    billing: [
      { label: 'Meter Reads', path: '/billing/reads' },
      { label: 'Usage Validation', path: '/billing/validation' },
      { label: 'Bill References', path: '/billing/references' },
      { label: 'Exceptions', path: '/billing/exceptions' },
      { label: 'Tariffs', path: '/billing/tariffs' },
    ],
    regulatory: [
      { label: 'Reliability Metrics', path: '/regulatory/metrics' },
      { label: 'Safety Records', path: '/regulatory/safety' },
      { label: 'Reports', path: '/regulatory/reports' },
      { label: 'Compliance', path: '/regulatory/compliance' },
      { label: 'Audits', path: '/regulatory/audits' },
    ],
    admin: [
      { label: 'User Management', path: '/admin/users' },
      { label: 'Region Config', path: '/admin/regions' },
      { label: 'Asset Types', path: '/admin/assets' },
      { label: 'Audit Logs', path: '/admin/audits' },
      { label: 'System Settings', path: '/admin/settings' },
    ],
  };

  const menuItems = menus[role] || [];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h3>UtiliTrack</h3>
        <p>{role.charAt(0).toUpperCase() + role.slice(1)} Dashboard</p>
      </div>
      <nav className="sidebar-nav">
        <ul>
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link to={item.path}>{item.label}</Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="sidebar-footer">
        <Link to="/">Back to Home</Link>
      </div>
    </aside>
  );
}