import React from 'react';
import './Dashboard.css';

export default function AdminDashboard() {
  return (
    <section className="dashboard-panel">
      <div className="dashboard-header">
        <div className="dashboard-meta">
          <span className="dashboard-label">Utility admin</span>
          <h2 className="dashboard-title">Network configuration, roles, and security</h2>
          <p className="dashboard-description">
            Control regions, asset classes, user roles, and audit policy from one secure admin console.
          </p>
        </div>
        <div className="dashboard-stat">
          <strong>7</strong>
          <span>Configured zones</span>
        </div>
      </div>

      <div
        className="dashboard-hero"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1500&q=80)' }}
      >
        <div className="dashboard-hero-text">
          <h3>Operational control</h3>
          <p>Manage asset categories, user permissions, and audit logging for your entire utility domain.</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <article className="dashboard-card">
          <h3>Region & topology</h3>
          <p>Configure feeders, substations, and asset relationships by geography.</p>
        </article>
        <article className="dashboard-card">
          <h3>Role management</h3>
          <p>Define access for planners, technicians, operators, billing staff, and analysts.</p>
        </article>
        <article className="dashboard-card">
          <h3>Audit trails</h3>
          <p>Track user actions, login events, and configuration changes for compliance.</p>
        </article>
      </div>
    </section>
  );
}