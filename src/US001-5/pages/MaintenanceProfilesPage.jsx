import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { assetService, maintenanceProfileService } from '../services/api';
import './MaintenanceProfilesPage.css';

const MAINTENANCE_TYPES = ['PREVENTIVE', 'CORRECTIVE', 'PREDICTIVE', 'INSPECTION'];
const RISK_CLASSES = ['LOW', 'MEDIUM', 'HIGH'];

const emptyForm = {
  assetId: '',
  profileName: '',
  description: '',
  maintenanceType: 'PREVENTIVE',
  frequencyDays: '',
  estimatedDurationHours: '',
  requiredCrewSize: '',
  estimatedCost: '',
  riskClass: 'MEDIUM',
  isStandardized: true,
};

const normalizeResponse = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.data?.content)) return payload.data.content;
  return [];
};

const getAssetId = (asset) => asset?.id ?? asset?.assetId ?? null;

const parseRiskClass = (profile) => {
  const raw = profile?.skillRequirements || '';
  const match = raw.match(/RISK_CLASS\s*:\s*(LOW|MEDIUM|HIGH)/i);
  return match ? match[1].toUpperCase() : '—';
};

export default function MaintenanceProfilesPage() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assetLoading, setAssetLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const [filterId, setFilterId] = useState('');
  const [filterAssetId, setFilterAssetId] = useState('');
  const [filterType, setFilterType] = useState('');
  const [searchText, setSearchText] = useState('');

  const loadAssets = useCallback(async () => {
    setAssetLoading(true);
    try {
      const response = await assetService.getAll();
      setAssets(normalizeResponse(response?.data));
    } catch (e) {
      console.error('Asset load failed', e);
      setAssets([]);
    } finally {
      setAssetLoading(false);
    }
  }, []);

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      if (filterId.trim()) {
        const response = await maintenanceProfileService.getById(Number(filterId));
        setProfiles(response?.data ? [response.data] : []);
      } else {
        const params = {};
        if (filterAssetId) params.assetId = Number(filterAssetId);
        if (filterType) params.maintenanceType = filterType;

        const response = await maintenanceProfileService.getAll(params);
        setProfiles(normalizeResponse(response?.data));
      }
    } catch (e) {
      console.error('Profile load failed', e);
      setError(e.response?.data?.message || 'Failed to load maintenance profiles');
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, [filterId, filterAssetId, filterType]);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const assetNameMap = useMemo(() => {
    const map = new Map();
    assets.forEach((asset) => {
      const id = getAssetId(asset);
      if (!id) return;
      map.set(id, `${asset.name || asset.serialNumber || `Asset ${id}`} (${asset.assetType || 'UNKNOWN'})`);
    });
    return map;
  }, [assets]);

  const filteredProfiles = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return profiles;

    return profiles.filter((profile) => {
      return (
        String(profile.id || '').includes(query) ||
        String(profile.assetId || '').includes(query) ||
        (profile.profileName || '').toLowerCase().includes(query) ||
        (profile.maintenanceType || '').toLowerCase().includes(query)
      );
    });
  }, [profiles, searchText]);

  const validateForm = () => {
    if (!form.assetId) return 'Asset is required';
    if (!form.profileName.trim()) return 'Profile name is required';
    if (form.profileName.trim().length < 3) return 'Profile name must be at least 3 characters';

    const interval = Number(form.frequencyDays);
    if (!Number.isFinite(interval) || interval <= 0 || !Number.isInteger(interval)) {
      return 'Interval (days) must be a positive whole number';
    }

    if (!RISK_CLASSES.includes(form.riskClass)) {
      return 'Risk class must be LOW, MEDIUM, or HIGH';
    }

    const duration = Number(form.estimatedDurationHours);
    if (!Number.isFinite(duration) || duration <= 0) {
      return 'Estimated duration must be greater than 0';
    }

    const crewSize = Number(form.requiredCrewSize);
    if (!Number.isFinite(crewSize) || crewSize <= 0 || !Number.isInteger(crewSize)) {
      return 'Required crew size must be a positive whole number';
    }

    const cost = Number(form.estimatedCost);
    if (!Number.isFinite(cost) || cost < 0) {
      return 'Estimated cost cannot be negative';
    }

    return '';
  };

  const handleCreate = async () => {
    setError('');
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      assetId: Number(form.assetId),
      profileName: form.profileName.trim(),
      description: form.description.trim() || null,
      maintenanceType: form.maintenanceType,
      frequencyDays: Number(form.frequencyDays),
      estimatedDurationHours: Number(form.estimatedDurationHours),
      requiredCrewSize: Number(form.requiredCrewSize),
      estimatedCost: Number(form.estimatedCost),
      skillRequirements: `RISK_CLASS:${form.riskClass}`,
      status: 'ACTIVE',
      isStandardized: Boolean(form.isStandardized),
    };

    try {
      await maintenanceProfileService.create(payload);
      setSuccess('Maintenance profile saved successfully');
      setShowForm(false);
      setForm(emptyForm);
      await loadProfiles();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      console.error('Create profile failed', e);
      setError(e.response?.data?.message || 'Failed to save profile');
    }
  };

  return (
    <div className="maint-page">
      <div className="maint-header">
        <div className="maint-title-group">
          <button className="maint-back-btn" onClick={() => navigate('/dashboard')}>← Back</button>
          <h1 className="maint-title">Maintenance Profiles</h1>
          <p className="maint-subtitle">Standardize maintenance configuration across assets.</p>
        </div>

        <div className="maint-header-actions">
          <button className="maint-btn maint-btn-secondary" onClick={() => navigate('/assets')}>Assets</button>
          <button className="maint-btn maint-btn-primary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Close Form' : '+ New Profile'}
          </button>
        </div>
      </div>

      {error && <div className="maint-alert maint-alert-error">⚠ {error}</div>}
      {success && <div className="maint-alert maint-alert-success">✓ {success}</div>}

      {showForm && (
        <section className="maint-card">
          <h2>Create Maintenance Profile</h2>
          <div className="maint-form-grid">
            <div className="maint-field">
              <label>Asset</label>
              <select value={form.assetId} onChange={(e) => setForm({ ...form, assetId: e.target.value })} disabled={assetLoading}>
                <option value="">Select asset</option>
                {assets.map((asset) => {
                  const id = getAssetId(asset);
                  return <option key={id} value={id}>{assetNameMap.get(id)}</option>;
                })}
              </select>
            </div>

            <div className="maint-field">
              <label>Profile Name</label>
              <input value={form.profileName} onChange={(e) => setForm({ ...form, profileName: e.target.value })} placeholder="Transformer Maintenance" />
            </div>

            <div className="maint-field">
              <label>Maintenance Type</label>
              <select value={form.maintenanceType} onChange={(e) => setForm({ ...form, maintenanceType: e.target.value })}>
                {MAINTENANCE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>

            <div className="maint-field">
              <label>Interval (Days)</label>
              <input type="number" min="1" value={form.frequencyDays} onChange={(e) => setForm({ ...form, frequencyDays: e.target.value })} placeholder="30" />
            </div>

            <div className="maint-field">
              <label>Risk Class</label>
              <select value={form.riskClass} onChange={(e) => setForm({ ...form, riskClass: e.target.value })}>
                {RISK_CLASSES.map((risk) => <option key={risk} value={risk}>{risk}</option>)}
              </select>
            </div>

            <div className="maint-field">
              <label>Estimated Duration (Hours)</label>
              <input type="number" min="0.5" step="0.5" value={form.estimatedDurationHours} onChange={(e) => setForm({ ...form, estimatedDurationHours: e.target.value })} placeholder="8.5" />
            </div>

            <div className="maint-field">
              <label>Required Crew Size</label>
              <input type="number" min="1" value={form.requiredCrewSize} onChange={(e) => setForm({ ...form, requiredCrewSize: e.target.value })} placeholder="3" />
            </div>

            <div className="maint-field">
              <label>Estimated Cost</label>
              <input type="number" min="0" step="0.01" value={form.estimatedCost} onChange={(e) => setForm({ ...form, estimatedCost: e.target.value })} placeholder="2500" />
            </div>

            <div className="maint-field maint-field-full">
              <label>Description (Optional)</label>
              <textarea rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Procedure notes / standard steps" />
            </div>

            <div className="maint-field maint-check-field">
              <label className="maint-checkbox-row">
                <input type="checkbox" checked={form.isStandardized} onChange={(e) => setForm({ ...form, isStandardized: e.target.checked })} />
                <span>Standardized profile template</span>
              </label>
            </div>
          </div>

          <div className="maint-actions">
            <button className="maint-btn maint-btn-secondary" onClick={() => { setShowForm(false); setForm(emptyForm); }}>Cancel</button>
            <button className="maint-btn maint-btn-primary" onClick={handleCreate}>Save Profile</button>
          </div>
        </section>
      )}

      <section className="maint-card">
        <div className="maint-toolbar">
          <input className="maint-search" placeholder="Search by id, asset id, name, type" value={searchText} onChange={(e) => setSearchText(e.target.value)} />
          <input className="maint-small-input" type="number" min="1" placeholder="Profile ID" value={filterId} onChange={(e) => setFilterId(e.target.value)} />
          <select className="maint-select" value={filterAssetId} onChange={(e) => setFilterAssetId(e.target.value)}>
            <option value="">All Assets</option>
            {assets.map((asset) => {
              const id = getAssetId(asset);
              return <option key={id} value={id}>{assetNameMap.get(id)}</option>;
            })}
          </select>
          <select className="maint-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="">All Types</option>
            {MAINTENANCE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
          <button className="maint-btn maint-btn-secondary" onClick={loadProfiles}>Apply</button>
        </div>

        <div className="maint-table-wrap">
          <table className="maint-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Profile</th>
                <th>Asset</th>
                <th>Type</th>
                <th>Interval</th>
                <th>Risk</th>
                <th>Crew</th>
                <th>Cost</th>
                <th>Standardized</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" className="maint-empty">Loading profiles...</td></tr>
              ) : filteredProfiles.length === 0 ? (
                <tr><td colSpan="9" className="maint-empty">No maintenance profiles found.</td></tr>
              ) : (
                filteredProfiles.map((profile) => (
                  <tr key={profile.id}>
                    <td>#{profile.id}</td>
                    <td>{profile.profileName}</td>
                    <td>{assetNameMap.get(profile.assetId) || `Asset ${profile.assetId}`}</td>
                    <td><span className="maint-badge">{profile.maintenanceType}</span></td>
                    <td>{profile.frequencyDays} days</td>
                    <td>{parseRiskClass(profile)}</td>
                    <td>{profile.requiredCrewSize}</td>
                    <td>${Number(profile.estimatedCost || 0).toLocaleString()}</td>
                    <td>{profile.isStandardized ? 'Yes' : 'No'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
