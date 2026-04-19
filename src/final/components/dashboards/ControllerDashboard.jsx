import React from 'react';
import {
  FiAlertTriangle, FiBell, FiRadio, FiZap, FiRefreshCw,
} from 'react-icons/fi';
import NotificationBell from './NotificationBell';
import ThemeToggleButton from '../layout/ThemeToggleButton';
import './Dashboard.css';

const CTRL_ALERTS = [
  { id: 1, type: 'critical', title: 'Active outage — Zone 3', body: 'Feeder FDR-002 down. ~340 customers affected.', time: '1 min ago' },
  { id: 2, type: 'critical', title: 'Crew dispatch required', body: 'Crew C-04 not yet dispatched to Zone 3 incident', time: '8 min ago' },
  { id: 3, type: 'warning',  title: 'Restoration delayed', body: 'Estimated restoration for OTG-012 pushed +2 hrs', time: '30 min ago' },
  { id: 4, type: 'info',     title: 'Incident closed', body: 'Outage OTG-009 resolved. Full restoration confirmed.', time: '1 hr ago' },
];

const OUTAGE_EVENTS = [
  { id: 'OTG-012', zone: 'Zone 3 — FDR-002', affected: 340, crew: 'Unassigned', eta: 'Unknown', status: 'OPEN' },
  { id: 'OTG-011', zone: 'Zone 1 — FDR-001', affected: 80,  crew: 'Crew C-02',  eta: '45 min',  status: 'IN_PROGRESS' },
  { id: 'OTG-010', zone: 'Zone 4 — SUB-003', affected: 15,  crew: 'Crew C-01',  eta: '10 min',  status: 'RESTORING' },
];

const ZONE_MAP = [
  { id: 'Z1', name: 'Zone 1', affected: 80,  status: 'IN_PROGRESS' },
  { id: 'Z2', name: 'Zone 2', affected: 0,   status: 'CLEAR' },
  { id: 'Z3', name: 'Zone 3', affected: 340, status: 'OPEN' },
  { id: 'Z4', name: 'Zone 4', affected: 15,  status: 'RESTORING' },
  { id: 'Z5', name: 'Zone 5', affected: 0,   status: 'CLEAR' },
  { id: 'Z6', name: 'Zone 6', affected: 0,   status: 'CLEAR' },
  { id: 'Z7', name: 'Zone 7', affected: 0,   status: 'CLEAR' },
  { id: 'Z8', name: 'N. Sub', affected: 0,   status: 'CLEAR' },
];

const statusColor = { OPEN: '#f87171', IN_PROGRESS: '#fbbf24', RESTORING: '#5ee6ff', CLEAR: '#34d399' };
const zoneStyle = {
  OPEN:        { bg: 'rgba(248,113,113,0.10)', border: 'rgba(248,113,113,0.40)', color: '#f87171' },
  IN_PROGRESS: { bg: 'rgba(251,191,36,0.10)',  border: 'rgba(251,191,36,0.40)',  color: '#fbbf24' },
  RESTORING:   { bg: 'rgba(94,230,255,0.08)',  border: 'rgba(94,230,255,0.30)',  color: '#5ee6ff' },
  CLEAR:       { bg: 'rgba(52,211,153,0.07)',  border: 'rgba(52,211,153,0.22)',  color: '#34d399' },
};

const SCOPE_CARDS = [
  { icon: FiZap,       label: 'Outage & Incident Mgmt',  desc: 'Log outages, assign cause codes, track customer impact. Update p95 < 2s.', color: '#f87171' },
  { icon: FiRadio,     label: 'Crew Dispatch Board',     desc: 'View crew locations, availability, and dispatch status with live updates.',  color: '#fbbf24' },
  { icon: FiRefreshCw, label: 'Restoration Progress',    desc: 'Measure restoration rate per zone, open vs closed ratio, and ETAs.',         color: '#5ee6ff' },
  { icon: FiBell,      label: 'Critical Alerts',         desc: 'Real-time alerts for new outages, unassigned incidents, and safety events.',  color: '#a78bfa' },
];

