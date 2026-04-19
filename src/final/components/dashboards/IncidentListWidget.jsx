import React, { useState, useEffect, useMemo } from 'react';
import {
  FiChevronDown, FiChevronUp, FiSearch, FiFilter,
} from 'react-icons/fi';
import { incidentReportService } from '../../services/api';
import './Dashboard.css';

const toList = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const unwrap = (r) => r?.data?.data ?? r?.data ?? null;

const SEVERITY_COLORS = {
  CRITICAL: '#f87171', HIGH: '#fb923c', MEDIUM: '#fbbf24', LOW: '#34d399',
};
const STATUS_COLORS = {
  DRAFT: '#94a3b8', SUBMITTED: '#5ee6ff', APPROVED: '#34d399', REJECTED: '#f87171', CLOSED: '#a78bfa',
};

export default function IncidentListWidget({ showTimeline = false, maxHeight = '500px' }) {
  const [incidents, setIncidents]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const res = await incidentReportService.getAll();
        const raw = unwrap(res);
        setIncidents(toList(raw));
      } catch {
        setIncidents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchIncidents();
  }, []);

  const filtered = useMemo(() => {
    return incidents.filter((inc) => {
      const matchStatus = statusFilter === 'ALL' || inc.status === statusFilter;
      const q = search.toLowerCase();
      const matchSearch = !q ||
        String(inc.id).includes(q) ||
        (inc.description || '').toLowerCase().includes(q) ||
        (inc.severityLevel || '').toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [incidents, statusFilter, search]);

  const stats = useMemo(() => ({
    total:    incidents.length,
    approved: incidents.filter((i) => i.status === 'APPROVED').length,
    rejected: incidents.filter((i) => i.status === 'REJECTED').length,
  }), [incidents]);

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'rgba(199,220,246,0.5)' }}>
        <div className="im-spinner" style={{ margin: '0 auto 12px', width: '24px', height: '24px' }} />
        Loading incidents…
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* MINI STATS */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <div style={{ flex: '0 1 auto', background: 'rgba(94,230,255,0.08)', border: '1px solid rgba(94,230,255,0.15)', borderRadius: '6px', padding: '6px 12px', fontSize: '11px', fontWeight: '600', color: '#5ee6ff' }}>
          {stats.total} total
        </div>
        <div style={{ flex: '0 1 auto', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.15)', borderRadius: '6px', padding: '6px 12px', fontSize: '11px', fontWeight: '600', color: '#34d399' }}>
          {stats.approved} approved
        </div>
        <div style={{ flex: '0 1 auto', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)', borderRadius: '6px', padding: '6px 12px', fontSize: '11px', fontWeight: '600', color: '#f87171' }}>
          {stats.rejected} rejected
        </div>
      </div>

      {/* SEARCH + FILTER */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(94,230,255,0.15)', borderRadius: '6px', padding: '0 8px' }}>
          <FiSearch size={12} style={{ color: 'rgba(94,230,255,0.5)' }} />
          <input
            type="text"
            placeholder="Search incidents…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, background: 'none', border: 'none', color: '#c7dcf6', fontSize: '12px', padding: '6px 8px', outline: 'none' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(94,230,255,0.15)', borderRadius: '6px', padding: '0 6px' }}>
          <FiFilter size={12} style={{ color: 'rgba(94,230,255,0.5)' }} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ background: 'none', border: 'none', color: '#c7dcf6', fontSize: '12px', padding: '6px 4px', outline: 'none', cursor: 'pointer' }}
          >
            <option value="ALL">All</option>
            <option value="DRAFT">Draft</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* LIST */}
      <div style={{ maxHeight, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(199,220,246,0.3)', fontSize: '13px' }}>
            No incidents found
          </div>
        ) : (
          filtered.map((inc) => {
            const sColor = SEVERITY_COLORS[inc.severityLevel] || '#94a3b8';
            const stColor = STATUS_COLORS[inc.status] || '#94a3b8';
            const isExpanded = expandedId === inc.id;

            return (
              <div
                key={inc.id}
                style={{
                  border: '1px solid rgba(94,230,255,0.1)',
                  borderLeft: `3px solid ${sColor}`,
                  borderRadius: '7px',
                  background: 'rgba(255,255,255,0.015)',
                  overflow: 'hidden',
                }}
              >
                <div
                  onClick={() => setExpandedId(isExpanded ? null : inc.id)}
                  style={{
                    padding: '10px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    userSelect: 'none',
                  }}
                >
                  <button
                    style={{
                      background: 'none', border: 'none', color: 'rgba(199,220,246,0.5)',
                      cursor: 'pointer', padding: '0', width: '16px', height: '16px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {isExpanded ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                  </button>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#e8f4ff', marginBottom: '2px' }}>
                      #{inc.id} · {inc.description || 'No description'}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '9px', fontWeight: '700', padding: '1px 6px', borderRadius: '3px', background: `${sColor}22`, color: sColor, border: `1px solid ${sColor}55` }}>
                        {inc.severityLevel || '—'}
                      </span>
                      <span style={{ fontSize: '9px', fontWeight: '700', padding: '1px 6px', borderRadius: '3px', background: `${stColor}22`, color: stColor, border: `1px solid ${stColor}55` }}>
                        {inc.status || '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(94,230,255,0.06)', background: 'rgba(255,255,255,0.01)', fontSize: '12px', color: 'rgba(199,220,246,0.7)', lineHeight: '1.5' }}>
                    <div><strong>Root Cause:</strong> {inc.rootCause || '—'}</div>
                    <div><strong>Safety:</strong> {inc.safetyDetails || '—'}</div>
                    {inc.correctiveActions && <div><strong>Actions:</strong> {inc.correctiveActions}</div>}
                    {inc.createdAt && <div style={{ marginTop: '6px', fontSize: '11px', color: 'rgba(199,220,246,0.4)' }}>Created {new Date(inc.createdAt).toLocaleString()}</div>}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
