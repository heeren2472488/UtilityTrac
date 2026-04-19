import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FiAlertTriangle,
  FiActivity,
  FiDollarSign,
  FiUploadCloud,
  FiFileText,
  FiCheckCircle,
  FiXCircle,
  FiSearch,
  FiRefreshCw,
  FiClock,
  FiChevronDown,
  FiChevronUp,
  FiEdit3,
  FiSave,
  FiFilter,
  FiAlertCircle,
} from 'react-icons/fi';
import NotificationBell from './NotificationBell';
import { meterReadService, usageAggregateService } from '../../services/api';
import ThemeToggleButton from '../layout/ThemeToggleButton';
import './Dashboard.css';

const BILLING_ALERTS = [
  { id: 1, type: 'critical', title: 'Abnormal consumption', body: 'Meter MTR-2026-001: usage 3x above monthly average', time: '10 min ago' },
  { id: 2, type: 'warning',  title: 'Missing meter read', body: 'MTR-004 has no reading for Apr 14. Estimation required.', time: '2 hr ago' },
  { id: 3, type: 'warning',  title: 'Tariff plan expiring', body: 'Residential Tier A tariff expires in 14 days', time: '5 hr ago' },
  { id: 4, type: 'info',     title: 'Billing reference updated', body: 'Account REF-00228 mapped to new Commercial Tier B', time: '1 day ago' },
];

const SCOPE_CARDS = [
  { icon: FiActivity,    label: 'Meter Read Overview',             desc: 'Read-only meter timeline with quality, source and ACTUAL/ESTIMATED status.', color: '#5ee6ff' },
  { icon: FiAlertTriangle, label: 'Usage Validation & Missing Reads', desc: 'Surface missing intervals and close validation gaps with clear status.',  color: '#f87171' },
  { icon: FiFileText,    label: 'Estimation & Gap Review',         desc: 'Review ESTIMATED and INTERPOLATED reads for audit-ready traceability.',      color: '#fbbf24' },
  { icon: FiDollarSign,  label: 'Billing Configuration',           desc: 'Billing reference and tariff mapping visibility (read-only Phase-1).',       color: '#a78bfa' },
];

const unwrap = (r) => r?.data?.data ?? r?.data ?? null;

const toList = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.content)) return payload.content;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.results)) return payload.results;
  if (Array.isArray(payload.records)) return payload.records;
  if (Array.isArray(payload.readings)) return payload.readings;
  if (Array.isArray(payload.meterReads)) return payload.meterReads;

  if (typeof payload === 'object') {
    const firstArrayValue = Object.values(payload).find((v) => Array.isArray(v));
    if (Array.isArray(firstArrayValue)) return firstArrayValue;
  }

  return [];
};

const getMeterValue = (row) => {
  return pick(row, [
    'meterId',
    'meter_id',
    'meterNo',
    'meterNumber',
    'meterCode',
    'meter',
  ], row?.meter?.id ?? row?.meter?.meterId ?? row?.meter?.meterNumber ?? null);
};

const pick = (obj, keys, fallback = null) => {
  for (const k of keys) {
    if (obj?.[k] !== undefined && obj?.[k] !== null) return obj[k];
  }
  return fallback;
};

const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const hasReadingValue = (row) => {
  const raw = pick(row, ['readingValue', 'reading_value', 'value'], null);
  return raw !== null && raw !== undefined && String(raw).trim() !== '';
};

const getDisplayReadType = (row) => {
  const explicitType = String(pick(row, ['readType', 'readingType', 'type'], '')).toUpperCase();
  const source = String(pick(row, ['source', 'readingSource', 'readSource'], '')).toUpperCase();
  const missing = String(pick(row, ['status', 'missingStatus'], '')).toUpperCase();

  if (explicitType.includes('MISSING') || missing.includes('MISSING')) return 'MISSING';
  if (explicitType.includes('INTERPOL') || source.includes('INTERPOL')) return 'INTERPOLATED';
  if (explicitType.includes('ESTIMAT') || source.includes('ESTIMAT')) return 'ESTIMATED';
  if (explicitType) return explicitType;
  return 'ACTUAL';
};

const shouldDisplayOverviewRow = (row) => {
  if (hasReadingValue(row)) return true;
  const t = getDisplayReadType(row);
  return t === 'MISSING' || t === 'ESTIMATED' || t === 'INTERPOLATED';
};

const normalizeAggregateRows = (payload) => {
  let list = toList(payload);
  if (!list.length && payload && typeof payload === 'object' && !Array.isArray(payload)) {
    list = [payload];
  }

  return list.map((row, idx) => {
    const periodStart = pick(row, ['periodStart', 'startDate', 'from', 'date'], null);
    const periodEnd = pick(row, ['periodEnd', 'endDate', 'to'], null);
    const period = pick(row, ['period', 'bucket', 'periodLabel'], null);

    const totalUsage = toNumber(pick(row, ['totalUsage', 'usageTotal', 'aggregatedUsage', 'consumption', 'total', 'units'], 0), 0);
    const readCount = Math.max(0, toNumber(pick(row, ['readCount', 'count', 'records', 'totalReads'], 0), 0));
    const averageUsage = toNumber(pick(row, ['averageUsage', 'avgUsage', 'meanUsage', 'average'], readCount > 0 ? totalUsage / readCount : totalUsage), readCount > 0 ? totalUsage / readCount : totalUsage);
    const minUsage = toNumber(pick(row, ['minUsage', 'minimumUsage', 'min'], averageUsage), averageUsage);
    const maxUsage = toNumber(pick(row, ['maxUsage', 'maximumUsage', 'max'], averageUsage), averageUsage);

    const fallbackPeriod = periodStart
      ? `${String(periodStart).slice(0, 10)}${periodEnd ? ` → ${String(periodEnd).slice(0, 10)}` : ''}`
      : `Summary ${idx + 1}`;

    return {
      period: String(period || fallbackPeriod),
      periodStart,
      periodEnd,
      readCount,
      totalUsage,
      averageUsage,
      minUsage,
      maxUsage,
      customerId: pick(row, ['customerId', 'customer_id'], ''),
      meterId: pick(row, ['meterId', 'meter_id'], ''),
      tariffId: pick(row, ['tariffId', 'tariff_id'], ''),
      billingStatus: pick(row, ['billingStatus', 'status'], ''),
    };
  });
};

const toTs = (value) => {
  const t = new Date(value).getTime();
  return Number.isFinite(t) ? t : 0;
};

const toIsoDay = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const startOfWeekIso = (date) => {
  const copy = new Date(date);
  const day = (copy.getDay() + 6) % 7; // Monday = 0
  copy.setDate(copy.getDate() - day);
  copy.setHours(0, 0, 0, 0);
  return toIsoDay(copy);
};

const periodKeyFor = (dateValue, period) => {
  const date = new Date(dateValue);
  if (!Number.isFinite(date.getTime())) return String(dateValue || 'Unknown');
  if (period === 'MONTH') {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }
  if (period === 'WEEK') {
    return `Week of ${startOfWeekIso(date)}`;
  }
  return toIsoDay(date);
};

