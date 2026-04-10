import React, { useEffect, useState } from 'react';
import { auditService } from '../services/api';

export default function 
AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');

  const load = () => {
    setLoading(true);

    auditService
      .getLogs({ page, size: 20 })
      .then((res) => {
        const pageData = res.data?.data;

        const rows = pageData?.content || [];

        // MAP BACKEND FIELDS → FRONTEND FIELDS
        const mapped = rows.map((log) => ({
          id: log.id,
          action: log.action,
          performedBy: log.actorEmail || "—",
          entityType: log.resource || "—",
          entityId: log.actorId || "—",
          description: log.detail || "—",
          timestamp: log.performedAt,
        }));

        setLogs(mapped);
        setTotalPages(pageData?.totalPages || 1);
      })
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [page]);

  // FILTER + SEARCH
  const filtered = logs.filter((l) => {
    const q = search.toLowerCase();

    const matchFilter = filter === 'ALL' || l.action === filter;

    const matchSearch =
      !q ||
      l.action.toLowerCase().includes(q) ||
      l.performedBy.toLowerCase().includes(q) ||
      l.entityType.toLowerCase().includes(q) ||
      l.description.toLowerCase().includes(q);

    return matchFilter && matchSearch;
  });

  // All unique actions
  const actions = ['ALL', ...new Set(logs.map((l) => l.action))];

  const actionBadge = (a) => {
    const map = {
      CREATE: 'badge-green',
      UPDATE: 'badge-blue',
      DELETE: 'badge-red',
      LOGIN: 'badge-yellow',
      LOGOUT: 'badge-gray',
    };
    return <span className={`badge ${map[a] || 'badge-gray'}`}>{a}</span>;
  };

  return (
    <div className="page">

      {/* HEADER */}
      <div className="page-header">
        <div>
          <div className="page-title">Audit Logs</div>
          <div className="page-subtitle">US004 — System audit trail</div>
        </div>
        <button className="btn btn-ghost" onClick={load}>↻ Refresh</button>
      </div>

      {/* SEARCH + FILTER */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          className="form-input"
          placeholder="Search logs…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 260 }}
        />

        <select
          className="form-select"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ maxWidth: 160 }}
        >
          {actions.map((a) => (
            <option key={a}>{a}</option>
          ))}
        </select>
      </div>

      {/* TABLE */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Action</th>
              <th>Performed By</th>
              <th>Entity</th>
              <th>Entity ID</th>
              <th>Description</th>
              <th>Timestamp</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6}>Loading audit logs…</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6}>No logs found</td>
              </tr>
            ) : (
              filtered.map((log, i) => (
                <tr key={log.id || i}>
                  <td>{actionBadge(log.action)}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{log.performedBy}</td>
                  <td>{log.entityType}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{log.entityId}</td>
                  <td style={{
                      maxWidth: 200,
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis'
                  }}>
                    {log.description}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                    {log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
        <button
          className="btn btn-ghost"
          disabled={page <= 0}
          onClick={() => setPage((p) => p - 1)}
        >
          ← Prev
        </button>

        <span style={{ lineHeight: '32px' }}>
          Page {page + 1} / {totalPages}
        </span>

        <button
          className="btn btn-ghost"
          disabled={page >= totalPages - 1}
          onClick={() => setPage((p) => p + 1)}
        >
          Next →
        </button>
      </div>

      <div style={{ marginTop: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
        Showing {filtered.length} of {logs.length} records (Page {page + 1})
      </div>
    </div>
  );
}