import React from 'react';
import './Dashboard.css';

export default function ControllerDashboard() {
  return (
    <section className="dashboard-panel">
      <div className="dashboard-header">
        <div className="dashboard-meta">
          <span className="dashboard-label">Control room</span>
          <h2 className="dashboard-title">Outage command & restoration tracking</h2>
          <p className="dashboard-description">
            Coordinate incident response, dispatch crews, and monitor restoration progress in real time.
          </p>
        </div>
        <div className="dashboard-stat">
          <strong>3</strong>
          <span>Open outage events</span>
        </div>
      </div>

      <div
        className="dashboard-hero"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1500&q=80)' }}
      >
        <div className="dashboard-hero-text">
          <h3>Incident visibility</h3>
          <p>Track affected customers, restoration ETA, and crew dispatch status at a glance.</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <article className="dashboard-card">
          <h3>Outage map</h3>
          <p>Visualize impacted feeders and restoration zones with live incident updates.</p>
        </article>
        <article className="dashboard-card">
          <h3>Dispatch queue</h3>
          <p>See upcoming crew assignments, travel status, and arrival windows.</p>
        </article>
        <article className="dashboard-card">
          <h3>Restoration progress</h3>
          <p>Measure open/closed outages and customer restoration rate in real time.</p>
        </article>
      </div>
    </section>
  );
}