export default function ControllerDashboard() {
  return (
    <section className="dashboard-panel">
      <ThemeToggleButton />
      <div className="dashboard-header" style={{ position: 'relative' }}>
        <div className="dashboard-meta">
          <span className="dashboard-label">Control Room Operator</span>
          <h2 className="dashboard-title">Outage Command &amp; Restoration Tracking</h2>
          <p className="dashboard-description">
            Monitor live outage events, dispatch crews, coordinate incident response,
            and track restoration progress in real time.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
          <NotificationBell alerts={CTRL_ALERTS} />
          <div className="dashboard-stat">
            <strong style={{ color: '#f87171' }}>3</strong>
            <span>Open outage events</span>
          </div>
        </div>
      </div>

      <div className="dash-kpi-row">
        <div className="dash-kpi-card kpi-alert"><div className="dash-kpi-value">3</div><div className="dash-kpi-label">Active Outages</div></div>
        <div className="dash-kpi-card"><div className="dash-kpi-value">435</div><div className="dash-kpi-label">Customers Affected</div></div>
        <div className="dash-kpi-card"><div className="dash-kpi-value">2 / 4</div><div className="dash-kpi-label">Crews Dispatched</div></div>
        <div className="dash-kpi-card"><div className="dash-kpi-value">~55 min</div><div className="dash-kpi-label">Avg Restoration ETA</div></div>
      </div>

      <h3 className="dash-section-title">Live Zone Status Map</h3>
      <div className="dash-zone-map">
        <div className="dash-zone-map-title">Live — colour indicates outage status per zone</div>
        <div className="dash-zone-grid">
          {ZONE_MAP.map(z => {
            const s = zoneStyle[z.status];
            return (
              <div key={z.id} className="dash-zone-cell" style={{ background: s.bg, borderColor: s.border, color: s.color }}>
                <div className="dash-zone-name">{z.name}</div>
                <div className="dash-zone-affected">{z.affected > 0 ? `${z.affected} affected` : 'Clear'}</div>
                <div className="dash-zone-status-label">{z.status.replace('_', ' ')}</div>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
          {Object.entries(zoneStyle).map(([key, s]) => (
            <span key={key} style={{ fontSize: '0.73rem', color: s.color, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
              {key.replace('_', ' ')}
            </span>
          ))}
        </div>
      </div>

      <h3 className="dash-section-title" style={{ marginTop: 28 }}>Active Outage Incidents</h3>
      <div className="dash-job-list">
        {OUTAGE_EVENTS.map(ev => (
          <div key={ev.id} className="dash-job-row">
            <div className="dash-job-id">{ev.id}</div>
            <div className="dash-job-info">
              <div className="dash-job-title">{ev.zone}</div>
              <div className="dash-job-asset">
                {ev.affected} customers &middot; Crew: {ev.crew} &middot; ETA: {ev.eta}
              </div>
            </div>
            <span className="dash-job-badge" style={{
              background: (statusColor[ev.status] || '#5ee6ff') + '22',
              color: statusColor[ev.status] || '#5ee6ff',
              border: `1px solid ${(statusColor[ev.status] || '#5ee6ff')}55`,
            }}>
              {ev.status.replace('_', ' ')}
            </span>
          </div>
        ))}
      </div>

      <h3 className="dash-section-title" style={{ marginTop: 28 }}>Operational Scope</h3>
      <div className="dashboard-grid">
        {SCOPE_CARDS.map(card => (
          <article key={card.label} className="dashboard-card dash-module-card" style={{ '--card-accent': card.color }}>
            <div className="dash-module-icon" style={{ color: card.color }}><card.icon size={22} /></div>
            <h3>{card.label}</h3>
            <p>{card.desc}</p>
          </article>
        ))}
      </div>

      <div className="dash-restricted-notice">
        <FiAlertTriangle size={14} style={{ marginRight: 6, flexShrink: 0 }} />
        <span>
          <strong>Restricted modules not shown:</strong> Users &amp; Roles, Asset Registry,
          Maintenance Profiles, Work Logs, Billing, Tariff Mapping, Regulatory Analytics, Audit Logs
        </span>
      </div>

    </section>
  );
}