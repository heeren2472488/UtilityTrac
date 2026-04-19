import React, { useEffect, useMemo, useState } from 'react';
import { tariffService } from '../services/api';
import './AdminControlCenter.css';

const SORTABLE = {
  code: 'code',
  name: 'name',
  serviceType: 'serviceType',
  ratePerUnit: 'ratePerUnit',
};

const emptyForm = {
  code: '',
  name: '',
  serviceType: '',
  unitType: 'KWH',
  ratePerUnit: '',
  fixedCharge: '',
  effectiveStartDate: '',
  effectiveEndDate: '',
  tiers: [{ min: '', max: '', rate: '' }],
};

const unwrapList = (res) => {
  const root = res?.data?.data ?? res?.data ?? [];
  if (Array.isArray(root)) return root;
  if (Array.isArray(root?.content)) return root.content;
  if (Array.isArray(root?.items)) return root.items;
  return [];
};

const readAmount = (obj) => {
  if (obj == null) return null;
  if (typeof obj === 'number') return obj;
  if (typeof obj === 'string' && obj.trim() !== '' && !Number.isNaN(Number(obj))) return Number(obj);

  const candidates = [
    obj.amount,
    obj.totalAmount,
    obj.calculatedAmount,
    obj.billAmount,
    obj.charge,
    obj.total,
  ];

  for (const value of candidates) {
    if (value != null && !Number.isNaN(Number(value))) {
      return Number(value);
    }
  }
  return null;
};

const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString();
};

