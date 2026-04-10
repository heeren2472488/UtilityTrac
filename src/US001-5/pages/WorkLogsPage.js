import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { workLogService, userService, workOrderService } from '../services/api';
import './WorkLogsPage.css';

const emptyForm = {
  userId: '',
  taskDescription: '',
  hoursWorked: '',
  workDate: '',
  status: 'PENDING',
  notes: ''
};

export default function WorkLogsPage() {
  const { workOrderId: routeWorkOrderId } = useParams();
  const [logs, setLogs] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState(routeWorkOrderId || '');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    setSelectedWorkOrderId(routeWorkOrderId || '');
  }, [routeWorkOrderId]);

  useEffect(() => {
    const normalizeList = (payload) => {
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.data)) return payload.data;
      if (Array.isArray(payload?.content)) return payload.content;
      if (Array.isArray(payload?.data?.content)) return payload.data.content;
      if (Array.isArray(payload?.items)) return payload.items;
      if (Array.isArray(payload?.data?.items)) return payload.data.items;
      return [];
    };

    const effectiveWorkOrderId = selectedWorkOrderId || routeWorkOrderId;

    const load = async () => {
      setLoading(true);
      setError('');

      try {
        const [usersRes, woRes] = await Promise.all([
          userService.getAll(),
          workOrderService.getAll(),
        ]);

        const woList = normalizeList(woRes.data);
        setWorkOrders(woList);

        const resolvedId = effectiveWorkOrderId || woList?.[0]?.id || woList?.[0]?.workOrderId || '';
        if (!resolvedId) {
          setLogs([]);
          setError('No work orders available');
          setLoading(false);
          return;
        }

        if (!effectiveWorkOrderId) {
          setSelectedWorkOrderId(String(resolvedId));
        }

        const logsRes = await workLogService.getByWorkOrder(resolvedId);

        // ✅ unwrap work logs safely
        const logsPayload = logsRes.data;
        if (Array.isArray(logsPayload?.data)) {
          setLogs(logsPayload.data);
        } else if (Array.isArray(logsPayload?.data?.content)) {
          setLogs(logsPayload.data.content);
        } else {
          setLogs([]);
        }

        // ✅ unwrap users safely
        const usersPayload = usersRes.data;
        setUsers(Array.isArray(usersPayload?.data) ? usersPayload.data : []);

      } catch (e) {
        console.error(e);
        setError('Failed to load work logs');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [routeWorkOrderId, selectedWorkOrderId]);

  /* ================= HANDLERS ================= */
  const openCreate = () => {
    setForm(emptyForm);
    setSelected(null);
    setModal('form');
  };

  const openEdit = (log) => {
    setSelected(log);
    setForm({
      ...log,
      workDate: log.workDate?.split('T')[0] || ''
    });
    setModal('form');
  };

  const handleSave = async () => {
    try {
      if (!selected) {
        await workLogService.create(selectedWorkOrderId || routeWorkOrderId, form);
      } else {
        await workLogService.update(selected.id, form);
      }

      setModal(null);
      setSuccess('Work log saved');
      setTimeout(() => setSuccess(''), 3000);

      // reload
      const res = await workLogService.getByWorkOrder(selectedWorkOrderId || routeWorkOrderId);
      setLogs(res.data?.data || []);

    } catch (e) {
      setError('Save failed');
    }
  };

  /* ================= UI ================= */
  return (
    <div className="worklogs-page">
      <div className="page-header">
        <div>
          <div className="page-title">Work Logs</div>
          <div className="page-subtitle">
            Work Order #{selectedWorkOrderId || routeWorkOrderId || 'N/A'}
          </div>
        </div>
        <button className="btn-primary" onClick={openCreate} disabled={!selectedWorkOrderId && !routeWorkOrderId}>
          + New Log
        </button>
      </div>

      <div className="table-card" style={{ marginBottom: 12 }}>
        <select
          value={selectedWorkOrderId}
          onChange={(e) => setSelectedWorkOrderId(e.target.value)}
          style={{ minWidth: 280 }}
        >
          <option value="">-- Select Work Order --</option>
          {workOrders.map((wo) => {
            const id = wo.id || wo.workOrderId;
            return <option key={id} value={id}>{wo.title || `Work Order #${id}`}</option>;
          })}
        </select>
      </div>

      {error && <div className="alert-error">{error}</div>}
      {success && <div className="alert-success">{success}</div>}

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Task</th>
              <th>Hours</th>
              <th>Date</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6}>Loading…</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={6}>No work logs</td></tr>
            ) : (
              logs.map(log => (
                <tr key={log.id}>
                  <td>{log.username || log.userId}</td>
                  <td className="truncate">{log.taskDescription}</td>
                  <td>{log.hoursWorked}h</td>
                  <td>{log.workDate ? new Date(log.workDate).toLocaleDateString() : '—'}</td>
                  <td><span className={`badge badge-${log.status.toLowerCase()}`}>{log.status}</span></td>
                  <td>
                    <button className="btn-ghost" onClick={() => openEdit(log)}>Edit</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modal === 'form' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{selected ? 'Edit Work Log' : 'New Work Log'}</h3>

            <select value={form.userId} onChange={e => setForm({ ...form, userId: e.target.value })}>
              <option value="">-- Select User --</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.username}</option>
              ))}
            </select>

            <input
              placeholder="Task description"
              value={form.taskDescription}
              onChange={e => setForm({ ...form, taskDescription: e.target.value })}
            />

            <input
              type="number"
              placeholder="Hours worked"
              value={form.hoursWorked}
              onChange={e => setForm({ ...form, hoursWorked: e.target.value })}
            />

            <input
              type="date"
              value={form.workDate}
              onChange={e => setForm({ ...form, workDate: e.target.value })}
            />

            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn-primary" onClick={handleSave}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}