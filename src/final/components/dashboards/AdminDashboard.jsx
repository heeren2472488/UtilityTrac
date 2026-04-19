import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBox, FiShare2, FiTool, FiUserCheck, FiShield, FiCheckCircle, FiXCircle, FiBarChart2, FiDollarSign, FiSettings, FiTrendingUp, FiRefreshCw } from 'react-icons/fi';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend,
} from 'recharts';
import NotificationBell from './NotificationBell';
import ThemeToggleButton from '../layout/ThemeToggleButton';
import { userService, assetService, incidentReportService, crewService, workOrderService } from '../../services/api';
import './Dashboard.css';

const ADMIN_ALERTS = [
  { id: 1, type: 'critical', title: 'Failed login attempts', body: '5 failed logins from IP 192.168.1.44', time: '2 min ago' },
  { id: 2, type: 'warning',  title: 'Role assignment changed', body: 'User john.doe promoted to PLANNER', time: '18 min ago' },
  { id: 3, type: 'info',     title: 'Audit trail export', body: 'Audit logs exported by admin@utilitrack.com', time: '1 hr ago' },
  { id: 4, type: 'info',     title: 'New asset registered', body: 'Transformer TRF-009 added to Zone 3', time: '3 hr ago' },
  { id: 5, type: 'warning',  title: 'Tariff plan expiring', body: 'Commercial Tier B expires in 7 days', time: '1 day ago' },
];

const MODULE_CARDS = [
  { icon: <FiShield size={22} />, label: 'Users & Roles', desc: 'Manage users, roles, access policies', path: '/users', color: '#5ee6ff' },
  { icon: <FiBox size={22} />, label: 'Asset Registry', desc: 'Assets, types & profiles', path: '/assets', color: '#a78bfa' },
  { icon: <FiShare2 size={22} />, label: 'Network Topology', desc: 'Feeders, links & topology', path: '/network-topology', color: '#34d399' },
  { icon: <FiTool size={22} />, label: 'Maintenance Profiles', desc: 'Templates & schedules', path: '/maintenance-profiles', color: '#fbbf24' },
  { icon: <FiUserCheck size={22} />, label: 'Crew Management', desc: 'Teams & skill sets', path: '/crews', color: '#f87171' },
  { icon: <FiDollarSign size={22} />, label: 'Tariff Management', desc: 'Tariff references and calculation preview', path: '/admin/tariffs', color: '#22d3ee' },
  { icon: <FiBarChart2 size={22} />, label: 'System & Billing Reports', desc: 'Usage and billing report center', path: '/admin/reports', color: '#818cf8' },
  { icon: <FiTrendingUp size={22} />, label: 'Compliance Reports', desc: 'Read-only regulatory reporting', path: '/admin/regulatory', color: '#38bdf8' },
  { icon: <FiSettings size={22} />, label: 'Platform Configuration', desc: 'Admin-only billing config summary', path: '/admin/system-settings', color: '#94a3b8' },
];

const normalizeCount = (res) => {
  const d = res?.data;
  return (
    d?.data?.totalElements ??
    d?.totalElements ??
    d?.data?.total ??
    d?.total ??
    (Array.isArray(d?.data?.content) ? d.data.content.length : undefined) ??
    (Array.isArray(d?.data) ? d.data.length : undefined) ??
    (Array.isArray(d?.content) ? d.content.length : undefined) ??
    (Array.isArray(d) ? d.length : undefined) ??
    '—'
  );
};

