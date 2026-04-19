import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggleButton from '../layout/ThemeToggleButton';
import { FiClipboard, FiAlertTriangle, FiCheckCircle, FiClock, FiEdit3, FiFlag, FiUploadCloud, FiBell, FiCheck, FiX } from 'react-icons/fi';
import NotificationBell from './NotificationBell';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/api';
import './Dashboard.css';

const TECH_ALERTS = [
  { id: 1, type: 'critical', title: 'Urgent work order', body: 'WO-0042 — Transformer TRF-002 fault repair. Priority: CRITICAL', time: '5 min ago' },
  { id: 2, type: 'warning',  title: 'Log submission due', body: 'WO-0038 log submission is overdue by 2 hours', time: '2 hr ago' },
  { id: 3, type: 'info',     title: 'New assignment', body: 'You have been assigned WO-0045 (Meter inspection)', time: '3 hr ago' },
  { id: 4, type: 'warning',  title: 'Safety checklist', body: 'Safety pre-check for WO-0042 not yet completed', time: '4 hr ago' },
];

const TODAY_JOBS = [
  { id: 'WO-0042', title: 'Transformer fault repair', asset: 'TRF-002', priority: 'CRITICAL', status: 'IN_PROGRESS' },
  { id: 'WO-0038', title: 'Meter read verification', asset: 'MTR-2026-001', priority: 'MEDIUM', status: 'PENDING' },
  { id: 'WO-0045', title: 'Feeder line inspection', asset: 'FDR-2026-001', priority: 'LOW', status: 'PENDING' },
];

const priorityColor = { CRITICAL: '#f87171', HIGH: '#fb923c', MEDIUM: '#fbbf24', LOW: '#34d399' };
const statusColor   = { IN_PROGRESS: '#5ee6ff', PENDING: '#a78bfa', COMPLETED: '#34d399' };

const normalizeNotificationList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.data?.content)) return payload.data.content;
  return [];
};

const inferTaskType = (n) => {
  const direct = String(n?.taskType || '').trim();
  if (direct) return direct.toUpperCase();
  const msg = String(n?.message || '').toUpperCase();
  if (msg.includes('OUTAGE')) return 'OUTAGE';
  if (msg.includes('MAINTENANCE')) return 'MAINTENANCE';
  return 'ASSIGNMENT';
};

const inferUrgency = (n) => {
  const direct = String(n?.urgency || '').trim();
  if (direct) return direct.toUpperCase();
  const msg = String(n?.message || '').toUpperCase();
  if (msg.includes('CRITICAL')) return 'CRITICAL';
  if (msg.includes('HIGH')) return 'HIGH';
  if (msg.includes('LOW')) return 'LOW';
  return 'MEDIUM';
};

const extractReferenceId = (n) => {
  if (n?.taskReferenceId) return String(n.taskReferenceId);
  const msg = String(n?.message || '');
  const m = msg.match(/(WO-\d+|OUT-\d+|MT-\d+)/i);
  return m?.[1] || 'N/A';
};

