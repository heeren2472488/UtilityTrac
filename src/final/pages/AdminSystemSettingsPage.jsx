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

export default function AdminSystemSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tariffs, setTariffs] = useState([]);
  const [summary, setSummary] = useState({});
  const [billingReady, setBillingReady] = useState([]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [t, s, b] = await Promise.allSettled([
        tariffService.getAll(),
        usageAggregateService.getSummary(),
        usageAggregateService.getBillingReady(),
      ]);

      setTariffs(t.status === 'fulfilled' ? unwrapList(t.value) : []);
      setSummary(s.status === 'fulfilled' ? unwrapObject(s.value) : {});
      setBillingReady(b.status === 'fulfilled' ? unwrapList(b.value) : []);

      if (t.status === 'rejected' && s.status === 'rejected' && b.status === 'rejected') {
        setError('Unable to load system configuration data.');
      }
    } catch {
      setError('Unable to load system configuration data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const unitTypes = useMemo(() => {
    const set = new Set();
    tariffs.forEach((t) => set.add(t.unitType || t.unit || 'KWH'));
    return [...set];
  }, [tariffs]);

  const toggles = useMemo(() => {
    const summaryReady = Object.keys(summary || {}).length > 0;
    return [
      { label: 'Tariff Calculation Engine', enabled: tariffs.length > 0, note: 'Derived from tariff reference availability' },
      { label: 'Usage Aggregation Feed', enabled: billingReady.length > 0, note: 'Derived from billing-ready aggregate records' },
      { label: 'Regulatory Reporting Feed', enabled: summaryReady, note: 'Derived from usage summary metrics' },
      { label: 'Billing Preview Mode', enabled: true, note: 'Tariff calculation endpoint available (read-only preview)' },
    ];
  }, [tariffs, billingReady, summary]);

  const configCards = useMemo(() => {
    return [
      { label: 'Tariff Definitions', value: tariffs.length },
      { label: 'Default Unit Types', value: unitTypes.length },
      { label: 'Summary Metrics', value: Object.keys(summary || {}).length },
      { label: 'Billing-ready Rows', value: billingReady.length },
    ];
  }, [tariffs, unitTypes, summary, billingReady]);

  return (
    <section className="admin-ops-page">
      <div className="admin-ops-header">
        <div>
          <h2 className="admin-ops-title">Platform Configuration</h2>
          <p className="admin-ops-subtitle">Admin-only configuration visibility for billing features, default units, and platform status.</p>
        </div>
        <div className="admin-ops-actions">
          <button className="admin-ops-btn secondary" onClick={load}>Refresh</button>
        </div>
      </div>

      {error ? <div className="alert-error">{error}</div> : null}

      <div className="admin-ops-grid">
        {configCards.map((card) => (
          <div className="admin-ops-card" key={card.label}>
            <div className="admin-ops-card-label">{card.label}</div>
            <div className="admin-ops-card-value">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="admin-ops-card" style={{ marginBottom: 12 }}>
        <h3 style={{ margin: '0 0 10px' }}>Billing Feature Toggles (Read-only · Phase 1)</h3>
        <div style={{ display: 'grid', gap: 10 }}>
          {toggles.map((toggle) => (
            <div className="admin-readonly-toggle" key={toggle.label}>
              <div>
                <div style={{ fontWeight: 700 }}>{toggle.label}</div>
                <div className="admin-note">{toggle.note}</div>
              </div>
              <div className={`admin-readonly-knob ${toggle.enabled ? 'on' : ''}`} aria-label={`${toggle.label} read-only state`} />
            </div>
          ))}
        </div>
      </div>

      <div className="admin-ops-card">
        <h3 style={{ margin: '0 0 10px' }}>Default Unit Types</h3>
        {loading ? (
          <div>Loading...</div>
        ) : unitTypes.length ? (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {unitTypes.map((u) => (
              <span key={u} className="admin-pill active">{u}</span>
            ))}
          </div>
        ) : (
          <div className="admin-note">No unit types available from tariff definitions.</div>
        )}
        <div className="admin-note">Configuration editing is intentionally disabled in Phase 1.</div>
      </div>
    </section>
  );
}
