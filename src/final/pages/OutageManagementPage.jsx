import React, { useMemo, useState, useEffect } from 'react';
import {
  FiAlertTriangle, FiPlus, FiRefreshCw, FiCheckCircle,
  FiSave, FiUsers, FiActivity, FiList, FiMapPin,
} from 'react-icons/fi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { outageService } from '../services/api';
import './OutageManagementPage.css';

const DRAFT_KEY = 'outage-log-form-draft-v1';
const RESTORATION_STEPS_KEY = 'outage-restoration-steps-v1';

const EMPTY_FORM = {
  region: '',
  cause: '',
  outageTime: '',
  status: '',
  affectedCustomers: '',
};

const unwrapResponseData = (r) => r?.data?.data ?? r?.data ?? null;

const toList = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.content)) return payload.content;
  return [];
};

const readRestorationSteps = () => {
  try {
    const raw = localStorage.getItem(RESTORATION_STEPS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const writeRestorationSteps = (value) => {
  localStorage.setItem(RESTORATION_STEPS_KEY, JSON.stringify(value));
};

const STATUS_COLORS = {
  OPEN:        '#f87171',
  LOGGED:      '#5ee6ff',
  IN_PROGRESS: '#fbbf24',
  RESTORING:   '#a78bfa',
  RESOLVED:    '#34d399',
};

const STATUS_BG = {
  OPEN:        'rgba(248,113,113,0.12)',
  LOGGED:      'rgba(94,230,255,0.12)',
  IN_PROGRESS: 'rgba(251,191,36,0.12)',
  RESTORING:   'rgba(167,139,250,0.12)',
  RESOLVED:    'rgba(52,211,153,0.10)',
};

const BAR_COLORS = ['#f87171', '#5ee6ff', '#fbbf24', '#a78bfa', '#34d399'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(10,18,42,0.95)',
      border: '1px solid rgba(94,230,255,0.25)',
      borderRadius: 10,
      padding: '10px 16px',
      fontSize: 13,
      color: '#e7f6ff',
    }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
      <div style={{ color: '#5ee6ff' }}>{payload[0].value} outage{payload[0].value !== 1 ? 's' : ''}</div>
    </div>
  );
};

export default function OutageManagementPage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autosaveState, setAutosaveState] = useState('idle');
  const [confirmation, setConfirmation] = useState(null);
  const [loggedOutages, setLoggedOutages] = useState([]);
  const [unresolvedOutages, setUnresolvedOutages] = useState([]);
  const [regionOutages, setRegionOutages] = useState([]);
  const [activeTab, setActiveTab] = useState('unresolved');
  const [regionQuery, setRegionQuery] = useState('');
  const [restorationOutageId, setRestorationOutageId] = useState('');
  const [restorationStepText, setRestorationStepText] = useState('');
  const [restorationError, setRestorationError] = useState('');
  const [restorationStepsByOutage, setRestorationStepsByOutage] = useState(() => readRestorationSteps());

  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      try { setForm((p) => ({ ...p, ...JSON.parse(saved) })); }
      catch { localStorage.removeItem(DRAFT_KEY); }
    }
    fetchOutageData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
      setAutosaveState('saved');
    }, 500);
    setAutosaveState('saving');
    return () => clearTimeout(timeout);
  }, [form]);

  const validate = () => {
    const e = {};
    if (!form.region.trim())                                              e.region = 'Region is required';
    if (!form.cause.trim())                                               e.cause  = 'Cause is required';
    if (!form.outageTime)                                                 e.outageTime = 'Outage time is required';
    if (!form.status)                                                     e.status = 'Status is required';
    if (!form.affectedCustomers || Number(form.affectedCustomers) <= 0)   e.affectedCustomers = 'Must be greater than 0';
    return e;
  };

  const fetchOutageData = async () => {
    try {
      setIsRefreshing(true);
      const [loggedRes, unresolvedRes, regionRes] = await Promise.allSettled([
        outageService.getByStatus('LOGGED'),
        outageService.getUnresolved(),
        regionQuery.trim() ? outageService.getByRegion(regionQuery.trim()) : Promise.resolve({ data: [] }),
      ]);
      if (loggedRes.status   === 'fulfilled') setLoggedOutages(toList(unwrapResponseData(loggedRes.value)));
      if (unresolvedRes.status === 'fulfilled') setUnresolvedOutages(toList(unwrapResponseData(unresolvedRes.value)));
      setRegionOutages(regionRes.status === 'fulfilled' ? toList(unwrapResponseData(regionRes.value)) : []);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleChange = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setIsSubmitting(true);
    setConfirmation(null);
    try {
      const payload = {
        region: form.region.trim(),
        cause: form.cause.trim(),
        outageTime: form.outageTime,
        status: form.status.trim().toUpperCase(),
        affectedCustomers: Number(form.affectedCustomers),
      };
      const response = await outageService.logOutage(payload);
      const data = unwrapResponseData(response);
      setConfirmation({ type: 'success', message: response?.data?.message || 'Outage logged successfully', outageId: data?.id });
      setForm(EMPTY_FORM);
      localStorage.removeItem(DRAFT_KEY);
      setAutosaveState('idle');
      await fetchOutageData();
    } catch (error) {
      setConfirmation({ type: 'error', message: error?.response?.data?.message || 'Failed to log outage. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalAffected = useMemo(
    () => unresolvedOutages.reduce((acc, r) => acc + Number(r.affectedCustomers || 0), 0),
    [unresolvedOutages]
  );

  const chartData = useMemo(() => {
    const counters = unresolvedOutages.reduce((acc, r) => {
      const k = r.status || 'UNKNOWN';
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(counters).map((k) => ({ status: k, outages: counters[k] }));
  }, [unresolvedOutages]);

  const allOutages = useMemo(
    () => [...unresolvedOutages, ...loggedOutages, ...regionOutages],
    [unresolvedOutages, loggedOutages, regionOutages]
  );

  const regionOptions = useMemo(() => {
    const set = new Set(
      allOutages
        .map((o) => (o.region || '').trim())
        .filter(Boolean)
        .map((r) => r.toUpperCase())
    );
    return [...set].sort();
  }, [allOutages]);

  const statusOptions = useMemo(() => {
    const set = new Set(
      allOutages
        .map((o) => (o.status || '').trim())
        .filter(Boolean)
        .map((s) => s.toUpperCase())
    );
    return [...set].sort();
  }, [allOutages]);

  const topOutage = useMemo(() => {
    if (!unresolvedOutages.length) return null;
    return [...unresolvedOutages].sort(
      (a, b) => Number(b.affectedCustomers || 0) - Number(a.affectedCustomers || 0)
    )[0];
  }, [unresolvedOutages]);

  const TABS = [
    { id: 'unresolved', label: 'Unresolved', count: unresolvedOutages.length },
    { id: 'logged',     label: 'LOGGED',     count: loggedOutages.length },
    { id: 'region',     label: 'By Region',  count: regionOutages.length },
  ];

  const statusBadge = (status) => (
    <span className="om-badge" style={{
      background: STATUS_BG[status] || 'rgba(148,163,184,0.10)',
      color: STATUS_COLORS[status] || '#94a3b8',
      borderColor: (STATUS_COLORS[status] || '#94a3b8') + '55',
    }}>
      {(status || 'UNKNOWN').replace('_', ' ')}
    </span>
  );

  const restorationOutageOptions = useMemo(() => {
    const map = new Map();
    allOutages.forEach((o) => {
      if (!o?.id) return;
      map.set(String(o.id), o);
    });
    return [...map.values()].sort((a, b) => Number(b.id) - Number(a.id));
  }, [allOutages]);

  useEffect(() => {
    if (restorationOutageId) return;
    if (!restorationOutageOptions.length) return;
    setRestorationOutageId(String(restorationOutageOptions[0].id));
  }, [restorationOutageId, restorationOutageOptions]);

  const selectedOutage = useMemo(
    () => restorationOutageOptions.find((o) => String(o.id) === String(restorationOutageId)) || null,
    [restorationOutageOptions, restorationOutageId]
  );

  const restorationTimeline = useMemo(() => {
    const list = restorationOutageId ? restorationStepsByOutage[String(restorationOutageId)] || [] : [];
    return [...list].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [restorationOutageId, restorationStepsByOutage]);

  const handleAddRestorationStep = (e) => {
    e.preventDefault();
    const text = restorationStepText.trim();
    if (!restorationOutageId) {
      setRestorationError('Select an outage first.');
      return;
    }
    if (!text) {
      setRestorationError('Restoration step is required.');
      return;
    }
    const nextStep = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      message: text,
      timestamp: new Date().toISOString(),
    };
    setRestorationStepsByOutage((prev) => {
      const key = String(restorationOutageId);
      const current = Array.isArray(prev[key]) ? prev[key] : [];
      const updated = { ...prev, [key]: [nextStep, ...current] };
      writeRestorationSteps(updated);
      return updated;
    });
    setRestorationStepText('');
    setRestorationError('');
  };

  return (
    <div className="om-page">

      {/* HERO */}
      <div className="om-hero">
        <div className="om-hero-glow" />
        <div className="om-hero-content">
          <div>
            <div className="om-hero-tag">⚡ Control Room · Outage Operations</div>
            <h1 className="om-hero-title">Outage Management</h1>
            <p className="om-hero-desc">
              Log incidents with mandatory validation and live autosave. Monitor unresolved, LOGGED, and region feeds in real time.
            </p>
          </div>
          <button type="button" className="om-btn om-btn-ghost" onClick={fetchOutageData} disabled={isRefreshing}>
            <FiRefreshCw className={isRefreshing ? 'om-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="om-skeleton-wrapper">
          {[1, 2, 3, 4].map((i) => <div key={i} className="om-skeleton om-skeleton-kpi" />)}
        </div>
      ) : (
        <>
          {/* KPI ROW */}
          <div className="om-kpi-row">
            <div className="om-kpi-card" style={{ '--kpi-accent': '#f87171' }}>
              <div className="om-kpi-icon" style={{ background: 'rgba(248,113,113,0.15)' }}>
                <FiAlertTriangle color="#f87171" size={20} />
              </div>
              <div className="om-kpi-body">
                <div className="om-kpi-value" style={{ color: '#f87171' }}>{unresolvedOutages.length}</div>
                <div className="om-kpi-label">Unresolved</div>
                <div className="om-kpi-sub">Active incidents</div>
              </div>
            </div>

            <div className="om-kpi-card" style={{ '--kpi-accent': '#fbbf24' }}>
              <div className="om-kpi-icon" style={{ background: 'rgba(251,191,36,0.15)' }}>
                <FiUsers color="#fbbf24" size={20} />
              </div>
              <div className="om-kpi-body">
                <div className="om-kpi-value" style={{ color: '#fbbf24' }}>{totalAffected.toLocaleString()}</div>
                <div className="om-kpi-label">Customers Affected</div>
                <div className="om-kpi-sub">Across all unresolved</div>
              </div>
            </div>

            <div className="om-kpi-card" style={{ '--kpi-accent': '#5ee6ff' }}>
              <div className="om-kpi-icon" style={{ background: 'rgba(94,230,255,0.15)' }}>
                <FiList color="#5ee6ff" size={20} />
              </div>
              <div className="om-kpi-body">
                <div className="om-kpi-value" style={{ color: '#5ee6ff' }}>{loggedOutages.length}</div>
                <div className="om-kpi-label">LOGGED</div>
                <div className="om-kpi-sub">Awaiting response</div>
              </div>
            </div>

            <div className="om-kpi-card" style={{ '--kpi-accent': '#34d399' }}>
              <div className="om-kpi-icon" style={{ background: 'rgba(52,211,153,0.15)' }}>
                <FiMapPin color="#34d399" size={20} />
              </div>
              <div className="om-kpi-body">
                <div className="om-kpi-value" style={{ color: '#34d399' }}>{regionOutages.length}</div>
                <div className="om-kpi-label">In Region</div>
                  <div className="om-kpi-sub">{regionQuery.trim() || 'Select region filter'}</div>
              </div>
            </div>
          </div>

          <div className="om-quick-strip">
            <div className="om-quick-chip">
              <span className="om-quick-label">Top impact outage</span>
              <strong>{topOutage ? `#${topOutage.id} · ${topOutage.region || 'Unknown'}` : 'No active outage'}</strong>
            </div>
            <div className="om-quick-chip">
              <span className="om-quick-label">Known regions</span>
              <strong>{regionOptions.length}</strong>
            </div>
            <div className="om-quick-chip">
              <span className="om-quick-label">Observed statuses</span>
              <strong>{statusOptions.length || 0}</strong>
            </div>
          </div>

          {/* FORM + CHART */}
          <div className="om-split-row">

            {/* FORM PANEL */}
            <div className="om-panel">
              <div className="om-panel-head">
                <div>
                  <div className="om-panel-title"><FiPlus /> Log New Outage</div>
                  <div className="om-panel-sub">Mandatory fields marked with *</div>
                </div>
                <div className={`om-autosave${autosaveState === 'saved' ? ' om-autosave-saved' : autosaveState === 'saving' ? ' om-autosave-saving' : ''}`}>
                  <FiSave size={13} />
                  {autosaveState === 'saved' ? 'Draft saved' : autosaveState === 'saving' ? 'Saving…' : ''}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="om-form">
                <div className="om-form-grid">
                  <div className="om-field">
                    <label className="om-label">Region *</label>
                    <input
                      className={`om-input${errors.region ? ' om-input-error' : ''}`}
                      type="text"
                      list="om-regions"
                      placeholder="Type region from live backend feed"
                      value={form.region}
                      onChange={handleChange('region')}
                    />
                    <datalist id="om-regions">
                      {regionOptions.map((region) => (
                        <option key={region} value={region} />
                      ))}
                    </datalist>
                    {errors.region && <div className="om-error">{errors.region}</div>}
                  </div>

                  <div className="om-field">
                    <label className="om-label">Outage Time *</label>
                    <input className={`om-input${errors.outageTime ? ' om-input-error' : ''}`} type="datetime-local" value={form.outageTime} onChange={handleChange('outageTime')} />
                    {errors.outageTime && <div className="om-error">{errors.outageTime}</div>}
                  </div>

                  <div className="om-field">
                    <label className="om-label">Status *</label>
                    <input
                      className={`om-input${errors.status ? ' om-input-error' : ''}`}
                      type="text"
                      list="om-statuses"
                      placeholder="Type/select status from backend values"
                      value={form.status}
                      onChange={(e) => setForm((p) => ({ ...p, status: e.target.value.toUpperCase() }))}
                    />
                    <datalist id="om-statuses">
                      {statusOptions.map((status) => (
                        <option key={status} value={status} />
                      ))}
                    </datalist>
                    {errors.status && <div className="om-error">{errors.status}</div>}
                  </div>

                  <div className="om-field">
                    <label className="om-label">Affected Customers *</label>
                    <input className={`om-input${errors.affectedCustomers ? ' om-input-error' : ''}`} type="number" min="1" value={form.affectedCustomers} onChange={handleChange('affectedCustomers')} placeholder="e.g. 410" />
                    {errors.affectedCustomers && <div className="om-error">{errors.affectedCustomers}</div>}
                  </div>
                </div>

                <div className="om-field">
                  <label className="om-label">Cause *</label>
                  <textarea className={`om-input om-textarea${errors.cause ? ' om-input-error' : ''}`} rows={3} value={form.cause} onChange={handleChange('cause')} placeholder="Grid overload caused by peak summer demand" />
                  {errors.cause && <div className="om-error">{errors.cause}</div>}
                </div>

                <div className="om-form-footer">
                  <button type="submit" className="om-btn om-btn-primary" disabled={isSubmitting}>
                    {isSubmitting
                      ? <><FiRefreshCw className="om-spin" /> Submitting…</>
                      : <><FiPlus /> Submit Outage</>}
                  </button>
                </div>
              </form>

              {confirmation && (
                <div className={`om-confirm om-confirm-${confirmation.type}`}>
                  {confirmation.type === 'success'
                    ? <FiCheckCircle size={18} style={{ flexShrink: 0 }} />
                    : <FiAlertTriangle size={18} style={{ flexShrink: 0 }} />}
                  <div>
                    <div className="om-confirm-msg">{confirmation.message}</div>
                    {confirmation.outageId && (
                      <div className="om-confirm-id">Outage ID: <strong>#{confirmation.outageId}</strong></div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* CHART PANEL */}
            <div className="om-panel">
              <div className="om-panel-head">
                <div>
                  <div className="om-panel-title"><FiActivity /> Status Distribution</div>
                  <div className="om-panel-sub">Unresolved outages grouped by status</div>
                </div>
              </div>
              {chartData.length === 0 ? (
                <div className="om-empty-chart">
                  <FiCheckCircle size={40} color="#34d399" />
                  <div style={{ marginTop: 12, color: '#34d399', fontWeight: 700, fontSize: 16 }}>All clear</div>
                  <div style={{ fontSize: 13, color: 'rgba(199,220,246,0.45)', marginTop: 4 }}>No unresolved outages</div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} barCategoryGap="35%">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(94,230,255,0.07)" vertical={false} />
                    <XAxis dataKey="status" tick={{ fontSize: 11, fill: 'rgba(199,220,246,0.55)' }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'rgba(199,220,246,0.55)' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(94,230,255,0.04)' }} />
                    <Bar dataKey="outages" radius={[6, 6, 0, 0]}>
                      {chartData.map((_, idx) => (
                        <Cell key={idx} fill={BAR_COLORS[idx % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
              <div className="om-status-legend">
                {Object.entries(STATUS_COLORS).map(([s, c]) => (
                  <span key={s} className="om-legend-item" style={{ color: c }}>
                    <span className="om-legend-dot" style={{ background: c }} />{s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* TABBED TABLES */}
          <div className="om-panel" style={{ marginTop: 20 }}>
            <div className="om-tabs">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`om-tab${activeTab === t.id ? ' om-tab-active' : ''}`}
                  onClick={() => setActiveTab(t.id)}
                >
                  {t.label}
                  <span className={`om-tab-count${activeTab === t.id ? ' om-tab-count-active' : ''}`}>{t.count}</span>
                </button>
              ))}
            </div>

            {activeTab === 'unresolved' && (
              <div className="om-table-wrap">
                <table className="om-table">
                  <thead><tr><th>#ID</th><th>Region</th><th>Outage Time</th><th>Customers</th><th>Status</th><th>Logged By</th></tr></thead>
                  <tbody>
                    {unresolvedOutages.map((o) => (
                      <tr key={o.id} className={o.status === 'OPEN' ? 'om-row-pulse' : ''}>
                        <td><span className="om-id">#{o.id}</span></td>
                        <td className="om-region">{o.region || '—'}</td>
                        <td>{o.outageTime ? new Date(o.outageTime).toLocaleString() : '—'}</td>
                        <td><span className="om-customers">{Number(o.affectedCustomers || 0).toLocaleString()}</span></td>
                        <td>{statusBadge(o.status)}</td>
                        <td className="om-mono">{o.loggedByOperatorId || '—'}</td>
                      </tr>
                    ))}
                    {unresolvedOutages.length === 0 && (
                      <tr><td colSpan={6} className="om-empty-row"><FiCheckCircle color="#34d399" style={{ marginRight: 8 }} />All outages resolved</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'logged' && (
              <div className="om-table-wrap">
                <table className="om-table">
                  <thead><tr><th>#ID</th><th>Region</th><th>Cause</th><th>Outage Time</th><th>Affected</th></tr></thead>
                  <tbody>
                    {loggedOutages.map((o) => (
                      <tr key={o.id}>
                        <td><span className="om-id">#{o.id}</span></td>
                        <td className="om-region">{o.region}</td>
                        <td className="om-cause">{o.cause}</td>
                        <td>{o.outageTime ? new Date(o.outageTime).toLocaleString() : '—'}</td>
                        <td>{Number(o.affectedCustomers || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                    {loggedOutages.length === 0 && (
                      <tr><td colSpan={5} className="om-empty-row">No LOGGED outages</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'region' && (
              <div className="om-table-wrap">
                <div className="om-region-banner">
                  <FiMapPin size={13} style={{ marginRight: 6 }} />
                  <span>Region filter</span>
                  <input
                    className="om-input om-region-input"
                    type="text"
                    list="om-region-filter-options"
                    placeholder="Type region and press Enter"
                    value={regionQuery}
                    onChange={(e) => setRegionQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchOutageData()}
                  />
                  <datalist id="om-region-filter-options">
                    {regionOptions.map((region) => (
                      <option key={region} value={region} />
                    ))}
                  </datalist>
                  <button type="button" className="om-btn om-btn-ghost om-btn-sm" onClick={fetchOutageData} disabled={isRefreshing}>
                    <FiRefreshCw className={isRefreshing ? 'om-spin' : ''} /> Fetch
                  </button>
                  <span className="om-region-hint">Showing: <strong>{regionQuery.trim() || 'No region selected'}</strong></span>
                </div>
                <table className="om-table">
                  <thead><tr><th>#ID</th><th>Status</th><th>Outage Time</th><th>Affected</th><th>Logged By</th></tr></thead>
                  <tbody>
                    {regionOutages.map((o) => (
                      <tr key={o.id}>
                        <td><span className="om-id">#{o.id}</span></td>
                        <td>{statusBadge(o.status)}</td>
                        <td>{o.outageTime ? new Date(o.outageTime).toLocaleString() : '—'}</td>
                        <td>{Number(o.affectedCustomers || 0).toLocaleString()}</td>
                        <td className="om-mono">{o.loggedByOperatorId || '—'}</td>
                      </tr>
                    ))}
                    {regionOutages.length === 0 && (
                      <tr><td colSpan={5} className="om-empty-row">No outages for this region</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="om-panel" style={{ marginTop: 20 }}>
            <div className="om-panel-head">
              <div>
                <div className="om-panel-title"><FiActivity /> Restoration Steps Timeline</div>
                <div className="om-panel-sub">Track progress updates for each outage in chronological order.</div>
              </div>
            </div>

            <form className="om-restoration-form" onSubmit={handleAddRestorationStep}>
              <div className="om-field">
                <label className="om-label">Outage</label>
                <select
                  className="om-input"
                  value={restorationOutageId}
                  onChange={(e) => setRestorationOutageId(e.target.value)}
                >
                  <option value="">-- Select outage --</option>
                  {restorationOutageOptions.map((o) => (
                    <option key={o.id} value={String(o.id)}>
                      #{o.id} · {(o.region || 'Unknown').toUpperCase()} · {(o.status || 'UNKNOWN').replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="om-field">
                <label className="om-label">New Restoration Step</label>
                <div className="om-restoration-row">
                  <input
                    className="om-input"
                    type="text"
                    placeholder="e.g. Crew reached feeder and started breaker reset"
                    value={restorationStepText}
                    onChange={(e) => {
                      setRestorationStepText(e.target.value);
                      if (restorationError) setRestorationError('');
                    }}
                  />
                  <button type="submit" className="om-btn om-btn-primary">Add Step</button>
                </div>
              </div>
            </form>

            {restorationError && <div className="om-error" style={{ marginBottom: 10 }}>{restorationError}</div>}

            <div className="om-restoration-meta">
              {selectedOutage
                ? <>Showing timeline for outage <strong>#{selectedOutage.id}</strong> ({selectedOutage.region || 'Unknown region'})</>
                : <>No outage selected</>}
            </div>

            <div className="om-restoration-timeline">
              {restorationTimeline.map((step) => (
                <div key={step.id} className="om-restoration-item">
                  <div className="om-restoration-dot" />
                  <div className="om-restoration-content">
                    <div className="om-restoration-time">
                      {new Date(step.timestamp).toLocaleString()}
                    </div>
                    <div className="om-restoration-text">{step.message}</div>
                  </div>
                </div>
              ))}
              {restorationTimeline.length === 0 && (
                <div className="om-empty-row" style={{ padding: '16px 0' }}>
                  No restoration steps yet. Add a step to start tracking.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
