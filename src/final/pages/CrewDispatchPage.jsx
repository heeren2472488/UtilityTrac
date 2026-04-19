import React, { useState, useEffect, useMemo } from 'react';
import {
  FiTruck, FiRefreshCw, FiCheckCircle, FiAlertTriangle,
  FiPlus, FiActivity, FiUsers, FiSearch, FiClock,
} from 'react-icons/fi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { crewDispatchService, outageService, crewService } from '../services/api';
import './CrewDispatchPage.css';

/* ── constants ────────────────────────────────────────── */
const EMPTY_FORM = {
  outageId: '',
  crewId: '',
  crewName: '',
  dispatchTime: '',
  estimatedTimeOfArrival: '',
  status: '',
  notes: '',
};

const STATUS_COLORS = {
  DISPATCHED:   '#5ee6ff',
  EN_ROUTE:     '#a78bfa',
  ON_SITE:      '#34d399',
  COMPLETED:    '#34d399',
  CANCELLED:    '#f87171',
  STANDBY:      '#fbbf24',
};
const STATUS_BG = {
  DISPATCHED:   'rgba(94,230,255,0.12)',
  EN_ROUTE:     'rgba(167,139,250,0.12)',
  ON_SITE:      'rgba(52,211,153,0.10)',
  COMPLETED:    'rgba(52,211,153,0.10)',
  CANCELLED:    'rgba(248,113,113,0.12)',
  STANDBY:      'rgba(251,191,36,0.12)',
};
const BAR_COLORS = ['#5ee6ff', '#a78bfa', '#34d399', '#f87171', '#fbbf24'];

const toList = (d) => {
  if (!d) return [];
  if (Array.isArray(d)) return d;
  if (Array.isArray(d.content)) return d.content;
  if (Array.isArray(d.data)) return d.data;
  return [];
};
const unwrap = (res) => res?.data?.data ?? res?.data ?? null;

const normalizeDispatchStatus = (dispatchOrStatus) => {
  const raw = typeof dispatchOrStatus === 'string'
    ? dispatchOrStatus
    : dispatchOrStatus?.status
      || dispatchOrStatus?.dispatchStatus
      || dispatchOrStatus?.currentStatus
      || dispatchOrStatus?.state;
  const normalized = (raw || '').toString().trim().toUpperCase();
  if (normalized) return normalized;
  if (typeof dispatchOrStatus === 'object' && dispatchOrStatus) return 'IN_PROGRESS';
  return '';
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(10,18,42,0.96)',
      border: '1px solid rgba(94,230,255,0.22)',
      borderRadius: 10, padding: '10px 16px', fontSize: 13, color: '#e7f6ff',
    }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
      <div style={{ color: '#5ee6ff' }}>{payload[0].value} dispatch{payload[0].value !== 1 ? 'es' : ''}</div>
    </div>
  );
};

