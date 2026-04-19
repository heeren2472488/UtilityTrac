// filepath: c:\Users\2472488\Downloads\utiltrack-iam-react-fixed\utiltrack-iam-react\src\US001-5\pages\AssetsPage.jsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { assetService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './AssetsPage.css';

const ASSET_TYPES = ['TRANSFORMER', 'SUBSTATION', 'METER', 'VALVE', 'PUMP', 'BREAKER', 'SWITCH'];
const ASSET_STATUSES = ['ACTIVE', 'MAINTENANCE', 'INACTIVE', 'RETIRED'];

const emptyForm = {
  name: '',
  assetType: '',
  status: 'ACTIVE',
  serialNumber: '',
  location: '',
  installationDate: '',
  description: '',
  parentAssetId: null,
};

const normalizeAssetResponse = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.data?.content)) return payload.data.content;
  return [];
};

const getAssetId = (asset) => asset?.id ?? asset?.assetId ?? null;

export default function AssetsPage() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewAsset, setViewAsset] = useState(null);
  const [selectedParent, setSelectedParent] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await assetService.getAll();
      setAssets(normalizeAssetResponse(response?.data));
    } catch (err) {
      console.error('Error loading assets:', err);
      
      // Enhanced error handling for 403
      if (err.response?.status === 403) {
        const userRoles = user?.roles || [];
        const tokenPayload = token ? JSON.parse(atob(token.split('.')[1])) : {};
        const tokenAuthorities = tokenPayload?.authorities || [];
        const roleMsg = userRoles.length ? userRoles.join(', ') : 'NONE';
        const authMsg = tokenAuthorities.length ? tokenAuthorities.join(', ') : 'NONE';
        setError(`ACCESS DENIED (403): BACKEND REJECTED ASSET REQUEST. USER ROLES: ${roleMsg}. TOKEN AUTHORITIES: ${authMsg}. 
        
SOLUTION: Ensure backend /api/assets endpoint accepts '${roleMsg}' role. Backend may require ROLE_ADMIN or ROLE_PLANNER authority. 
Contact backend admin to verify: (1) Role names match exactly in backend, (2) Asset endpoint is configured to accept OPERATIONS PLANNER role, (3) User token includes correct authorities.`);
      } else {
        setError(err.response?.data?.message || 'Failed to load assets. Please try again.');
      }
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }, [user?.roles, token]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredAssets = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return assets.filter((asset) => {
      if (filterType && asset.assetType !== filterType) return false;
      if (filterStatus && asset.status !== filterStatus) return false;
      if (!query) return true;

      return (
        getAssetId(asset)?.toString().includes(query) ||
        asset.assetType?.toLowerCase().includes(query) ||
        asset.status?.toLowerCase().includes(query)
      );
    });
  }, [assets, filterType, filterStatus, searchQuery]);

  const handleSearch = () => {
    setSearchQuery(searchText);
  };

  const openCreate = () => {
    setForm(emptyForm);
    setSelected(null);
    setSelectedParent(null);
    setError('');
    setModal('create');
  };

  const openEdit = (asset) => {
    setSelected(asset);
    setForm({
      name: asset.name || '',
      assetType: asset.assetType || '',
      status: asset.status || 'ACTIVE',
      serialNumber: asset.serialNumber || '',
      location: asset.location || '',
      installationDate: asset.installationDate || '',
      description: asset.description || '',
      parentAssetId: asset.parentAssetId || null,
    });
    setSelectedParent(asset.parentAssetId || null);
    setError('');
    setModal('edit');
  };

  const handleSave = async () => {
    setError('');
    if (!form.name.trim() || !form.assetType || !form.serialNumber.trim() || !form.location.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    const payload = {
      name: form.name,
      assetType: form.assetType,
      status: form.status || 'ACTIVE',
      serialNumber: form.serialNumber,
      location: form.location,
      installationDate: form.installationDate || null,
      description: form.description,
      parentAssetId: selectedParent || null,
    };

    try {
      if (modal === 'create') {
        await assetService.create(payload);
        setSuccess('Asset created successfully');
      } else {
        await assetService.update(getAssetId(selected), payload);
        setSuccess('Asset updated successfully');
      }
      setModal(null);
      setViewAsset(null); // Ensure view modal is closed
      await load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Save error:', err);
      setError(err.response?.data?.message || err.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this asset?')) return;

    try {
      await assetService.delete(id);
      setSuccess('Asset deleted successfully');
      await load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.response?.data?.message || err.message || 'Delete failed');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return '#10b981';
      case 'MAINTENANCE': return '#f59e0b';
      case 'INACTIVE': return '#6b7280';
      case 'RETIRED': return '#ef4444';
      default: return '#3b82f6';
    }
  };

  return (
    <div className="assets-page">
      <div className="assets-header">
        <div className="assets-title-group">
          <button className="assets-back-btn" onClick={() => navigate('/dashboard')}>
            ← Back
          </button>
          <h1 className="assets-title">Assets Management</h1>
          <p className="assets-subtitle">Manage utility assets and their hierarchy</p>
        </div>
        <div className="assets-header-actions">
          <button className="assets-nav-link-btn active" onClick={() => navigate('/assets')}>
            Asset Management
          </button>
          <button className="assets-nav-link-btn" onClick={() => navigate('/network-topology')}>
            Network Topology
          </button>
          <button className="assets-btn-create" onClick={openCreate}>
            Add Asset
          </button>
        </div>
      </div>

      <div className="assets-filter-row">
        <div className="assets-filter-group">
          <input
            className="assets-filter-input"
            placeholder="Search by id, type, status"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <button className="assets-filter-btn" onClick={handleSearch}>
            Search
          </button>
        </div>

        <div className="assets-filter-group">
          <select
            className="assets-filter-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">All Types</option>
            {ASSET_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <select
            className="assets-filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Status</option>
            {ASSET_STATUSES.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="assets-alert assets-alert-error">⚠ {error}</div>}
      {success && <div className="assets-alert assets-alert-success">✓ {success}</div>}

      <div className="assets-grid">
        {loading ? (
          <div className="assets-loading-state">
            <div className="assets-spinner"></div>
            <p>Loading assets…</p>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="assets-empty-state">
            <h3>No assets found</h3>
            <p>Use search or filters to find assets, or create a new one.</p>
            <button className="assets-btn-create" onClick={openCreate}>
              Create Asset
            </button>
          </div>
        ) : (
          <table className="assets-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Type</th>
                <th>Serial Number</th>
                <th>Location</th>
                <th>Status</th>
                <th>Installation Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset) => (
                <tr key={getAssetId(asset)}>
                  <td className="assets-table-id">{getAssetId(asset)}</td>
                  <td>{asset.name || asset.serialNumber}</td>
                  <td>
                    <span className="assets-table-badge assets-table-badge-type">
                      {asset.assetType}
                    </span>
                  </td>
                  <td>{asset.serialNumber}</td>
                  <td>{asset.location}</td>
                  <td>
                    {asset.status && (
                      <span className="assets-table-badge assets-table-badge-status" style={{ borderColor: getStatusColor(asset.status), color: getStatusColor(asset.status) }}>
                        {asset.status}
                      </span>
                    )}
                  </td>
                  <td>
                    {asset.installationDate
                      ? new Date(asset.installationDate).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="assets-table-actions">
                    <button className="assets-table-action assets-table-action-view" onClick={() => setViewAsset(asset)}>
                      View
                    </button>
                    <button className="assets-table-action assets-table-action-edit" onClick={() => openEdit(asset)}>
                      Edit
                    </button>
                    <button className="assets-table-action assets-table-action-delete" onClick={() => handleDelete(getAssetId(asset))}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {viewAsset && (
        <div key="view-modal" className="assets-modal-overlay" onClick={() => setViewAsset(null)}>
          <div className="assets-modal" onClick={(e) => e.stopPropagation()}>
            <button className="assets-modal-close" onClick={() => setViewAsset(null)}>×</button>

            <div className="assets-modal-header">
              <h2 className="assets-modal-title">{viewAsset.name || viewAsset.serialNumber}</h2>
              <p className="assets-modal-subtitle">{viewAsset.assetType}</p>
              {viewAsset.status && (
                <span className="assets-modal-status" style={{ backgroundColor: getStatusColor(viewAsset.status) }}>
                  {viewAsset.status}
                </span>
              )}
            </div>

            <div className="assets-modal-body">
              <div className="assets-modal-section">
                <h4 className="assets-modal-section-title">Asset Information</h4>
                <div className="assets-modal-fields">
                  <div className="assets-modal-field">
                    <span className="assets-modal-label">Serial Number</span>
                    <p className="assets-modal-value">{viewAsset.serialNumber}</p>
                  </div>
                  <div className="assets-modal-field">
                    <span className="assets-modal-label">Location</span>
                    <p className="assets-modal-value">{viewAsset.location}</p>
                  </div>
                  {viewAsset.installationDate && (
                    <div className="assets-modal-field">
                      <span className="assets-modal-label">Installation Date</span>
                      <p className="assets-modal-value">{new Date(viewAsset.installationDate).toLocaleDateString()}</p>
                    </div>
                  )}
                  {viewAsset.description && (
                    <div className="assets-modal-field">
                      <span className="assets-modal-label">Description</span>
                      <p className="assets-modal-value">{viewAsset.description}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="assets-modal-footer">
              <button className="assets-btn-secondary" onClick={() => { setViewAsset(null); openEdit(viewAsset); }}>
                Edit
              </button>
              <button className="assets-btn-danger" onClick={() => { setViewAsset(null); handleDelete(getAssetId(viewAsset)); }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {(modal === 'create' || modal === 'edit') && (
        <div key="form-modal" className="assets-modal-overlay" onClick={() => setModal(null)}>
          <div className="assets-modal" onClick={(e) => e.stopPropagation()}>
            <button className="assets-modal-close" onClick={() => setModal(null)}>×</button>

            <div className="assets-modal-header">
              <h2 className="assets-modal-title">
                {modal === 'create' ? 'Create New Asset' : 'Edit Asset'}
              </h2>
            </div>

            {error && <div className="assets-alert assets-alert-error" style={{ margin: '16px' }}>⚠ {error}</div>}

            <div className="assets-modal-body">
              <div className="assets-form-group">
                <label className="assets-form-label">Asset Name</label>
                <input
                  className="assets-form-input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Enter asset name"
                />
              </div>

              <div className="assets-form-group">
                <label className="assets-form-label">Asset Type</label>
                <select
                  className="assets-form-input"
                  value={form.assetType}
                  onChange={(e) => setForm({ ...form, assetType: e.target.value })}
                >
                  <option value="">Select asset type</option>
                  {ASSET_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="assets-form-group">
                <label className="assets-form-label">Status</label>
                <select
                  className="assets-form-input"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  {ASSET_STATUSES.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div className="assets-form-group">
                <label className="assets-form-label">Serial Number</label>
                <input
                  className="assets-form-input"
                  value={form.serialNumber}
                  onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
                  placeholder="MTR-2026-001"
                />
              </div>

              <div className="assets-form-group">
                <label className="assets-form-label">Location</label>
                <input
                  className="assets-form-input"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="Residential Block A"
                />
              </div>

              <div className="assets-form-group">
                <label className="assets-form-label">Installation Date</label>
                <input
                  type="date"
                  className="assets-form-input"
                  value={form.installationDate}
                  onChange={(e) => setForm({ ...form, installationDate: e.target.value })}
                />
              </div>

              <div className="assets-form-group">
                <label className="assets-form-label">Description</label>
                <textarea
                  className="assets-form-input"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Enter asset description"
                  rows="3"
                />
              </div>

              <div className="assets-form-group">
                <label className="assets-form-label">Parent Asset (Optional)</label>
                <select
                  className="assets-form-input"
                  value={selectedParent || ''}
                  onChange={(e) => setSelectedParent(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">None</option>
                  {assets.filter((a) => getAssetId(a) !== getAssetId(selected)).map((asset) => (
                    <option key={getAssetId(asset)} value={getAssetId(asset)}>
                      {asset.name || asset.serialNumber} ({asset.assetType})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="assets-modal-footer">
              <button className="assets-btn-secondary" onClick={() => setModal(null)}>
                Cancel
              </button>
              <button className="assets-btn-primary" onClick={handleSave}>
                {modal === 'create' ? 'Create Asset' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}