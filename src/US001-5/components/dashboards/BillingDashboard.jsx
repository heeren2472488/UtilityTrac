import React from 'react';
import './Dashboard.css';

export default function BillingDashboard() {
  return (
    <section className="dashboard-panel">
      <div className="dashboard-header">
        <div className="dashboard-meta">
          <span className="dashboard-label">Billing & meter ops</span>
          <h2 className="dashboard-title">Meter reads, usage validation, and bill references</h2>
          <p className="dashboard-description">
            Review meter data, estimate missing intervals, and manage billing references from a single pane.
          </p>
        </div>
        <div className="dashboard-stat">
          <strong>12</strong>
          <span>Meter exceptions</span>
        </div>
      </div>

      <div
        className="dashboard-hero"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=1500&q=80)' }}
      >
        <div className="dashboard-hero-text">
          <h3>Usage intelligence</h3>
          <p>Spot abnormal consumption, validate reads, and link usage to tariff references.</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <article className="dashboard-card">
          <h3>Read quality</h3>
          <p>Flag estimated, suspect, and valid reads with source metadata.</p>
        </article>
        <article className="dashboard-card">
          <h3>Billing references</h3>
          <p>Track billable usage tied to service type and tariff plan.</p>
        </article>
        <article className="dashboard-card">
          <h3>Cycle health</h3>
          <p>See upcoming meter readings, missing reads, and billing reconciliation status.</p>
        </article>
      </div>
    </section>
  );
}