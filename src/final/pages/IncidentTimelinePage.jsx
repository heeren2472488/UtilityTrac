import React, { useState, useEffect } from 'react';
import { FiClock, FiDownload, FiUsers, FiActivity, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import { incidentReportService } from '../services/api';
import './IncidentTimelinePage.css';

const TIMELINE_EVENTS = [
  {
    id: 1, time: '14:12', title: 'Outage Reported',
    description: 'Initial fault detected on Feeder FDR-002. Zone 3 impacted.',
    type: 'INCIDENT', severity: 'critical',
  },
  {
    id: 2, time: '14:15', title: 'Zone Isolation Confirmed',
    description: 'Protective relay isolated Zone 3. 340 customers affected.',
    type: 'ACTION', severity: 'critical',
  },
  {
    id: 3, time: '14:18', title: 'Crew C-04 Dispatched',
    description: 'Crew C-04 assigned to Zone 3. ETA 14:45.',
    type: 'DISPATCH', severity: 'high',
  },
  {
    id: 4, time: '14:35', title: 'Field Investigation Started',
    description: 'Crew C-04 on-site at FDR-002 junction. Initial assessment in progress.',
    type: 'ACTION', severity: 'medium',
  },
  {
    id: 5, time: '14:52', title: 'Root Cause Identified',
    description: 'Faulty capacitor bank detected. Isolation prevents cascade failure.',
    type: 'DIAGNOSIS', severity: 'medium',
  },
  {
    id: 6, time: '15:10', title: 'Repair in Progress',
    description: 'Crew C-04 replacing capacitor. Estimated completion 15:35.',
    type: 'ACTION', severity: 'medium',
  },
  {
    id: 7, time: '15:38', title: 'Restoration Initiated',
    description: 'Feeder FDR-002 energized. Restoration to Zone 3 in progress.',
    type: 'RESTORATION', severity: 'low',
  },
  {
    id: 8, time: '15:45', title: 'Full Restoration Confirmed',
    description: 'All 340 customers restored. System stable. Incident closed.',
    type: 'RESOLVED', severity: 'resolved',
  },
];

const TYPE_CONFIG = {
  INCIDENT:    { color: '#f87171', bg: 'rgba(248,113,113,0.12)',  emoji: '⚠️', label: 'INCIDENT'    },
  ACTION:      { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',   emoji: '🔧', label: 'ACTION'      },
  DISPATCH:    { color: '#5ee6ff', bg: 'rgba(94,230,255,0.12)',   emoji: '🚗', label: 'DISPATCH'    },
  DIAGNOSIS:   { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)',  emoji: '🔍', label: 'DIAGNOSIS'   },
  RESTORATION: { color: '#34d399', bg: 'rgba(52,211,153,0.12)',   emoji: '⚡', label: 'RESTORATION' },
  RESOLVED:    { color: '#10b981', bg: 'rgba(16,185,129,0.12)',   emoji: '✓',  label: 'RESOLVED'    },
};

const convertIncidentToTimelineEvent = (incident) => ({
  id: incident.id,
  time: incident.createdAt ? new Date(incident.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
  title: `Incident #${incident.id} - ${incident.severityLevel || 'MEDIUM'} Severity`,
  description: incident.description || incident.rootCause || 'Incident report filed',
  type: 'INCIDENT',
  severity: (incident.severityLevel || 'MEDIUM').toLowerCase(),
  status: incident.status,
  outageId: incident.outageId,
  rootCause: incident.rootCause,
  safetyDetails: incident.safetyDetails,
  correctiveActions: incident.correctiveActions,
});

export default function IncidentTimelinePage() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents]   = useState([]);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const res = await incidentReportService.getAll();
        const incidents = res?.data?.data ?? [];
        const approvedIncidents = (Array.isArray(incidents) ? incidents : []).filter(
          (i) => i.status === 'APPROVED'
        );
        if (approvedIncidents.length > 0) {
          const timelineEvents = approvedIncidents.map(convertIncidentToTimelineEvent);
          setEvents(timelineEvents);
        } else {
          // Fallback to demo data if no approved incidents
          setTimeout(() => {
            setEvents(TIMELINE_EVENTS);
          }, 600);
        }
      } catch {
        // Fallback to demo data on error
        setTimeout(() => {
          setEvents(TIMELINE_EVENTS);
        }, 600);
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();
    const interval = setInterval(fetchIncidents, 15000); // Refresh every 15s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="itl-page">

      {/* HERO */}
      <div className="itl-hero">
        <div className="itl-hero-glow" />
        <div className="itl-hero-content">
          <div className="itl-hero-left">
            <div className="itl-hero-tag">⚡ Control Room · Incident Operations</div>
            <h1 className="itl-hero-title">Incident Timeline</h1>
            <div className="itl-hero-sub">OTG-024 — Feeder FDR-002 Fault Response</div>
          </div>
          <div className="itl-hero-right">
            <button className="itl-btn itl-btn-ghost">
              <FiDownload /> Export Timeline
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="itl-loading">
          <div className="itl-spinner" />
          <span>Loading timeline…</span>
        </div>
      ) : (
        <>
          {/* KPI STRIP */}
          <div className="itl-kpi-strip">
            <div className="itl-kpi-card" style={{ '--kc': '#f87171' }}>
              <div className="itl-kpi-icon"><FiAlertTriangle /></div>
              <div className="itl-kpi-value">1 hr 33 min</div>
              <div className="itl-kpi-label">Incident Duration</div>
            </div>
            <div className="itl-kpi-card" style={{ '--kc': '#fbbf24' }}>
              <div className="itl-kpi-icon"><FiClock /></div>
              <div className="itl-kpi-value">6 min</div>
              <div className="itl-kpi-label">Time to Crew Dispatch</div>
            </div>
            <div className="itl-kpi-card" style={{ '--kc': '#34d399' }}>
              <div className="itl-kpi-icon"><FiCheckCircle /></div>
              <div className="itl-kpi-value">93 min</div>
              <div className="itl-kpi-label">Time to Resolution</div>
            </div>
            <div className="itl-kpi-card" style={{ '--kc': '#5ee6ff' }}>
              <div className="itl-kpi-icon"><FiUsers /></div>
              <div className="itl-kpi-value">340</div>
              <div className="itl-kpi-label">Customers Affected</div>
            </div>
          </div>

          {/* TIMELINE PANEL */}
          <div className="itl-panel">
            <div className="itl-panel-head">
              <div>
                <div className="itl-panel-title"><FiActivity /> Event Timeline</div>
                <div className="itl-panel-sub">Chronological sequence of events and actions</div>
              </div>
              <div className="itl-legend">
                {Object.entries(TYPE_CONFIG).map(([type, cfg]) => (
                  <span key={type} className="itl-legend-dot" style={{ '--lc': cfg.color }}>
                    {cfg.emoji} {cfg.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="itl-timeline">
              {events.map((event, idx) => {
                const cfg = TYPE_CONFIG[event.type] || TYPE_CONFIG.ACTION;
                const isLast = idx === events.length - 1;
                return (
                  <div
                    key={event.id}
                    className="itl-event"
                    style={{ animationDelay: `${idx * 0.08}s` }}
                  >
                    {/* LEFT: connector */}
                    <div className="itl-connector">
                      <div
                        className="itl-dot"
                        style={{ background: cfg.color, boxShadow: `0 0 14px ${cfg.color}80` }}
                      >
                        <span className="itl-dot-emoji">{cfg.emoji}</span>
                      </div>
                      {!isLast && (
                        <div
                          className="itl-line"
                          style={{ background: `linear-gradient(to bottom, ${cfg.color}88, rgba(94,230,255,0.08))` }}
                        />
                      )}
                    </div>

                    {/* RIGHT: card */}
                    <div
                      className="itl-card"
                      style={{ '--card-accent': cfg.color, '--card-bg': cfg.bg }}
                    >
                      <div className="itl-card-top">
                        <span
                          className="itl-type-badge"
                          style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.color + '55' }}
                        >
                          {cfg.label}
                        </span>
                        <span className="itl-time">
                          <FiClock size={11} /> {event.time}
                        </span>
                        <div className="itl-card-num">#{idx + 1}</div>
                      </div>
                      <div className="itl-card-title">{event.title}</div>
                      <div className="itl-card-desc">{event.description}</div>
                      {event.type === 'RESOLVED' && (
                        <div className="itl-resolved-badge">
                          <FiCheckCircle /> Incident Closed — All Services Restored
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