const statusPill = (status) => {
  const s = String(status || '').toUpperCase();
  if (['COMPLETED', 'SUCCESS', 'GOOD', 'ACTUAL', 'FILLED'].includes(s)) {
    return { bg: 'rgba(52,211,153,0.12)', color: '#34d399', bd: 'rgba(52,211,153,0.35)' };
  }
  if (['SKIPPED', 'ESTIMATED', 'INTERPOLATED', 'PENDING', 'REVIEW'].includes(s)) {
    return { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24', bd: 'rgba(251,191,36,0.35)' };
  }
  return { bg: 'rgba(248,113,113,0.12)', color: '#f87171', bd: 'rgba(248,113,113,0.35)' };
};

const parseBatchSummary = (raw, fileName = 'CSV File') => {
  const data = raw || {};
  const total = Number(pick(data, ['totalRecords', 'total', 'recordCount'], 0)) || 0;
  const success = Number(pick(data, ['successCount', 'processedCount', 'successfulRecords'], 0)) || 0;
  const skipped = Number(pick(data, ['skippedCount', 'skipCount'], 0)) || 0;
  const errors = Number(pick(data, ['errorCount', 'failedCount', 'errors'], 0)) || 0;
  const status = String(pick(data, ['status', 'uploadStatus'], errors > 0 ? 'FAILED' : 'COMPLETED')).toUpperCase();
  const id = pick(data, ['id', 'batchId', 'uploadId'], null);
  const timestamp = pick(data, ['timestamp', 'createdAt', 'uploadedAt'], new Date().toISOString());
  const errRows = toList(pick(data, ['errorRows', 'errors', 'failedRows', 'validationErrors'], []));

  return {
    id,
    fileName: pick(data, ['fileName', 'name'], fileName),
    status,
    total,
    success,
    skipped,
    errors,
    timestamp,
    errorRows: errRows,
  };
};

const paginate = (list, page, size) => list.slice(page * size, page * size + size);

export default function BillingDashboard() {
  const [searchParams] = useSearchParams();
  const activeSection = searchParams.get('section') || 'all'; // 'all'|'overview'|'validation'|'estimation'|'config'

  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [expandedBatchKey, setExpandedBatchKey] = useState('');
  const [toasts, setToasts] = useState([]);

  const [meterIdFilter, setMeterIdFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [overviewRows, setOverviewRows] = useState([]);
  const [overviewLoading, setOverviewLoading] = useState(false);

  const [missingSummary, setMissingSummary] = useState({ totalMissing: 0, gapsFilled: 0, remaining: 0 });
  const [missingRows, setMissingRows] = useState([]);
  const [missingLoading, setMissingLoading] = useState(false);

  const [historyPage, setHistoryPage] = useState(0);
  const [missingPage, setMissingPage] = useState(0);
  const [overviewPage, setOverviewPage] = useState(0);
  const [overviewSort, setOverviewSort] = useState({ key: 'date', dir: 'desc' });
  const [sortBy, setSortBy] = useState({ key: 'timestamp', dir: 'desc' });

  // ── Aggregated Usage Summary state ────────────────────────
  const [aggPeriod, setAggPeriod] = useState('DAY'); // DAY | WEEK | MONTH
  const [aggCustomerId, setAggCustomerId] = useState('');
  const [aggMeterFilter, setAggMeterFilter] = useState('');
  const [aggTariffId, setAggTariffId] = useState('');
  const [aggFromDate, setAggFromDate] = useState('');
  const [aggToDate, setAggToDate] = useState('');
  const [aggLoading, setAggLoading] = useState(false);
  const [aggRows, setAggRows] = useState([]);
  const [aggReadyRows, setAggReadyRows] = useState([]);
  const [aggRawCount, setAggRawCount] = useState(0);
  const [aggLoadMs, setAggLoadMs] = useState(0);
  const [aggSource, setAggSource] = useState('');
  const [billingReadyCount, setBillingReadyCount] = useState(0);
  const [aggAutoLoadAttempted, setAggAutoLoadAttempted] = useState(false);
  const [selectedUsageAlert, setSelectedUsageAlert] = useState(null);

  // ── Estimation & Gap Review state ────────────────────────
  const [estLabelFilter, setEstLabelFilter]   = useState('ALL');   // ALL | ESTIMATED | INTERPOLATED
  const [estMeterFilter, setEstMeterFilter]   = useState('');
  const [estDateFrom,    setEstDateFrom]      = useState('');
  const [estDateTo,      setEstDateTo]        = useState('');
  const [editingRowId,   setEditingRowId]     = useState(null);    // id of row being overridden
  const [editValue,      setEditValue]        = useState('');
  const [editNote,       setEditNote]         = useState('');
  const [savingId,       setSavingId]         = useState(null);
  const [overrideDone,   setOverrideDone]     = useState({});      // { [id]: true } saved rows
  const [overrideErrors, setOverrideErrors]   = useState({});      // { [id]: msg }
  const [estPage,        setEstPage]          = useState(0);
  const EST_PAGE_SIZE = 8;

  const pushToast = (type, text) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((p) => [...p, { id, type, text }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3200);
  };

  const loadBatchHistory = async () => {
    setHistoryLoading(true);
    try {
      console.log('[BillingDashboard] Loading batch history...');
      const res = await meterReadService.getBatch();
      const list = toList(unwrap(res)).map((r) => parseBatchSummary(r, pick(r, ['fileName', 'name'], 'Batch Upload')));
      const sorted = [...list].sort((a, b) => toTs(b.timestamp) - toTs(a.timestamp));
      setHistory(sorted);
      console.log(`[BillingDashboard] Batch history loaded: ${sorted.length} batches`, sorted);
    } catch (err) {
      console.error('[BillingDashboard] Batch history load failed:', err?.response?.data || err?.message || err);
      setHistory([]);
      pushToast('error', 'Unable to load batch history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadMissingData = async () => {
    setMissingLoading(true);
    try {
      console.log('[BillingDashboard] Loading missing reads data...');
      const [sumRes, listRes] = await Promise.all([
        meterReadService.getMissingSummary(),
        meterReadService.getMissing(),
      ]);
      const sum = unwrap(sumRes) || {};
      setMissingSummary({
        totalMissing: Number(pick(sum, ['totalMissingReads', 'totalMissing', 'missingCount'], 0)) || 0,
        gapsFilled: Number(pick(sum, ['gapsFilled', 'filledCount'], 0)) || 0,
        remaining: Number(pick(sum, ['remainingGaps', 'remainingCount'], 0)) || 0,
      });
      const list = toList(unwrap(listRes));
      setMissingRows(list);
      console.log('[BillingDashboard] Missing reads loaded:', { summary: sum, listCount: list.length }, list);
    } catch (err) {
      console.error('[BillingDashboard] Missing data load failed:', err?.response?.data || err?.message || err);
      setMissingSummary({ totalMissing: 0, gapsFilled: 0, remaining: 0 });
      setMissingRows([]);
      pushToast('error', 'Unable to load missing reads');
    } finally {
      setMissingLoading(false);
    }
  };

  useEffect(() => {
    loadBatchHistory();
    loadMissingData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!aggMeterFilter && meterIdFilter) {
      setAggMeterFilter(String(meterIdFilter));
    }
  }, [meterIdFilter, aggMeterFilter]);

  const onFilePick = (incoming) => {
    const picked = Array.from(incoming || []).filter((f) => f.name.toLowerCase().endsWith('.csv'));
    setFiles((prev) => {
      const map = new Map(prev.map((f) => [f.name + f.size, f]));
      picked.forEach((f) => map.set(f.name + f.size, f));
      return Array.from(map.values());
    });
  };

  const handleUpload = async () => {
    if (!files.length) return;
    setUploading(true);
    const results = [];
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('files', file);
        console.log(`[BillingDashboard] Uploading file: ${file.name} (${file.size} bytes)`);
        const res = await meterReadService.importBatch(formData);
        console.log(`[BillingDashboard] Upload response for ${file.name}:`, res);
        const summary = parseBatchSummary(unwrap(res), file.name);
        results.push(summary);
        const errorRate = summary.total > 0 ? summary.errors / summary.total : 0;
        const msg = `${summary.fileName}: ${summary.total} total, ${summary.success} success, ${summary.errors} error${summary.errors !== 1 ? 's' : ''}`;
        pushToast(errorRate >= 0.3 ? 'warn' : 'success', msg);
        console.log(`[BillingDashboard] ${file.name} parsed:`, summary);
      } catch (err) {
        console.error(`[BillingDashboard] Upload failed for ${file.name}:`, err?.response?.data || err?.message || err);
        const fail = {
          id: null,
          fileName: file.name,
          status: 'FAILED',
          total: 0,
          success: 0,
          skipped: 0,
          errors: 1,
          timestamp: new Date().toISOString(),
          errorRows: [{ message: err?.response?.data?.message || err?.message || 'Unknown error', rawData: err?.response?.data }],
        };
        results.push(fail);
        const errMsg = err?.response?.status === 403 ? 'Permission denied' : err?.response?.status === 400 ? 'Invalid file format' : 'Upload failed';
        pushToast('error', `${file.name}: ${errMsg}`);
      }
    }
    setUploadResults((prev) => [...results, ...prev].slice(0, 20));
    setFiles([]);
    setUploading(false);
    loadBatchHistory();
  };

  const loadBatchDetail = async (id) => {
    if (!id) return;
    try {
      const res = await meterReadService.getBatchById(id);
      setSelectedBatch(parseBatchSummary(unwrap(res), `Batch ${id}`));
      setExpandedBatchKey(String(id));
    } catch {
      pushToast('error', `Unable to load batch details #${id}`);
    }
  };

  const loadOverview = async () => {
    const meterInput = String(meterIdFilter || '').trim();
    if (!meterInput) {
      setOverviewRows([]);
      pushToast('warn', 'Enter a Meter ID to load readings');
      return;
    }
    setOverviewLoading(true);
    try {
      console.log(`[BillingDashboard] Loading overview for meter ${meterInput}, dates: ${fromDate || 'none'} to ${toDate || 'none'}`);
      const [historyRes, rangeRes] = await Promise.allSettled([
        meterReadService.getByMeter(meterInput),
        meterReadService.getByMeterRange(meterInput, {
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
          from: fromDate || undefined,
          to: toDate || undefined,
        }),
      ]);

      const history = historyRes.status === 'fulfilled' ? toList(unwrap(historyRes.value)) : [];
      const range = rangeRes.status === 'fulfilled' ? toList(unwrap(rangeRes.value)) : [];
      
      console.log(`[BillingDashboard] Meter ${meterInput} - history: ${history.length} rows, range: ${range.length} rows`);
      
      let rows = range.length ? range : history;

      if (fromDate || toDate) {
        const fromTs = fromDate ? new Date(fromDate).getTime() : -Infinity;
        const toTs = toDate ? new Date(`${toDate}T23:59:59`).getTime() : Infinity;
        rows = rows.filter((r) => {
          const ts = toTsVal(pick(r, ['readingDateTime', 'reading_date_time', 'createdAt', 'created_at']));
          return ts >= fromTs && ts <= toTs;
        });
        console.log(`[BillingDashboard] After date filter: ${rows.length} rows`);
      }

      const deduped = [];
      const seen = new Set();
      rows.forEach((r) => {
        const id = pick(r, ['id'], null);
        const ts = pick(r, ['readingDateTime', 'reading_date_time', 'createdAt', 'created_at'], '');
        const mv = pick(r, ['readingValue', 'reading_value'], '');
        const mk = getMeterValue(r);
        const key = `${id ?? 'x'}|${mk}|${ts}|${mv}`;
        if (!seen.has(key)) {
          seen.add(key);
          deduped.push(r);
        }
      });

      const visibleRows = deduped.filter(shouldDisplayOverviewRow);
      const hiddenCount = deduped.length - visibleRows.length;

      setOverviewRows(visibleRows.sort((a, b) => toTsVal(pick(b, ['readingDateTime', 'reading_date_time', 'createdAt', 'created_at'])) - toTsVal(pick(a, ['readingDateTime', 'reading_date_time', 'createdAt', 'created_at']))));
      if (visibleRows.length > 0) {
        pushToast('success', `Loaded ${visibleRows.length} meter reads for meter ${meterInput}${hiddenCount > 0 ? ` (${hiddenCount} non-billing rows hidden)` : ''}`);
      } else {
        pushToast('warn', `No readings found for meter ${meterInput}`);
      }
    } catch (err) {
      console.error(`[BillingDashboard] Overview load failed:`, err?.response?.data || err?.message || err);
      setOverviewRows([]);
      pushToast('error', `Failed to load readings: ${err?.response?.status === 403 ? 'Access denied' : 'Check meter ID'}`);
    } finally {
      setOverviewLoading(false);
    }
  };

  useEffect(() => {
    const meterInput = String(meterIdFilter || '').trim();
    if (!meterInput || !['all', 'overview'].includes(activeSection)) return;
    const t = setTimeout(() => {
      loadOverview();
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meterIdFilter, fromDate, toDate, activeSection]);

  const loadAggregatedUsage = useCallback(async () => {
    const startedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();
    setAggLoading(true);
    try {
      const customerIdRaw = String(aggCustomerId || '').trim();
      const meterIdRaw = String(aggMeterFilter || '').trim();
      const customerLooksLikeMeter = /^\d+$/.test(customerIdRaw);
      const customerId = customerLooksLikeMeter ? '' : customerIdRaw;
      const meterId = meterIdRaw || (customerLooksLikeMeter ? customerIdRaw : '');
      const tariffId = String(aggTariffId || '').trim();

      let normalized = [];
      let source = '';

      // Always refresh billing-ready count quickly
      const billingReadyPromise = usageAggregateService.getBillingReady();

      // 1) Primary endpoint from backend contract
      if (customerId && meterId && aggFromDate && aggToDate) {
        const aggregateRes = await usageAggregateService.aggregate({
          customerId,
          meterId,
          periodStart: aggFromDate,
          periodEnd: aggToDate,
          tariffId: tariffId || undefined,
        });
        normalized = normalizeAggregateRows(unwrap(aggregateRes));
        source = 'aggregate';
      }

      // 2) Report endpoint (customer + date range)
      if (!normalized.length && customerId && aggFromDate && aggToDate) {
        const reportRes = await usageAggregateService.getReport({
          customerId,
          from: aggFromDate,
          to: aggToDate,
        });
        normalized = normalizeAggregateRows(unwrap(reportRes));
        source = 'report';
      }

      // 3) By-customer endpoint
      if (!normalized.length && customerId) {
        const byCustomerRes = await usageAggregateService.getByCustomerId(customerId);
        normalized = normalizeAggregateRows(unwrap(byCustomerRes));
        source = 'customer';
      }

      // 4) Summary endpoint
      if (!normalized.length) {
        const summaryRes = await usageAggregateService.getSummary();
        normalized = normalizeAggregateRows(unwrap(summaryRes));
        source = 'summary';
      }

      // 5) Billing-ready endpoint as display fallback
      const billingReadyRes = await billingReadyPromise.catch(() => null);
      const readyList = billingReadyRes ? toList(unwrap(billingReadyRes)) : [];
      const normalizedReady = normalizeAggregateRows(readyList);
      setBillingReadyCount(readyList.length);
      setAggReadyRows(normalizedReady);

      if (!normalized.length && normalizedReady.length) {
        normalized = normalizedReady;
        source = 'billing-ready';
      }

      // No meter-read fallback here: backend provided dedicated usage-aggregate APIs.
      // This avoids repeated /meter-reads 500 errors when that resource is unavailable.

      // If backend rows are daily-ish, allow UI period regrouping
      const regroupedMap = new Map();
      normalized.forEach((row) => {
        const dateSeed = row.periodStart || row.periodEnd || row.period;
        const period = periodKeyFor(dateSeed, aggPeriod);
        const current = regroupedMap.get(period) || {
          period,
          readCount: 0,
          totalUsage: 0,
          minUsage: Number.POSITIVE_INFINITY,
          maxUsage: Number.NEGATIVE_INFINITY,
        };
        current.readCount += toNumber(row.readCount, 1);
        current.totalUsage += toNumber(row.totalUsage, 0);
        current.minUsage = Math.min(current.minUsage, toNumber(row.minUsage, toNumber(row.averageUsage, 0)));
        current.maxUsage = Math.max(current.maxUsage, toNumber(row.maxUsage, toNumber(row.averageUsage, 0)));
        regroupedMap.set(period, current);
      });

      const grouped = Array.from(regroupedMap.values())
        .map((g) => ({
          ...g,
          averageUsage: g.readCount > 0 ? g.totalUsage / g.readCount : 0,
          minUsage: Number.isFinite(g.minUsage) ? g.minUsage : 0,
          maxUsage: Number.isFinite(g.maxUsage) ? g.maxUsage : 0,
        }))
        .sort((a, b) => String(b.period).localeCompare(String(a.period)));

      setAggRows(grouped);
      setAggRawCount(grouped.reduce((sum, r) => sum + toNumber(r.readCount, 0), 0));
      setAggSource(source);

      if (!billingReadyRes) {
        setBillingReadyCount(0);
      }

      const endedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const elapsed = Math.max(1, Math.round(endedAt - startedAt));
      setAggLoadMs(elapsed);
      if (grouped.length > 0) {
        pushToast('success', `Loaded ${grouped.length} aggregate row(s) from ${source} in ${elapsed} ms`);
      } else {
        pushToast('warn', 'No aggregate data found for the current filters');
      }
    } catch (err) {
      console.error('[BillingDashboard] Aggregated usage load failed:', err?.response?.data || err?.message || err);
      setAggRows([]);
      setAggReadyRows([]);
      setAggRawCount(0);
      setAggSource('');
      setBillingReadyCount(0);
      pushToast('error', 'Unable to load aggregated usage from usage-aggregates API');
    } finally {
      setAggLoading(false);
    }
  }, [aggCustomerId, aggFromDate, aggMeterFilter, aggPeriod, aggTariffId, aggToDate]);

  useEffect(() => {
    if ((activeSection === 'all' || activeSection === 'overview') && !aggLoading && !aggAutoLoadAttempted) {
      setAggAutoLoadAttempted(true);
      loadAggregatedUsage();
    }
  }, [activeSection, aggLoading, aggAutoLoadAttempted, loadAggregatedUsage]);

  const toTsVal = (value) => {
    const t = new Date(value).getTime();
    return Number.isFinite(t) ? t : 0;
  };

  const markAsMissing = async (id) => {
    try {
      await meterReadService.markMissing(id);
      pushToast('success', `Read #${id} marked missing`);
      loadMissingData();
    } catch {
      pushToast('error', `Unable to mark #${id} as missing`);
    }
  };

  const sortList = (list, key, dir = 'asc') => {
    const factor = dir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      const va = pick(a, [key], '');
      const vb = pick(b, [key], '');
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * factor;
      return String(va).localeCompare(String(vb)) * factor;
    });
  };

  const sortedHistory = useMemo(() => sortList(history, sortBy.key, sortBy.dir), [history, sortBy]);
  const pagedHistory = useMemo(() => paginate(sortedHistory, historyPage, 6), [sortedHistory, historyPage]);
  const pagedMissing = useMemo(() => paginate(missingRows, missingPage, 6), [missingRows, missingPage]);
  const sortedOverviewRows = useMemo(() => {
    const rows = [...overviewRows];
    const factor = overviewSort.dir === 'asc' ? 1 : -1;
    rows.sort((a, b) => {
      if (overviewSort.key === 'value') {
        return (toNumber(pick(a, ['readingValue', 'reading_value'], 0), 0) - toNumber(pick(b, ['readingValue', 'reading_value'], 0), 0)) * factor;
      }
      if (overviewSort.key === 'meter') {
        return String(getMeterValue(a) ?? '').localeCompare(String(getMeterValue(b) ?? '')) * factor;
      }
      const at = toTs(pick(a, ['readingDateTime', 'reading_date_time', 'createdAt', 'created_at']));
      const bt = toTs(pick(b, ['readingDateTime', 'reading_date_time', 'createdAt', 'created_at']));
      return (at - bt) * factor;
    });
    return rows;
  }, [overviewRows, overviewSort]);

  const pagedOverview = useMemo(() => paginate(sortedOverviewRows, overviewPage, 8), [sortedOverviewRows, overviewPage]);

  const estimationRows = useMemo(() => {
    return overviewRows.filter((r) => {
      const type = String(pick(r, ['readType', 'readingType', 'type'], '')).toUpperCase();
      const source = String(pick(r, ['source', 'readingSource', 'readSource'], '')).toUpperCase();
      return type.includes('ESTIMATED') || source.includes('INTERPOLATED') || type.includes('INTERPOLATED');
    });
  }, [overviewRows]);

  const highErrorUploads = uploadResults.filter((u) => u.total > 0 && u.errors / u.total >= 0.3).length;

  const aggViewRows = useMemo(() => (aggRows.length ? aggRows : aggReadyRows), [aggRows, aggReadyRows]);

  const aggSummary = useMemo(() => {
    const totalUsage = aggViewRows.reduce((sum, r) => sum + (Number(r.totalUsage) || 0), 0);
    const totalReads = aggViewRows.reduce((sum, r) => sum + (Number(r.readCount) || 0), 0);
    const averageUsage = totalReads > 0 ? totalUsage / totalReads : 0;
    return {
      totalUsage,
      totalReads,
      averageUsage,
      periodCount: aggViewRows.length,
    };
  }, [aggViewRows]);

  const abnormalUsageAlerts = useMemo(() => {
    if (!aggViewRows.length) return [];
    const baseline = Number(aggSummary.averageUsage) || 0;

    return aggViewRows
      .map((row, idx) => {
        const avg = Number(row.averageUsage || 0);
        const total = Number(row.totalUsage || 0);
        const reads = Number(row.readCount || 0);
        const ref = row.customerId || row.meterId || row.period || `ALERT-${idx + 1}`;
        const threshold = baseline > 0 ? baseline * 1.8 : Math.max(avg * 1.5, 1);
        const breach = avg >= threshold;
        if (!breach) return null;

        return {
          id: `${row.period}-${row.customerId || ''}-${row.meterId || ''}-${idx}`,
          reference: ref,
          period: row.period,
          customerId: row.customerId || 'N/A',
          meterId: row.meterId || 'N/A',
          averageUsage: avg,
          totalUsage: total,
          threshold,
          reads,
          severity: avg >= threshold * 1.2 ? 'CRITICAL' : 'HIGH',
          details: row,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.averageUsage - a.averageUsage);
  }, [aggViewRows, aggSummary.averageUsage]);

  const usageTrend = useMemo(() => {
    const rows = [...aggViewRows].slice(-8);
    const maxAvg = Math.max(...rows.map((r) => Number(r.averageUsage || 0)), 1);
    return rows.map((r, idx) => ({
      key: `${r.period}-${idx}`,
      label: String(r.period || `P${idx + 1}`),
      avg: Number(r.averageUsage || 0),
      widthPct: Math.max(6, Math.round((Number(r.averageUsage || 0) / maxAvg) * 100)),
    }));
  }, [aggViewRows]);

  return (
    <section className="dashboard-panel">
      <ThemeToggleButton />
      <div className="dashboard-header" style={{ position: 'relative' }}>
        <div className="dashboard-meta">
          <span className="dashboard-label">Billing &amp; Customer Operations</span>
          <h2 className="dashboard-title">Meter Reads, Usage Validation &amp; Billing References</h2>
          <p className="dashboard-description">
            Review and validate meter readings, adjust usage estimates, manage billing references,
            and maintain tariff mappings to ensure accuracy at 99.9%.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
          <NotificationBell alerts={BILLING_ALERTS} />
          <div className="dashboard-stat">
            <strong style={{ color: highErrorUploads > 0 ? '#f87171' : '#fbbf24' }}>{missingSummary.totalMissing || 0}</strong>
            <span>Open read gaps</span>
          </div>
        </div>
      </div>

      <div className="dash-kpi-row">
        <div className="dash-kpi-card kpi-alert"><div className="dash-kpi-value">{missingSummary.totalMissing}</div><div className="dash-kpi-label">Missing Reads</div></div>
        <div className="dash-kpi-card"><div className="dash-kpi-value">{missingSummary.gapsFilled}</div><div className="dash-kpi-label">Gaps Filled</div></div>
        <div className="dash-kpi-card"><div className="dash-kpi-value">{history.length}</div><div className="dash-kpi-label">Batches Processed</div></div>
        <div className="dash-kpi-card"><div className="dash-kpi-value">{highErrorUploads}</div><div className="dash-kpi-label">High Error Uploads</div></div>
      </div>

      {/* Section title banner when drilling into a specific section */}
      {activeSection !== 'all' && (
        <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 12, background: 'rgba(94,230,255,0.07)', borderLeft: '3px solid #5ee6ff', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: '#5ee6ff', fontSize: '13px' }}>📌</span>
          <span style={{ color: 'rgba(199,220,246,0.8)', fontSize: '13px' }}>
            Viewing: <strong style={{ color: '#e7f6ff' }}>{
              { overview: 'Meter Read Overview', validation: 'Usage Validation & Missing Reads', estimation: 'Estimation & Gap Review', config: 'Billing Configuration' }[activeSection]
            }</strong>
          </span>
        </div>
      )}

      {/* Bulk Meter Read Upload — shown on main dashboard view only */}
      {(activeSection === 'all') && (
      <div id="bulk-upload" className="dashboard-card" style={{ padding: 20, marginBottom: 18, scrollMarginTop: 100 }}>
        <h3 className="dash-section-title" style={{ marginBottom: 10 }}>Bulk Meter Read Upload</h3>
        <div style={{ color: 'rgba(199,220,246,0.65)', fontSize: '0.82rem', marginBottom: 12 }}>
          Upload one or more CSV files. Supported columns: meterId, customerId, readingDateTime, readingValue, readingQuality, readingType.
        </div>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            onFilePick(e.dataTransfer.files);
          }}
          style={{
            border: '1px dashed rgba(94,230,255,0.4)',
            borderRadius: 12,
            padding: 18,
            background: 'rgba(94,230,255,0.04)',
            marginBottom: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <FiUploadCloud color="#5ee6ff" />
            <strong style={{ color: '#e7f6ff' }}>Drop CSV files here</strong>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <label className="dash-action-btn" style={{ cursor: 'pointer', color: '#5ee6ff', borderColor: 'rgba(94,230,255,0.35)' }}>
              Choose Files
              <input
                type="file"
                accept=".csv"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => onFilePick(e.target.files)}
              />
            </label>
            <button
              className="dash-action-btn"
              onClick={handleUpload}
              disabled={!files.length || uploading}
              style={{
                color: '#34d399',
                borderColor: 'rgba(52,211,153,0.35)',
                opacity: !files.length || uploading ? 0.5 : 1,
              }}
            >
              {uploading ? '⏳ Uploading…' : '↑ Upload CSV'}
            </button>
            <button className="dash-action-btn" onClick={() => setFiles([])} style={{ color: '#c7dcf6' }}>✕ Clear</button>
          </div>
          {!!files.length && (
            <div style={{ marginTop: 10, fontSize: '0.8rem', color: 'rgba(199,220,246,0.72)' }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{files.length} file{files.length !== 1 ? 's' : ''} selected:</div>
              {files.map((f) => (
                <div key={f.name + f.size} style={{ marginLeft: 8, color: 'rgba(199,220,246,0.6)' }}>
                  • {f.name} ({(f.size / 1024).toFixed(1)} KB)
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dash-job-list">
          {uploadResults.length === 0 ? (
            <div style={{ padding: '12px 0', color: 'rgba(199,220,246,0.45)' }}>No uploads yet. Select CSV files to begin.</div>
          ) : uploadResults.map((u, idx) => {
            const pill = statusPill(u.status);
            const key = String(u.id || `${u.fileName}-${idx}`);
            const errorRate = u.total > 0 ? ((u.errors / u.total) * 100).toFixed(0) : 0;
            return (
              <div key={key} className="dash-job-row" style={{ alignItems: 'flex-start', gap: 12 }}>
                <div className="dash-job-info" style={{ flex: 2 }}>
                  <div className="dash-job-title">{u.fileName}</div>
                  <div className="dash-job-asset"><FiClock size={12} style={{ marginRight: 6 }} />{new Date(u.timestamp).toLocaleString()}</div>
                  <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: '0.75rem', color: 'rgba(199,220,246,0.75)' }}>
                    <span>Total: <strong>{u.total}</strong></span>
                    <span>✓ Success: <strong style={{ color: '#34d399' }}>{u.success}</strong></span>
                    <span>⊘ Skipped: <strong style={{ color: '#fbbf24' }}>{u.skipped}</strong></span>
                    <span>✕ Error: <strong style={{ color: '#f87171' }}>{u.errors}</strong> {u.total > 0 ? `(${errorRate}%)` : ''}</span>
                  </div>
                </div>
                <span className="dash-job-badge" style={{ background: pill.bg, color: pill.color, border: `1px solid ${pill.bd}` }}>{u.status}</span>
                {u.errorRows?.length > 0 && (
                  <button
                    className="dash-action-btn"
                    onClick={() => setExpandedBatchKey((p) => (p === key ? '' : key))}
                    style={{ color: '#c7dcf6' }}
                  >
                    {expandedBatchKey === key ? <FiChevronUp /> : <FiChevronDown />} Errors ({u.errorRows.length})
                  </button>
                )}

                {expandedBatchKey === key && u.errorRows?.length > 0 && (
                  <div style={{ width: '100%', marginTop: 8, borderTop: '1px solid rgba(94,230,255,0.12)', paddingTop: 8 }}>
                    <div className="table-wrapper">
                      <table>
                        <thead><tr><th>Row</th><th>Error Message</th><th>Details</th></tr></thead>
                        <tbody>
                          {u.errorRows.slice(0, 10).map((er, i) => (
                            <tr key={i}>
                              <td>{pick(er, ['rowNumber', 'row', 'line'], i + 1)}</td>
                              <td style={{ fontSize: '0.8rem' }}>{pick(er, ['message', 'error', 'reason'], 'Validation error')}</td>
                              <td style={{ maxWidth: 300, whiteSpace: 'normal', wordBreak: 'break-word', fontSize: '0.75rem' }}>
                                <code style={{ color: 'rgba(199,220,246,0.6)', fontSize: '0.65rem' }}>
                                  {JSON.stringify(pick(er, ['rawRow', 'rawData', 'data'], er)).slice(0, 100)}...
                                </code>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {u.errorRows.length > 10 && (
                        <div style={{ marginTop: 6, fontSize: '0.75rem', color: 'rgba(199,220,246,0.5)' }}>
                          +{u.errorRows.length - 10} more errors...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      )} {/* end bulk upload guard */}

      {/* Batch Upload History */}
      {(activeSection === 'all') && (
      <div id="batch-history" className="dashboard-card" style={{ padding: 20, marginBottom: 18, scrollMarginTop: 100 }}>
        <h3 className="dash-section-title" style={{ marginBottom: 10 }}>Batch Upload History</h3>
        <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: 'rgba(199,220,246,0.6)' }}>Click a row to load details</div>
          <button className="dash-action-btn" onClick={loadBatchHistory}><FiRefreshCw size={13} /> Refresh</button>
        </div>
        {historyLoading ? (
          <div style={{ color: 'rgba(199,220,246,0.6)' }}>Loading batch history…</div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th onClick={() => setSortBy({ key: 'fileName', dir: sortBy.dir === 'asc' ? 'desc' : 'asc' })}>File Name</th>
                  <th onClick={() => setSortBy({ key: 'timestamp', dir: sortBy.dir === 'asc' ? 'desc' : 'asc' })}>Upload Date</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Success</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {pagedHistory.map((h) => {
                  const pill = statusPill(h.status);
                  return (
                    <tr key={h.id || h.fileName} style={{ cursor: 'pointer' }} onClick={() => loadBatchDetail(h.id)}>
                      <td>{h.fileName}</td>
                      <td>{h.timestamp ? new Date(h.timestamp).toLocaleString() : '—'}</td>
                      <td><span className="dash-job-badge" style={{ background: pill.bg, color: pill.color, border: `1px solid ${pill.bd}` }}>{h.status}</span></td>
                      <td>{h.total}</td>
                      <td>{h.success}</td>
                      <td>{h.errors}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
          <button className="dash-action-btn" onClick={() => setHistoryPage((p) => Math.max(0, p - 1))}>Prev</button>
          <button className="dash-action-btn" onClick={() => setHistoryPage((p) => (p + 1) * 6 < sortedHistory.length ? p + 1 : p)}>Next</button>
        </div>

        {selectedBatch && (
          <div style={{ marginTop: 12, borderTop: '1px solid rgba(94,230,255,0.12)', paddingTop: 12 }}>
            <div style={{ fontWeight: 700, color: '#e7f6ff', marginBottom: 6 }}>Batch Detail #{selectedBatch.id || 'N/A'}</div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(199,220,246,0.7)' }}>
              {selectedBatch.fileName} · Total {selectedBatch.total} · Success {selectedBatch.success} · Error {selectedBatch.errors}
            </div>
          </div>
        )}
      </div>
      )} {/* end batch history guard */}

      {/* Meter Read Overview */}
      {(activeSection === 'all' || activeSection === 'overview') && (
      <div id="meter-overview" className="dashboard-card" style={{ padding: 20, marginBottom: 18, scrollMarginTop: 100 }}>
        <h3 className="dash-section-title" style={{ marginBottom: 10 }}>Meter Read Overview</h3>
        <div style={{ color: 'rgba(199,220,246,0.58)', fontSize: '0.78rem', marginBottom: 8 }}>
          Showing rows with value, plus explicit MISSING / ESTIMATED / INTERPOLATED records.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(120px, 1fr))', gap: 10, marginBottom: 10 }}>
          <input className="dash-search" placeholder="Meter ID (required)" value={meterIdFilter} onChange={(e) => setMeterIdFilter(e.target.value)} />
          <input className="dash-search" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} placeholder="From Date (optional)" />
          <input className="dash-search" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} placeholder="To Date (optional)" />
          <button className="dash-action-btn" onClick={loadOverview} disabled={!meterIdFilter}><FiSearch size={14} /> Load</button>
        </div>
        {overviewLoading ? (
          <div style={{ color: 'rgba(199,220,246,0.6)' }}>Loading meter reads…</div>
        ) : meterIdFilter ? (
          <div className="table-wrapper">
            <table>
              <thead><tr><th onClick={() => setOverviewSort((p) => ({ key: 'meter', dir: p.key === 'meter' && p.dir === 'asc' ? 'desc' : 'asc' }))}>Meter ID</th><th onClick={() => setOverviewSort((p) => ({ key: 'date', dir: p.key === 'date' && p.dir === 'asc' ? 'desc' : 'asc' }))}>Date & Time</th><th onClick={() => setOverviewSort((p) => ({ key: 'value', dir: p.key === 'value' && p.dir === 'asc' ? 'desc' : 'asc' }))}>Reading</th><th>Quality</th><th>Read Type</th><th>Source</th></tr></thead>
              <tbody>
                {pagedOverview.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: 'rgba(199,220,246,0.5)', padding: 20 }}>No reads found for meter {meterIdFilter}.</td></tr>
                ) : pagedOverview.map((r, i) => {
                  const meterVal = getMeterValue(r);
                  const quality = String(pick(r, ['readingQuality', 'quality'], 'UNKNOWN')).toUpperCase();
                  const source = String(pick(r, ['source', 'readingSource', 'readingType'], 'MANUAL')).toUpperCase();
                  const readType = getDisplayReadType(r);
                  const readingValue = pick(r, ['readingValue', 'reading_value'], null);
                  return (
                    <tr key={pick(r, ['id'], i)}>
                      <td>{meterVal ?? '—'}</td>
                      <td>{pick(r, ['readingDateTime', 'reading_date_time']) ? new Date(pick(r, ['readingDateTime', 'reading_date_time'])).toLocaleString() : '—'}</td>
                      <td>{readingValue !== null && readingValue !== undefined && String(readingValue).trim() !== '' ? readingValue : <span style={{ color: 'rgba(199,220,246,0.5)' }}>—</span>}</td>
                      <td><span className="dash-job-badge" style={{ ...statusPill(quality), border: `1px solid ${statusPill(quality).bd}` }}>{quality}</span></td>
                      <td><span className="dash-job-badge" style={{ ...statusPill(readType), border: `1px solid ${statusPill(readType).bd}` }}>{readType}</span></td>
                      <td>{source}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ color: 'rgba(199,220,246,0.5)', padding: 20, textAlign: 'center' }}>
            <p>Enter a Meter ID above to view the meter's reading history.</p>
            <p style={{ fontSize: '0.85rem', marginTop: 6 }}>Optionally filter by date range. Click <strong>Load</strong> to fetch data.</p>
          </div>
        )}
        {meterIdFilter && (
          <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
            <button className="dash-action-btn" onClick={() => setOverviewPage((p) => Math.max(0, p - 1))}>Prev</button>
            <button className="dash-action-btn" onClick={() => setOverviewPage((p) => (p + 1) * 8 < sortedOverviewRows.length ? p + 1 : p)}>Next</button>
          </div>
        )}

        {/* Aggregated Usage Summary */}
        <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid rgba(94,230,255,0.14)' }}>
          <h3 className="dash-section-title" style={{ marginBottom: 10 }}>
            Aggregated Usage Summary
          </h3>

          <div style={{ color: 'rgba(199,220,246,0.64)', fontSize: '0.82rem', marginBottom: 10 }}>
            Uses Usage Aggregates APIs: aggregate (POST), billing-ready (GET), customer (GET), report (GET), summary (GET).
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr 1fr 1fr 1fr auto', gap: 10, marginBottom: 10 }}>
            <input
              className="dash-search"
              placeholder="Customer ID (e.g., CUST4001)"
              value={aggCustomerId}
              onChange={(e) => setAggCustomerId(e.target.value)}
            />
            <input
              className="dash-search"
              placeholder="Meter ID (e.g., METER-099)"
              value={aggMeterFilter}
              onChange={(e) => setAggMeterFilter(e.target.value)}
            />
            <input className="dash-search" type="date" value={aggFromDate} onChange={(e) => setAggFromDate(e.target.value)} title="periodStart / from" />
            <input className="dash-search" type="date" value={aggToDate} onChange={(e) => setAggToDate(e.target.value)} title="periodEnd / to" />
            <input
              className="dash-search"
              placeholder="Tariff ID (e.g., 15)"
              value={aggTariffId}
              onChange={(e) => setAggTariffId(e.target.value)}
            />
            <select className="dash-search" value={aggPeriod} onChange={(e) => setAggPeriod(e.target.value)}>
              <option value="DAY">Daily</option>
              <option value="WEEK">Weekly</option>
              <option value="MONTH">Monthly</option>
            </select>
            <button className="dash-action-btn" onClick={loadAggregatedUsage} disabled={aggLoading}>
              {aggLoading ? <><FiRefreshCw size={13} /> Loading…</> : <><FiActivity size={13} /> Summarize</>}
            </button>
          </div>

          <div style={{ marginBottom: 10, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            {meterIdFilter && (
              <button
                className="dash-action-btn"
                onClick={() => {
                  setAggMeterFilter(String(meterIdFilter));
                  setAggFromDate(fromDate || '');
                  setAggToDate(toDate || '');
                }}
              >
                Use current overview filters
              </button>
            )}
            {aggSource && (
              <span style={{ fontSize: '0.78rem', color: 'rgba(123,228,255,0.95)', background: 'rgba(94,230,255,0.08)', border: '1px solid rgba(94,230,255,0.25)', padding: '4px 10px', borderRadius: 999 }}>
                Source: {aggSource}
              </span>
            )}
            {!!billingReadyCount && (
              <span style={{ fontSize: '0.78rem', color: 'rgba(52,211,153,0.95)', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)', padding: '4px 10px', borderRadius: 999 }}>
                Billing-ready: {billingReadyCount}
              </span>
            )}
            {!!aggLoadMs && (
              <span style={{ fontSize: '0.78rem', color: 'rgba(52,211,153,0.86)' }}>
                Loaded in {aggLoadMs} ms
              </span>
            )}
          </div>

          <div className="dash-kpi-row" style={{ marginBottom: 10 }}>
            <div className="dash-kpi-card"><div className="dash-kpi-value">{aggSummary.periodCount}</div><div className="dash-kpi-label">Periods</div></div>
            <div className="dash-kpi-card"><div className="dash-kpi-value">{aggSummary.totalReads}</div><div className="dash-kpi-label">Reads Included</div></div>
            <div className="dash-kpi-card"><div className="dash-kpi-value">{aggSummary.totalUsage.toFixed(2)}</div><div className="dash-kpi-label">Total Usage</div></div>
            <div className="dash-kpi-card"><div className="dash-kpi-value">{aggSummary.averageUsage.toFixed(2)}</div><div className="dash-kpi-label">Average Usage</div></div>
          </div>

          <div className="billing-alert-grid">
            <div className="billing-alert-panel">
              <div className="billing-alert-panel-head">
                <h4>Abnormal Usage Alerts</h4>
                <span className="billing-alert-count">{abnormalUsageAlerts.length}</span>
              </div>

              {abnormalUsageAlerts.length === 0 ? (
                <div className="billing-alert-empty">No threshold breaches detected for current filters.</div>
              ) : (
                <div className="billing-alert-list">
                  {abnormalUsageAlerts.slice(0, 10).map((a) => (
                    <div key={a.id} className={`billing-alert-item severity-${a.severity.toLowerCase()}`}>
                      <div className="billing-alert-item-main">
                        <div className="billing-alert-tags">
                          <span className="billing-tag">ABNORMAL</span>
                          <span className={`billing-tag severity-${a.severity.toLowerCase()}`}>{a.severity}</span>
                          <span className="billing-ref">{a.reference}</span>
                        </div>
                        <div className="billing-alert-message">
                          Average usage {a.averageUsage.toFixed(2)} breached threshold {a.threshold.toFixed(2)} in period {a.period}.
                        </div>
                      </div>
                      <button className="dash-action-btn" onClick={() => setSelectedUsageAlert(a)}>View details</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="billing-alert-panel">
              <div className="billing-alert-panel-head">
                <h4>Usage Trend (Avg)</h4>
              </div>
              {usageTrend.length === 0 ? (
                <div className="billing-alert-empty">No trend points yet. Run summarize to visualize usage trends.</div>
              ) : (
                <div className="billing-trend-list">
                  {usageTrend.map((p) => (
                    <div key={p.key} className="billing-trend-row">
                      <div className="billing-trend-label" title={p.label}>{p.label}</div>
                      <div className="billing-trend-bar-wrap">
                        <div className="billing-trend-bar" style={{ width: `${p.widthPct}%` }} />
                      </div>
                      <div className="billing-trend-value">{p.avg.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {selectedUsageAlert && (
            <div className="billing-alert-details">
              <div className="billing-alert-panel-head">
                <h4>Alert Details</h4>
                <button className="dash-action-btn" onClick={() => setSelectedUsageAlert(null)}>Close</button>
              </div>
              <div className="billing-alert-detail-grid">
                <div><strong>Reference:</strong> {selectedUsageAlert.reference}</div>
                <div><strong>Period:</strong> {selectedUsageAlert.period}</div>
                <div><strong>Customer:</strong> {selectedUsageAlert.customerId}</div>
                <div><strong>Meter:</strong> {selectedUsageAlert.meterId}</div>
                <div><strong>Reads:</strong> {selectedUsageAlert.reads}</div>
                <div><strong>Severity:</strong> {selectedUsageAlert.severity}</div>
                <div><strong>Avg Usage:</strong> {selectedUsageAlert.averageUsage.toFixed(2)}</div>
                <div><strong>Threshold:</strong> {selectedUsageAlert.threshold.toFixed(2)}</div>
                <div><strong>Total Usage:</strong> {selectedUsageAlert.totalUsage.toFixed(2)}</div>
              </div>
            </div>
          )}

          {aggLoading ? (
            <div style={{ color: 'rgba(199,220,246,0.6)' }}>Aggregating usage…</div>
          ) : aggViewRows.length === 0 ? (
            <div style={{ color: 'rgba(199,220,246,0.5)', padding: 14, textAlign: 'center' }}>
              No aggregate rows returned for the current filters. Try Customer ID + Meter ID + Date range, then click <strong>Summarize</strong>.
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Meter</th>
                    <th>Period</th>
                    <th>Period Start</th>
                    <th>Period End</th>
                    <th>Reads</th>
                    <th>Total Usage</th>
                    <th>Average Usage</th>
                    <th>Min</th>
                    <th>Max</th>
                  </tr>
                </thead>
                <tbody>
                  {aggViewRows.map((row, idx) => (
                    <tr key={`${row.period}-${row.customerId || ''}-${row.meterId || ''}-${idx}`}>
                      <td>{row.customerId || aggCustomerId || '—'}</td>
                      <td>{row.meterId || aggMeterFilter || '—'}</td>
                      <td>{row.period}</td>
                      <td>{row.periodStart ? String(row.periodStart).slice(0, 10) : '—'}</td>
                      <td>{row.periodEnd ? String(row.periodEnd).slice(0, 10) : '—'}</td>
                      <td>{row.readCount}</td>
                      <td>{Number(row.totalUsage || 0).toFixed(2)}</td>
                      <td>{Number(row.averageUsage || 0).toFixed(2)}</td>
                      <td>{Number(row.minUsage || 0).toFixed(2)}</td>
                      <td>{Number(row.maxUsage || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: 6, fontSize: '0.75rem', color: 'rgba(199,220,246,0.5)' }}>
                Based on {aggRawCount} read record{aggRawCount !== 1 ? 's' : ''} from backend.
              </div>
            </div>
          )}
        </div>
      </div>
      )} {/* end overview guard */}

      {/* Usage Validation & Missing Reads */}
      {(activeSection === 'all' || activeSection === 'validation') && (
      <div id="missing-reads" className="dashboard-card" style={{ padding: 20, marginBottom: 18, scrollMarginTop: 100 }}>
        <h3 className="dash-section-title" style={{ marginBottom: 10 }}>Usage Validation & Missing Reads</h3>
        <div className="dash-kpi-row" style={{ marginBottom: 10 }}>
          <div className="dash-kpi-card"><div className="dash-kpi-value">{missingSummary.totalMissing}</div><div className="dash-kpi-label">Total Missing Reads</div></div>
          <div className="dash-kpi-card"><div className="dash-kpi-value">{missingSummary.gapsFilled}</div><div className="dash-kpi-label">Gaps Filled</div></div>
          <div className="dash-kpi-card"><div className="dash-kpi-value">{missingSummary.remaining}</div><div className="dash-kpi-label">Remaining Gaps</div></div>
        </div>
        {missingLoading ? (
          <div style={{ color: 'rgba(199,220,246,0.6)' }}>Loading missing reads…</div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Meter ID</th><th>Date</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {pagedMissing.length === 0 ? (
                  <tr><td colSpan={4}>No missing reads found.</td></tr>
                ) : pagedMissing.map((m, i) => {
                  const id = pick(m, ['id'], null);
                  const status = String(pick(m, ['status', 'missingStatus'], 'MISSING')).toUpperCase();
                  const pill = statusPill(status.includes('MISSING') ? 'ERROR' : status);
                  return (
                    <tr key={id || i}>
                      <td>{pick(m, ['meterId', 'meter_id'], '—')}</td>
                      <td>{pick(m, ['readingDateTime', 'date', 'reading_date_time']) ? new Date(pick(m, ['readingDateTime', 'date', 'reading_date_time'])).toLocaleDateString() : '—'}</td>
                      <td><span className="dash-job-badge" style={{ background: pill.bg, color: pill.color, border: `1px solid ${pill.bd}` }}>{status}</span></td>
                      <td>
                        <button className="dash-action-btn" onClick={() => markAsMissing(id)} disabled={!id}>
                          Mark as Missing
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
          <button className="dash-action-btn" onClick={() => setMissingPage((p) => Math.max(0, p - 1))}>Prev</button>
          <button className="dash-action-btn" onClick={() => setMissingPage((p) => (p + 1) * 6 < missingRows.length ? p + 1 : p)}>Next</button>
        </div>
      </div>
      )} {/* end validation guard */}

      {/* ═══════════════════════════════════════════════════
           ESTIMATION & GAP REVIEW  (US001-5 AC)
          ═══════════════════════════════════════════════════ */}
      {(activeSection === 'all' || activeSection === 'estimation') && (() => {
        // ── Filtered + paginated data ───────────────────────
        const filtered = estimationRows.filter((r) => {
          const label = String(pick(r, ['readType','readingType','type','source'], '')).toUpperCase();
          const isInterp = label.includes('INTERPOL');
          const isEst    = !isInterp;
          if (estLabelFilter === 'ESTIMATED'    && !isEst)    return false;
          if (estLabelFilter === 'INTERPOLATED' && !isInterp) return false;
          const meterId = String(pick(r, ['meterId','meter_id'], ''));
          if (estMeterFilter && !meterId.toLowerCase().includes(estMeterFilter.toLowerCase())) return false;
          const ts = toTsVal(pick(r, ['readingDateTime','reading_date_time'], null));
          if (estDateFrom && ts < new Date(estDateFrom).getTime()) return false;
          if (estDateTo   && ts > new Date(`${estDateTo}T23:59:59`).getTime()) return false;
          return true;
        });

        const totalPages = Math.max(1, Math.ceil(filtered.length / EST_PAGE_SIZE));
        const safePage   = Math.min(estPage, totalPages - 1);
        const paged      = paginate(filtered, safePage, EST_PAGE_SIZE);
        const countEst   = estimationRows.filter((r) => !String(pick(r,['readType','readingType','type','source'],'')).toUpperCase().includes('INTERPOL')).length;
        const countInterp= estimationRows.length - countEst;

        const handleEdit = (r) => {
          const id = pick(r, ['id'], null);
          setEditingRowId(id);
          setEditValue(String(pick(r, ['readingValue','reading_value'], '')));
          setEditNote('');
          setOverrideErrors((p) => { const n = {...p}; delete n[id]; return n; });
        };

        const handleCancel = () => { setEditingRowId(null); setEditValue(''); setEditNote(''); };

        const handleSave = async (r) => {
          const id = pick(r, ['id'], null);
          if (!id) { pushToast('error', 'Cannot override — record has no ID'); return; }
          const num = parseFloat(editValue);
          if (isNaN(num)) { setOverrideErrors((p) => ({...p, [id]: 'Value must be a number'})); return; }
          setSavingId(id);
          try {
            await meterReadService.overrideEstimate(id, {
              readingValue:  num,
              overrideValue: num,
              overrideNote:  editNote || undefined,
              readType:      'ACTUAL',
              readingType:   'ACTUAL',
              source:        'MANUAL_OVERRIDE',
            });
            setOverrideDone((p) => ({...p, [id]: { value: num, note: editNote, at: new Date().toLocaleString() }}));
            pushToast('success', `Override saved for meter ${pick(r,['meterId','meter_id'],'?')} — new value: ${num}`);
            handleCancel();
          } catch (err) {
            const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Save failed';
            setOverrideErrors((p) => ({...p, [id]: msg}));
            pushToast('error', `Override failed: ${msg}`);
          } finally {
            setSavingId(null);
          }
        };

        return (
        <div id="estimation" className="dashboard-card" style={{ padding: 0, marginBottom: 18, scrollMarginTop: 100, overflow: 'hidden' }}>

          {/* ── Header ──────────────────────────────────── */}
          <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid rgba(94,230,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FiFileText size={18} color="#fbbf24" />
              <h3 className="dash-section-title" style={{ margin: 0 }}>Estimation &amp; Gap Review</h3>
              {estimationRows.length > 0 && (
                <span style={{ background: 'rgba(251,191,36,0.14)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.35)', borderRadius: 20, padding: '2px 10px', fontSize: '0.75rem', fontWeight: 700 }}>
                  {estimationRows.length} flagged
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 20, padding: '3px 11px', fontSize: '0.75rem' }}>
                ⚠ ESTIMATED: {countEst}
              </span>
              <span style={{ background: 'rgba(168,85,247,0.1)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.25)', borderRadius: 20, padding: '3px 11px', fontSize: '0.75rem' }}>
                ⟳ INTERPOLATED: {countInterp}
              </span>
            </div>
          </div>

          {/* ── Filter bar ──────────────────────────────── */}
          <div style={{ padding: '12px 20px', background: 'rgba(94,230,255,0.03)', borderBottom: '1px solid rgba(94,230,255,0.08)', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <FiFilter size={13} style={{ color: 'rgba(199,220,246,0.5)', flexShrink: 0 }} />
            <select
              value={estLabelFilter}
              onChange={(e) => { setEstLabelFilter(e.target.value); setEstPage(0); }}
              style={{ background: 'rgba(94,230,255,0.06)', border: '1px solid rgba(94,230,255,0.2)', borderRadius: 8, color: '#e7f6ff', padding: '6px 10px', fontSize: '0.8rem', cursor: 'pointer' }}
            >
              <option value="ALL">All Types</option>
              <option value="ESTIMATED">ESTIMATED only</option>
              <option value="INTERPOLATED">INTERPOLATED only</option>
            </select>
            <input
              placeholder="Filter by Meter ID…"
              value={estMeterFilter}
              onChange={(e) => { setEstMeterFilter(e.target.value); setEstPage(0); }}
              style={{ background: 'rgba(94,230,255,0.06)', border: '1px solid rgba(94,230,255,0.2)', borderRadius: 8, color: '#e7f6ff', padding: '6px 10px', fontSize: '0.8rem', width: 160 }}
            />
            <input
              type="date" value={estDateFrom}
              onChange={(e) => { setEstDateFrom(e.target.value); setEstPage(0); }}
              style={{ background: 'rgba(94,230,255,0.06)', border: '1px solid rgba(94,230,255,0.2)', borderRadius: 8, color: '#e7f6ff', padding: '6px 8px', fontSize: '0.8rem' }}
            />
            <span style={{ color: 'rgba(199,220,246,0.4)', fontSize: '0.8rem' }}>→</span>
            <input
              type="date" value={estDateTo}
              onChange={(e) => { setEstDateTo(e.target.value); setEstPage(0); }}
              style={{ background: 'rgba(94,230,255,0.06)', border: '1px solid rgba(94,230,255,0.2)', borderRadius: 8, color: '#e7f6ff', padding: '6px 8px', fontSize: '0.8rem' }}
            />
            {(estMeterFilter || estDateFrom || estDateTo || estLabelFilter !== 'ALL') && (
              <button
                onClick={() => { setEstLabelFilter('ALL'); setEstMeterFilter(''); setEstDateFrom(''); setEstDateTo(''); setEstPage(0); }}
                style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 8, color: '#f87171', padding: '6px 12px', fontSize: '0.78rem', cursor: 'pointer' }}
              >
                ✕ Clear filters
              </button>
            )}
            <span style={{ marginLeft: 'auto', color: 'rgba(199,220,246,0.5)', fontSize: '0.78rem' }}>
              {filtered.length} of {estimationRows.length} rows
            </span>
          </div>

          {/* ── Table ───────────────────────────────────── */}
          <div style={{ padding: '0 20px 20px' }}>
            {estimationRows.length === 0 ? (
              <div style={{ padding: '40px 0', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: 10 }}>✅</div>
                <div style={{ color: 'rgba(199,220,246,0.6)', fontSize: '0.9rem' }}>No estimated or interpolated reads detected.</div>
                <div style={{ color: 'rgba(199,220,246,0.4)', fontSize: '0.8rem', marginTop: 4 }}>Load meter data from the Meter Read Overview section first.</div>
              </div>
            ) : (
              <>
              <div className="table-wrapper" style={{ marginTop: 14 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Meter ID</th>
                      <th>Date &amp; Time</th>
                      <th>Reading Value</th>
                      <th>Label</th>
                      <th>Gap Risk</th>
                      <th>Override</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: 20, color: 'rgba(199,220,246,0.45)' }}>No rows match the current filters.</td></tr>
                    ) : paged.map((r, i) => {
                      const id       = pick(r, ['id'], null);
                      const meterId  = pick(r, ['meterId','meter_id'], '—');
                      const dt       = pick(r, ['readingDateTime','reading_date_time'], null);
                      const value    = pick(r, ['readingValue','reading_value'], '—');
                      const rawType  = String(pick(r, ['readType','readingType','type','source'], '')).toUpperCase();
                      const isInterp = rawType.includes('INTERPOL');
                      const label    = isInterp ? 'INTERPOLATED' : 'ESTIMATED';
                      const rowKey   = id != null ? String(id) : `${meterId}-${dt || i}`;
                      const saved    = overrideDone[id];
                      const rowErr   = overrideErrors[id];
                      const isEditing= editingRowId === id && id != null;
                      const isSaving = savingId === id;

                      // Pill colours
                      const labelPill = isInterp
                        ? { bg: 'rgba(168,85,247,0.13)', color: '#c084fc', bd: 'rgba(168,85,247,0.35)' }
                        : { bg: 'rgba(251,191,36,0.13)', color: '#fbbf24', bd: 'rgba(251,191,36,0.35)' };

                      // Gap risk heuristic: no id = higher risk
                      const gapRisk = !id ? 'HIGH' : isInterp ? 'MEDIUM' : 'LOW';
                      const riskPill = gapRisk === 'HIGH'
                        ? { bg:'rgba(248,113,113,0.12)', color:'#f87171', bd:'rgba(248,113,113,0.35)' }
                        : gapRisk === 'MEDIUM'
                        ? { bg:'rgba(251,191,36,0.1)',   color:'#fbbf24', bd:'rgba(251,191,36,0.3)'   }
                        : { bg:'rgba(52,211,153,0.1)',   color:'#34d399', bd:'rgba(52,211,153,0.3)'   };

                      return (
                        <React.Fragment key={rowKey}>
                          <tr style={{ background: saved ? 'rgba(52,211,153,0.04)' : 'transparent' }}>
                            <td style={{ fontWeight: 600 }}>{meterId}</td>
                            <td style={{ fontSize: '0.82rem' }}>{dt ? new Date(dt).toLocaleString() : '—'}</td>
                            <td>
                              {saved ? (
                                <span style={{ color: '#34d399', fontWeight: 700 }}>
                                  {saved.value} <span style={{ fontSize: '0.72rem', fontWeight: 400, color: 'rgba(52,211,153,0.7)' }}>(overridden)</span>
                                </span>
                              ) : String(value)}
                            </td>
                            <td>
                              <span className="dash-job-badge" style={{ background: labelPill.bg, color: labelPill.color, border: `1px solid ${labelPill.bd}`, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                {isInterp ? '⟳' : '⚠'} {label}
                              </span>
                              {saved && (
                                <span style={{ marginLeft: 6, background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 20, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 700 }}>✓ OVERRIDDEN</span>
                              )}
                            </td>
                            <td>
                              <span className="dash-job-badge" style={{ background: riskPill.bg, color: riskPill.color, border: `1px solid ${riskPill.bd}` }}>{gapRisk}</span>
                            </td>
                            <td>
                              {saved ? (
                                <span style={{ fontSize: '0.75rem', color: 'rgba(52,211,153,0.7)' }}>Saved {saved.at}</span>
                              ) : id ? (
                                isEditing ? (
                                  <button className="dash-action-btn" style={{ color:'#f87171', borderColor:'rgba(248,113,113,0.3)' }} onClick={handleCancel}>✕ Cancel</button>
                                ) : (
                                  <button className="dash-action-btn" style={{ color:'#fbbf24', borderColor:'rgba(251,191,36,0.35)', display:'inline-flex', alignItems:'center', gap:5 }} onClick={() => handleEdit(r)}>
                                    <FiEdit3 size={12} /> Override
                                  </button>
                                )
                              ) : (
                                <span style={{ fontSize:'0.75rem', color:'rgba(199,220,246,0.35)' }}>No ID</span>
                              )}
                            </td>
                          </tr>

                          {/* ── Inline override form ── */}
                          {isEditing && (
                            <tr>
                              <td colSpan={6} style={{ padding: 0, border: 'none' }}>
                                <div style={{ margin: '0 0 4px', padding: '14px 16px', background: 'rgba(251,191,36,0.07)', borderLeft: '3px solid #fbbf24', borderRadius: '0 0 8px 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                  <div style={{ fontSize: '0.8rem', color: '#fbbf24', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <FiAlertCircle size={13} /> Override Estimated Read — Meter: <strong>{meterId}</strong>
                                  </div>
                                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                      <label style={{ fontSize: '0.75rem', color: 'rgba(199,220,246,0.6)' }}>New Reading Value <span style={{ color: '#f87171' }}>*</span></label>
                                      <input
                                        type="number"
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        style={{ background: 'rgba(255,255,255,0.07)', border: `1px solid ${rowErr ? '#f87171' : 'rgba(251,191,36,0.4)'}`, borderRadius: 8, color: '#e7f6ff', padding: '7px 12px', fontSize: '0.85rem', width: 160 }}
                                        autoFocus
                                      />
                                      {rowErr && <span style={{ fontSize: '0.72rem', color: '#f87171' }}>{rowErr}</span>}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 200 }}>
                                      <label style={{ fontSize: '0.75rem', color: 'rgba(199,220,246,0.6)' }}>Override Note (optional)</label>
                                      <input
                                        placeholder="Reason for override…"
                                        value={editNote}
                                        onChange={(e) => setEditNote(e.target.value)}
                                        style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(94,230,255,0.2)', borderRadius: 8, color: '#e7f6ff', padding: '7px 12px', fontSize: '0.82rem' }}
                                      />
                                    </div>
                                    <button
                                      className="dash-action-btn"
                                      onClick={() => handleSave(r)}
                                      disabled={isSaving || !editValue}
                                      style={{ color: '#34d399', borderColor: 'rgba(52,211,153,0.4)', display: 'inline-flex', alignItems: 'center', gap: 6, opacity: isSaving || !editValue ? 0.55 : 1, padding: '8px 14px' }}
                                    >
                                      {isSaving ? <FiRefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <FiSave size={13} />}
                                      {isSaving ? 'Saving…' : 'Save Override'}
                                    </button>
                                  </div>
                                  <div style={{ fontSize: '0.72rem', color: 'rgba(199,220,246,0.45)', marginTop: 2 }}>
                                    Saving will change read type to <strong style={{ color:'rgba(52,211,153,0.8)' }}>ACTUAL</strong> and source to <strong style={{ color:'rgba(52,211,153,0.8)' }}>MANUAL_OVERRIDE</strong>.
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ── Pagination ── */}
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <button className="dash-action-btn" onClick={() => setEstPage((p) => Math.max(0, p - 1))} disabled={safePage === 0}>← Prev</button>
                <span style={{ fontSize: '0.78rem', color: 'rgba(199,220,246,0.55)' }}>Page {safePage + 1} of {totalPages}</span>
                <button className="dash-action-btn" onClick={() => setEstPage((p) => Math.min(totalPages - 1, p + 1))} disabled={safePage >= totalPages - 1}>Next →</button>
                {Object.keys(overrideDone).length > 0 && (
                  <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <FiCheckCircle size={12} /> {Object.keys(overrideDone).length} override{Object.keys(overrideDone).length !== 1 ? 's' : ''} saved this session
                  </span>
                )}
              </div>
              </>
            )}
          </div>
        </div>
        );
      })()}
      {/* end estimation section */}

      {/* Billing Configuration */}
      {(activeSection === 'all' || activeSection === 'config') && (
      <div id="billing-config" className="dashboard-card" style={{ padding: 20, marginBottom: 18, scrollMarginTop: 100 }}>
        <h3 className="dash-section-title" style={{ marginBottom: 10 }}>Billing Configuration</h3>
        <div style={{ color: 'rgba(199,220,246,0.65)', fontSize: '0.82rem', marginBottom: 12 }}>
          Billing reference and tariff mapping visibility (read-only Phase-1).
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {/* Tariff Mapping */}
          <div className="dashboard-card" style={{ padding: 14, background: 'rgba(94,230,255,0.04)', border: '1px solid rgba(94,230,255,0.15)' }}>
            <h4 style={{ color: '#5ee6ff', marginBottom: 8, fontSize: '13px', fontWeight: '600' }}>📋 Active Tariff Plans</h4>
            <div style={{ fontSize: '12px', color: 'rgba(199,220,246,0.75)' }}>
              <div style={{ marginBottom: 6 }}>
                <div style={{ color: '#e7f6ff', fontWeight: '500' }}>Residential Tier A</div>
                <div>Rate: $0.145/kWh • Expires: 2026-05-30</div>
              </div>
              <div style={{ marginBottom: 6 }}>
                <div style={{ color: '#e7f6ff', fontWeight: '500' }}>Commercial Tier B</div>
                <div>Rate: $0.128/kWh • Expires: 2026-06-15</div>
              </div>
              <div>
                <div style={{ color: '#e7f6ff', fontWeight: '500' }}>Industrial Tier C</div>
                <div>Rate: $0.105/kWh • Expires: 2026-07-01</div>
              </div>
            </div>
          </div>

          {/* Billing References */}
          <div className="dashboard-card" style={{ padding: 14, background: 'rgba(52,211,153,0.04)', border: '1px solid rgba(52,211,153,0.15)' }}>
            <h4 style={{ color: '#34d399', marginBottom: 8, fontSize: '13px', fontWeight: '600' }}>🔗 Billing References</h4>
            <div style={{ fontSize: '12px', color: 'rgba(199,220,246,0.75)' }}>
              <div style={{ marginBottom: 6 }}>
                <div style={{ color: '#e7f6ff', fontWeight: '500' }}>Total Accounts Mapped</div>
                <div style={{ color: '#34d399', fontWeight: '600', fontSize: '14px' }}>1,247</div>
              </div>
              <div style={{ marginBottom: 6 }}>
                <div style={{ color: '#e7f6ff', fontWeight: '500' }}>Pending Reconciliation</div>
                <div style={{ color: '#fbbf24', fontWeight: '600', fontSize: '14px' }}>23</div>
              </div>
              <div>
                <div style={{ color: '#e7f6ff', fontWeight: '500' }}>Failed Mappings</div>
                <div style={{ color: '#f87171', fontWeight: '600', fontSize: '14px' }}>4</div>
              </div>
            </div>
          </div>
        </div>

        {/* Config Table */}
        <div style={{ marginTop: 16 }} className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Reference ID</th>
                <th>Account Type</th>
                <th>Tariff Plan</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>REF-00228</td>
                <td>Commercial</td>
                <td>Tier B</td>
                <td><span className="dash-job-badge" style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.35)' }}>ACTIVE</span></td>
              </tr>
              <tr>
                <td>REF-00229</td>
                <td>Residential</td>
                <td>Tier A</td>
                <td><span className="dash-job-badge" style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.35)' }}>ACTIVE</span></td>
              </tr>
              <tr>
                <td>REF-00230</td>
                <td>Industrial</td>
                <td>Tier C</td>
                <td><span className="dash-job-badge" style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.35)' }}>ACTIVE</span></td>
              </tr>
              <tr>
                <td>REF-00231</td>
                <td>Commercial</td>
                <td>Tier B</td>
                <td><span className="dash-job-badge" style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.35)' }}>PENDING</span></td>
              </tr>
              <tr>
                <td>REF-00232</td>
                <td>Residential</td>
                <td>Tier A</td>
                <td><span className="dash-job-badge" style={{ background: 'rgba(248,113,113,0.12)', color: '#f87171', border: '1px solid rgba(248,113,113,0.35)' }}>FAILED</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 12, fontSize: '12px', color: 'rgba(199,220,246,0.5)', fontStyle: 'italic' }}>
          ℹ️  Billing Configuration is read-only in Phase-1. Contact admin for changes.
        </div>
      </div>
      )} {/* end config guard */}

      {activeSection === 'all' && (<>
      <h3 className="dash-section-title" style={{ marginTop: 28 }}>Authorized Scope</h3>
      <div className="dashboard-grid">
        {SCOPE_CARDS.map(card => (
          <article key={card.label} className="dashboard-card dash-module-card" style={{ '--card-accent': card.color }}>
            <div className="dash-module-icon" style={{ color: card.color }}><card.icon size={22} /></div>
            <h3>{card.label}</h3>
            <p>{card.desc}</p>
          </article>
        ))}
      </div>
      </>)}

      <div className="dash-restricted-notice">
        <FiAlertTriangle size={14} style={{ marginRight: 6, flexShrink: 0 }} />
        <span>
          <strong>Restricted modules not shown:</strong> Users &amp; Roles, Asset Registry,
          Network Topology, Maintenance Profiles, Crew, Work Orders, Audit Logs, Regulatory Analytics
        </span>
      </div>

      {/* top-right notifications */}
      <div style={{ position: 'fixed', top: 18, right: 18, zIndex: 3000, display: 'grid', gap: 8 }}>
        {toasts.map((t) => {
          const c = t.type === 'success' ? '#34d399' : t.type === 'warn' ? '#fbbf24' : '#f87171';
          const icon = t.type === 'success' ? <FiCheckCircle size={14} /> : t.type === 'warn' ? <FiAlertTriangle size={14} /> : <FiXCircle size={14} />;
          return (
            <div key={t.id} style={{ background: '#0f1530', border: `1px solid ${c}66`, color: c, borderRadius: 10, padding: '9px 12px', minWidth: 220, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 10px 26px rgba(0,0,0,0.33)' }}>
              {icon} {t.text}
            </div>
          );
        })}
      </div>

    </section>
  );
}