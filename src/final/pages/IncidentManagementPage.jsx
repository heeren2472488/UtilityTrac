import React, { useState, useEffect, useMemo } from 'react';
import {
  FiPlus, FiRefreshCw, FiCheckCircle, FiXCircle, FiAlertTriangle,
  FiFileText, FiShield, FiActivity, FiSearch, FiFilter,
  FiChevronDown, FiChevronUp, FiClipboard,
} from 'react-icons/fi';
import { incidentReportService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './IncidentManagementPage.css';

const EMPTY_FORM = {
  outageId: '',
  analystId: '',
  severityLevel: '',
  incidentType: '',
  rootCause: '',
  safetyDetails: '',
  correctiveActions: '',
  description: '',
  status: 'DRAFT',
};

const INCIDENT_META_KEY = 'incident-management-meta-v1';

const SEVERITY_COLORS = {
  CRITICAL: '#f87171',
  HIGH:     '#fb923c',
  MEDIUM:   '#fbbf24',
  LOW:      '#34d399',
};

const STATUS_COLORS = {
  DRAFT:     '#94a3b8',
  SUBMITTED: '#5ee6ff',
  APPROVED:  '#34d399',
  REJECTED:  '#f87171',
  CLOSED:    '#a78bfa',
};

const toList = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const unwrap = (r) => r?.data?.data ?? r?.data ?? null;

const readIncidentMeta = () => {
  try {
    const raw = localStorage.getItem(INCIDENT_META_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const writeIncidentMeta = (value) => {
  localStorage.setItem(INCIDENT_META_KEY, JSON.stringify(value));
};

export default function IncidentManagementPage() {
  const { user } = useAuth();
  const [incidents, setIncidents]   = useState([]);
  const [loading, setLoading]       = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [formError, setFormError]   = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionMsg, setActionMsg]   = useState({ id: null, text: '', ok: true });
  const [search, setSearch]         = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [expandedId, setExpandedId] = useState(null);
  const [statusTab, setStatusTab]   = useState('ALL');
  const [attachmentFiles, setAttachmentFiles] = useState([]);
  const [incidentMeta, setIncidentMeta] = useState(() => readIncidentMeta());
  const isAdmin = (user?.roles || []).includes('ADMIN');

  const fetchAll = async () => {
    setIsRefreshing(true);
    try {
      const res = await incidentReportService.getAll();
      const raw = unwrap(res);
      setIncidents(toList(raw));
    } catch {
      setIncidents([]);
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchAll();
  }, []);

  const validate = () => {
    if (!form.outageId || isNaN(Number(form.outageId))) return 'Outage ID must be a valid number.';
    if (!form.analystId || isNaN(Number(form.analystId))) return 'Analyst ID must be a valid number.';
    if (!form.severityLevel) return 'Severity Level is required.';
    if (!form.incidentType.trim()) return 'Type is required.';
    if (!form.rootCause.trim()) return 'Root Cause is required.';
    if (!form.description.trim()) return 'Description is required.';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setFormError(err); return; }
    setFormError('');
    setSubmitting(true);
    try {
      const payload = {
        outageId:          Number(form.outageId),
        analystId:         Number(form.analystId),
        severityLevel:     form.severityLevel,
        incidentType:      form.incidentType.trim(),
        rootCause:         form.rootCause.trim(),
        safetyDetails:     form.safetyDetails.trim(),
        correctiveActions: form.correctiveActions.trim(),
        description:       form.description.trim(),
        status:            form.status,
      };
      const res = await incidentReportService.create(payload);
      const created = unwrap(res);
      if (created?.id) {
        const nextMeta = {
          ...incidentMeta,
          [String(created.id)]: {
            incidentType: form.incidentType.trim(),
            attachments: attachmentFiles.map((f) => f.name),
          },
        };
        setIncidentMeta(nextMeta);
        writeIncidentMeta(nextMeta);
      }
      setFormSuccess('Incident report created successfully!');
      setForm(EMPTY_FORM);
      setAttachmentFiles([]);
      setShowForm(false);
      fetchAll();
      setTimeout(() => setFormSuccess(''), 4000);
    } catch (ex) {
      const msg = ex?.response?.data?.message || ex?.response?.data || ex.message || 'Create failed.';
      setFormError(String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await incidentReportService.approve(id);
      setActionMsg({ id, text: 'Approved successfully!', ok: true });
      fetchAll();
      setTimeout(() => setActionMsg({ id: null, text: '', ok: true }), 3000);
    } catch (ex) {
      const msg = ex?.response?.data?.message || ex?.response?.data || ex.message || 'Approve failed.';
      setActionMsg({ id, text: String(msg), ok: false });
      setTimeout(() => setActionMsg({ id: null, text: '', ok: true }), 4000);
    }
  };

  const handleReject = async (id) => {
    try {
      await incidentReportService.reject(id);
      setActionMsg({ id, text: 'Rejected successfully.', ok: true });
      fetchAll();
      setTimeout(() => setActionMsg({ id: null, text: '', ok: true }), 3000);
    } catch (ex) {
      const msg = ex?.response?.data?.message || ex?.response?.data || ex.message || 'Reject failed.';
      setActionMsg({ id, text: String(msg), ok: false });
      setTimeout(() => setActionMsg({ id: null, text: '', ok: true }), 4000);
    }
  };

  const statusOptions = useMemo(() => {
    const seen = new Set(incidents.map((i) => i.status).filter(Boolean));
    return ['ALL', ...Array.from(seen)];
  }, [incidents]);

  const filtered = useMemo(() => {
    return incidents.filter((inc) => {
      const matchStatusTab = statusTab === 'ALL' || inc.status === statusTab;
      const matchStatusDropdown = filterStatus === 'ALL' || inc.status === filterStatus;
      const q = search.toLowerCase();
      const matchSearch = !q ||
        String(inc.id).includes(q) ||
        (inc.description || '').toLowerCase().includes(q) ||
        (inc.rootCause || '').toLowerCase().includes(q) ||
        (inc.severityLevel || '').toLowerCase().includes(q);
      return matchStatusTab && matchStatusDropdown && matchSearch;
    });
  }, [incidents, filterStatus, search, statusTab]);

  const stats = useMemo(() => ({
    total:    incidents.length,
    draft:    incidents.filter((i) => i.status === 'DRAFT').length,
    approved: incidents.filter((i) => i.status === 'APPROVED').length,
    rejected: incidents.filter((i) => i.status === 'REJECTED').length,
    critical: incidents.filter((i) => i.severityLevel === 'CRITICAL').length,
  }), [incidents]);

  return (
    <div className="im-page">
      {/* HERO */}
      <div className="im-hero">
        <div className="im-hero-glow" />
        <div className="im-hero-content">
          <div>
            <div className="im-hero-tag">🛡️ Regulatory Analyst · Incident Documentation</div>
            <h1 className="im-hero-title">Incident Management</h1>
            <p className="im-hero-desc">
              Record and review incident reports to document safety issues with complete severity and type tracking.
            </p>
          </div>
          <div className="im-hero-actions">
            <button className="im-btn im-btn-ghost" onClick={fetchAll} disabled={isRefreshing}>
              <FiRefreshCw className={isRefreshing ? 'im-spin' : ''} />
              {isRefreshing ? 'Refreshing…' : 'Refresh'}
            </button>
            <button className="im-btn im-btn-primary" onClick={() => { setShowForm((s) => !s); setFormError(''); }}>
              <FiPlus /> {showForm ? 'Cancel' : 'New Incident Report'}
            </button>
          </div>
        </div>
      </div>

      {/* KPI STRIP */}
      <div className="im-kpi-strip">
        {[
          { label: 'Total Reports',  value: stats.total,    color: '#5ee6ff', icon: <FiFileText /> },
          { label: 'Draft',          value: stats.draft,    color: '#94a3b8', icon: <FiClipboard /> },
          { label: 'Approved',       value: stats.approved, color: '#34d399', icon: <FiCheckCircle /> },
          { label: 'Rejected',       value: stats.rejected, color: '#f87171', icon: <FiXCircle /> },
          { label: 'Critical',       value: stats.critical, color: '#fb923c', icon: <FiAlertTriangle /> },
        ].map((k) => (
          <div key={k.label} className="im-kpi-card" style={{ '--kpi-color': k.color }}>
            <div className="im-kpi-icon">{k.icon}</div>
            <div className="im-kpi-value">{k.value}</div>
            <div className="im-kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      {/* SUCCESS BANNER */}
      {formSuccess && (
        <div className="im-banner im-banner-ok">
          <FiCheckCircle /> {formSuccess}
        </div>
      )}

      {/* CREATE FORM */}
      {showForm && (
        <div className="im-panel im-form-panel">
          <div className="im-panel-head">
            <div>
              <div className="im-panel-title"><FiPlus /> New Incident Report</div>
              <div className="im-panel-sub">Submit a new incident report with mandatory severity, type, and optional attachments</div>
            </div>
          </div>
          <form className="im-form" onSubmit={handleSubmit} noValidate>
            <div className="im-form-grid">
              <label className="im-label">
                <span>Outage ID <em>*</em></span>
                <input
                  type="number" className="im-input" placeholder="e.g. 5"
                  value={form.outageId}
                  onChange={(e) => setForm((f) => ({ ...f, outageId: e.target.value }))}
                />
              </label>
              <label className="im-label">
                <span>Analyst ID <em>*</em></span>
                <input
                  type="number" className="im-input" placeholder="e.g. 505"
                  value={form.analystId}
                  onChange={(e) => setForm((f) => ({ ...f, analystId: e.target.value }))}
                />
              </label>
              <label className="im-label">
                <span>Severity Level <em>*</em></span>
                <select
                  className="im-input"
                  value={form.severityLevel}
                  onChange={(e) => setForm((f) => ({ ...f, severityLevel: e.target.value }))}
                >
                  <option value="">Select severity</option>
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </label>
              <label className="im-label">
                <span>Incident Type <em>*</em></span>
                <input
                  className="im-input"
                  placeholder="e.g. Safety, Electrical, Environmental"
                  value={form.incidentType}
                  onChange={(e) => setForm((f) => ({ ...f, incidentType: e.target.value }))}
                />
              </label>
              <label className="im-label">
                <span>Initial Status</span>
                <select
                  className="im-input"
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="SUBMITTED">SUBMITTED</option>
                </select>
              </label>
            </div>

            <label className="im-label im-label-full">
              <span>Description <em>*</em></span>
              <textarea
                className="im-input im-textarea" rows={2} placeholder="Brief description of the incident…"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </label>

            <label className="im-label im-label-full">
              <span>Root Cause <em>*</em></span>
              <textarea
                className="im-input im-textarea" rows={2} placeholder="Identified root cause…"
                value={form.rootCause}
                onChange={(e) => setForm((f) => ({ ...f, rootCause: e.target.value }))}
              />
            </label>

            <div className="im-form-grid">
              <label className="im-label">
                <span>Safety Details</span>
                <textarea
                  className="im-input im-textarea" rows={2} placeholder="Any safety hazards or precautions…"
                  value={form.safetyDetails}
                  onChange={(e) => setForm((f) => ({ ...f, safetyDetails: e.target.value }))}
                />
              </label>
              <label className="im-label">
                <span>Corrective Actions</span>
                <textarea
                  className="im-input im-textarea" rows={2} placeholder="Steps taken or planned…"
                  value={form.correctiveActions}
                  onChange={(e) => setForm((f) => ({ ...f, correctiveActions: e.target.value }))}
                />
              </label>
            </div>

            <label className="im-label im-label-full">
              <span>Attachments</span>
              <input
                type="file"
                className="im-input"
                multiple
                onChange={(e) => setAttachmentFiles(Array.from(e.target.files || []))}
              />
              {attachmentFiles.length > 0 && (
                <small style={{ color: 'rgba(199,220,246,0.65)' }}>
                  {attachmentFiles.length} file(s): {attachmentFiles.map((f) => f.name).join(', ')}
                </small>
              )}
            </label>

            {formError && (
              <div className="im-banner im-banner-err">
                <FiAlertTriangle /> {formError}
              </div>
            )}

            <div className="im-form-footer">
              <button type="button" className="im-btn im-btn-ghost" onClick={() => { setShowForm(false); setFormError(''); setForm(EMPTY_FORM); }}>
                Cancel
              </button>
              <button type="submit" className="im-btn im-btn-primary" disabled={submitting}>
                {submitting ? 'Submitting…' : <><FiShield /> Submit Report</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STATUS TABS */}
      <div className="im-tabs">
        {['ALL', 'DRAFT', 'APPROVED', 'REJECTED'].map((tab) => {
          const count = tab === 'ALL' ? incidents.length : incidents.filter((i) => i.status === tab).length;
          return (
            <button
              key={tab}
              className={`im-tab ${statusTab === tab ? 'im-tab-active' : ''}`}
              onClick={() => setStatusTab(tab)}
            >
              {tab} <span className="im-tab-count">{count}</span>
            </button>
          );
        })}
      </div>

      {/* FILTER BAR */}
      <div className="im-filter-bar">
        <div className="im-search-wrap">
          <FiSearch className="im-search-icon" />
          <input
            className="im-search"
            placeholder="Search by ID, description, root cause, severity…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="im-filter-wrap">
          <FiFilter />
          <select className="im-filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            {statusOptions.map((s) => (
              <option key={s} value={s}>{s === 'ALL' ? 'All Statuses' : s}</option>
            ))}
          </select>
        </div>
        <div className="im-filter-count">
          {filtered.length} / {incidents.length} report{incidents.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* INCIDENT LIST */}
      <div className="im-panel">
        <div className="im-panel-head">
          <div>
            <div className="im-panel-title"><FiActivity /> Incident Reports</div>
            <div className="im-panel-sub">Click a row to expand details · Approve or Reject pending reports</div>
          </div>
        </div>

        {loading ? (
          <div className="im-loading">
            <div className="im-spinner" />
            <span>Loading incident reports…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="im-empty">
            <FiShield size={44} />
            <div>No incident reports found</div>
            <p>{incidents.length === 0 ? 'Create the first report using the button above.' : 'Try adjusting your filters.'}</p>
          </div>
        ) : (
          <div className="im-list">
            {filtered.map((inc) => {
              const sColor = SEVERITY_COLORS[inc.severityLevel] || '#94a3b8';
              const stColor = STATUS_COLORS[inc.status] || '#94a3b8';
              const meta = incidentMeta[String(inc.id)] || {};
              const incidentType = inc.incidentType || meta.incidentType || '—';
              const isExpanded = expandedId === inc.id;
              const isActioned = actionMsg.id === inc.id;
              return (
                <div key={inc.id} className={`im-card${isExpanded ? ' im-card-open' : ''}`} style={{ '--sev-color': sColor }}>
                  {/* CARD HEADER */}
                  <div className="im-card-header" onClick={() => setExpandedId(isExpanded ? null : inc.id)}>
                    <div className="im-card-left">
                      <div className="im-card-id">#{inc.id}</div>
                      <div className="im-card-meta">
                        <span className="im-badge" style={{ background: sColor + '22', color: sColor, borderColor: sColor + '55' }}>
                          {inc.severityLevel || '—'}
                        </span>
                        <span className="im-badge" style={{ background: stColor + '22', color: stColor, borderColor: stColor + '55' }}>
                          {inc.status || '—'}
                        </span>
                        <span className="im-badge" style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa', borderColor: 'rgba(167,139,250,0.45)' }}>
                          {incidentType}
                        </span>
                        <span className="im-card-desc">{inc.description || 'No description'}</span>
                      </div>
                    </div>
                    <div className="im-card-right">
                      <div className="im-card-ids">
                        <span>Outage <strong>{inc.outageId ?? '—'}</strong></span>
                        <span>Analyst <strong>{inc.analystId ?? '—'}</strong></span>
                      </div>
                      <div className="im-card-actions">
                        {isAdmin && inc.status !== 'APPROVED' && inc.status !== 'REJECTED' && (
                          <>
                            <button
                              className="im-action-btn im-action-approve"
                              title="Approve"
                              onClick={(e) => { e.stopPropagation(); handleApprove(inc.id); }}
                            >
                              <FiCheckCircle /> Approve
                            </button>
                            <button
                              className="im-action-btn im-action-reject"
                              title="Reject"
                              onClick={(e) => { e.stopPropagation(); handleReject(inc.id); }}
                            >
                              <FiXCircle /> Reject
                            </button>
                          </>
                        )}
                        {inc.status === 'APPROVED' && (
                          <span className="im-action-done im-action-done-ok"><FiCheckCircle /> Approved</span>
                        )}
                        {inc.status === 'REJECTED' && (
                          <span className="im-action-done im-action-done-err"><FiXCircle /> Rejected</span>
                        )}
                        <button className="im-expand-btn">
                          {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ACTION MESSAGE */}
                  {isActioned && (
                    <div className={`im-card-msg ${actionMsg.ok ? 'im-card-msg-ok' : 'im-card-msg-err'}`}>
                      {actionMsg.ok ? <FiCheckCircle /> : <FiAlertTriangle />} {actionMsg.text}
                    </div>
                  )}

                  {/* EXPANDED DETAIL */}
                  {isExpanded && (
                    <div className="im-card-detail">
                      <div className="im-detail-grid">
                        <div className="im-detail-block">
                          <div className="im-detail-label">Root Cause</div>
                          <div className="im-detail-value">{inc.rootCause || <em>Not provided</em>}</div>
                        </div>
                        <div className="im-detail-block">
                          <div className="im-detail-label">Safety Details</div>
                          <div className="im-detail-value">{inc.safetyDetails || <em>Not provided</em>}</div>
                        </div>
                        <div className="im-detail-block">
                          <div className="im-detail-label">Corrective Actions</div>
                          <div className="im-detail-value">{inc.correctiveActions || <em>Not provided</em>}</div>
                        </div>
                        <div className="im-detail-block">
                          <div className="im-detail-label">Full Description</div>
                          <div className="im-detail-value">{inc.description || <em>Not provided</em>}</div>
                        </div>
                        <div className="im-detail-block">
                          <div className="im-detail-label">Incident Type</div>
                          <div className="im-detail-value">{incidentType || <em>Not provided</em>}</div>
                        </div>
                        <div className="im-detail-block">
                          <div className="im-detail-label">Attachments</div>
                          <div className="im-detail-value">
                            {Array.isArray(meta.attachments) && meta.attachments.length
                              ? meta.attachments.join(', ')
                              : <em>None uploaded</em>}
                          </div>
                        </div>
                        {inc.createdAt && (
                          <div className="im-detail-block">
                            <div className="im-detail-label">Created At</div>
                            <div className="im-detail-value">{new Date(inc.createdAt).toLocaleString()}</div>
                          </div>
                        )}
                        {inc.updatedAt && (
                          <div className="im-detail-block">
                            <div className="im-detail-label">Last Updated</div>
                            <div className="im-detail-value">{new Date(inc.updatedAt).toLocaleString()}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