export default function TechnicianDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assignmentNotifications, setAssignmentNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifError, setNotifError] = useState('');
  const [toast, setToast] = useState(null);

  const crewUserId = user?.id ?? user?.userId;

  const loadNotifications = useCallback(async () => {
    if (!crewUserId) {
      setAssignmentNotifications([]);
      return;
    }
    setNotifLoading(true);
    setNotifError('');
    try {
      const [allRes, unreadRes] = await Promise.allSettled([
        notificationService.getUserNotifications(crewUserId),
        notificationService.getUnreadUserNotifications(crewUserId),
      ]);

      const allNotifications = allRes.status === 'fulfilled'
        ? normalizeNotificationList(allRes.value?.data)
        : [];

      const unreadNotifications = unreadRes.status === 'fulfilled'
        ? normalizeNotificationList(unreadRes.value?.data)
        : [];

      const unreadIds = new Set(
        unreadNotifications
          .map((n) => n?.notificationId ?? n?.id)
          .filter(Boolean)
      );

      const merged = allNotifications
        .filter((n) => String(n?.category || '').toUpperCase().includes('ASSIGNMENT'))
        .map((n) => {
          const id = n?.notificationId ?? n?.id;
          const status = unreadIds.has(id)
            ? 'UNREAD'
            : String(n?.status || '').toUpperCase() || 'READ';
          return {
            ...n,
            notificationId: id,
            status,
          };
        })
        .sort((a, b) => new Date(b?.createdDate || b?.createdAt || 0) - new Date(a?.createdDate || a?.createdAt || 0));

      setAssignmentNotifications(merged);

      if (allRes.status === 'rejected' && unreadRes.status === 'rejected') {
        setNotifError('Unable to load assignment notifications right now.');
      }
    } catch {
      setNotifError('Unable to load assignment notifications right now.');
    } finally {
      setNotifLoading(false);
    }
  }, [crewUserId]);

  useEffect(() => {
    loadNotifications();
    const timer = setInterval(loadNotifications, 15000);
    return () => clearInterval(timer);
  }, [loadNotifications]);

  const unreadCount = useMemo(
    () => assignmentNotifications.filter((n) => String(n?.status || '').toUpperCase() === 'UNREAD').length,
    [assignmentNotifications]
  );

  const handleMarkRead = async (notificationId) => {
    try {
      await notificationService.markRead(notificationId);
      setAssignmentNotifications((prev) =>
        prev.map((n) => (n.notificationId === notificationId ? { ...n, status: 'READ' } : n))
      );
      setToast({ type: 'success', text: 'Notification marked as read.' });
      setTimeout(() => setToast(null), 2200);
    } catch {
      setNotifError('Failed to mark notification as read.');
    }
  };

  const handleDismiss = async (notificationId) => {
    try {
      await notificationService.dismiss(notificationId);
      setAssignmentNotifications((prev) => prev.filter((n) => n.notificationId !== notificationId));
      setToast({ type: 'success', text: 'Notification dismissed.' });
      setTimeout(() => setToast(null), 2200);
    } catch {
      setNotifError('Failed to dismiss notification.');
    }
  };

  return (
    <section className="dashboard-panel">
      <ThemeToggleButton />
      <div className="dashboard-header" style={{ position: 'relative' }}>
        <div className="dashboard-meta">
          <span className="dashboard-label">Field Technician</span>
          <h2 className="dashboard-title">Work Orders, Inspections &amp; Field Logs</h2>
          <p className="dashboard-description">
            View your assigned jobs, capture work logs, record asset readings, and update completion status from the field.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
          <NotificationBell alerts={TECH_ALERTS} />
          <div className="dashboard-stat">
            <strong style={{ color: '#f87171' }}>1</strong>
            <span>Critical job today</span>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="dash-kpi-row">
        <div className="dash-kpi-card kpi-alert"><div className="dash-kpi-value">3</div><div className="dash-kpi-label">Open Assignments</div></div>
        <div className="dash-kpi-card"><div className="dash-kpi-value">1</div><div className="dash-kpi-label">Due Today</div></div>
        <div className="dash-kpi-card"><div className="dash-kpi-value">5</div><div className="dash-kpi-label">Completed This Week</div></div>
        <div className="dash-kpi-card"><div className="dash-kpi-value">2</div><div className="dash-kpi-label">Logs Pending Submit</div></div>
      </div>

      {/* Quick action buttons */}
      <h3 className="dash-section-title">Quick Actions</h3>
      <div className="dash-action-row">
        <button
          className="dash-action-btn"
          style={{ color: '#5ee6ff', borderColor: 'rgba(94,230,255,0.35)', background: 'rgba(94,230,255,0.07)' }}
          onClick={() => navigate('/work-logs')}
        >
          <FiUploadCloud size={16} /> Submit Work Log
        </button>
        <button
          className="dash-action-btn"
          style={{ color: '#fbbf24', borderColor: 'rgba(251,191,36,0.35)', background: 'rgba(251,191,36,0.07)' }}
          onClick={() => navigate('/meter-readings')}
        >
          <FiEdit3 size={16} /> Record Meter Reading
        </button>
        <button
          className="dash-action-btn"
          style={{ color: '#34d399', borderColor: 'rgba(52,211,153,0.35)', background: 'rgba(52,211,153,0.07)' }}
        >
          <FiCheckCircle size={16} /> Complete Safety Check
        </button>
        <button
          className="dash-action-btn"
          style={{ color: '#f87171', borderColor: 'rgba(248,113,113,0.35)', background: 'rgba(248,113,113,0.07)' }}
        >
          <FiFlag size={16} /> Flag an Issue
        </button>
      </div>

      {/* Assignment notifications */}
      <h3 className="dash-section-title" style={{ marginTop: 24 }}>Crew Assignment Notifications</h3>
      <div className="crew-notif-wrap">
        <div className="crew-notif-head">
          <div className="crew-notif-head-left">
            <FiBell />
            <span>Assignment Feed</span>
            <span className="crew-notif-badge">{unreadCount} unread</span>
          </div>
          <button className="btn-ghost" onClick={loadNotifications}>Refresh</button>
        </div>

        {notifError && (
          <div className="crew-notif-error">
            <div>{notifError}</div>
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              <button className="btn-ghost" onClick={loadNotifications}>Retry</button>
              <button className="btn-ghost" onClick={() => setNotifError('')}>Dismiss</button>
            </div>
          </div>
        )}

        {notifLoading ? (
          <div className="crew-notif-empty">Loading assignment notifications...</div>
        ) : assignmentNotifications.length === 0 ? (
          <div className="crew-notif-empty">No assignment notifications yet. New crew assignments will appear here instantly.</div>
        ) : (
          <div className="crew-notif-list">
            {assignmentNotifications.map((n) => {
              const isUnread = String(n?.status || '').toUpperCase() === 'UNREAD';
              const taskType = inferTaskType(n);
              const urgency = inferUrgency(n);
              const refId = extractReferenceId(n);
              return (
                <div key={n.notificationId} className={`crew-notif-item ${isUnread ? 'is-unread' : 'is-read'}`}>
                  <div className="crew-notif-item-main">
                    <div className="crew-notif-meta-row">
                      <span className="crew-notif-chip">ASSIGNMENT</span>
                      <span className="crew-notif-chip chip-task">{taskType}</span>
                      <span className={`crew-notif-chip chip-urgency urgency-${urgency.toLowerCase()}`}>{urgency}</span>
                      <span className="crew-notif-ref">REF: {refId}</span>
                    </div>
                    <div className="crew-notif-message">{n.message}</div>
                    <div className="crew-notif-time">
                      {n.createdDate ? new Date(n.createdDate).toLocaleString() : 'Just now'}
                    </div>
                  </div>
                  <div className="crew-notif-actions">
                    {isUnread && (
                      <button className="btn-ghost" onClick={() => handleMarkRead(n.notificationId)}>
                        <FiCheck size={14} /> Mark Read
                      </button>
                    )}
                    <button className="btn-ghost" onClick={() => handleDismiss(n.notificationId)}>
                      <FiX size={14} /> Dismiss
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {toast && (
        <div className={`system-toast ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`} role="status" aria-live="polite">
          {toast.text}
        </div>
      )}

      {/* Today's assignments */}
      <h3 className="dash-section-title">Today's Assignments</h3>
      <div className="dash-job-list">
        {TODAY_JOBS.map(job => (
          <div key={job.id} className="dash-job-row">
            <div className="dash-job-id">{job.id}</div>
            <div className="dash-job-info">
              <div className="dash-job-title">{job.title}</div>
              <div className="dash-job-asset">Asset: {job.asset}</div>
            </div>
            <span className="dash-job-badge" style={{ background: priorityColor[job.priority] + '22', color: priorityColor[job.priority], border: `1px solid ${priorityColor[job.priority]}55` }}>{job.priority}</span>
            <span className="dash-job-badge" style={{ background: statusColor[job.status] + '22', color: statusColor[job.status], border: `1px solid ${statusColor[job.status]}55` }}>{job.status}</span>
          </div>
        ))}
      </div>

      {/* Authorized modules */}
      <h3 className="dash-section-title" style={{ marginTop: 28 }}>Authorized Actions</h3>
      <div className="dashboard-grid">
        <article className="dashboard-card dash-module-card" onClick={() => navigate('/work-logs')} style={{ cursor: 'pointer', '--card-accent': '#5ee6ff' }}>
          <div className="dash-module-icon" style={{ color: '#5ee6ff' }}><FiClipboard size={22} /></div>
          <h3>Work Logs</h3>
          <p>Log task details, hours worked, parts used, and completion status for assigned work orders.</p>
          <span className="dash-module-link">Open Work Logs →</span>
        </article>
        <article className="dashboard-card dash-module-card" style={{ '--card-accent': '#fbbf24' }}>
          <div className="dash-module-icon" style={{ color: '#fbbf24' }}><FiAlertTriangle size={22} /></div>
          <h3>Safety Checklists</h3>
          <p>Complete safety pre-checks and post-checks tied to each work order before and after field execution.</p>
        </article>
        <article className="dashboard-card dash-module-card" style={{ '--card-accent': '#34d399' }}>
          <div className="dash-module-icon" style={{ color: '#34d399' }}><FiCheckCircle size={22} /></div>
          <h3>Asset Status Update</h3>
          <p>Record status changes, inspection findings, and meter readings on the go during field operations.</p>
        </article>
        <article className="dashboard-card dash-module-card" style={{ '--card-accent': '#a78bfa' }}>
          <div className="dash-module-icon" style={{ color: '#a78bfa' }}><FiClock size={22} /></div>
          <h3>Maintenance Alerts</h3>
          <p>Receive push alerts for due maintenance, overdue logs, and critical job updates in real time.</p>
        </article>
      </div>

      <div className="dash-restricted-notice">
        🔒 <strong>Restricted modules not visible:</strong> Users &amp; Roles, Network Topology, Billing References, Tariff Management, Regulatory Analytics, Audit Logs
      </div>
    </section>
  );
}