const DASHBOARD_CACHE_KEY = 'admin_dashboard_snapshot_v1';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [kpi, setKpi] = useState({ users: '—', assets: '—', crews: '—', workOrders: '—' });
  const [kpiLoading, setKpiLoading] = useState(true);
  const [workOrderNotice, setWorkOrderNotice] = useState('');
  const [incidents, setIncidents] = useState([]);
  const [actionMsg, setActionMsg] = useState({ id: null, text: '', ok: true });
  const [assetTypeData, setAssetTypeData] = useState([]);
  const [workOrderTrend, setWorkOrderTrend] = useState([
    { month: 'Nov', open: 0, closed: 0 },
    { month: 'Dec', open: 0, closed: 0 },
    { month: 'Jan', open: 0, closed: 0 },
    { month: 'Feb', open: 0, closed: 0 },
    { month: 'Mar', open: 0, closed: 0 },
    { month: 'Apr', open: 0, closed: 0 },
  ]);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DASHBOARD_CACHE_KEY);
      if (!raw) return;
      const snapshot = JSON.parse(raw);
      if (snapshot?.kpi) setKpi((prev) => ({ ...prev, ...snapshot.kpi }));
      if (Array.isArray(snapshot?.workOrderTrend)) setWorkOrderTrend(snapshot.workOrderTrend);
    } catch {
      // ignore cache parse issues
    }
  }, []);

  const loadAll = () => {
    setKpiLoading(true);
    setWorkOrderNotice('');
    Promise.allSettled([
      userService.getAll({ page: 0, size: 1 }),
      assetService.getAll({ page: 0, size: 200 }),
      crewService.getAll(),
      workOrderService.getAll(),
      incidentReportService.getAll(),
    ]).then(([u, a, c, wo, i]) => {
      // Users count
      const usersCount = u.status === 'fulfilled' ? normalizeCount(u.value) : '—';

      // Assets count + type breakdown
      let assetsCount = '—';
      if (a.status === 'fulfilled') {
        const d = a.value?.data;
        const list =
          d?.data?.content ?? d?.data ?? d?.content ?? (Array.isArray(d) ? d : []);
        if (Array.isArray(list) && list.length > 0) {
          assetsCount = list.length;
          const typeCounts = list.reduce((acc, asset) => {
            const type = asset.assetType || asset.type || 'Other';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
          }, {});
          setAssetTypeData(Object.entries(typeCounts).map(([type, count]) => ({ type, count })));
        }
      } else if (a.status === 'rejected') {
        console.error('Assets load failed:', a.reason);
      }

      // Crews count
      let crewsCount = '—';
      if (c.status === 'fulfilled') {
        const d = c.value?.data;
        const list = Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : Array.isArray(d?.content) ? d.content : [];
        crewsCount = list.length > 0 ? list.length : normalizeCount(c.value);
      } else if (c.status === 'rejected') {
        console.error('Crews load failed:', c.reason);
      }

      // Work orders count + trend
      let woCount = '—';
      if (wo.status === 'fulfilled') {
        const d = wo.value?.data;
        const list =
          d?.data?.content ?? d?.data ?? d?.content ?? (Array.isArray(d) ? d : []);
        if (Array.isArray(list)) {
          woCount = list.length;
          // Build 6-month trend from real data
          const months = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'];
          const now = new Date();
          const trend = months.map((month, idx) => {
            const targetMonth = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1);
            const monthWOs = list.filter(w => {
              const d = new Date(w.scheduledStartDate || w.createdAt || w.startDate || 0);
              return d.getMonth() === targetMonth.getMonth() && d.getFullYear() === targetMonth.getFullYear();
            });
            return {
              month,
              open: monthWOs.filter(w => ['OPEN', 'IN_PROGRESS', 'PENDING', 'ASSIGNED'].includes(w.status)).length,
              closed: monthWOs.filter(w => ['COMPLETED', 'CLOSED', 'CANCELLED'].includes(w.status)).length,
            };
          });
          if (trend.some(t => t.open > 0 || t.closed > 0)) setWorkOrderTrend(trend);
          try {
            localStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify({
              kpi: {
                users: usersCount,
                assets: assetsCount,
                crews: crewsCount,
                workOrders: woCount,
              },
              workOrderTrend: trend,
              cachedAt: new Date().toISOString(),
            }));
          } catch {
            // ignore cache write issues
          }
        } else {
          woCount = normalizeCount(wo.value);
        }
      } else if (wo.status === 'rejected') {
        console.error('Work orders load failed:', wo.reason);
        if (wo.reason?.response?.status === 429) {
          setWorkOrderNotice('Work orders API is rate-limited (429). Showing last available dashboard snapshot.');
          try {
            const raw = localStorage.getItem(DASHBOARD_CACHE_KEY);
            const snapshot = raw ? JSON.parse(raw) : null;
            if (snapshot?.kpi?.workOrders !== undefined && snapshot?.kpi?.workOrders !== null) {
              woCount = snapshot.kpi.workOrders;
            }
            if (Array.isArray(snapshot?.workOrderTrend) && snapshot.workOrderTrend.length > 0) {
              setWorkOrderTrend(snapshot.workOrderTrend);
            }
          } catch {
            // ignore cache parse issues
          }
        }
      }

      setKpi((prev) => ({
        users: usersCount === '—' ? prev.users : usersCount,
        assets: assetsCount === '—' ? prev.assets : assetsCount,
        crews: crewsCount === '—' ? prev.crews : crewsCount,
        workOrders: woCount === '—' ? prev.workOrders : woCount,
      }));

      // Incidents
      if (i.status === 'fulfilled') {
        const payload = i.value?.data?.data ?? i.value?.data ?? [];
        setIncidents(Array.isArray(payload) ? payload : []);
      }

      setKpiLoading(false);
    });
  };

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    loadAll();
  }, []);

  const handleApprove = async (id) => {
    try {
      await incidentReportService.approve(id);
      setActionMsg({ id, text: 'Approved', ok: true });
      setTimeout(() => {
        setIncidents((prev) => prev.map((i) => i.id === id ? { ...i, status: 'APPROVED' } : i));
        setActionMsg({ id: null, text: '', ok: true });
      }, 300);
    } catch {
      setActionMsg({ id, text: 'Approve failed', ok: false });
      setTimeout(() => setActionMsg({ id: null, text: '', ok: true }), 3000);
    }
  };

  const handleReject = async (id) => {
    try {
      await incidentReportService.reject(id);
      setActionMsg({ id, text: 'Rejected', ok: true });
      setTimeout(() => {
        setIncidents((prev) => prev.map((i) => i.id === id ? { ...i, status: 'REJECTED' } : i));
        setActionMsg({ id: null, text: '', ok: true });
      }, 300);
    } catch {
      setActionMsg({ id, text: 'Reject failed', ok: false });
      setTimeout(() => setActionMsg({ id: null, text: '', ok: true }), 3000);
    }
  };

  const incidentStats = useMemo(() => ({
    pending:  incidents.filter((i) => i.status === 'DRAFT' || i.status === 'SUBMITTED').length,
    approved: incidents.filter((i) => i.status === 'APPROVED').length,
    rejected: incidents.filter((i) => i.status === 'REJECTED').length,
    critical: incidents.filter((i) => i.severityLevel === 'CRITICAL').length,
  }), [incidents]);

  const pendingApprovals = useMemo(() =>
    incidents.filter((i) => i.status === 'DRAFT' || i.status === 'SUBMITTED').slice(0, 5),
    [incidents]
  );

  return (
    <>
    <ThemeToggleButton />
    <section className="dashboard-panel">
      <div className="dashboard-header" style={{ position: 'relative' }}>
        <div className="dashboard-meta">
          <span className="dashboard-label">Utilities Admin</span>
          <h2 className="dashboard-title">System Administration &amp; Configuration</h2>
          <p className="dashboard-description">
            Oversee identity management, asset registry, network topology, maintenance profiles, billing configuration and regulatory analytics from one secure console.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
          <NotificationBell alerts={ADMIN_ALERTS} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={loadAll}
              title="Refresh all data"
              style={{ background: 'rgba(94,230,255,0.08)', border: '1px solid rgba(94,230,255,0.2)', color: '#5ee6ff', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <FiRefreshCw size={13} /> Refresh
            </button>
            <div className="dashboard-stat">
              <strong style={{ color: '#5ee6ff' }}>Full</strong>
              <span>System access</span>
            </div>
          </div>
        </div>
      </div>

      {/* Live KPI row */}
      <div className="dash-kpi-row">
        <div className="dash-kpi-card">
          <div className="dash-kpi-value">{kpiLoading ? '…' : kpi.assets}</div>
          <div className="dash-kpi-label">Total Assets</div>
        </div>
        <div className="dash-kpi-card">
          <div className="dash-kpi-value">{kpiLoading ? '…' : kpi.users}</div>
          <div className="dash-kpi-label">Active Users</div>
        </div>
        <div className="dash-kpi-card">
          <div className="dash-kpi-value">{kpiLoading ? '…' : kpi.crews}</div>
          <div className="dash-kpi-label">Total Crews</div>
        </div>
        <div className="dash-kpi-card">
          <div className="dash-kpi-value">{kpiLoading ? '…' : kpi.workOrders}</div>
          <div className="dash-kpi-label">Work Orders</div>
        </div>
        <div className="dash-kpi-card kpi-alert">
          <div className="dash-kpi-value">{incidentStats.critical}</div>
          <div className="dash-kpi-label">Critical Incidents</div>
        </div>
        <div className="dash-kpi-card kpi-alert">
          <div className="dash-kpi-value">{incidentStats.pending}</div>
          <div className="dash-kpi-label">Pending Approvals</div>
        </div>
        <div className="dash-kpi-card">
          <div className="dash-kpi-value">{incidentStats.approved}</div>
          <div className="dash-kpi-label">Approved Incidents</div>
        </div>
        <div className="dash-kpi-card">
          <div className="dash-kpi-value">{incidentStats.rejected}</div>
          <div className="dash-kpi-label">Rejected Incidents</div>
        </div>
      </div>

      {/* INCIDENT APPROVALS SECTION */}
      {pendingApprovals.length > 0 && (
        <div className="dashboard-card" style={{ marginBottom: 20, borderLeft: '3px solid #f87171' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 className="dash-section-title" style={{ margin: 0 }}>Pending Incident Approvals</h3>
            <button onClick={() => navigate('/incident-management')} style={{ background: 'rgba(94,230,255,0.1)', border: '1px solid rgba(94,230,255,0.2)', color: '#5ee6ff', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
              View All
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
            {pendingApprovals.map((inc) => {
              const isActioned = actionMsg.id === inc.id;
              return (
                <div key={inc.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(94,230,255,0.08)', borderRadius: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#e8f4ff' }}>#{inc.id} · {(inc.description || 'Incident').substring(0, 40)}</div>
                    <div style={{ fontSize: '11px', color: 'rgba(199,220,246,0.5)' }}>{inc.severityLevel || '—'} severity · Outage {inc.outageId}</div>
                  </div>
                  {isActioned ? (
                    <div style={{ fontSize: '11px', fontWeight: '700', color: actionMsg.ok ? '#34d399' : '#f87171' }}>
                      {actionMsg.ok ? '✓' : '✗'} {actionMsg.text}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => handleApprove(inc.id)} style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>
                        <FiCheckCircle size={11} style={{ marginRight: '3px', display: 'inline' }} /> Approve
                      </button>
                      <button onClick={() => handleReject(inc.id)} style={{ background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>
                        <FiXCircle size={11} style={{ marginRight: '3px', display: 'inline' }} /> Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, margin: '0 0 28px' }}>
        <div className="dashboard-card" style={{ padding: '20px 20px 10px' }}>
          <h3 className="dash-section-title" style={{ marginBottom: 16 }}>Assets by Type</h3>
          {assetTypeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={assetTypeData} margin={{ left: -20, right: 4 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#0f1530', border: '1px solid rgba(94,230,255,0.2)', borderRadius: 10, fontSize: 12 }} labelStyle={{ color: '#e7f6ff' }} itemStyle={{ color: '#a78bfa' }} />
                <Bar dataKey="count" fill="#a78bfa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(199,220,246,0.4)', fontSize: '0.85rem' }}>
              {kpiLoading ? 'Loading assets...' : 'No asset data available'}
            </div>
          )}
        </div>

        <div className="dashboard-card" style={{ padding: '20px 20px 10px' }}>
          <h3 className="dash-section-title" style={{ marginBottom: 16 }}>Work Orders — 6-Month Trend</h3>
          {workOrderNotice && (
            <div style={{ marginBottom: 10, padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(251,191,36,0.35)', background: 'rgba(251,191,36,0.08)', color: '#fbbf24', fontSize: '0.78rem' }}>
              {workOrderNotice}
            </div>
          )}
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={workOrderTrend} margin={{ left: -20, right: 4 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#0f1530', border: '1px solid rgba(94,230,255,0.2)', borderRadius: 10, fontSize: 12 }} labelStyle={{ color: '#e7f6ff' }} />
              <Legend />
              <Line type="monotone" dataKey="open"   stroke="#f87171" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="closed" stroke="#34d399" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Module cards */}
      <h3 className="dash-section-title">Quick Access — Authorized Modules</h3>
      <div className="dashboard-grid">
        {MODULE_CARDS.map(card => (
          <article key={card.label} className="dashboard-card dash-module-card" onClick={() => navigate(card.path)} style={{ '--card-accent': card.color, cursor: 'pointer' }}>
            <div className="dash-module-icon" style={{ color: card.color }}>{card.icon}</div>
            <h3>{card.label}</h3>
            <p>{card.desc}</p>
            <span className="dash-module-link">Open →</span>
          </article>
        ))}
      </div>

      {/* Access scope table */}
      <h3 className="dash-section-title" style={{ marginTop: 28 }}>Access Scope</h3>
      <div className="dash-access-table">
        <div className="dash-access-row dash-access-head"><span>Module</span><span>Access Level</span><span>SLA Target</span></div>
        {[
          ['Identity & Access Management', 'Full CRUD + Audit', 'p95 auth < 2s, 100% audit'],
          ['Asset Registry & Network Topology', 'Full CRUD', 'CRUD p95 < 1.5s'],
          ['Maintenance Planning', 'Full CRUD', 'WO assign < 5s'],
          ['Billing Ref & Tariff Mapping', 'Full CRUD', 'Mapping accuracy 99.9%'],
          ['Reliability & Regulatory Analytics', 'Read + Reports', 'Report gen < 60s'],
          ['Notifications & Alerts', 'All alert types', 'Latency < 5s'],
        ].map(([mod, access, sla]) => (
          <div className="dash-access-row" key={mod}>
            <span>{mod}</span>
            <span className="dash-access-badge">{access}</span>
            <span className="dash-access-sla">{sla}</span>
          </div>
        ))}
      </div>
    </section>
    </>
  );
}

