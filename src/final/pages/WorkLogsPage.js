import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { workLogService } from '../services/api';
import './WorkLogsPage.css';

const emptyForm = {
  workOrderId: '',
  technicianId: '',
  hoursWorked: '',
  notes: '',
  partsUsedJson: '[{"partId":"","qty":1}]',
  completionStatus: 'IN_PROGRESS',
};

const completionStatusOptions = ['IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'PENDING'];

const normalizeLogs = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.content)) return payload.data.content;
  if (Array.isArray(payload?.content)) return payload.content;
  return [];
};

const draftKey = (workOrderId) => `worklog_draft_${String(workOrderId || '').trim()}`;

export default function WorkLogsPage() {
  const { workOrderId: routeWorkOrderId } = useParams();

  const [logs, setLogs] = useState([]);
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState(String(routeWorkOrderId || ''));
  const [manualWorkOrderId, setManualWorkOrderId] = useState(String(routeWorkOrderId || ''));
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [draftInfo, setDraftInfo] = useState('');

  const currentWorkOrderId = selectedWorkOrderId || String(routeWorkOrderId || '').trim();

  useEffect(() => {
    const fromRoute = String(routeWorkOrderId || '').trim();
    setSelectedWorkOrderId(fromRoute);
    setManualWorkOrderId(fromRoute);
  }, [routeWorkOrderId]);

  const loadLogs = async (workOrderId) => {
    setLoading(true);
    setError('');
    try {
      const res = workOrderId
        ? await workLogService.getByWorkOrder(workOrderId)
        : await workLogService.getAll();
      setLogs(normalizeLogs(res?.data));
    } catch (e) {
      const status = e?.response?.status;
      setLogs([]);
      setError(
        status === 403
          ? 'Access denied for work logs.'
          : status === 404
            ? (workOrderId ? 'Work order not found or no logs available.' : 'No work logs available.')
            : 'Failed to load work logs'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs(currentWorkOrderId);
  }, [currentWorkOrderId]);

  useEffect(() => {
    if (!currentWorkOrderId) {
      setDraftInfo('');
      return;
    }
    const saved = localStorage.getItem(draftKey(currentWorkOrderId));
    if (!saved) {
      setDraftInfo('');
      return;
    }
    try {
      const parsed = JSON.parse(saved);
      if (parsed?.form) {
        setForm({ ...emptyForm, ...parsed.form });
      }
      setDraftInfo(`Draft saved for work order #${currentWorkOrderId}`);
    } catch {
      setDraftInfo('');
    }
  }, [currentWorkOrderId]);

  const openCreate = () => {
    setFormErrors({});
    setError('');
    setForm((prev) => ({
      ...prev,
      workOrderId: String(currentWorkOrderId || manualWorkOrderId || prev.workOrderId || '').trim(),
    }));
    setShowForm(true);
  };

  const handleLoadManualWorkOrder = () => {
    const value = String(manualWorkOrderId || '').trim();
    setError('');
    setSelectedWorkOrderId(value);
  };

  const handleChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForSubmit = () => {
    const nextErrors = {};
    const submitWorkOrderId = String(form.workOrderId || currentWorkOrderId || '').trim();
    if (!submitWorkOrderId) {
      nextErrors.workOrderId = 'Work order is required.';
    } else if (!/^\d+$/.test(submitWorkOrderId)) {
      nextErrors.workOrderId = 'Work order ID must be numeric.';
    }
    if (!String(form.technicianId || '').trim()) nextErrors.technicianId = 'Technician ID is required.';
    if (!String(form.notes || '').trim()) nextErrors.notes = 'Work notes are required.';

    const hours = Number(form.hoursWorked);
    if (!Number.isFinite(hours) || hours <= 0) {
      nextErrors.hoursWorked = 'Hours worked must be greater than 0.';
    }

    if (!String(form.completionStatus || '').trim()) {
      nextErrors.completionStatus = 'Completion status is required.';
    }

    if (String(form.partsUsedJson || '').trim()) {
      try {
        JSON.parse(form.partsUsedJson);
      } catch {
        nextErrors.partsUsedJson = 'Parts JSON must be valid JSON.';
      }
    }

    return nextErrors;
  };

  const handleSaveDraft = () => {
    const draftWorkOrderId = String(form.workOrderId || currentWorkOrderId || '').trim();
    if (!draftWorkOrderId) {
      setError('Select or enter a Work Order ID before saving draft.');
      return;
    }

    localStorage.setItem(
      draftKey(draftWorkOrderId),
      JSON.stringify({ form, savedAt: new Date().toISOString() })
    );
    setSuccess('Draft saved successfully.');
    setDraftInfo(`Draft saved for work order #${draftWorkOrderId}`);
    setTimeout(() => setSuccess(''), 2500);
  };

  const handleSubmit = async () => {
    const nextErrors = validateForSubmit();
    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setError('Please fix validation errors before submission.');
      return;
    }

    setError('');
    try {
      const submitWorkOrderId = String(form.workOrderId || currentWorkOrderId || '').trim();
      const payload = {
        technicianId: String(form.technicianId).trim(),
        notes: String(form.notes).trim(),
        hoursWorked: Number(form.hoursWorked),
        partsUsedJson: String(form.partsUsedJson || '').trim(),
        completionStatus: String(form.completionStatus).trim().toUpperCase(),
      };

      await workLogService.create(submitWorkOrderId, payload);

      localStorage.removeItem(draftKey(submitWorkOrderId));
      setDraftInfo('');
      setShowForm(false);
      setForm(emptyForm);
      setSelectedWorkOrderId(submitWorkOrderId);
      setManualWorkOrderId(submitWorkOrderId);

      setSuccess('Work details submitted successfully.');
      setTimeout(() => setSuccess(''), 3500);

      await loadLogs(submitWorkOrderId);
    } catch (e) {
      const message = e?.response?.data?.message || 'Work log submission failed.';
      setError(message);
    }
  };

  return (
    <div className="worklogs-page">
      <div className="page-header">
        <div>
          <div className="page-title">Work Logs</div>
          <div className="page-subtitle">
            {selectedWorkOrderId || routeWorkOrderId ? `Work Order #${selectedWorkOrderId || routeWorkOrderId}` : 'All Work Orders'}
          </div>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          + New Log
        </button>
      </div>

      <div className="table-card worklogs-toolbar">
        <div className="worklogs-toolbar-row">
          <input
            type="number"
            min="1"
            placeholder="Enter Work Order ID"
            value={manualWorkOrderId}
            onChange={(e) => setManualWorkOrderId(e.target.value)}
            className="worklogs-input"
          />
          <button className="btn-ghost" onClick={handleLoadManualWorkOrder}>Load</button>
          <button className="btn-ghost" onClick={() => { setManualWorkOrderId(''); setSelectedWorkOrderId(''); setError(''); }}>Load All</button>
        </div>
        {draftInfo && <div className="worklogs-draft-info">{draftInfo}</div>}
      </div>

      {showForm && (
        <div className="table-card worklog-form-card">
          <h3 className="worklog-form-title">Technician Work Log</h3>

          <div className="worklog-form-grid">
            <div className="worklog-field">
              <label>Work Order ID *</label>
              <input
                className={`worklogs-input ${formErrors.workOrderId ? 'input-error' : ''}`}
                type="number"
                min="1"
                value={form.workOrderId}
                onChange={(e) => handleChange('workOrderId', e.target.value)}
                placeholder="e.g., 1"
              />
              {formErrors.workOrderId && <span className="field-error">{formErrors.workOrderId}</span>}
            </div>

            <div className="worklog-field">
              <label>Technician ID *</label>
              <input
                className={`worklogs-input ${formErrors.technicianId ? 'input-error' : ''}`}
                value={form.technicianId}
                onChange={(e) => handleChange('technicianId', e.target.value)}
                placeholder="e.g., TECH-007"
              />
              {formErrors.technicianId && <span className="field-error">{formErrors.technicianId}</span>}
            </div>

            <div className="worklog-field">
              <label>Hours Worked *</label>
              <input
                className={`worklogs-input ${formErrors.hoursWorked ? 'input-error' : ''}`}
                type="number"
                min="0"
                step="0.5"
                value={form.hoursWorked}
                onChange={(e) => handleChange('hoursWorked', e.target.value)}
                placeholder="e.g., 4.5"
              />
              {formErrors.hoursWorked && <span className="field-error">{formErrors.hoursWorked}</span>}
            </div>

            <div className="worklog-field worklog-field-wide">
              <label>Work Notes *</label>
              <textarea
                className={`worklogs-input ${formErrors.notes ? 'input-error' : ''}`}
                rows={4}
                value={form.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Describe work performed, tests executed, and observations"
              />
              {formErrors.notes && <span className="field-error">{formErrors.notes}</span>}
            </div>

            <div className="worklog-field worklog-field-wide">
              <label>Parts Used (JSON)</label>
              <textarea
                className={`worklogs-input ${formErrors.partsUsedJson ? 'input-error' : ''}`}
                rows={3}
                value={form.partsUsedJson}
                onChange={(e) => handleChange('partsUsedJson', e.target.value)}
                placeholder='[{"partId":"TRANS-01","qty":1}]'
              />
              {formErrors.partsUsedJson && <span className="field-error">{formErrors.partsUsedJson}</span>}
            </div>

            <div className="worklog-field">
              <label>Completion Status *</label>
              <select
                className={`worklogs-input ${formErrors.completionStatus ? 'input-error' : ''}`}
                value={form.completionStatus}
                onChange={(e) => handleChange('completionStatus', e.target.value)}
              >
                {completionStatusOptions.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              {formErrors.completionStatus && <span className="field-error">{formErrors.completionStatus}</span>}
            </div>
          </div>

          <div className="modal-actions">
            <button className="btn-ghost" onClick={() => setShowForm(false)}>Close</button>
            <button className="btn-ghost" onClick={handleSaveDraft}>Save Draft</button>
            <button className="btn-primary" onClick={handleSubmit}>Submit Work Log</button>
          </div>
        </div>
      )}

      {formErrors.workOrderId && (
        <div className="alert-error">{formErrors.workOrderId}</div>
      )}

      {error && <div className="alert-error">{error}</div>}
      {success && <div className="alert-success">{success}</div>}

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Technician</th>
              <th>Notes</th>
              <th>Hours</th>
              <th>Status</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5}>Loading…</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={5}>No work logs</td></tr>
            ) : (
              logs.map(log => (
                <tr key={log.id ?? log.workLogId}>
                  <td>{log.technicianId || log.userId || '—'}</td>
                  <td className="truncate">{log.notes || log.taskDescription || '—'}</td>
                  <td>{log.hoursWorked}h</td>
                  <td><span className={`badge badge-${String(log.completionStatus || log.status || 'pending').toLowerCase()}`}>{log.completionStatus || log.status || 'PENDING'}</span></td>
                  <td>{log.updatedAt ? new Date(log.updatedAt).toLocaleString() : (log.createdAt ? new Date(log.createdAt).toLocaleString() : '—')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}