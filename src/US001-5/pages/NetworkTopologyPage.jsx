import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { assetService, topologyService } from '../services/api';
import './NetworkTopologyPage.css';

const TOPOLOGY_RELATIONSHIPS = ['UPSTREAM', 'DOWNSTREAM', 'ADJACENT'];
const FALLBACK_ASSET_IMAGE = 'https://api.iconify.design/mdi:cube-outline.svg?color=%23dbe3ff';

const ASSET_IMAGE_MAP = {
  TRANSFORMER: 'https://api.iconify.design/mdi:transmission-tower.svg?color=%234f7cff',
  SUBSTATION: 'https://api.iconify.design/mdi:power-station.svg?color=%236a91ff',
  METER: 'https://api.iconify.design/mdi:gauge.svg?color=%2322c986',
  VALVE: 'https://api.iconify.design/mdi:valve.svg?color=%23f5b03a',
  PUMP: 'https://api.iconify.design/mdi:water-pump.svg?color=%2342a5f5',
  BREAKER: 'https://api.iconify.design/mdi:lightning-bolt.svg?color=%23ffb74d',
  SWITCH: 'https://api.iconify.design/mdi:toggle-switch-outline.svg?color=%23ab47bc',
};

const normalizeAssetResponse = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.data?.content)) return payload.data.content;
  return [];
};

const normalizeTopologyResponse = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.data?.content)) return payload.data.content;
  return [];
};

const normalizeHierarchyResponse = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.data?.content)) return payload.data.content;
  return [];
};

const getAssetId = (asset) => asset?.id ?? asset?.assetId ?? null;
const getHierarchyNodeId = (node) => node?.assetId ?? node?.id ?? null;

const hierarchyNodeMatches = (node, query) => {
  const id = getHierarchyNodeId(node);
  const searchable = [
    id,
    node?.name,
    node?.serialNumber,
    node?.assetType,
    node?.location,
    node?.status,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return searchable.includes(query);
};

const filterHierarchyTree = (nodes, query) => {
  if (!query) return nodes;

  const result = [];
  for (const node of nodes) {
    const children = Array.isArray(node.children) ? node.children : [];
    const filteredChildren = filterHierarchyTree(children, query);
    const isMatch = hierarchyNodeMatches(node, query);

    if (isMatch || filteredChildren.length > 0) {
      result.push({
        ...node,
        children: filteredChildren,
      });
    }
  }

  return result;
};

const collectHierarchyNodeIds = (nodes, bucket = []) => {
  nodes.forEach((node) => {
    const id = getHierarchyNodeId(node);
    if (id) bucket.push(id);
    if (Array.isArray(node.children) && node.children.length > 0) {
      collectHierarchyNodeIds(node.children, bucket);
    }
  });
  return bucket;
};

const HierarchyTreeNode = React.memo(function HierarchyTreeNode({ node, depth, expandedNodes, onToggle }) {
  const nodeId = getHierarchyNodeId(node);
  const children = Array.isArray(node.children) ? node.children : [];
  const hasChildren = children.length > 0;
  const isExpanded = expandedNodes.has(nodeId);

  return (
    <li className="network-topology-tree-node" style={{ '--node-depth': depth }}>
      <div className="network-topology-tree-row">
        <button
          className={`network-topology-tree-toggle ${hasChildren ? '' : 'is-leaf'}`}
          onClick={() => hasChildren && onToggle(nodeId)}
          disabled={!hasChildren}
          aria-label={hasChildren ? (isExpanded ? 'Collapse node' : 'Expand node') : 'Leaf node'}
        >
          {hasChildren ? (isExpanded ? '▾' : '▸') : '•'}
        </button>

        <div className="network-topology-tree-content">
          <span className="network-topology-tree-title">
            {node.name || node.serialNumber || `Asset ${nodeId}`}
          </span>
          <span className="network-topology-tree-meta">
            #{nodeId} • {node.assetType || 'UNKNOWN'} • {node.status || 'N/A'}
          </span>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <ul className="network-topology-tree-list">
          {children.map((child) => (
            <HierarchyTreeNode
              key={getHierarchyNodeId(child)}
              node={child}
              depth={depth + 1}
              expandedNodes={expandedNodes}
              onToggle={onToggle}
            />
          ))}
        </ul>
      )}
    </li>
  );
});

