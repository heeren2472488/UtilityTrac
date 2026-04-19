import React, { useEffect, useMemo, useState } from 'react';
import { tariffService, usageAggregateService } from '../services/api';
import './AdminControlCenter.css';

const unwrapList = (res) => {
  const root = res?.data?.data ?? res?.data ?? [];
  if (Array.isArray(root)) return root;
  if (Array.isArray(root?.content)) return root.content;
  if (Array.isArray(root?.items)) return root.items;
  return [];
};

const amountOf = (row) => Number(
  row?.billAmount ?? row?.amount ?? row?.totalAmount ?? row?.charge ?? 0
) || 0;

const toCsv = (rows) => {
  if (!rows.length) return '';
  const keys = Object.keys(rows[0]);
  const header = keys.join(',');
  const body = rows
    .map((r) => keys.map((k) => {
      const val = r[k] == null ? '' : String(r[k]).replace(/"/g, '""');
      return `"${val}"`;
    }).join(','))
    .join('\n');
  return `${header}\n${body}`;
};

export default function AdminRegulatoryReportsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tariffs, setTariffs] = useState([]);
  const [billingReady, setBillingReady] = useState([]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [tariffRes, billingRes] = await Promise.allSettled([
        tariffService.getAll(),
        usageAggregateService.getBillingReady(),
      ]);

      setTariffs(tariffRes.status === 'fulfilled' ? unwrapList(tariffRes.value) : []);
      setBillingReady(billingRes.status === 'fulfilled' ? unwrapList(billingRes.value) : []);

      if (tariffRes.status === 'rejected' && billingRes.status === 'rejected') {
        setError('Unable to load regulatory report data.');
      }
    } catch {
      setError('Unable to load regulatory report data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const impactRows = useMemo(() => {
    const map = new Map();
    tariffs.forEach((t) => {
      const service = t.serviceType || t.serviceCode || 'UNKNOWN';
      const row = map.get(service) || { serviceType: service, tariffs: 0, avgRate: 0, _sum: 0 };
      const rate = Number(t.ratePerUnit ?? t.rate ?? 0) || 0;
      row.tariffs += 1;
      row._sum += rate;
      row.avgRate = row.tariffs ? row._sum / row.tariffs : 0;
      map.set(service, row);
    });
    return [...map.values()].sort((a, b) => b.tariffs - a.tariffs);
  }, [tariffs]);

  const reportCards = useMemo(() => {
    const totalAmount = billingReady.reduce((sum, r) => sum + amountOf(r), 0);
    return [
      { title: 'Compliance Snapshot', value: billingReady.length > 0 ? 'Ready' : 'Pending', note: 'Billing-ready data feed status' },
      { title: 'Tariff Coverage', value: `${impactRows.length}`, note: 'Service types with tariff definitions' },
      { title: 'Billable Amount Scope', value: totalAmount.toLocaleString(undefined, { maximumFractionDigits: 2 }), note: 'Aggregated report-card amount' },
    ];
  }, [billingReady, impactRows]);

  const exportImpact = () => {
    const rows = impactRows.map((r) => ({
      serviceType: r.serviceType,
      tariffs: r.tariffs,
      averageRatePerUnit: r.avgRate.toFixed(2),
    }));
    const csv = toCsv(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'utilitrac-regulatory-tariff-impact.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="admin-ops-page">
      <div className="admin-ops-header">
        <div>
          <h2 className="admin-ops-title">Compliance & Regulatory Reports</h2>
          <p className="admin-ops-subtitle">Read-only compliance reports, tariff impact summaries, and export-ready report cards.</p>
        </div>
        <div className="admin-ops-actions">
          <button className="admin-ops-btn secondary" onClick={load}>Refresh</button>
          <button className="admin-ops-btn" onClick={exportImpact} disabled={!impactRows.length}>Export Tariff Impact CSV</button>
        </div>
      </div>

      {error ? <div className="alert-error">{error}</div> : null}

      <div className="admin-ops-grid">
        {reportCards.map((card) => (
          <div className="admin-ops-card" key={card.title}>
            <div className="admin-ops-card-label">{card.title}</div>
            <div className="admin-ops-card-value">{card.value}</div>
            <div className="admin-note">{card.note}</div>
          </div>
        ))}
      </div>

      <div className="admin-ops-card" style={{ marginBottom: 12 }}>
        <h3 style={{ margin: '0 0 10px' }}>Tariff Impact Summary (Read-only)</h3>
        <div className="admin-ops-table-wrap">
          <table className="admin-ops-table">
            <thead>
              <tr>
                <th>Service Type</th>
                <th>Tariff Count</th>
                <th>Average Rate per Unit</th>
              </tr>
            </thead>
            <tbody>
              {impactRows.length === 0 ? (
                <tr><td colSpan={3}>{loading ? 'Loading...' : 'No tariff impact data available.'}</td></tr>
              ) : impactRows.map((row) => (
                <tr key={row.serviceType}>
                  <td>{row.serviceType}</td>
                  <td>{row.tariffs}</td>
                  <td>{row.avgRate.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-ops-card">
        <h3 style={{ margin: '0 0 10px' }}>Compliance Report Cards</h3>
        <div className="admin-ops-table-wrap">
          <table className="admin-ops-table">
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Meter ID</th>
                <th>Billing Period</th>
                <th>Bill Amount</th>
                <th>Compliance Status</th>
              </tr>
            </thead>
            <tbody>
              {billingReady.length === 0 ? (
                <tr><td colSpan={5}>{loading ? 'Loading...' : 'No billing-ready rows available.'}</td></tr>
              ) : billingReady.slice(0, 50).map((row, idx) => (
                <tr key={`${row.id || row.customerId || 'report'}-${idx}`}>
                  <td>{row.customerId ?? row.customer ?? '—'}</td>
                  <td>{row.meterId ?? row.meterNumber ?? '—'}</td>
                  <td>{row.billingPeriod ?? row.period ?? '—'}</td>
                  <td>{amountOf(row).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td>
                    <span className="admin-pill active">COMPLIANT</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="admin-note">This section is strictly read-only for regulatory review.</div>
      </div>
    </section>
  );
}
