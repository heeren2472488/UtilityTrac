
import React, { useEffect, useMemo, useState } from 'react';
import {
  FiActivity,
  FiCheckCircle,
  FiSearch,
  FiClock,
  FiMapPin,
  FiEdit3,
  FiAlertTriangle,
  FiRefreshCw,
  FiCpu,
  FiTarget,
  FiLayers,
} from 'react-icons/fi';
import { meterReadService, meterService } from '../services/api';
import './MeterReadingsPage.css';

const unwrap = (r) => r?.data?.data ?? r?.data ?? null;

const toList = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.content)) return payload.content;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
};

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const toDateTs = (value) => {
  const t = new Date(value).getTime();
  return Number.isFinite(t) ? t : 0;
};

const pickField = (obj, keys, fallback = null) => {
  for (const key of keys) {
    if (obj?.[key] !== undefined && obj?.[key] !== null) return obj[key];
  }
  return fallback;
};

const extractMeterRows = (input) => {
  const rows = [];
  const stack = [input];

  while (stack.length) {
    const node = stack.pop();
    if (!node) continue;

    if (Array.isArray(node)) {
      node.forEach((n) => stack.push(n));
      continue;
    }

    if (typeof node === 'object') {
      const meterId = pickField(node, ['meterId', 'meter_id']);
      const readingValue = pickField(node, ['readingValue', 'reading_value']);
      const readingDateTime = pickField(node, ['readingDateTime', 'reading_date_time', 'createdAt', 'created_at']);
      if (meterId !== null && meterId !== undefined && (readingValue !== null || readingDateTime !== null)) {
        rows.push(node);
      }

      Object.values(node).forEach((v) => {
        if (v && (Array.isArray(v) || typeof v === 'object')) stack.push(v);
      });
    }
  }

  return rows;
};