/* ── component ────────────────────────────────────────── */
export default function CrewDispatchPage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  /* data feeds */
  const [activeDispatches, setActiveDispatches] = useState([]);
  const [allDispatches, setAllDispatches]       = useState([]);   // status filter
  const [outageDispatches, setOutageDispatches] = useState([]);   // by outage
  const [crewDispatches, setCrewDispatches]     = useState([]);   // by crew
  const [unresolvedOutages, setUnresolvedOutages] = useState([]);
  const [availableCrews, setAvailableCrews] = useState([]);

  /* filter params */
  const [statusFilter, setStatusFilter]   = useState('');
  const [outageIdFilter, setOutageIdFilter] = useState('');
  const [crewIdFilter, setCrewIdFilter]    = useState('');
  const [dispatchIdQuery, setDispatchIdQuery] = useState('');
  const [dispatchLookup, setDispatchLookup] = useState(null);
  const [dispatchLookupError, setDispatchLookupError] = useState('');

  const [activeTab, setActiveTab] = useState('active');

  /* ─ initial load ─ */
  useEffect(() => { fetchAll(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAll = async () => {
    setIsRefreshing(true);
    try {
      const [activeRes, outagesRes, crewsRes] = await Promise.allSettled([
        crewDispatchService.getActive(),
        outageService.getUnresolved(),
        crewService.getAll({ page: 0, size: 100 }),
      ]);
      if (activeRes.status === 'fulfilled') setActiveDispatches(toList(unwrap(activeRes.value)));
      if (outagesRes.status === 'fulfilled') setUnresolvedOutages(toList(unwrap(outagesRes.value)));
      if (crewsRes.status === 'fulfilled') setAvailableCrews(toList(unwrap(crewsRes.value)));
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchByStatus = async () => {
    if (!statusFilter.trim()) return;
    setIsRefreshing(true);
    try {
      const res = await crewDispatchService.getByStatus(statusFilter.trim().toUpperCase());
      setAllDispatches(toList(unwrap(res)));
    } finally { setIsRefreshing(false); }
  };

  const fetchByOutage = async () => {
    if (!outageIdFilter.trim()) return;
    setIsRefreshing(true);
    try {
      const res = await crewDispatchService.getByOutage(outageIdFilter.trim());
      setOutageDispatches(toList(unwrap(res)));
    } finally { setIsRefreshing(false); }
  };

  const fetchByCrew = async () => {
    if (!crewIdFilter.trim()) return;
    setIsRefreshing(true);
    try {
      const res = await crewDispatchService.getByCrew(crewIdFilter.trim());
      setCrewDispatches(toList(unwrap(res)));
    } finally { setIsRefreshing(false); }
  };

  const fetchByDispatchId = async () => {
    if (!dispatchIdQuery.trim()) return;
    setIsRefreshing(true);
    setDispatchLookupError('');
    try {
      const res = await crewDispatchService.getById(dispatchIdQuery.trim());
      setDispatchLookup(unwrap(res));
    } catch (err) {
      setDispatchLookup(null);
      setDispatchLookupError(err?.response?.data?.message || 'Dispatch not found');
    } finally {
      setIsRefreshing(false);
    }
  };

  const getCrewId = (crew) => String(crew?.id ?? crew?.crewId ?? '');
  const getCrewName = (crew) => crew?.crewName || crew?.name || '';
  const getCrewMembers = (crew) => Array.isArray(crew?.members) ? crew.members.length : (crew?.memberCount || 0);

  const onSelectCrew = (rawCrewId) => {
    const selected = availableCrews.find((c) => String(c.id ?? c.crewId) === String(rawCrewId));
    setForm((p) => ({
      ...p,
      crewId: String(rawCrewId || ''),
      crewName: selected ? getCrewName(selected) : p.crewName,
    }));
    setErrors((p) => ({ ...p, crewId: '', crewName: '' }));
  };

  const observedStatusOptions = useMemo(() => {
    const set = new Set(
      [...activeDispatches, ...allDispatches, ...outageDispatches, ...crewDispatches]
        .map((d) => (d.status || '').trim())
        .filter(Boolean)
        .map((s) => s.toUpperCase())
    );
    return [...set].sort();
  }, [activeDispatches, allDispatches, outageDispatches, crewDispatches]);

  /* ─ form ─ */
  const validate = () => {
    const e = {};
    if (!form.outageId)               e.outageId = 'Outage ID is required';
    if (!form.crewId)                 e.crewId   = 'Crew ID is required';
    if (!form.crewName.trim())        e.crewName = 'Crew name is required';
    if (!form.dispatchTime)           e.dispatchTime = 'Dispatch time is required';
    if (!form.estimatedTimeOfArrival) e.estimatedTimeOfArrival = 'ETA is required';
    return e;
  };

  const getCrewIdForApi = () => {
    const raw = String(form.crewId || '').trim();
    if (!raw) return '';
    if (/^\d+$/.test(raw) && raw.length < 2) return raw.padStart(2, '0');
    return raw;
  };

  const handleChange = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: '' }));
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setIsSubmitting(true);
    setConfirmation(null);
    try {
      const payload = {
        outageId: Number(form.outageId),
        crewId: getCrewIdForApi(),
        crewName: form.crewName.trim(),
        dispatchTime: form.dispatchTime,
        estimatedTimeOfArrival: form.estimatedTimeOfArrival,
        ...(form.status.trim() ? { status: form.status.trim().toUpperCase() } : {}),
        notes: form.notes.trim() || undefined,
      };
      const response = await crewDispatchService.dispatch(payload);
      const data = unwrap(response);
      setConfirmation({
        type: 'success',
        message: response?.data?.message || 'Crew dispatched successfully',
        dispatchId: data?.id,
        eta: data?.estimatedTimeOfArrival,
      });
      setForm(EMPTY_FORM);
      setDispatchLookup(data || null);
      await fetchAll();
    } catch (err) {
      setConfirmation({ type: 'error', message: err?.response?.data?.message || 'Dispatch failed. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ─ chart ─ */
  const chartData = useMemo(() => {
    const counts = activeDispatches.reduce((acc, d) => {
      const k = d.status || 'UNKNOWN';
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(counts).map((k) => ({ status: k, count: counts[k] }));
  }, [activeDispatches]);

  /* ─ helpers ─ */
  const fmtTime = (t) => (t ? new Date(t).toLocaleString() : '—');
  const fmtEta  = (dispatch) => {
    if (!dispatch.estimatedTimeOfArrival) return '—';
    const diff = new Date(dispatch.estimatedTimeOfArrival) - Date.now();
    if (diff <= 0) return 'Arriving';
    const mins = Math.round(diff / 60000);
    return `${mins} min`;
  };

  const statusBadge = (dispatchOrStatus) => {
    const status = normalizeDispatchStatus(dispatchOrStatus);
    return (
    <span className="cd-badge" style={{
      background:   STATUS_BG[status]     || 'rgba(148,163,184,0.10)',
      color:        STATUS_COLORS[status] || '#94a3b8',
      borderColor: (STATUS_COLORS[status] || '#94a3b8') + '55',
    }}>
      {(status || '—').replace('_', ' ')}
    </span>
    );
  };

  const activeDispatchesSorted = useMemo(
    () => [...activeDispatches].sort((a, b) => Number(a.id || 0) - Number(b.id || 0)),
    [activeDispatches]
  );

  const TABS = [
    { id: 'active',   label: 'Active',         count: activeDispatches.length },
    { id: 'status',   label: 'By Status',       count: allDispatches.length },
    { id: 'outage',   label: 'By Outage',        count: outageDispatches.length },
    { id: 'crew',     label: 'By Crew',          count: crewDispatches.length },
  ];

  const unassignedCrews = useMemo(() => {
    const activeCrewIds = new Set(activeDispatches.map((d) => String(d.crewId)));
    return availableCrews.filter((c) => !activeCrewIds.has(getCrewId(c)));
  }, [availableCrews, activeDispatches]);

  return (
    <div className="cd-page">

      {/* ── HERO ─────────────────────────────────────────── */}
      <div className="cd-hero">
        <div className="cd-hero-glow" />
        <div className="cd-hero-content">
          <div>
            <div className="cd-hero-tag">🚗 Control Room · Crew Operations</div>
            <h1 className="cd-hero-title">Crew Dispatch</h1>
            <p className="cd-hero-desc">
              Assign crews to active outages with ETA visibility. Track dispatches by status, outage, and crew in real time.
            </p>
          </div>
          <button type="button" className="cd-btn cd-btn-ghost" onClick={fetchAll} disabled={isRefreshing}>
            <FiRefreshCw className={isRefreshing ? 'cd-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="cd-skeleton-wrapper">
          {[1,2,3,4].map((i) => <div key={i} className="cd-skeleton cd-skeleton-kpi" />)}
        </div>
      ) : (
        <>
          {/* ── KPI ROW ──────────────────────────────────── */}
          <div className="cd-kpi-row">
            <div className="cd-kpi-card" style={{ '--kpi-accent': '#5ee6ff' }}>
              <div className="cd-kpi-icon" style={{ background: 'rgba(94,230,255,0.15)' }}>
                <FiTruck color="#5ee6ff" size={20} />
              </div>
              <div className="cd-kpi-body">
                <div className="cd-kpi-value" style={{ color: '#5ee6ff' }}>{activeDispatches.length}</div>
                <div className="cd-kpi-label">Active Dispatches</div>
                <div className="cd-kpi-sub">Currently in progress</div>
              </div>
            </div>

            <div className="cd-kpi-card" style={{ '--kpi-accent': '#f87171' }}>
              <div className="cd-kpi-icon" style={{ background: 'rgba(248,113,113,0.15)' }}>
                <FiAlertTriangle color="#f87171" size={20} />
              </div>
              <div className="cd-kpi-body">
                <div className="cd-kpi-value" style={{ color: '#f87171' }}>{unresolvedOutages.length}</div>
                <div className="cd-kpi-label">Open Outages</div>
                <div className="cd-kpi-sub">Awaiting response</div>
              </div>
            </div>

            <div className="cd-kpi-card" style={{ '--kpi-accent': '#34d399' }}>
              <div className="cd-kpi-icon" style={{ background: 'rgba(52,211,153,0.15)' }}>
                <FiActivity color="#34d399" size={20} />
              </div>
              <div className="cd-kpi-body">
                <div className="cd-kpi-value" style={{ color: '#34d399' }}>
                  {activeDispatches.filter((d) => d.status === 'ON_SITE' || d.status === 'COMPLETED').length}
                </div>
                <div className="cd-kpi-label">On Site</div>
                <div className="cd-kpi-sub">Crews working</div>
              </div>
            </div>

            <div className="cd-kpi-card" style={{ '--kpi-accent': '#a78bfa' }}>
              <div className="cd-kpi-icon" style={{ background: 'rgba(167,139,250,0.15)' }}>
                <FiUsers color="#a78bfa" size={20} />
              </div>
              <div className="cd-kpi-body">
                <div className="cd-kpi-value" style={{ color: '#a78bfa' }}>
                  {unassignedCrews.length}
                </div>
                <div className="cd-kpi-label">Available Crews</div>
                <div className="cd-kpi-sub">From backend crew roster</div>
              </div>
            </div>
          </div>

          {unassignedCrews.length > 0 && (
            <div className="cd-crew-rail">
              <div className="cd-crew-rail-head">Available crews — click to prefill dispatch form</div>
              <div className="cd-crew-rail-grid">
                {unassignedCrews.slice(0, 8).map((crew) => (
                  <button
                    key={getCrewId(crew)}
                    type="button"
                    className={`cd-crew-pill${String(form.crewId) === getCrewId(crew) ? ' cd-crew-pill-active' : ''}`}
                    onClick={() => onSelectCrew(getCrewId(crew))}
                  >
                    <span className="cd-crew-pill-name">{getCrewName(crew) || `Crew ${getCrewId(crew)}`}</span>
                    <span className="cd-crew-pill-meta">ID {getCrewId(crew)} · {getCrewMembers(crew)} members</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── FORM + CHART ──────────────────────────────── */}
          <div className="cd-split-row">

            {/* DISPATCH FORM */}
            <div className="cd-panel">
              <div className="cd-panel-head">
                <div>
                  <div className="cd-panel-title"><FiPlus /> Dispatch a Crew</div>
                  <div className="cd-panel-sub">POST /v1/crew-dispatches · Mandatory fields marked *</div>
                </div>
              </div>

              {/* open outage hint */}
              {unresolvedOutages.length > 0 && (
                <div className="cd-outage-hints">
                  <div className="cd-outage-hints-label">
                    <FiAlertTriangle size={12} /> Open outages — click to prefill Outage ID
                  </div>
                  <div className="cd-outage-pills">
                    {unresolvedOutages.slice(0, 6).map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        className={`cd-outage-pill${String(form.outageId) === String(o.id) ? ' cd-pill-active' : ''}`}
                        onClick={() => { setForm((p) => ({ ...p, outageId: o.id })); setErrors((p) => ({ ...p, outageId: '' })); }}
                      >
                        #{o.id} · {o.region || 'Unknown'}
                        <span className="cd-pill-affected">{Number(o.affectedCustomers || 0)} cust.</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

                <form onSubmit={handleSubmit} className="cd-form">
                  <div className="cd-form-grid">
                    <div className="cd-field">
                      <label className="cd-label">Outage ID *</label>
                      <select className={`cd-input${errors.outageId ? ' cd-input-err' : ''}`} value={form.outageId} onChange={handleChange('outageId')}>
                        <option value="">Select active outage</option>
                        {unresolvedOutages.map((o) => (
                          <option key={o.id} value={o.id}>#{o.id} · {o.region || 'Unknown'} · {Number(o.affectedCustomers || 0)} customers</option>
                        ))}
                      </select>
                      {errors.outageId && <div className="cd-error">{errors.outageId}</div>}
                    </div>

                    <div className="cd-field">
                      <label className="cd-label">Crew ID *</label>
                      <select className={`cd-input${errors.crewId ? ' cd-input-err' : ''}`} value={form.crewId} onChange={(e) => onSelectCrew(e.target.value)}>
                        <option value="">Select available crew</option>
                        {availableCrews.map((crew) => (
                          <option key={getCrewId(crew)} value={getCrewId(crew)}>
                            {getCrewName(crew) || `Crew ${getCrewId(crew)}`} (ID {getCrewId(crew)})
                          </option>
                        ))}
                      </select>
                      {errors.crewId && <div className="cd-error">{errors.crewId}</div>}
                    </div>

                    <div className="cd-field">
                      <label className="cd-label">Crew Name *</label>
                      <input className={`cd-input${errors.crewName ? ' cd-input-err' : ''}`} type="text" placeholder="Auto-filled from backend roster" value={form.crewName} onChange={handleChange('crewName')} />
                      {errors.crewName && <div className="cd-error">{errors.crewName}</div>}
                    </div>

                    <div className="cd-field">
                      <label className="cd-label">Status (Optional)</label>
                      <input
                        className="cd-input"
                        list="cd-observed-statuses"
                        value={form.status}
                        onChange={(e) => setForm((p) => ({ ...p, status: e.target.value.toUpperCase() }))}
                        placeholder="Leave empty to use backend default"
                      />
                      <datalist id="cd-observed-statuses">
                        {observedStatusOptions.map((status) => (
                          <option key={status} value={status} />
                        ))}
                      </datalist>
                    </div>

                    <div className="cd-field">
                      <label className="cd-label">Dispatch Time *</label>
                      <input className={`cd-input${errors.dispatchTime ? ' cd-input-err' : ''}`} type="datetime-local" value={form.dispatchTime} onChange={handleChange('dispatchTime')} />
                      {errors.dispatchTime && <div className="cd-error">{errors.dispatchTime}</div>}
                    </div>

                    <div className="cd-field">
                      <label className="cd-label">ETA (Arrival Time) *</label>
                      <input className={`cd-input${errors.estimatedTimeOfArrival ? ' cd-input-err' : ''}`} type="datetime-local" value={form.estimatedTimeOfArrival} onChange={handleChange('estimatedTimeOfArrival')} />
                      {errors.estimatedTimeOfArrival && <div className="cd-error">{errors.estimatedTimeOfArrival}</div>}
                    </div>
                  </div>

                  {form.dispatchTime && form.estimatedTimeOfArrival && (
                    <div className="cd-eta-preview">
                      <FiClock size={14} />
                      <span>
                        Dispatch → <strong>{new Date(form.dispatchTime).toLocaleTimeString()}</strong>
                        &nbsp;·&nbsp;ETA → <strong style={{ color: '#34d399' }}>{new Date(form.estimatedTimeOfArrival).toLocaleTimeString()}</strong>
                        &nbsp;·&nbsp;Travel time: <strong style={{ color: '#fbbf24' }}>
                          {Math.max(0, Math.round((new Date(form.estimatedTimeOfArrival) - new Date(form.dispatchTime)) / 60000))} min
                        </strong>
                      </span>
                    </div>
                  )}

                  <div className="cd-field">
                    <label className="cd-label">Notes</label>
                    <textarea className="cd-input cd-textarea" rows={2} value={form.notes} onChange={handleChange('notes')} placeholder="Crew dispatched to handle grid overload condition" />
                  </div>

                  <div className="cd-form-footer">
                    <button type="submit" className="cd-btn cd-btn-primary" disabled={isSubmitting}>
                      {isSubmitting
                        ? <><FiRefreshCw className="cd-spin" /> Dispatching…</>
                        : <><FiTruck /> Dispatch Crew</>}
                    </button>
                  </div>
                </form>

                {confirmation && (
                  <div className={`cd-confirm cd-confirm-${confirmation.type}`}>
                    {confirmation.type === 'success'
                      ? <FiCheckCircle size={18} style={{ flexShrink: 0 }} />
                      : <FiAlertTriangle size={18} style={{ flexShrink: 0 }} />}
                    <div>
                      <div className="cd-confirm-msg">{confirmation.message}</div>
                      {confirmation.dispatchId && (
                        <div className="cd-confirm-sub">
                          Dispatch ID: <strong>#{confirmation.dispatchId}</strong>
                          {confirmation.eta && <> · ETA: <strong>{fmtTime(confirmation.eta)}</strong></>}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="cd-panel">
                <div className="cd-panel-head">
                  <div>
                    <div className="cd-panel-title"><FiActivity /> Active Dispatch Breakdown</div>
                    <div className="cd-panel-sub">Live from GET /v1/crew-dispatches/active</div>
                  </div>
                </div>

                {chartData.length === 0 ? (
                  <div className="cd-empty-chart">
                    <FiCheckCircle size={40} color="#34d399" />
                    <div style={{ color: '#34d399', fontWeight: 700, marginTop: 12 }}>No active dispatches</div>
                    <div style={{ fontSize: 13, color: 'rgba(199,220,246,0.4)', marginTop: 4 }}>Dispatch a crew to see data here</div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={chartData} barCategoryGap="38%">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(94,230,255,0.07)" vertical={false} />
                      <XAxis dataKey="status" tick={{ fontSize: 11, fill: 'rgba(199,220,246,0.55)' }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'rgba(199,220,246,0.55)' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(94,230,255,0.04)' }} />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {chartData.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}

                {activeDispatchesSorted.length > 0 && (
                  <div className="cd-active-cards">
                    {activeDispatchesSorted.slice(0, 4).map((d, idx) => (
                      <div
                        key={d.id || idx}
                        className="cd-active-card"
                        style={{
                          borderLeft: `3px solid ${STATUS_COLORS[normalizeDispatchStatus(d)] || '#94a3b8'}`,
                          animation: `cd-slide-up 0.4s ease-out ${idx * 0.08}s both`,
                        }}
                      >
                        <div className="cd-active-card-row">
                          <span className="cd-active-crew">{d.crewName || `Crew #${d.crewId}`}</span>
                          {statusBadge(d)}
                        </div>
                        <div className="cd-active-card-row" style={{ marginTop: 6 }}>
                          <span className="cd-active-meta">Outage #{d.outageId}</span>
                          <span className="cd-active-eta">
                            <FiClock size={11} /> ETA {fmtEta(d)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="cd-panel" style={{ marginTop: 20 }}>
              <div className="cd-tabs">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`cd-tab${activeTab === t.id ? ' cd-tab-active' : ''}`}
                    onClick={() => setActiveTab(t.id)}
                  >
                    {t.label}
                    <span className={`cd-tab-count${activeTab === t.id ? ' cd-tab-count-active' : ''}`}>{t.count}</span>
                  </button>
                ))}
              </div>

              {activeTab === 'active' && (
                <DispatchTable
                  rows={activeDispatchesSorted}
                  statusBadge={statusBadge}
                  fmtTime={fmtTime}
                  fmtEta={fmtEta}
                  emptyMsg="No active dispatches"
                />
              )}

              {activeTab === 'status' && (
                <div>
                  <div className="cd-filter-bar">
                    <input
                      className="cd-input cd-filter-select"
                      list="cd-status-filter-options"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value.toUpperCase())}
                      placeholder="Type status"
                    />
                    <datalist id="cd-status-filter-options">
                      {observedStatusOptions.map((status) => (
                        <option key={status} value={status} />
                      ))}
                    </datalist>
                    <button type="button" className="cd-btn cd-btn-ghost cd-btn-sm" onClick={fetchByStatus} disabled={isRefreshing}>
                      <FiSearch size={13} /> Fetch
                    </button>
                  </div>
                  <DispatchTable rows={allDispatches} statusBadge={statusBadge} fmtTime={fmtTime} fmtEta={fmtEta} emptyMsg={statusFilter ? `No dispatches with status ${statusFilter}` : 'Enter a status above'} />
                </div>
              )}

              {activeTab === 'outage' && (
                <div>
                  <div className="cd-filter-bar">
                    <input
                      className="cd-input cd-filter-input"
                      type="number"
                      min="1"
                      placeholder="Enter Outage ID"
                      value={outageIdFilter}
                      onChange={(e) => setOutageIdFilter(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && fetchByOutage()}
                    />
                    <button type="button" className="cd-btn cd-btn-ghost cd-btn-sm" onClick={fetchByOutage} disabled={isRefreshing}>
                      <FiSearch size={13} /> Fetch
                    </button>
                  </div>
                  <DispatchTable rows={outageDispatches} statusBadge={statusBadge} fmtTime={fmtTime} fmtEta={fmtEta} emptyMsg={outageIdFilter ? `No dispatches for outage #${outageIdFilter}` : 'Enter an outage ID above'} />
                </div>
              )}

              {activeTab === 'crew' && (
                <div>
                  <div className="cd-filter-bar">
                    <select className="cd-input cd-filter-input" value={crewIdFilter} onChange={(e) => setCrewIdFilter(e.target.value)}>
                      <option value="">Select Crew ID</option>
                      {availableCrews.map((crew) => (
                        <option key={getCrewId(crew)} value={getCrewId(crew)}>
                          {getCrewName(crew) || `Crew ${getCrewId(crew)}`} (ID {getCrewId(crew)})
                        </option>
                      ))}
                    </select>
                    <button type="button" className="cd-btn cd-btn-ghost cd-btn-sm" onClick={fetchByCrew} disabled={isRefreshing}>
                      <FiSearch size={13} /> Fetch
                    </button>
                  </div>
                  <DispatchTable rows={crewDispatches} statusBadge={statusBadge} fmtTime={fmtTime} fmtEta={fmtEta} emptyMsg={crewIdFilter ? `No dispatches for crew #${crewIdFilter}` : 'Enter a crew ID above'} />
                </div>
              )}
            </div>

            <div className="cd-panel" style={{ marginTop: 16 }}>
              <div className="cd-panel-head">
                <div>
                  <div className="cd-panel-title"><FiSearch /> Dispatch Lookup</div>
                  <div className="cd-panel-sub">GET /v1/crew-dispatches/{'{id}'}</div>
                </div>
              </div>
              <div className="cd-filter-bar" style={{ paddingBottom: 16 }}>
                <input
                  className="cd-input cd-filter-input"
                  type="number"
                  min="1"
                  placeholder="Enter dispatch ID"
                  value={dispatchIdQuery}
                  onChange={(e) => setDispatchIdQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchByDispatchId()}
                />
                <button type="button" className="cd-btn cd-btn-ghost cd-btn-sm" onClick={fetchByDispatchId} disabled={isRefreshing}>
                  <FiSearch size={13} /> Lookup
                </button>
              </div>
              {dispatchLookupError && <div className="cd-lookup-error">{dispatchLookupError}</div>}
              {dispatchLookup && (
                <div className="cd-lookup-card">
                  <div className="cd-lookup-row"><span>ID</span><strong>#{dispatchLookup.id}</strong></div>
                  <div className="cd-lookup-row"><span>Crew</span><strong>{dispatchLookup.crewName || `#${dispatchLookup.crewId}`}</strong></div>
                  <div className="cd-lookup-row"><span>Outage</span><strong>#{dispatchLookup.outageId}</strong></div>
                  <div className="cd-lookup-row"><span>Status</span>{statusBadge(dispatchLookup)}</div>
                  <div className="cd-lookup-row"><span>Dispatch Time</span><strong>{fmtTime(dispatchLookup.dispatchTime)}</strong></div>
                  <div className="cd-lookup-row"><span>ETA</span><strong>{fmtTime(dispatchLookup.estimatedTimeOfArrival)}</strong></div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  function DispatchTable({ rows, statusBadge, fmtTime, fmtEta, emptyMsg }) {
    return (
      <div className="cd-table-wrap">
        <table className="cd-table">
          <thead>
            <tr>
              <th>#ID</th>
              <th>Crew</th>
              <th>Crew ID</th>
              <th>Outage</th>
              <th>Status</th>
              <th>Dispatch Time</th>
              <th>ETA</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d, idx) => (
              <tr key={d.id || idx} style={{ animation: `cd-slide-up 0.35s ease-out ${idx * 0.06}s both` }}>
                <td><span className="cd-id">#{d.id}</span></td>
                <td className="cd-crew-name">{d.crewName || '—'}</td>
                <td className="cd-mono">{d.crewId}</td>
                <td><span className="cd-outage-ref">#{d.outageId}</span></td>
                <td>{statusBadge(d)}</td>
                <td className="cd-ts">{fmtTime(d.dispatchTime)}</td>
                <td><span style={{ color: '#34d399', fontWeight: 600, fontSize: 13 }}>{fmtEta(d)}</span></td>
                <td className="cd-notes">{d.notes || '—'}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="cd-empty-row">{emptyMsg}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }
