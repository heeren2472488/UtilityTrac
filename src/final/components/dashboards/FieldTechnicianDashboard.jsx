import React from 'react';
import ThemeToggleButton from '../layout/ThemeToggleButton';
import './Dashboard.css';

export default function FieldTechnicianDashboard() {
  return (
    <section className="dashboard-panel">
      <ThemeToggleButton />
      <div className="dashboard-header">
        <div className="dashboard-meta">
          <span className="dashboard-label">Field technician</span>
          <h2 className="dashboard-title">Work orders, inspections & asset updates</h2>
          <p className="dashboard-description">
            Stay connected with your assigned jobs, work logs, and asset health while on site.
          </p>
        </div>
        <div className="dashboard-stat">
          <strong>9</strong>
          <span>Active assignments</span>
        </div>
      </div>

      <div
        className="dashboard-hero"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1500&q=80)' }}
      >
        <div className="dashboard-hero-text">
          <h3>Mobile-ready field view</h3>
          <p>Capture inspections, update asset status, and close jobs directly from the field.</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <article className="dashboard-card">
          <h3>Assigned jobs</h3>
          <p>See job priority, scheduled arrival, and related asset details in one panel.</p>
        </article>
        <article className="dashboard-card">
          <h3>Inspection checklist</h3>
          <p>Use standard safety and maintenance checklists tied to each work order.</p>
        </article>
        <article className="dashboard-card">
          <h3>Asset updates</h3>
          <p>Record status changes, uploaded photos, and spare parts usage on the go.</p>
        </article>
      </div>
    </section>
  );
}