export default function NetworkTopologyPage() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [topologyLinks, setTopologyLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [topologyLoading, setTopologyLoading] = useState(true);
  const [hierarchyLoading, setHierarchyLoading] = useState(true);
  const [error, setError] = useState('');
  const [hierarchyError, setHierarchyError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [selectedLinkId, setSelectedLinkId] = useState(null);
  const [hierarchyRoots, setHierarchyRoots] = useState([]);
  const [hierarchyQuery, setHierarchyQuery] = useState('');
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [form, setForm] = useState({
    fromAssetId: '',
    toAssetId: '',
    relationship: 'DOWNSTREAM',
  });

  const loadAssets = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await assetService.getAll();
      setAssets(normalizeAssetResponse(response?.data));
    } catch (err) {
      console.error('Error loading assets:', err);
      setError('Failed to load assets for topology links.');
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTopology = useCallback(async () => {
    setTopologyLoading(true);
    setError('');
    try {
      const response = await topologyService.getAll();
      setTopologyLinks(normalizeTopologyResponse(response?.data));
    } catch (err) {
      console.error('Error loading topology links:', err);
      setError('Failed to load topology links.');
      setTopologyLinks([]);
    } finally {
      setTopologyLoading(false);
    }
  }, []);

  const loadHierarchy = useCallback(async () => {
    setHierarchyLoading(true);
    setHierarchyError('');
    try {
      const response = await assetService.getHierarchy();
      const roots = normalizeHierarchyResponse(response?.data);
      setHierarchyRoots(roots);

      const rootIds = roots
        .map((node) => getHierarchyNodeId(node))
        .filter(Boolean);
      setExpandedNodes(new Set(rootIds));
    } catch (err) {
      console.error('Error loading hierarchy:', err);
      setHierarchyError('Failed to load asset hierarchy.');
      setHierarchyRoots([]);
      setExpandedNodes(new Set());
    } finally {
      setHierarchyLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAssets();
    loadTopology();
    loadHierarchy();
  }, [loadAssets, loadTopology, loadHierarchy]);

  const assetNameMap = useMemo(() => {
    const map = new Map();
    assets.forEach((asset) => {
      const id = getAssetId(asset);
      if (!id) return;
      map.set(id, `${asset.name || asset.serialNumber || `Asset ${id}`} (${asset.assetType || 'UNKNOWN'})`);
    });
    return map;
  }, [assets]);

  const assetMap = useMemo(() => {
    const map = new Map();
    assets.forEach((asset) => {
      const id = getAssetId(asset);
      if (!id) return;
      map.set(id, asset);
    });
    return map;
  }, [assets]);

  const selectedLink = useMemo(
    () => topologyLinks.find((link) => link.linkId === selectedLinkId) || null,
    [topologyLinks, selectedLinkId]
  );

  const selectedFromAsset = selectedLink ? assetMap.get(selectedLink.fromAssetId) : null;
  const selectedToAsset = selectedLink ? assetMap.get(selectedLink.toAssetId) : null;

  const filteredHierarchy = useMemo(() => {
    const query = hierarchyQuery.trim().toLowerCase();
    return filterHierarchyTree(hierarchyRoots, query);
  }, [hierarchyRoots, hierarchyQuery]);

  useEffect(() => {
    if (!hierarchyQuery.trim()) return;
    const ids = collectHierarchyNodeIds(filteredHierarchy);
    setExpandedNodes(new Set(ids));
  }, [hierarchyQuery, filteredHierarchy]);

  const toggleNode = useCallback((id) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const expandAllNodes = () => {
    const ids = collectHierarchyNodeIds(filteredHierarchy);
    setExpandedNodes(new Set(ids));
  };

  const collapseAllNodes = () => {
    setExpandedNodes(new Set());
  };

  const getAssetImage = (asset) => {
    const type = asset?.assetType?.toUpperCase();
    return ASSET_IMAGE_MAP[type] || FALLBACK_ASSET_IMAGE;
  };

  const validateForm = () => {
    const fromAssetId = Number(form.fromAssetId);
    const toAssetId = Number(form.toAssetId);

    if (!fromAssetId || !toAssetId || !form.relationship) {
      return 'Please select source, target, and relationship.';
    }

    if (fromAssetId === toAssetId) {
      return 'Source and target assets cannot be the same.';
    }

    if (!TOPOLOGY_RELATIONSHIPS.includes(form.relationship)) {
      return 'Invalid relationship selected.';
    }

    const duplicate = topologyLinks.some((link) => {
      if (editingId && link.linkId === editingId) return false;

      const sameDirection = Number(link.fromAssetId) === fromAssetId && Number(link.toAssetId) === toAssetId;
      const reverseDirection = Number(link.fromAssetId) === toAssetId && Number(link.toAssetId) === fromAssetId;
      return sameDirection || reverseDirection;
    });

    if (duplicate) {
      return 'A link already exists between these two assets.';
    }

    return '';
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({
      fromAssetId: '',
      toAssetId: '',
      relationship: 'DOWNSTREAM',
    });
  };

  const handleSave = async () => {
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      fromAssetId: Number(form.fromAssetId),
      toAssetId: Number(form.toAssetId),
      relationship: form.relationship,
    };

    try {
      if (editingId) {
        await topologyService.update(editingId, payload);
        setSuccess('Topology link updated successfully');
      } else {
        await topologyService.create(payload);
        setSuccess('Topology link created successfully');
      }

      resetForm();
      await loadTopology();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Topology save error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save topology link');
    }
  };

  const handleEdit = (link) => {
    setError('');
    setEditingId(link.linkId);
    setSelectedLinkId(link.linkId);
    setForm({
      fromAssetId: String(link.fromAssetId),
      toAssetId: String(link.toAssetId),
      relationship: link.relationship || 'DOWNSTREAM',
    });
  };

  const handleRelationClick = (link) => {
    setSelectedLinkId(link.linkId);
  };

  const relationArrow = selectedLink?.relationship === 'UPSTREAM'
    ? '↑'
    : selectedLink?.relationship === 'ADJACENT'
      ? '↔'
      : '↓';

  const visualMode = selectedLink?.relationship === 'ADJACENT'
    ? 'adjacent'
    : selectedLink?.relationship === 'UPSTREAM'
      ? 'upstream'
      : 'downstream';

  return (
    <div className="network-topology-page">
      <div className="network-topology-header">
        <div className="network-topology-title-group">
          <button className="network-topology-back-btn" onClick={() => navigate('/dashboard')}>
            ← Back
          </button>
          <h1 className="network-topology-title">Network Topology Links</h1>
          <p className="network-topology-subtitle">Define source-to-target relationships for network visualization.</p>
        </div>
        <div className="network-topology-header-actions">
          <button className="network-topology-tab-btn" onClick={() => navigate('/assets')}>
            Asset Management
          </button>
          <button className="network-topology-tab-btn active" onClick={() => navigate('/network-topology')}>
            Network Topology
          </button>
        </div>
      </div>

      {error && <div className="network-topology-alert network-topology-alert-error">⚠ {error}</div>}
      {success && <div className="network-topology-alert network-topology-alert-success">✓ {success}</div>}

      <section className="network-topology-card">
        <h2>Create / Update Link</h2>
        <div className="network-topology-form">
          <div className="network-topology-form-group">
            <label>Source Asset</label>
            <select
              value={form.fromAssetId}
              onChange={(e) => setForm({ ...form, fromAssetId: e.target.value })}
              disabled={loading}
            >
              <option value="">Select source asset</option>
              {assets.map((asset) => {
                const id = getAssetId(asset);
                return (
                  <option key={id} value={id}>
                    {assetNameMap.get(id)}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="network-topology-form-group">
            <label>Target Asset</label>
            <select
              value={form.toAssetId}
              onChange={(e) => setForm({ ...form, toAssetId: e.target.value })}
              disabled={loading}
            >
              <option value="">Select target asset</option>
              {assets.map((asset) => {
                const id = getAssetId(asset);
                return (
                  <option key={id} value={id}>
                    {assetNameMap.get(id)}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="network-topology-form-group">
            <label>Relationship</label>
            <select
              value={form.relationship}
              onChange={(e) => setForm({ ...form, relationship: e.target.value })}
            >
              {TOPOLOGY_RELATIONSHIPS.map((relationship) => (
                <option key={relationship} value={relationship}>{relationship}</option>
              ))}
            </select>
          </div>

          <div className="network-topology-form-actions">
            <button className="network-topology-primary-btn" onClick={handleSave}>
              {editingId ? 'Update Link' : 'Create Link'}
            </button>
            {editingId && (
              <button className="network-topology-secondary-btn" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="network-topology-card">
        <h2>Defined Links</h2>

        {topologyLoading ? (
          <p className="network-topology-empty">Loading topology links…</p>
        ) : topologyLinks.length === 0 ? (
          <p className="network-topology-empty">No topology links defined yet.</p>
        ) : (
          <div className="network-topology-table-wrap">
            <table className="network-topology-table">
              <thead>
                <tr>
                  <th>Link ID</th>
                  <th>Source Asset</th>
                  <th>Target Asset</th>
                  <th>Relationship</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {topologyLinks.map((link) => (
                  <tr key={link.linkId}>
                    <td>{link.linkId}</td>
                    <td>{assetNameMap.get(link.fromAssetId) || `Asset ${link.fromAssetId}`}</td>
                    <td>{assetNameMap.get(link.toAssetId) || `Asset ${link.toAssetId}`}</td>
                    <td>
                      <button
                        className={`network-topology-badge network-topology-badge-btn ${selectedLinkId === link.linkId ? 'active' : ''}`}
                        onClick={() => handleRelationClick(link)}
                        title="Click to view visual mapping"
                      >
                        {link.relationship}
                      </button>
                    </td>
                    <td>
                      <button className="network-topology-edit-btn" onClick={() => handleEdit(link)}>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="network-topology-card">
        <h2>Visual Topology Mapping</h2>
        {!selectedLink ? (
          <p className="network-topology-empty">Click any relationship badge above to view mapped assets with images.</p>
        ) : (
          <div className={`network-topology-visual-wrap ${visualMode}`}>
            <div className="network-topology-node-card network-topology-node-source">
              <img
                src={getAssetImage(selectedFromAsset)}
                alt={selectedFromAsset?.assetType || 'Source Asset'}
                className="network-topology-node-image"
                onError={(e) => {
                  e.currentTarget.src = FALLBACK_ASSET_IMAGE;
                }}
              />
              <div className="network-topology-node-info">
                <span className="network-topology-node-tag">Source</span>
                <h4>{assetNameMap.get(selectedLink.fromAssetId) || `Asset ${selectedLink.fromAssetId}`}</h4>
                <p>{selectedFromAsset?.location || 'Location not available'}</p>
              </div>
            </div>

            <div className="network-topology-connector">
              <span className="network-topology-connector-arrow">{relationArrow}</span>
              <span className="network-topology-connector-label">{selectedLink.relationship}</span>
            </div>

            <div className="network-topology-node-card network-topology-node-target">
              <img
                src={getAssetImage(selectedToAsset)}
                alt={selectedToAsset?.assetType || 'Target Asset'}
                className="network-topology-node-image"
                onError={(e) => {
                  e.currentTarget.src = FALLBACK_ASSET_IMAGE;
                }}
              />
              <div className="network-topology-node-info">
                <span className="network-topology-node-tag">Target</span>
                <h4>{assetNameMap.get(selectedLink.toAssetId) || `Asset ${selectedLink.toAssetId}`}</h4>
                <p>{selectedToAsset?.location || 'Location not available'}</p>
              </div>
            </div>
          </div>
        )}

        <div className="network-topology-asset-gallery">
          {assets.map((asset) => {
            const id = getAssetId(asset);
            const isActive = selectedLink && (selectedLink.fromAssetId === id || selectedLink.toAssetId === id);
            return (
              <div key={id} className={`network-topology-asset-tile ${isActive ? 'active' : ''}`}>
                <img
                  src={getAssetImage(asset)}
                  alt={asset.assetType || 'Asset'}
                  className="network-topology-asset-tile-image"
                  onError={(e) => {
                    e.currentTarget.src = FALLBACK_ASSET_IMAGE;
                  }}
                />
                <div className="network-topology-asset-tile-text">
                  <strong>{asset.name || asset.serialNumber || `Asset ${id}`}</strong>
                  <span>{asset.assetType || 'UNKNOWN'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="network-topology-card">
        <div className="network-topology-tree-header">
          <h2>Asset Hierarchy Tree</h2>
          <div className="network-topology-tree-actions">
            <input
              className="network-topology-tree-search"
              placeholder="Search hierarchy by id, serial, type, location, status..."
              value={hierarchyQuery}
              onChange={(e) => setHierarchyQuery(e.target.value)}
            />
            <button className="network-topology-secondary-btn" onClick={expandAllNodes}>
              Expand All
            </button>
            <button className="network-topology-secondary-btn" onClick={collapseAllNodes}>
              Collapse All
            </button>
          </div>
        </div>

        {hierarchyError && <div className="network-topology-alert network-topology-alert-error">⚠ {hierarchyError}</div>}

        {hierarchyLoading ? (
          <p className="network-topology-empty">Loading hierarchy tree…</p>
        ) : filteredHierarchy.length === 0 ? (
          <p className="network-topology-empty">No hierarchy nodes found.</p>
        ) : (
          <ul className="network-topology-tree-list root">
            {filteredHierarchy.map((rootNode) => (
              <HierarchyTreeNode
                key={getHierarchyNodeId(rootNode)}
                node={rootNode}
                depth={0}
                expandedNodes={expandedNodes}
                onToggle={toggleNode}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