export default function AdminTariffManagementPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('code');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const [openForm, setOpenForm] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  const [calcForm, setCalcForm] = useState({
    billingPeriod: '2026-Jan',
    customerId: '',
    unitsConsumed: '',
    serviceType: '',
  });
  const [calcResult, setCalcResult] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [calcError, setCalcError] = useState('');

  const loadTariffs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await tariffService.getAll();
      setRows(unwrapList(res));
    } catch (e) {
      setError(e?.response?.data?.message || 'Unable to load tariffs.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTariffs();
  }, []);

  const normalized = useMemo(() => {
    return rows.map((row, index) => {
      const rate = row.ratePerUnit ?? row.rate ?? row.unitRate ?? 0;
      const from = row.effectiveFrom ?? row.effectiveStartDate ?? row.startDate ?? row.validFrom;
      const to = row.effectiveTo ?? row.effectiveEndDate ?? row.endDate ?? row.validTo;
      const status = String(row.status || '').toUpperCase() || 'ACTIVE';
      return {
        id: row.id ?? `${row.code || row.tariffCode || 'tariff'}-${index}`,
        code: row.code || row.tariffCode || '—',
        name: row.name || row.tariffName || '—',
        serviceType: row.serviceType || row.serviceCode || '—',
        ratePerUnit: Number(rate) || 0,
        unitType: row.unitType || row.unit || 'KWH',
        status: status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
        effectiveFrom: from || '',
        effectiveTo: to || '',
        fixedCharge: row.fixedCharge ?? '',
        raw: row,
      };
    });
  }, [rows]);

  const filteredSorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = normalized.filter((r) => {
      if (!q) return true;
      return [r.code, r.name, r.serviceType, r.unitType].some((v) => String(v).toLowerCase().includes(q));
    });

    list = [...list].sort((a, b) => {
      const key = SORTABLE[sortBy] || 'code';
      const va = a[key];
      const vb = b[key];
      const cmp = typeof va === 'number' || typeof vb === 'number'
        ? Number(va || 0) - Number(vb || 0)
        : String(va || '').localeCompare(String(vb || ''));
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [normalized, query, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / pageSize));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredSorted.slice(start, start + pageSize);
  }, [filteredSorted, page, pageSize]);

  const onSort = (key) => {
    if (sortBy === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortBy(key);
    setSortDir('asc');
  };

  const openCreate = () => {
    setEditingRow(null);
    setForm(emptyForm);
    setOpenForm(true);
  };

  const openEdit = (row) => {
    setEditingRow(row);
    setForm({
      code: row.code || '',
      name: row.name || '',
      serviceType: row.serviceType || '',
      unitType: row.unitType || 'KWH',
      ratePerUnit: row.ratePerUnit ?? '',
      fixedCharge: row.fixedCharge ?? '',
      effectiveStartDate: row.effectiveFrom ? String(row.effectiveFrom).slice(0, 10) : '',
      effectiveEndDate: row.effectiveTo ? String(row.effectiveTo).slice(0, 10) : '',
      tiers: [{ min: '', max: '', rate: '' }],
    });
    setOpenForm(true);
  };

  const saveTariff = async (e) => {
    e.preventDefault();
    if (!form.code || !form.name || !form.serviceType || !form.unitType || form.ratePerUnit === '') {
      setError('Code, Name, Service Type, Unit Type and Rate per Unit are required.');
      return;
    }

    const payload = {
      code: form.code.trim(),
      name: form.name.trim(),
      unitType: form.unitType,
      ratePerUnit: Number(form.ratePerUnit),
      serviceType: form.serviceType.trim(),
    };

    setSaving(true);
    setError('');
    try {
      await tariffService.add(payload);
      setToast(editingRow ? 'Tariff updated successfully.' : 'Tariff created successfully.');
      setOpenForm(false);
      setForm(emptyForm);
      setEditingRow(null);
      await loadTariffs();
      setTimeout(() => setToast(''), 2200);
    } catch (e2) {
      setError(e2?.response?.data?.message || 'Failed to save tariff.');
    } finally {
      setSaving(false);
    }
  };

  const runPreview = async (e) => {
    e.preventDefault();
    setCalcError('');

    if (!calcForm.billingPeriod || !calcForm.customerId || !calcForm.unitsConsumed || !calcForm.serviceType) {
      setCalcError('Billing period, customer ID, units consumed and service type are required.');
      return;
    }

    setCalcLoading(true);
    try {
      const res = await tariffService.calculate(calcForm.billingPeriod, {
        customerId: Number(calcForm.customerId),
        unitsConsumed: Number(calcForm.unitsConsumed),
        serviceType: calcForm.serviceType,
      });
      const payload = res?.data?.data ?? res?.data ?? null;
      const amount = readAmount(payload);
      setCalcResult({ payload, amount });
    } catch (e3) {
      setCalcResult(null);
      setCalcError(e3?.response?.data?.message || 'Unable to calculate tariff preview.');
    } finally {
      setCalcLoading(false);
    }
  };

  return (
    <section className="admin-ops-page">
      <div className="admin-ops-header">
        <div>
          <h2 className="admin-ops-title">Tariff Management</h2>
          <p className="admin-ops-subtitle">
            Configure tariff references and preview calculations using existing billing services.
          </p>
        </div>
        <div className="admin-ops-actions">
          <button className="admin-ops-btn" onClick={openCreate}>+ Create Tariff</button>
          <button className="admin-ops-btn secondary" onClick={loadTariffs}>Refresh</button>
        </div>
      </div>

      <div className="admin-ops-toolbar">
        <div className="admin-ops-field">
          <label>Search</label>
          <input
            className="admin-ops-input"
            placeholder="Code, name, service type"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="admin-ops-field">
          <label>Rows per page</label>
          <select
            className="admin-ops-select"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
          >
            {[5, 8, 10, 20].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      {toast ? <div className="alert-success">{toast}</div> : null}
      {error ? <div className="alert-error">{error}</div> : null}

      <div className="admin-ops-table-wrap">
        <table className="admin-ops-table">
          <thead>
            <tr>
              <th onClick={() => onSort('code')} role="button">Tariff Code</th>
              <th onClick={() => onSort('name')} role="button">Name</th>
              <th onClick={() => onSort('serviceType')} role="button">Service Type</th>
              <th onClick={() => onSort('ratePerUnit')} role="button">Rate per Unit</th>
              <th>Unit Type</th>
              <th>Status</th>
              <th>Effective From</th>
              <th>Effective To</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9}>Loading tariffs...</td></tr>
            ) : paged.length === 0 ? (
              <tr><td colSpan={9}>No tariffs found.</td></tr>
            ) : (
              paged.map((row) => (
                <tr key={row.id}>
                  <td>{row.code}</td>
                  <td>{row.name}</td>
                  <td>{row.serviceType}</td>
                  <td>{row.ratePerUnit.toFixed(2)}</td>
                  <td>{row.unitType}</td>
                  <td>
                    <span className={`admin-pill ${row.status === 'ACTIVE' ? 'active' : 'inactive'}`}>
                      {row.status}
                    </span>
                  </td>
                  <td>{formatDate(row.effectiveFrom)}</td>
                  <td>{formatDate(row.effectiveTo)}</td>
                  <td>
                    <button className="admin-ops-btn secondary" onClick={() => openEdit(row)}>Edit</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="admin-ops-pagination">
        <span>Showing {paged.length} of {filteredSorted.length} tariffs</span>
        <div className="admin-ops-actions">
          <button className="admin-ops-btn secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
          <span>Page {page} / {totalPages}</span>
          <button className="admin-ops-btn secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      </div>

      <div style={{ height: 14 }} />

      <div className="admin-ops-card">
        <h3 style={{ margin: '0 0 12px' }}>Tariff Calculation Preview (Read-only)</h3>
        <form className="admin-ops-toolbar" onSubmit={runPreview}>
          <div className="admin-ops-field">
            <label>Billing Period</label>
            <input
              className="admin-ops-input"
              value={calcForm.billingPeriod}
              onChange={(e) => setCalcForm((s) => ({ ...s, billingPeriod: e.target.value }))}
              placeholder="2026-Jan"
            />
          </div>
          <div className="admin-ops-field">
            <label>Customer ID</label>
            <input
              className="admin-ops-input"
              type="number"
              value={calcForm.customerId}
              onChange={(e) => setCalcForm((s) => ({ ...s, customerId: e.target.value }))}
            />
          </div>
          <div className="admin-ops-field">
            <label>Units Consumed</label>
            <input
              className="admin-ops-input"
              type="number"
              value={calcForm.unitsConsumed}
              onChange={(e) => setCalcForm((s) => ({ ...s, unitsConsumed: e.target.value }))}
            />
          </div>
          <div className="admin-ops-field">
            <label>Service Type</label>
            <input
              className="admin-ops-input"
              value={calcForm.serviceType}
              onChange={(e) => setCalcForm((s) => ({ ...s, serviceType: e.target.value }))}
              placeholder="TAR_RES_001"
            />
          </div>
          <div className="admin-ops-actions" style={{ alignItems: 'end' }}>
            <button className="admin-ops-btn" type="submit" disabled={calcLoading}>
              {calcLoading ? 'Calculating...' : 'Preview Amount'}
            </button>
          </div>
        </form>

        {calcError ? <div className="alert-error" style={{ marginTop: 10 }}>{calcError}</div> : null}
        {calcResult ? (
          <div className="admin-ops-grid" style={{ marginTop: 10 }}>
            <div className="admin-ops-card">
              <div className="admin-ops-card-label">Calculated Amount</div>
              <div className="admin-ops-card-value">
                {calcResult.amount == null ? '—' : calcResult.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="admin-ops-card" style={{ gridColumn: '1 / -1' }}>
              <div className="admin-ops-card-label">Preview Payload</div>
              <pre style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap', fontSize: 12 }}>
                {JSON.stringify(calcResult.payload, null, 2)}
              </pre>
            </div>
          </div>
        ) : null}
      </div>

      {openForm ? (
        <div className="admin-ops-modal" onClick={() => setOpenForm(false)}>
          <div className="admin-ops-modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>{editingRow ? 'Edit Tariff' : 'Create Tariff'}</h3>
            <form onSubmit={saveTariff}>
              <div className="admin-ops-form-grid">
                <div className="admin-ops-field">
                  <label>Code *</label>
                  <input className="admin-ops-input" value={form.code} onChange={(e) => setForm((s) => ({ ...s, code: e.target.value }))} />
                </div>
                <div className="admin-ops-field">
                  <label>Name *</label>
                  <input className="admin-ops-input" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
                </div>
                <div className="admin-ops-field">
                  <label>Service Type *</label>
                  <input className="admin-ops-input" value={form.serviceType} onChange={(e) => setForm((s) => ({ ...s, serviceType: e.target.value }))} />
                </div>
                <div className="admin-ops-field">
                  <label>Unit Type *</label>
                  <select className="admin-ops-select" value={form.unitType} onChange={(e) => setForm((s) => ({ ...s, unitType: e.target.value }))}>
                    {['KWH', 'MWH', 'KVAH'].map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div className="admin-ops-field">
                  <label>Rate per Unit *</label>
                  <input className="admin-ops-input" type="number" step="0.01" value={form.ratePerUnit} onChange={(e) => setForm((s) => ({ ...s, ratePerUnit: e.target.value }))} />
                </div>
                <div className="admin-ops-field">
                  <label>Fixed Charge (optional)</label>
                  <input className="admin-ops-input" type="number" step="0.01" value={form.fixedCharge} onChange={(e) => setForm((s) => ({ ...s, fixedCharge: e.target.value }))} />
                </div>
                <div className="admin-ops-field">
                  <label>Effective Start Date</label>
                  <input className="admin-ops-input" type="date" value={form.effectiveStartDate} onChange={(e) => setForm((s) => ({ ...s, effectiveStartDate: e.target.value }))} />
                </div>
                <div className="admin-ops-field">
                  <label>Effective End Date</label>
                  <input className="admin-ops-input" type="date" value={form.effectiveEndDate} onChange={(e) => setForm((s) => ({ ...s, effectiveEndDate: e.target.value }))} />
                </div>
              </div>

              <div className="admin-note">
                Tiered rates are UI-ready for Phase 1. Flat-rate submission is currently used to match existing backend contract.
              </div>

              <div className="admin-ops-actions" style={{ marginTop: 14 }}>
                <button className="admin-ops-btn" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Tariff'}</button>
                <button className="admin-ops-btn secondary" type="button" onClick={() => setOpenForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