export default function MeterReadingsPage() {
  const [search, setSearch] = useState('');
  const [meterIdInput, setMeterIdInput] = useState('');
  const [customerIdInput, setCustomerIdInput] = useState('');
  const [reading, setReading] = useState('');
  const [notes, setNotes] = useState('');
  const [touched, setTouched] = useState({ meter: false, reading: false });
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [success, setSuccess] = useState('');
  const [liveTime, setLiveTime] = useState(new Date());
  const [entries, setEntries] = useState([]);
  const [meters, setMeters] = useState([]);
  const [rangeInfo, setRangeInfo] = useState(null);
  const [hasExplicitRange, setHasExplicitRange] = useState(false);
  const [loadingMeters, setLoadingMeters] = useState(true);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState('');

  const selectedMeter = useMemo(
    () => meters.find((m) => String(m.meterId) === String(meterIdInput)) || null,
    [meters, meterIdInput]
  );

  const fetchMeterCatalog = async () => {
    setLoadingMeters(true);
    setPageError('');
    try {
      const [metersRes, batchRes, missingRes, missingSummaryRes] = await Promise.allSettled([
        meterService.getAllMeters(),
        meterReadService.getBatch(),
        meterReadService.getMissing(),
        meterReadService.getMissingSummary(),
      ]);

      const meterIds = metersRes.status === 'fulfilled'
        ? toList(unwrap(metersRes.value)).map((m) => Number(m)).filter((n) => Number.isFinite(n))
        : [];

      const batchRows = batchRes.status === 'fulfilled' ? extractMeterRows(unwrap(batchRes.value)) : [];
      const missingRows = missingRes.status === 'fulfilled' ? extractMeterRows(unwrap(missingRes.value)) : [];

      const missingSummaryRows = missingSummaryRes.status === 'fulfilled'
        ? extractMeterRows(unwrap(missingSummaryRes.value))
        : [];

      const latestByMeter = new Map();
      [...batchRows, ...missingRows, ...missingSummaryRows].forEach((r) => {
        const meterId = pickField(r, ['meterId', 'meter_id', 'id']);
        if (meterId === undefined || meterId === null) return;
        const key = String(meterId);
        const current = latestByMeter.get(key);
        const candidateDate = pickField(r, ['readingDateTime', 'reading_date_time', 'createdAt', 'created_at']);
        const currentDate = pickField(current, ['readingDateTime', 'reading_date_time', 'createdAt', 'created_at']);
        if (!current || toDateTs(candidateDate) > toDateTs(currentDate)) {
          latestByMeter.set(key, r);
        }
      });

      meterIds.forEach((meterId) => {
        const key = String(meterId);
        if (!latestByMeter.has(key)) {
          latestByMeter.set(key, { meterId });
        }
      });

      // Enrich each meter from dedicated per-meter history endpoint.
      const historyResults = await Promise.allSettled(
        meterIds.map((id) => meterReadService.getByMeter(id))
      );

      historyResults.forEach((res, idx) => {
        if (res.status !== 'fulfilled') return;
        const meterId = meterIds[idx];
        const list = toList(unwrap(res.value));
        if (!Array.isArray(list) || list.length === 0) return;
        const latest = [...list].sort(
          (a, b) =>
            toDateTs(pickField(b, ['readingDateTime', 'reading_date_time', 'createdAt', 'created_at'])) -
            toDateTs(pickField(a, ['readingDateTime', 'reading_date_time', 'createdAt', 'created_at']))
        )[0];
        latestByMeter.set(String(meterId), latest);
      });

      const builtMeters = Array.from(latestByMeter.values())
        .map((r) => {
          const meterId = pickField(r, ['meterId', 'meter_id', 'id']);
          return {
            meterId,
            customerId: pickField(r, ['customerId', 'customer_id'], null),
            assetId: pickField(r, ['assetId', 'asset_id'], null),
            location: pickField(r, ['location', 'region'], '—'),
            name: pickField(r, ['meterName', 'meter_name'], `Meter ${meterId}`),
            unit: pickField(r, ['unit', 'readingUnit', 'reading_unit'], ''),
            lastReading: toNumber(pickField(r, ['readingValue', 'reading_value'])),
            lastReadAt: pickField(r, ['readingDateTime', 'reading_date_time', 'createdAt', 'created_at'], null),
          };
        })
        .sort((a, b) => Number(a.meterId) - Number(b.meterId));

      setMeters(builtMeters);

      if (builtMeters.length === 0) {
        setPageError('No readable meter rows found from backend responses.');
      }
    } catch {
      setMeters([]);
      setPageError('Unable to load meter records right now. You can still submit using Meter ID and Customer ID.');
    } finally {
      setLoadingMeters(false);
    }
  };

  const fetchSelectedMeterData = async (meterId) => {
    if (!meterId) {
      setEntries([]);
      setRangeInfo(null);
      setHasExplicitRange(false);
      return;
    }
    setLoadingEntries(true);
    try {
      const [historyRes, rangeRes] = await Promise.allSettled([
        meterReadService.getByMeter(meterId),
        meterReadService.getByMeterRange(meterId),
      ]);

      const history = historyRes.status === 'fulfilled'
        ? toList(unwrap(historyRes.value)).sort(
          (a, b) => toDateTs(pickField(b, ['readingDateTime', 'reading_date_time', 'createdAt', 'created_at'])) - toDateTs(pickField(a, ['readingDateTime', 'reading_date_time', 'createdAt', 'created_at']))
        )
        : [];

      setEntries(history);

      if (history.length > 0) {
        const latest = history[0];
        const latestCustomerId = pickField(latest, ['customerId', 'customer_id']);
        if ((customerIdInput === '' || Number.isNaN(Number(customerIdInput))) && latestCustomerId !== null && latestCustomerId !== undefined) {
          setCustomerIdInput(String(latestCustomerId));
        }

        const latestReading = toNumber(pickField(latest, ['readingValue', 'reading_value']));
        const latestUnit = pickField(latest, ['unit', 'readingUnit', 'reading_unit'], '');

        setMeters((prev) => {
          const exists = prev.some((m) => String(m.meterId) === String(meterId));
          if (exists) return prev;
          return [
            {
              meterId: Number(meterId),
              customerId: latestCustomerId ?? null,
              assetId: pickField(latest, ['assetId', 'asset_id'], null),
              location: pickField(latest, ['location', 'region'], '—'),
              name: `Meter ${meterId}`,
              unit: latestUnit,
              lastReading: latestReading,
              lastReadAt: pickField(latest, ['readingDateTime', 'reading_date_time', 'createdAt', 'created_at'], null),
            },
            ...prev,
          ];
        });
      }

      const rangePayload = rangeRes.status === 'fulfilled' ? unwrap(rangeRes.value) : null;
      const rangeObj = Array.isArray(rangePayload) ? rangePayload[0] : rangePayload;

      let min = toNumber(
        rangeObj?.minReading ?? rangeObj?.minimumReading ?? rangeObj?.min ?? rangeObj?.rangeMin ?? rangeObj?.lowerBound
      );
      let max = toNumber(
        rangeObj?.maxReading ?? rangeObj?.maximumReading ?? rangeObj?.max ?? rangeObj?.rangeMax ?? rangeObj?.upperBound
      );
      const explicitRangeAvailable = min !== null && max !== null;
      setHasExplicitRange(explicitRangeAvailable);

      if ((min === null || max === null) && history.length) {
        const vals = history.map((h) => toNumber(pickField(h, ['readingValue', 'reading_value']))).filter((v) => v !== null);
        if (vals.length) {
          // Do not lock technician input to a single historical value range.
          // Keep lower bound practical and skip strict max when backend range is unavailable.
          min = 0;
          max = null;
        }
      }

      setRangeInfo(min !== null && max !== null ? { min, max } : null);
    } catch {
      setEntries([]);
      setRangeInfo(null);
      setHasExplicitRange(false);
    } finally {
      setLoadingEntries(false);
    }
  };

  useEffect(() => {
    const t = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetchMeterCatalog();
  }, []);

  useEffect(() => {
    fetchSelectedMeterData(meterIdInput);
  }, [meterIdInput, fetchSelectedMeterData]);

  useEffect(() => {
    if (!selectedMeter) return;
    if (selectedMeter.customerId !== null && selectedMeter.customerId !== undefined && customerIdInput === '') {
      setCustomerIdInput(String(selectedMeter.customerId));
    }
  }, [selectedMeter, customerIdInput]);

  const filteredMeters = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return meters;
    return meters.filter((m) =>
      String(m.meterId).toLowerCase().includes(q) ||
      String(m.assetId || '').toLowerCase().includes(q) ||
      String(m.name || '').toLowerCase().includes(q) ||
      String(m.location || '').toLowerCase().includes(q)
    );
  }, [search, meters]);

  const validation = useMemo(() => {
    const next = {};
    if (!meterIdInput || Number.isNaN(Number(meterIdInput))) {
      next.meter = 'Meter ID is required and must be numeric.';
    }
    if (!customerIdInput || Number.isNaN(Number(customerIdInput))) {
      next.customer = 'Customer ID is required and must be numeric.';
    }
    if (reading === '') {
      next.reading = 'Reading value is required.';
    } else if (Number.isNaN(Number(reading))) {
      next.reading = 'Reading must be numeric.';
    } else if (meterIdInput && rangeInfo && hasExplicitRange) {
      const value = Number(reading);
      if (value < rangeInfo.min || value > rangeInfo.max) {
        next.reading = `Reading must be between ${rangeInfo.min} and ${rangeInfo.max}.`;
      }
    }
    return next;
  }, [reading, meterIdInput, customerIdInput, rangeInfo, hasExplicitRange]);

  const readingState = useMemo(() => {
    if (!meterIdInput || !selectedMeter || reading === '' || Number.isNaN(Number(reading))) return 'idle';
    const value = Number(reading);
    if (value < 0) return 'invalid';
    if (rangeInfo && hasExplicitRange && (value < rangeInfo.min || value > rangeInfo.max)) return 'invalid';
    if (selectedMeter.lastReading !== null && selectedMeter.lastReading !== undefined && value < Number(selectedMeter.lastReading)) return 'warning';
    return 'valid';
  }, [reading, meterIdInput, selectedMeter, rangeInfo, hasExplicitRange]);

  const canSubmit = Object.keys(validation).length === 0;

  const handleReset = () => {
    setSearch('');
    setMeterIdInput('');
    setCustomerIdInput('');
    setReading('');
    setNotes('');
    setTouched({ meter: false, reading: false });
    setAttemptedSubmit(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAttemptedSubmit(true);
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      await meterReadService.createManual([
        {
          meterId: Number(meterIdInput),
          customerId: Number(customerIdInput),
          readingDateTime: new Date().toISOString().slice(0, 19),
          readingValue: Number(reading),
          readingQuality: 'GOOD',
          readingType: 'AUTOMATIC',
        },
      ]);

      setSuccess('Meter reading recorded successfully');
      setReading('');
      setNotes('');
      setTouched({ meter: false, reading: false });
      setAttemptedSubmit(false);
      await fetchSelectedMeterData(meterIdInput);
      await fetchMeterCatalog();
      setTimeout(() => setSuccess(''), 3000);
    } catch (ex) {
      const msg = ex?.response?.data?.message || ex?.response?.data?.error || 'Unable to save reading. Verify meter/customer IDs and try again.';
      setPageError(String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  const showMeterError = (touched.meter || attemptedSubmit) && validation.meter;
  const showCustomerError = (touched.meter || attemptedSubmit) && validation.customer;
  const showReadingError = (touched.reading || attemptedSubmit) && validation.reading;

  const entriesToday = useMemo(() => {
    const today = new Date().toDateString();
    return entries.filter((e) => new Date(e.readingDateTime || e.createdAt || e.timestamp).toDateString() === today).length;
  }, [entries]);

  const readingStateLabel = {
    idle: 'Awaiting reading',
    valid: 'Valid input',
    warning: 'Check value',
    invalid: 'Invalid input',
  }[readingState];

  return (
    <section className="mr-page">
      <div className="mr-glow mr-glow-cyan" />
      <div className="mr-glow mr-glow-violet" />

      <div className="mr-header">
        <span className="mr-label">Field Work · Technician</span>
        <h1 className="mr-title">Record Meter Reading</h1>
        <p className="mr-desc">Capture and submit meter readings from the field.</p>
      </div>

      <div className="mr-strip">
        <div className="mr-strip-item">
          <FiCpu />
          <div>
            <small>Selected Meter</small>
            <strong>{meterIdInput || 'Not selected'}</strong>
          </div>
        </div>
        <div className="mr-strip-item">
          <FiTarget />
          <div>
            <small>Reading Status</small>
            <strong className={`mr-state-${readingState}`}>{readingStateLabel}</strong>
          </div>
        </div>
        <div className="mr-strip-item">
          <FiLayers />
          <div>
            <small>Entries Today</small>
            <strong>{entriesToday}</strong>
          </div>
        </div>
      </div>

      <div className="mr-grid">
        <div className="mr-card">
          <div className="mr-card-head">
            <h3 className="mr-card-title"><FiActivity /> Record Meter Reading</h3>
            <span className="mr-card-tag">Live Entry</span>
          </div>

          <label className="mr-field">
            <span><FiSearch size={13} style={{ marginRight: 6 }} />Search Meter</span>
            <div className="mr-search-wrap">
              <FiSearch className="mr-search-icon" />
              <input
                className={`mr-input ${showMeterError ? 'mr-input-error' : ''}`}
                placeholder="Search by meter ID, asset ID, or location"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                }}
              />
            </div>
            <small className="mr-help">Type at least 2 characters to narrow choices quickly.</small>
            {showMeterError && <small className="mr-error">{validation.meter}</small>}
          </label>

          {pageError && <div className="mr-error" style={{ marginBottom: 10 }}>{pageError}</div>}

          <label className="mr-field">
            <span><FiCpu size={13} style={{ marginRight: 6 }} />Select Meter</span>
            <select
              className={`mr-input ${showMeterError ? 'mr-input-error' : ''}`}
              value={meterIdInput}
              onChange={(e) => {
                setMeterIdInput(e.target.value);
                setTouched((p) => ({ ...p, meter: true }));
              }}
              disabled={loadingMeters}
            >
              <option value="">{loadingMeters ? 'Loading meters…' : '-- Select a meter --'}</option>
              {filteredMeters.map((m) => (
                <option key={m.meterId} value={String(m.meterId)}>
                  {m.meterId} · {m.assetId || '—'} · {m.location || '—'}
                </option>
              ))}
            </select>
          </label>

          <div className="mr-meter-list">
            {filteredMeters.slice(0, 6).map((m) => (
              <button
                type="button"
                key={m.meterId}
                className={`mr-meter-item ${String(meterIdInput) === String(m.meterId) ? 'mr-meter-item-active' : ''}`}
                onClick={() => {
                  setMeterIdInput(String(m.meterId));
                  if (m.customerId !== null && m.customerId !== undefined) {
                    setCustomerIdInput(String(m.customerId));
                  }
                  setTouched((p) => ({ ...p, meter: true }));
                }}
              >
                <strong>{m.meterId}</strong>
                <span>{m.assetId || '—'} · {m.name || 'Meter'}</span>
                <em><FiMapPin size={12} /> {m.location}</em>
              </button>
            ))}
            {!loadingMeters && filteredMeters.length === 0 && <div className="mr-empty">No matching meters.</div>}
          </div>

          {selectedMeter && (
            <div className="mr-selected">
              <span className="mr-selected-chip">Selected</span>
              <strong>{selectedMeter.meterId}</strong> · {selectedMeter.assetId || '—'} · {selectedMeter.location}
              <span className="mr-sep">•</span>
              Last reading {selectedMeter.lastReading ?? '—'} {selectedMeter.unit || ''}
            </div>
          )}

          <div className="mr-reading-wrap" style={{ marginBottom: 10 }}>
            <label className="mr-field" style={{ marginBottom: 0 }}>
              <span>Meter ID *</span>
              <input
                className={`mr-input ${showMeterError ? 'mr-input-error' : ''}`}
                type="number"
                value={meterIdInput}
                onChange={(e) => {
                  setMeterIdInput(e.target.value);
                  setTouched((p) => ({ ...p, meter: true }));
                }}
              />
              {showMeterError && <small className="mr-error">{validation.meter}</small>}
            </label>
            <label className="mr-field" style={{ marginBottom: 0 }}>
              <span>Customer ID *</span>
              <input
                className={`mr-input ${showCustomerError ? 'mr-input-error' : ''}`}
                type="number"
                value={customerIdInput}
                onChange={(e) => {
                  setCustomerIdInput(e.target.value);
                  setTouched((p) => ({ ...p, meter: true }));
                }}
              />
              {showCustomerError && <small className="mr-error">{validation.customer}</small>}
            </label>
          </div>

          <form onSubmit={handleSubmit} className="mr-form" noValidate>
            <label className="mr-field">
              <span><FiTarget size={13} style={{ marginRight: 6 }} />Reading Value</span>
              <div className="mr-reading-wrap">
                <input
                  className={`mr-input ${showReadingError ? 'mr-input-error' : ''}`}
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  placeholder={selectedMeter && rangeInfo ? `Range ${rangeInfo.min} - ${rangeInfo.max}` : 'Enter numeric reading'}
                  value={reading}
                  onBlur={() => setTouched((p) => ({ ...p, reading: true }))}
                  onChange={(e) => {
                    setReading(e.target.value);
                    setTouched((p) => ({ ...p, reading: true }));
                  }}
                />
                <span className="mr-unit-pill">{selectedMeter?.unit || '—'}</span>
              </div>
              {showReadingError && <small className="mr-error">{validation.reading}</small>}
              {!showReadingError && readingState === 'valid' && (
                <small className="mr-valid"><FiCheckCircle size={13} /> Reading is within allowed range.</small>
              )}
              {!showReadingError && readingState === 'warning' && (
                <small className="mr-warn"><FiAlertTriangle size={13} /> Reading is below last captured value. Confirm meter value.</small>
              )}
            </label>

            <div className="mr-timestamp-row">
              <FiClock />
              <span>Date & Time auto-captured: <strong>{liveTime.toLocaleString()}</strong></span>
            </div>

            <label className="mr-field">
              <span><FiEdit3 size={13} style={{ marginRight: 6 }} />Notes / Observations (Optional)</span>
              <textarea
                className="mr-input mr-notes"
                rows={3}
                placeholder="Unusual noise, damaged seal, display flicker, access issue…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>

            <div className="mr-actions">
              <button
                type="button"
                className="mr-reset"
                onClick={handleReset}
                disabled={submitting}
              >
                <FiRefreshCw size={14} /> Reset
              </button>
              <button type="submit" className="mr-submit" disabled={!canSubmit || submitting}>
                {submitting ? 'Submitting…' : 'Submit Reading'}
              </button>
            </div>
          </form>
        </div>

        <div className="mr-card">
          <div className="mr-card-head">
            <h3 className="mr-card-title"><FiLayers /> Recent Entries</h3>
            <span className="mr-card-tag">Latest 8</span>
          </div>
          <div className="mr-entry-list">
            {loadingEntries ? (
              <div className="mr-empty">Loading readings…</div>
            ) : entries.length === 0 ? (
              <div className="mr-empty">No readings submitted yet.</div>
            ) : (
              entries.slice(0, 8).map((entry) => (
                <div key={entry.id || `${entry.meterId}-${entry.readingDateTime}`} className="mr-entry-item">
                  <div className="mr-entry-head">
                    <strong>{pickField(entry, ['meterId', 'meter_id'])}</strong>
                    <span>{pickField(entry, ['readingValue', 'reading_value'])} {pickField(entry, ['unit', 'readingUnit', 'reading_unit'], '')}</span>
                  </div>
                  <div className="mr-entry-sub">Customer {pickField(entry, ['customerId', 'customer_id'], '—')} · {selectedMeter?.location || '—'}</div>
                  <div className="mr-entry-time">{pickField(entry, ['readingDateTime', 'reading_date_time']) ? new Date(pickField(entry, ['readingDateTime', 'reading_date_time'])).toLocaleString() : '—'}</div>
                  {entry.notes && <div className="mr-entry-note">Note: {entry.notes}</div>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {success && (
        <div className="mr-toast" role="status" aria-live="polite">
          <FiCheckCircle /> {success}
        </div>
      )}
    </section>
  );
}
