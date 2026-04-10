import React from 'react';
import './Dashboard.css';

export default function RegulatoryDashboard() {
  return (
    <section className="dashboard-panel">
      <div className="dashboard-header">
        <div className="dashboard-meta">
          <span className="dashboard-label">Regulatory analytics</span>
          <h2 className="dashboard-title">Reliability, safety, and report generation</h2>
          <p className="dashboard-description">
            Generate SAIDI/SAIFI/CAIDI, safety records, and regulatory reports for audit-ready oversight.
          </p>
        </div>
        <div className="dashboard-stat">
          <strong>98%</strong>
          <span>Report completion rate</span>
        </div>
      </div>

      <div
        className="dashboard-hero"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1518779578993-ec3579fee39f?auto=format&fit=crop&w=1500&q=80)' }}
      >
        <div className="dashboard-hero-text">
          <h3>Compliance command</h3>
          <p>Track reliability metrics, safety incidents, and regulatory submissions all in one view.</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <article className="dashboard-card">
          <h3>Reliability metrics</h3>
          <p>Monitor SAIDI, SAIFI, and CAIDI by region or feeder line.</p>
        </article>
        <article className="dashboard-card">
          <h3>Safety records</h3>
          <p>Capture incidents, near misses, and corrective actions for audits.</p>
        </article>
        <article className="dashboard-card">
          <h3>Report history</h3>
          <p>Review past submissions and generate new regulatory packs with ease.</p>
        </article>
      </div>
    </section>
  );
}