import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts';
import {
  FiAlertTriangle, FiTrendingUp, FiShield, FiCheckSquare,
  FiDownload, FiRefreshCw, FiActivity, FiFileText, FiZap,
} from 'react-icons/fi';
import NotificationBell from './NotificationBell';
import { analyticsService } from '../../services/api';
import './Dashboard.css';

function SectionHeader({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="reg-section-header">
      <div className="reg-section-header-left">
        {Icon && <span className="reg-section-icon"><Icon size={15} /></span>}
        <div>
          <h3 className="reg-section-title">{title}</h3>
          {subtitle && <p className="reg-section-subtitle">{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

function KpiCard({ value, label, unit, breach }) {
  return (
    <div className={`reg-kpi-card${breach ? ' reg-kpi-breach' : ''}`}>
      <div className="reg-kpi-value">{value}</div>
      <div className="reg-kpi-label">{label}</div>
      {unit && <div className="reg-kpi-unit">{unit}</div>}
      {breach && <span className="reg-kpi-badge">⚠ BREACH</span>}
    </div>
  );
}

const REG_ALERTS = [
  { id: 1, type: 'critical', title: 'SAIDI threshold breached', body: 'Monthly SAIDI exceeds regulatory limit of 120 min', time: '30 min ago' },
  { id: 2, type: 'warning',  title: 'Safety incident reported', body: 'Near-miss at Substation SUB-003. Review required.', time: '2 hr ago' },
  { id: 3, type: 'warning',  title: 'Regulatory report due', body: 'Q1 2026 reliability report due in 3 days', time: '1 day ago' },
  { id: 4, type: 'info',     title: 'Report generated', body: 'Annual CAIDI report for 2025 successfully exported', time: '2 days ago' },
];

const reportColor = {
  DRAFT: '#fbbf24',
  SUBMITTED: '#34d399',
  PENDING: '#5ee6ff',
  OVERDUE: '#f87171',
};

const unwrap = (r) => r?.data?.data ?? r?.data ?? [];

const toList = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.content)) return payload.content;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
};

const toDate = (v) => {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

const inPeriod = (dateValue, period) => {
  if (period === 'ALL') return true;
  const d = toDate(dateValue);
  if (!d) return false;
  const now = new Date();
  const days = period === '7D' ? 7 : period === '30D' ? 30 : 90;
  const from = new Date(now);
  from.setDate(now.getDate() - days);
  return d >= from && d <= now;
};

const csvEscape = (value) => {
  const v = value == null ? '' : String(value);
  return `"${v.replace(/"/g, '""')}"`;
};

const downloadCsv = (filename, rows) => {
  if (!rows?.length) return;
  const columns = Object.keys(rows[0]);
  const data = [
    columns.join(','),
    ...rows.map((r) => columns.map((c) => csvEscape(r[c])).join(',')),
  ].join('\n');
  const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export default function RegulatoryDashboard() {
  const navigate = useNavigate();
  const [periodFilter, setPeriodFilter] = useState('30D');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [reliabilityRows, setReliabilityRows] = useState([]);
  const [safetyRows, setSafetyRows] = useState([]);
  const [reportRows, setReportRows] = useState([]);

  const [safetyForm, setSafetyForm] = useState({ workOrderId: '', incidentType: 'NEAR_MISS', severity: 'LOW', description: '' });
  const [safetySubmitting, setSafetySubmitting] = useState(false);

  const [reportForm, setReportForm] = useState({ reportType: 'SAFETY', period: 'Q2-2026', reportPayload: '' });
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [rel, safe, rep] = await Promise.allSettled([
        analyticsService.getReliability(),
        analyticsService.getSafety(),
        analyticsService.getReports(),
      ]);

      setReliabilityRows(rel.status === 'fulfilled' ? toList(unwrap(rel.value)) : []);
      setSafetyRows(safe.status === 'fulfilled' ? toList(unwrap(safe.value)) : []);
      setReportRows(rep.status === 'fulfilled' ? toList(unwrap(rep.value)) : []);

      if (rel.status === 'rejected' && safe.status === 'rejected' && rep.status === 'rejected') {
        setError('Unable to load analytics data.');
      }
    } catch (ex) {
      setError(ex?.response?.data?.message || 'Unable to load analytics data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const filteredReliability = useMemo(() => reliabilityRows.filter((r) => inPeriod(r.generatedDate, periodFilter)).sort((a, b) => new Date(a.generatedDate) - new Date(b.generatedDate)), [reliabilityRows, periodFilter]);
  const filteredSafety = useMemo(() => safetyRows.filter((r) => inPeriod(r.reportedDate, periodFilter)).sort((a, b) => new Date(b.reportedDate) - new Date(a.reportedDate)), [safetyRows, periodFilter]);
  const filteredReports = useMemo(() => reportRows.filter((r) => inPeriod(r.generatedDate, periodFilter)).sort((a, b) => new Date(b.generatedDate) - new Date(a.generatedDate)), [reportRows, periodFilter]);

  const latest = filteredReliability[filteredReliability.length - 1] || null;
  const avg = (rows, key) => (rows.length ? rows.reduce((sum, r) => sum + (Number(r[key]) || 0), 0) / rows.length : 0);

  const kpis = useMemo(() => ({
    saidi: latest?.saidi ?? avg(filteredReliability, 'saidi'),
    saifi: latest?.saifi ?? avg(filteredReliability, 'saifi'),
    caidi: latest?.caidi ?? avg(filteredReliability, 'caidi'),
    highSeveritySafety: filteredSafety.filter((s) => String(s.severity || '').toUpperCase() === 'HIGH').length,
    ltiCount: filteredSafety.filter((s) => String(s.incidentType || '').toUpperCase() === 'LTI').length,
    draftReports: filteredReports.filter((r) => String(r.status || '').toUpperCase() === 'DRAFT').length,
  }), [latest, filteredReliability, filteredSafety, filteredReports]);

  const trendData = useMemo(() => filteredReliability.map((r) => {
    const d = toDate(r.generatedDate);
    return {
      ...r,
      label: d ? `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` : 'N/A',
      saidi: Number(r.saidi) || 0,
      saifi: Number(r.saifi) || 0,
      caidi: Number(r.caidi) || 0,
    };
  }), [filteredReliability]);

  const metricRows = [
    { label: 'SAIDI (min/customer)', value: kpis.saidi, limit: 120 },
    { label: 'SAIFI (interruptions)', value: kpis.saifi, limit: 1.5 },
    { label: 'CAIDI (min/interruption)', value: kpis.caidi, limit: 100 },
  ].map((m) => ({ ...m, breach: Number(m.value) > Number(m.limit) }));

  const severityColor = { LOW: '#34d399', MEDIUM: '#fbbf24', HIGH: '#fb923c', CRITICAL: '#f87171' };

  const submitSafety = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!safetyForm.workOrderId || Number.isNaN(Number(safetyForm.workOrderId))) {
      setError('Work Order ID must be a valid number.');
      return;
    }
    if (!safetyForm.incidentType.trim() || !safetyForm.severity || !safetyForm.description.trim()) {
      setError('Incident Type, Severity and Description are required.');
      return;
    }
    setSafetySubmitting(true);
    try {
      await analyticsService.createSafety({
        workOrderId: Number(safetyForm.workOrderId),
        incidentType: safetyForm.incidentType.trim(),
        severity: safetyForm.severity,
        description: safetyForm.description.trim(),
      });
      setSafetyForm({ workOrderId: '', incidentType: 'NEAR_MISS', severity: 'LOW', description: '' });
      setSuccess('Safety event saved successfully.');
      await fetchAll();
      setTimeout(() => setSuccess(''), 2200);
    } catch (ex) {
      setError(ex?.response?.data?.message || 'Failed to save safety event.');
    } finally {
      setSafetySubmitting(false);
    }
  };

  const createReportDraft = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!reportForm.period.trim() || !reportForm.reportType.trim()) {
      setError('Report Type and Reporting Period are required.');
      return;
    }
    setReportSubmitting(true);
    try {
      await analyticsService.createReportDraft({
        reportType: reportForm.reportType.trim(),
        period: reportForm.period.trim(),
        reportPayload: reportForm.reportPayload.trim() || null,
      });
      setSuccess('Regulatory draft report generated successfully.');
      setReportForm((p) => ({ ...p, reportPayload: '' }));
      await fetchAll();
      setTimeout(() => setSuccess(''), 2200);
    } catch (ex) {
      setError(ex?.response?.data?.message || 'Failed to generate report draft.');
    } finally {
      setReportSubmitting(false);
    }
  };

  const submitReport = async (row) => {
    setError('');
    setSuccess('');
    try {
      await analyticsService.submitReport(row.reportId, { ...row, status: 'SUBMITTED' });
      setSuccess(`Report ${row.reportId} submitted successfully.`);
      await fetchAll();
      setTimeout(() => setSuccess(''), 2200);
    } catch (ex) {
      setError(ex?.response?.data?.message || 'Failed to submit report.');
    }
  };

  const exportKpis = () => {
    const rows = metricRows.map((m) => ({ metric: m.label, value: Number(m.value).toFixed(3), limit: m.limit, status: m.breach ? 'BREACH' : 'OK', periodFilter }));
    downloadCsv('utilitrack-reliability-kpis.csv', rows);
  };

  const exportReports = () => {
    const rows = filteredReports.map((r) => ({ reportId: r.reportId, reportType: r.reportType, period: r.period, status: r.status, generatedDate: r.generatedDate, reportPayload: r.reportPayload }));
    downloadCsv('utilitrack-regulatory-reports.csv', rows);
  };

  const saidiBreach = Number(kpis.saidi) > 120;

  return (
    <section className="dashboard-panel regulatory-dashboard reg-panel">

      {/* Header */}
      <div className="reg-header">
        <div className="reg-header-left">
          <div className="reg-header-eyebrow"><FiActivity size={12} /><span>Regulatory Analyst</span></div>
          <h1 className="reg-header-title">Reliability, Safety &amp; Regulatory Analytics</h1>
          <p className="reg-header-desc">View reliability KPIs, manage safety events, and generate regulatory compliance reports.</p>
        </div>
        <div className="reg-header-right">
          <NotificationBell alerts={REG_ALERTS} />
          <div className={`reg-status-chip ${saidiBreach ? 'reg-status-breach' : 'reg-status-ok'}`}>
            {saidiBreach ? <FiAlertTriangle size={12} /> : <FiZap size={12} />}
            <span>{saidiBreach ? 'SAIDI BREACH' : 'KPIs Within Limit'}</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="reg-toolbar">
        <div className="reg-toolbar-left">
          <label className="reg-label">Period</label>
          <select className="reg-select" value={periodFilter} onChange={(e) => setPeriodFilter(e.target.value)}>
            <option value="7D">Last 7 days</option>
            <option value="30D">Last 30 days</option>
            <option value="90D">Last 90 days</option>
            <option value="ALL">All time</option>
          </select>
          <span className="reg-meta-chip"><FiTrendingUp size={10} /> {filteredReliability.length} reliability</span>
          <span className="reg-meta-chip"><FiShield size={10} /> {filteredSafety.length} safety</span>
          <span className="reg-meta-chip"><FiFileText size={10} /> {filteredReports.length} reports</span>
        </div>
        <div className="reg-toolbar-right">
          <button className="reg-btn reg-btn-ghost" onClick={fetchAll} disabled={loading}><FiRefreshCw size={12} /> {loading ? 'Loading…' : 'Refresh'}</button>
          <button className="reg-btn reg-btn-ghost" onClick={exportKpis}><FiDownload size={12} /> Export KPIs</button>
          <button className="reg-btn reg-btn-green" onClick={exportReports}><FiDownload size={12} /> Export Reports</button>
        </div>
      </div>

      {error   && <div className="reg-alert reg-alert-error"><FiAlertTriangle size={13} /> {error}</div>}
      {success && <div className="reg-alert reg-alert-success"><FiCheckSquare size={13} /> {success}</div>}

      {/* KPI Row */}
      <div className="reg-kpi-row">
        <KpiCard value={Number(kpis.saidi || 0).toFixed(2)} label="SAIDI" unit="min/customer · limit 120" breach={Number(kpis.saidi) > 120} />
        <KpiCard value={Number(kpis.saifi || 0).toFixed(2)} label="SAIFI" unit="interruptions · limit 1.5" breach={Number(kpis.saifi) > 1.5} />
        <KpiCard value={Number(kpis.caidi || 0).toFixed(2)} label="CAIDI" unit="min/interruption · limit 100" breach={Number(kpis.caidi) > 100} />
        <KpiCard value={kpis.highSeveritySafety} label="High Severity Events" />
        <KpiCard value={kpis.ltiCount} label="LTI Events" />
        <KpiCard value={kpis.draftReports} label="Draft Reports" />
      </div>

      {/* Charts */}
      <div className="reg-split reg-split-wide">
        <div className="reg-card">
          <SectionHeader icon={FiActivity} title="SAIDI / SAIFI / CAIDI Trend" subtitle={`${trendData.length} data points · selected period`} />
          {trendData.length === 0 ? (
            <div className="reg-empty">{loading ? 'Loading trend data…' : 'No reliability data for selected period.'}</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trendData} margin={{ left: -18, right: 4, top: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(94,230,255,0.08)" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'rgba(199,220,246,0.55)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'rgba(199,220,246,0.55)' }} />
                  <Tooltip contentStyle={{ background: '#0e1528', border: '1px solid rgba(94,230,255,0.2)', borderRadius: 10, fontSize: 12 }} labelStyle={{ color: '#e7f6ff' }} />
                  <Legend wrapperStyle={{ fontSize: '0.74rem' }} />
                  <ReferenceLine y={120} stroke="#f87171" strokeDasharray="4 2" label={{ value: 'SAIDI limit', fill: '#f87171', fontSize: 10 }} />
                  <Line type="monotone" dataKey="saidi" stroke="#f87171" strokeWidth={2} dot={{ r: 2 }} name="SAIDI" />
                  <Line type="monotone" dataKey="saifi" stroke="#fbbf24" strokeWidth={2} dot={{ r: 2 }} name="SAIFI" />
                  <Line type="monotone" dataKey="caidi" stroke="#5ee6ff" strokeWidth={2} dot={{ r: 2 }} name="CAIDI" />
                </LineChart>
              </ResponsiveContainer>
              <div className="reg-chart-legend">
                <span><i style={{ background: '#f87171' }} /> SAIDI 120</span>
                <span><i style={{ background: '#fbbf24' }} /> SAIFI 1.5</span>
                <span><i style={{ background: '#5ee6ff' }} /> CAIDI 100</span>
              </div>
            </>
          )}
        </div>
        <div className="reg-card">
          <SectionHeader icon={FiTrendingUp} title="KPI vs Regulatory Limit" />
          <div className="reg-metric-list">
            {metricRows.map((m) => {
              const pct = Math.min((Number(m.value || 0) / Number(m.limit)) * 100, 100);
              const color = m.breach ? '#f87171' : '#34d399';
              return (
                <div key={m.label} className="reg-metric-row">
                  <div className="reg-metric-head">
                    <span className="reg-metric-name">{m.label}</span>
                    <span className="reg-metric-val" style={{ color }}>{Number(m.value || 0).toFixed(2)}</span>
                  </div>
                  <div className="reg-bar-track"><div className="reg-bar-fill" style={{ width: `${pct}%`, background: color }} /></div>
                  <div className="reg-metric-limit">Limit: {m.limit}{m.breach && <span className="reg-breach-tag"> — BREACH</span>}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Safety Events */}
      <SectionHeader icon={FiShield} title="Safety Events" subtitle="Log and track workplace safety incidents for compliance reporting." />
      <div className="reg-split">
        <div className="reg-card">
          <h4 className="reg-card-title">Log New Safety Event</h4>
          <form onSubmit={submitSafety} className="reg-form">
            <div className="reg-form-row">
              <div className="reg-form-group">
                <label className="reg-label">Work Order ID *</label>
                <input className="reg-input" type="number" placeholder="e.g. 42" value={safetyForm.workOrderId} onChange={(e) => setSafetyForm((p) => ({ ...p, workOrderId: e.target.value }))} />
              </div>
              <div className="reg-form-group">
                <label className="reg-label">Incident Type</label>
                <select className="reg-input" value={safetyForm.incidentType} onChange={(e) => setSafetyForm((p) => ({ ...p, incidentType: e.target.value }))}>
                  <option value="NEAR_MISS">Near Miss</option>
                  <option value="FIRST_AID">First Aid</option>
                  <option value="LTI">LTI</option>
                </select>
              </div>
            </div>
            <div className="reg-form-group">
              <label className="reg-label">Severity</label>
              <select className="reg-input" value={safetyForm.severity} onChange={(e) => setSafetyForm((p) => ({ ...p, severity: e.target.value }))}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
            <div className="reg-form-group">
              <label className="reg-label">Description *</label>
              <textarea className="reg-input reg-textarea" rows={3} placeholder="Describe the safety event…" value={safetyForm.description} onChange={(e) => setSafetyForm((p) => ({ ...p, description: e.target.value }))} />
            </div>
            <button type="submit" className="reg-btn reg-btn-primary" disabled={safetySubmitting}>{safetySubmitting ? 'Saving…' : 'Save Safety Event'}</button>
          </form>
        </div>
        <div className="reg-card">
          <h4 className="reg-card-title">Safety Event History</h4>
          {filteredSafety.length === 0 ? (
            <div className="reg-empty">{loading ? 'Loading…' : 'No safety events for selected period.'}</div>
          ) : (
            <div className="reg-scroll-list">
              {filteredSafety.slice(0, 10).map((s) => {
                const sev = String(s.severity || '').toUpperCase() || 'LOW';
                const col = severityColor[sev] || '#94a3b8';
                return (
                  <div key={s.recordId || `${s.workOrderId}-${s.reportedDate}`} className="reg-event-item">
                    <div className="reg-event-header">
                      <span className="reg-event-id">WO #{s.workOrderId}</span>
                      <span className="reg-tag" style={{ color: col, borderColor: `${col}55`, background: `${col}18` }}>{sev}</span>
                    </div>
                    <div className="reg-event-type">{s.incidentType}</div>
                    <div className="reg-event-desc">{(s.description || 'No description').slice(0, 120)}</div>
                    <div className="reg-event-date">{s.reportedDate ? new Date(s.reportedDate).toLocaleString() : '—'}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Regulatory Reports */}
      <SectionHeader icon={FiFileText} title="Regulatory Report Generation" subtitle="Generate draft compliance reports and submit for review." />
      <div className="reg-split">
        <div className="reg-card">
          <h4 className="reg-card-title">Generate Draft Report</h4>
          <form onSubmit={createReportDraft} className="reg-form">
            <div className="reg-form-row">
              <div className="reg-form-group">
                <label className="reg-label">Report Type</label>
                <select className="reg-input" value={reportForm.reportType} onChange={(e) => setReportForm((p) => ({ ...p, reportType: e.target.value }))}>
                  <option value="SAFETY">Safety</option>
                  <option value="RELIABILITY">Reliability</option>
                </select>
              </div>
              <div className="reg-form-group">
                <label className="reg-label">Period *</label>
                <input className="reg-input" placeholder="e.g. Q2-2026" value={reportForm.period} onChange={(e) => setReportForm((p) => ({ ...p, period: e.target.value }))} />
              </div>
            </div>
            <div className="reg-form-group">
              <label className="reg-label">Payload JSON <span className="reg-optional">(optional)</span></label>
              <textarea className="reg-input reg-textarea" rows={3} placeholder="Optional JSON payload…" value={reportForm.reportPayload} onChange={(e) => setReportForm((p) => ({ ...p, reportPayload: e.target.value }))} />
            </div>
            <button type="submit" className="reg-btn reg-btn-green" disabled={reportSubmitting}>{reportSubmitting ? 'Generating…' : 'Generate Draft Report'}</button>
          </form>
        </div>
        <div className="reg-card">
          <h4 className="reg-card-title">Generated Reports</h4>
          {filteredReports.length === 0 ? (
            <div className="reg-empty">{loading ? 'Loading…' : 'No reports for selected period.'}</div>
          ) : (
            <div className="reg-scroll-list">
              {filteredReports.slice(0, 12).map((r) => {
                const status = String(r.status || 'DRAFT').toUpperCase();
                const col = reportColor[status] || '#94a3b8';
                const canSubmit = status === 'DRAFT';
                return (
                  <div key={r.reportId || `${r.reportType}-${r.generatedDate}`} className="reg-event-item">
                    <div className="reg-event-header">
                      <span className="reg-event-id">#{r.reportId} · {r.reportType}</span>
                      <span className="reg-tag" style={{ color: col, borderColor: `${col}55`, background: `${col}18` }}>{status}</span>
                    </div>
                    <div className="reg-event-type">Period: {r.period || '—'}</div>
                    <div className="reg-event-date">{r.generatedDate ? new Date(r.generatedDate).toLocaleString() : '—'}</div>
                    {r.reportPayload && (
                      <details className="reg-payload-details">
                        <summary>View payload</summary>
                        <pre className="reg-payload-pre">{r.reportPayload}</pre>
                      </details>
                    )}
                    <div className="reg-event-actions">
                      <button className="reg-btn reg-btn-xs reg-btn-ghost" onClick={() => downloadCsv(`report-${r.reportId || 'item'}.csv`, [{ ...r }])}><FiDownload size={11} /> Download</button>
                      {canSubmit && <button className="reg-btn reg-btn-xs reg-btn-green" onClick={() => submitReport(r)}><FiCheckSquare size={11} /> Submit</button>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Access */}
      <SectionHeader icon={FiCheckSquare} title="Authorized Modules" />
      <div className="reg-modules">
        {[
          { path: '/reliability-analytics', icon: FiTrendingUp, label: 'Reliability KPIs', desc: 'Monitor SAIDI/SAIFI/CAIDI trends, limits, and KPI export.', color: '#5ee6ff' },
          { path: '/safety-reports', icon: FiShield, label: 'Safety Events', desc: 'Record safety incidents with severity and complete history.', color: '#fbbf24' },
          { path: '/regulatory-reports', icon: FiCheckSquare, label: 'Regulatory Reports', desc: 'Generate drafts, submit compliance reports, and download.', color: '#34d399' },
        ].map((card) => (
          <article key={card.label} className="reg-module-card" style={{ '--card-accent': card.color }} onClick={() => navigate(card.path)} role="button" tabIndex={0} onKeyPress={(e) => e.key === 'Enter' && navigate(card.path)}>
            <div className="reg-module-icon" style={{ color: card.color }}><card.icon size={20} /></div>
            <h3 className="reg-module-title">{card.label}</h3>
            <p className="reg-module-desc">{card.desc}</p>
            <span className="reg-module-link">Open →</span>
          </article>
        ))}
      </div>

      <div className="reg-scope-notice">
        <FiAlertTriangle size={13} />
        <span><strong>Role scope enforced:</strong> Reliability KPIs, Safety Events, and Regulatory Reports access only.</span>
      </div>

    </section>
  );
}