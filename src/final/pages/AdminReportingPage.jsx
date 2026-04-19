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

const unwrapObject = (res) => res?.data?.data ?? res?.data ?? {};

const amountOf = (row) => Number(
  row?.billAmount ?? row?.amount ?? row?.totalAmount ?? row?.charge ?? 0
) || 0;

const usageOf = (row) => Number(
  row?.usageKwh ?? row?.unitsConsumed ?? row?.consumption ?? row?.usage ?? 0
) || 0;

export default function AdminReportingPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tariffs, setTariffs] = useState([]);
  const [billingReady, setBillingReady] = useState([]);
  const [summary, setSummary] = useState({});

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [t, b, s] = await Promise.allSettled([
        tariffService.getAll(),
        usageAggregateService.getBillingReady(),
        usageAggregateService.getSummary(),
      ]);

      setTariffs(t.status === 'fulfilled' ? unwrapList(t.value) : []);
      setBillingReady(b.status === 'fulfilled' ? unwrapList(b.value) : []);
      setSummary(s.status === 'fulfilled' ? unwrapObject(s.value) : {});

      if (t.status === 'rejected' && b.status === 'rejected' && s.status === 'rejected') {
        setError('Unable to load reporting data.');
      }
    } catch {
      setError('Unable to load reporting data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totals = useMemo(() => {
    const totalUsage = billingReady.reduce((sum, r) => sum + usageOf(r), 0);
    const totalAmount = billingReady.reduce((sum, r) => sum + amountOf(r), 0);
    return {
      rows: billingReady.length,
      tariffs: tariffs.length,
      totalUsage,
      totalAmount,
      summaryEntries: Object.keys(summary || {}).length,
    };
  }, [billingReady, tariffs, summary]);

  const tariffByService = useMemo(() => {
    const map = new Map();
    tariffs.forEach((t) => {
      const service = t.serviceType || t.serviceCode || 'UNKNOWN';
      const current = map.get(service) || { serviceType: service, count: 0, avgRate: 0, _sum: 0 };
      const rate = Number(t.ratePerUnit ?? t.rate ?? 0) || 0;
      current.count += 1;
      current._sum += rate;
      current.avgRate = current.count ? current._sum / current.count : 0;
      map.set(service, current);
    });
    return [...map.values()].sort((a, b) => b.count - a.count);
  }, [tariffs]);

  return (
    <section className="admin-ops-page">
      <div className="admin-ops-header">
        <div>
          <h2 className="admin-ops-title">System & Billing Reports</h2>
          <p className="admin-ops-subtitle">Billing usage summaries, tariff application overview, and system-wide billing statistics.</p>
        </div>
        <div className="admin-ops-actions">
          <button className="admin-ops-btn secondary" onClick={loadData}>Refresh</button>
        </div>
      </div>

      {error ? <div className="alert-error">{error}</div> : null}

      <div className="admin-ops-grid">
        <div className="admin-ops-card">
          <div className="admin-ops-card-label">Billing-ready records</div>
          <div className="admin-ops-card-value">{totals.rows}</div>
        </div>
        <div className="admin-ops-card">
          <div className="admin-ops-card-label">Tariff references</div>
          <div className="admin-ops-card-value">{totals.tariffs}</div>
        </div>
        <div className="admin-ops-card">
          <div className="admin-ops-card-label">Total usage</div>
          <div className="admin-ops-card-value">{totals.totalUsage.toLocaleString()}</div>
        </div>
        <div className="admin-ops-card">
          <div className="admin-ops-card-label">Total billable amount</div>
          <div className="admin-ops-card-value">{totals.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
      </div>

      <div className="admin-ops-card" style={{ marginBottom: 12 }}>
        <h3 style={{ margin: '0 0 10px' }}>Tariff Application Overview</h3>
        <div className="admin-ops-table-wrap">
          <table className="admin-ops-table">
            <thead>
              <tr>
                <th>Service Type</th>
                <th>Applied Tariffs</th>
                <th>Average Rate per Unit</th>
              </tr>
            </thead>
            <tbody>
              {tariffByService.length === 0 ? (
                <tr><td colSpan={3}>{loading ? 'Loading...' : 'No tariff data available.'}</td></tr>
              ) : tariffByService.map((row) => (
                <tr key={row.serviceType}>
                  <td>{row.serviceType}</td>
                  <td>{row.count}</td>
                  <td>{row.avgRate.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-ops-card" style={{ marginBottom: 12 }}>
        <h3 style={{ margin: '0 0 10px' }}>Billing Usage Summary</h3>
        <div className="admin-ops-table-wrap">
          <table className="admin-ops-table">
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Meter ID</th>
                <th>Billing Period</th>
                <th>Usage</th>
                <th>Calculated Amount</th>
              </tr>
            </thead>
            <tbody>
              {billingReady.length === 0 ? (
                <tr><td colSpan={5}>{loading ? 'Loading...' : 'No billing usage rows available.'}</td></tr>
              ) : billingReady.slice(0, 50).map((row, idx) => (
                <tr key={`${row.id || row.customerId || 'r'}-${idx}`}>
                  <td>{row.customerId ?? row.customer ?? '—'}</td>
                  <td>{row.meterId ?? row.meterNumber ?? '—'}</td>
                  <td>{row.billingPeriod ?? row.period ?? '—'}</td>
                  <td>{usageOf(row).toLocaleString()}</td>
                  <td>{amountOf(row).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-ops-card">
        <h3 style={{ margin: '0 0 10px' }}>System-wide Billing Statistics</h3>
        <div className="admin-ops-table-wrap">
          <table className="admin-ops-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(summary || {}).length === 0 ? (
                <tr><td colSpan={2}>{loading ? 'Loading...' : 'No summary metrics returned by backend.'}</td></tr>
              ) : Object.entries(summary).map(([k, v]) => (
                <tr key={k}>
                  <td>{k}</td>
                  <td>{typeof v === 'number' ? v.toLocaleString() : String(v)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
