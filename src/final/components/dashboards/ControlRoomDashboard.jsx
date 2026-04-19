import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiAlertTriangle, FiRadio, FiRefreshCw, FiClock, FiArrowRight } from 'react-icons/fi';
import NotificationBell from './NotificationBell';
import IncidentListWidget from './IncidentListWidget';
import { outageService } from '../../services/api';
import ThemeToggleButton from '../layout/ThemeToggleButton';
import './Dashboard.css';

const CTRL_ROOM_ALERTS = [
  { id: 1, type: 'critical', title: 'Active outage — Zone 3', body: 'Feeder FDR-002 down. ~340 customers affected.', time: '1 min ago' },
  { id: 2, type: 'critical', title: 'Crew dispatch required', body: 'Crew C-04 not yet dispatched to Zone 3 incident', time: '8 min ago' },
  { id: 3, type: 'warning',  title: 'Restoration delayed', body: 'Estimated restoration for OTG-012 pushed +2 hrs', time: '30 min ago' },
  { id: 4, type: 'info',     title: 'Incident closed', body: 'Outage OTG-009 resolved. Full restoration confirmed.', time: '1 hr ago' },
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

const DISPATCH_BOARD = [
  { crew: 'Crew C-01', status: 'On Site',    zone: 'Zone 4', eta: '10 min', color: '#34d399' },
  { crew: 'Crew C-02', status: 'En Route',   zone: 'Zone 1', eta: '45 min', color: '#5ee6ff' },
  { crew: 'Crew C-03', status: 'Standby',    zone: '—',      eta: '—',      color: '#fbbf24' },
  { crew: 'Crew C-04', status: 'Unassigned', zone: '—',      eta: '—',      color: '#f87171' },
];

const zoneStyle = {
  OPEN:        { bg: 'rgba(248,113,113,0.10)', border: 'rgba(248,113,113,0.40)', color: '#f87171' },
  IN_PROGRESS: { bg: 'rgba(251,191,36,0.10)',  border: 'rgba(251,191,36,0.40)',  color: '#fbbf24' },
  RESTORING:   { bg: 'rgba(94,230,255,0.08)',  border: 'rgba(94,230,255,0.30)',  color: '#5ee6ff' },
  CLEAR:       { bg: 'rgba(52,211,153,0.07)',  border: 'rgba(52,211,153,0.22)',  color: '#34d399' },
};

export default function ControlRoomDashboard() {
  const navigate = useNavigate();
  const [unresolvedOutages, setUnresolvedOutages] = useState([]);

  useEffect(() => {
    let alive = true;
    outageService.getUnresolved()
      .then((res) => {
        const payload = res?.data?.data ?? [];
        const list = Array.isArray(payload) ? payload : [];
        if (alive) setUnresolvedOutages(list);
      })
      .catch(() => {
        if (alive) setUnresolvedOutages([]);
      });

    return () => { alive = false; };
  }, []);

  const liveAlerts = useMemo(() => {
    if (unresolvedOutages.length === 0) return CTRL_ROOM_ALERTS;
    return unresolvedOutages.slice(0, 6).map((o, idx) => ({
      id: o.id || idx + 1,
      type: (o.status === 'OPEN' || o.status === 'LOGGED') ? 'critical' : 'warning',
      title: `${o.status || 'OUTAGE'} — ${o.region || 'Unknown region'}`,
      body: `${o.affectedCustomers || 0} customers affected. Cause: ${o.cause || 'N/A'}`,
      time: o.loggedTime ? new Date(o.loggedTime).toLocaleTimeString() : 'Just now',
    }));
  }, [unresolvedOutages]);

  const totalAffected = useMemo(
    () => unresolvedOutages.reduce((acc, o) => acc + Number(o.affectedCustomers || 0), 0),
    [unresolvedOutages]
  );

  const activeOutageCount = unresolvedOutages.length || 3;

  const highestImpactOutage = useMemo(() => {
    if (!unresolvedOutages.length) return null;
    return [...unresolvedOutages].sort(
      (a, b) => Number(b.affectedCustomers || 0) - Number(a.affectedCustomers || 0)
    )[0];
  }, [unresolvedOutages]);

  const lastUpdated = useMemo(() => new Date().toLocaleTimeString([], {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }), []);

  return (
    <section className="dashboard-panel control-room-dashboard" style={{ position: 'relative' }}>
      <ThemeToggleButton />
      {/* NOTIFICATION BELL — fixed top-right */}
      <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 50 }}>
        <NotificationBell alerts={liveAlerts} />
      </div>

      <div className="dashboard-header" style={{ position: 'relative' }}>
        <div className="dashboard-meta">
          <span className="dashboard-label">Control Room</span>
          <h2 className="dashboard-title">Outage Command &amp; Restoration Tracking</h2>
          <p className="dashboard-description">
            Coordinate incident response, dispatch crews, and monitor restoration progress in real time.
          </p>

          <div className="crd-health-banner" role="status" aria-live="polite">
            {activeOutageCount > 0 ? (
              <>
                <FiAlertTriangle size={14} />
                <span>
                  <strong>{activeOutageCount}</strong> active outage event{activeOutageCount !== 1 ? 's' : ''}
                  {highestImpactOutage && (
                    <>
                      {' '}· Highest impact: <strong>#{highestImpactOutage.id}</strong> in <strong>{highestImpactOutage.region || 'Unknown region'}</strong>
                    </>
                  )}
                </span>
              </>
            ) : (
              <>
                <FiRadio size={14} />
                <span>All zones clear. Monitoring continues.</span>
              </>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
          <div className="dashboard-stat crd-stat-panel">
            <div className="crd-stat-top">
              <strong style={{ color: '#f87171' }}>{activeOutageCount}</strong>
              <span>Open outage events</span>
            </div>
            <div className="crd-updated-time"><FiClock size={12} /> Updated {lastUpdated}</div>
          </div>
        </div>
      </div>

      <div className="dash-kpi-row">
        <div className="dash-kpi-card kpi-alert crd-kpi-card">
          <div className="dash-kpi-value">{activeOutageCount}</div>
          <div className="dash-kpi-label">Active Outages</div>
          <div className="crd-kpi-sub">Need immediate control-room attention</div>
        </div>
        <div className="dash-kpi-card crd-kpi-card">
          <div className="dash-kpi-value">{totalAffected || 435}</div>
          <div className="dash-kpi-label">Customers Affected</div>
          <div className="crd-kpi-sub">Live aggregate impact</div>
        </div>
        <div className="dash-kpi-card crd-kpi-card">
          <div className="dash-kpi-value">2 / 4</div>
          <div className="dash-kpi-label">Crews Dispatched</div>
          <div className="crd-kpi-sub">2 teams still available</div>
        </div>
        <div className="dash-kpi-card crd-kpi-card">
          <div className="dash-kpi-value">~55 min</div>
          <div className="dash-kpi-label">Avg Restoration ETA</div>
          <div className="crd-kpi-sub">Across currently active outages</div>
        </div>
      </div>

      <div className="crd-quick-actions" aria-label="Control room quick actions">
        <button className="crd-action-btn" type="button" onClick={() => navigate('/outage-management')}>
          <FiAlertTriangle size={14} /> Log / Update Outage <FiArrowRight size={13} />
        </button>
        <button className="crd-action-btn" type="button" onClick={() => navigate('/crew-dispatch')}>
          <FiRefreshCw size={14} /> Dispatch Crew <FiArrowRight size={13} />
        </button>
        <button className="crd-action-btn" type="button" onClick={() => navigate('/incident-timeline')}>
          <FiRadio size={14} /> Incident Timeline <FiArrowRight size={13} />
        </button>
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

      <h3 className="dash-section-title" style={{ marginTop: 28 }}>Incident Dashboard</h3>
      <div style={{ background: 'linear-gradient(135deg, rgba(15,25,55,0.95), rgba(10,18,42,0.98))', border: '1px solid rgba(94,230,255,0.1)', borderRadius: '14px', padding: '18px' }}>
        <IncidentListWidget maxHeight="400px" />
      </div>

      <h3 className="dash-section-title" style={{ marginTop: 28 }}>Crew Dispatch Board</h3>
      <div className="dash-job-list">
        {DISPATCH_BOARD.map(d => (
          <div key={d.crew} className="dash-job-row">
            <div className="dash-job-id">{d.crew}</div>
            <div className="dash-job-info">
              <div className="dash-job-title">
                {d.zone !== '—' ? `Dispatched to ${d.zone}` : 'Awaiting dispatch'}
              </div>
              <div className="dash-job-asset">ETA: {d.eta}</div>
            </div>
            <span className="dash-job-badge" style={{
              background: d.color + '22',
              color: d.color,
              border: `1px solid ${d.color}55`,
            }}>{d.status}</span>
          </div>
        ))}
      </div>

      <h3 className="dash-section-title" style={{ marginTop: 28 }}>Live Outage Feed</h3>
      <div className="dash-job-list">
        {unresolvedOutages.length === 0 ? (
          <div style={{ padding: '16px 0', textAlign: 'center', color: 'rgba(199,220,246,0.38)', fontSize: '0.85rem' }}>
            ✓ No unresolved outages
          </div>
        ) : (
          unresolvedOutages.map((o) => {
            const statusColor = {
              OPEN: '#f87171', LOGGED: '#5ee6ff', IN_PROGRESS: '#fbbf24',
              RESTORING: '#a78bfa', RESOLVED: '#34d399',
            }[o.status] || '#94a3b8';
            return (
              <div key={o.id} className="dash-job-row" style={{ animation: o.status === 'OPEN' ? 'outage-pulse 2s infinite' : 'none' }}>
                <div className="dash-job-id" style={{ color: '#5ee6ff' }}>#{o.id}</div>
                <div className="dash-job-info" style={{ flex: 2 }}>
                  <div className="dash-job-title">{o.region || '—'}</div>
                  <div className="dash-job-asset">{o.cause || '—'}</div>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'rgba(199,220,246,0.55)' }}>
                  {o.affectedCustomers?.toLocaleString() || 0} customers
                </div>
                <span className="dash-job-badge" style={{
                  background: statusColor + '22',
                  color: statusColor,
                  border: `1px solid ${statusColor}55`,
                }}>{(o.status || 'UNKNOWN').replace('_', ' ')}</span>
              </div>
            );
          })
        )}
      </div>

      <style>{`
        @keyframes outage-pulse {
          0%, 100% { background: transparent; }
          50% { background: rgba(248,113,113,0.05); }
        }
      `}</style>

      <h3 className="dash-section-title" style={{ marginTop: 28 }}>Operational Scope</h3>
      <div className="dashboard-grid">
        {[
          { path: '/outage-management', icon: FiAlertTriangle, label: 'Outage Management', desc: 'Log incidents, update status, and keep outage records accurate for all teams.', color: '#f87171' },
          { path: '/incident-timeline', icon: FiRadio,         label: 'Incident Timeline',  desc: 'Track every event in sequence from outage report to final restoration closure.', color: '#5ee6ff' },
          { path: '/crew-dispatch',     icon: FiRefreshCw,     label: 'Crew Dispatch',      desc: 'Assign field crews quickly, monitor ETA, and follow dispatch progress live.',   color: '#fbbf24' },
        ].map(card => (
          <article
            key={card.label}
            className="dashboard-card dash-module-card"
            style={{ '--card-accent': card.color, cursor: 'pointer' }}
            onClick={() => navigate(card.path)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate(card.path)}
          >
            <div className="dash-module-icon" style={{ color: card.color }}><card.icon size={22} /></div>
            <h3>{card.label}</h3>
            <p>{card.desc}</p>
          </article>
        ))}
      </div>

      <div className="dash-restricted-notice">
        <FiAlertTriangle size={14} style={{ marginRight: 6, flexShrink: 0 }} />
        <span>
          <strong>Restricted modules not shown:</strong> Asset Registry, Maintenance Profiles,
          Billing, Tariffs, Regulatory Analytics, Audit Logs
        </span>
      </div>

    </section>
  );
}