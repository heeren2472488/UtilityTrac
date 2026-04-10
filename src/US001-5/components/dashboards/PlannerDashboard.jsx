import React, { useState, useEffect, useCallback } from 'react';
import { FaTree, FaClipboardList, FaUsers, FaChevronDown, FaChevronRight, FaSearch, FaCheckCircle } from 'react-icons/fa';
import { MdCheckCircle, MdPending } from 'react-icons/md';
import { workOrderService, crewService, assetService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './Dashboard.css';

const normalizeListResponse = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.workOrders)) return payload.workOrders;
  if (Array.isArray(payload?.data?.workOrders)) return payload.data.workOrders;
  if (Array.isArray(payload?.data?.data?.workOrders)) return payload.data.data.workOrders;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.data?.content)) return payload.data.content;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data?.results)) return payload.data.results;
  if (Array.isArray(payload?.result)) return payload.result;

  // Deep fallback: first array found in object tree (up to 3 levels)
  if (payload && typeof payload === 'object') {
    for (const v1 of Object.values(payload)) {
      if (Array.isArray(v1)) return v1;
      if (v1 && typeof v1 === 'object') {
        for (const v2 of Object.values(v1)) {
          if (Array.isArray(v2)) return v2;
          if (v2 && typeof v2 === 'object') {
            for (const v3 of Object.values(v2)) {
              if (Array.isArray(v3)) return v3;
            }
          }
        }
      }
    }
  }
  return [];
};

const getWorkOrderId = (wo) => wo?.id ?? wo?.workOrderId ?? null;
const getCrewId = (crew) => crew?.id ?? crew?.crewId ?? null;
const getAssetId = (asset) => asset?.id ?? asset?.assetId ?? null;

// Asset hierarchy tree node component - memoized for efficient rendering
const HierarchyTreeNode = React.memo(({ node, expandedIds, onExpandToggle, onSelect, searchQuery }) => {
  const isExpanded = expandedIds.has(node.id);
  const hasChildren = node.children && node.children.length > 0;
  const nodeName = node.name || 'Unnamed Asset';
  
  // Highlight matching search terms (without innerHTML)
  const renderHighlightedText = (text) => {
    if (!searchQuery || searchQuery.length === 0) return text;
    const safeQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${safeQuery})`, 'ig');
    const parts = String(text).split(regex);
    return parts.map((part, idx) =>
      part.toLowerCase() === searchQuery.toLowerCase()
        ? <strong key={`${node.id}-hl-${idx}`}>{part}</strong>
        : <React.Fragment key={`${node.id}-tx-${idx}`}>{part}</React.Fragment>
    );
  };

  return (
    <div className="hierarchy-node" style={{ marginLeft: `${(node.level || 0) * 20}px` }}>
      <div className="hierarchy-row">
        {hasChildren && (
          <button
            className="expand-btn"
            onClick={() => onExpandToggle(node.id)}
          >
            {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
          </button>
        )}
        {!hasChildren && <span className="expand-btn-placeholder" />}
        <button
          className="node-btn"
          onClick={() => onSelect(node)}
        >
          {renderHighlightedText(nodeName)}
        </button>
        <span className="node-type">{node.type || 'Asset'}</span>
      </div>
      {isExpanded && hasChildren && (
        <div className="hierarchy-children">
          {node.children.map((child, index) => (
            <HierarchyTreeNode
              key={child.id ?? `${node.id}-child-${index}`}
              node={child}
              expandedIds={expandedIds}
              onExpandToggle={onExpandToggle}
              onSelect={onSelect}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}
    </div>
  );
});

export default function PlannerDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('hierarchy');
  
  // Hierarchy state
  const [hierarchyData, setHierarchyData] = useState([]);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [hierarchySearch, setHierarchySearch] = useState('');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [hierarchyLoading, setHierarchyLoading] = useState(false);

  // Work order state
  const [workOrders, setWorkOrders] = useState([]);
  const [workOrdersLoading, setWorkOrdersLoading] = useState(false);
  const [workOrdersError, setWorkOrdersError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assetId: '',
    workType: 'PREVENTIVE_MAINTENANCE',
    priority: 'MEDIUM',
    scheduledStartDate: '',
    scheduledEndDate: '',
    estimatedDurationHours: '',
    estimatedCost: '',
    maintenanceProfileId: 1,
  });
  const [formErrors, setFormErrors] = useState({});
  const [workOrderSuccess, setWorkOrderSuccess] = useState('');

  // Crew assignment state
  const [crews, setCrews] = useState([]);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);
  const [selectedCrew, setSelectedCrew] = useState(null);
  const [crewsLoading, setCrewsLoading] = useState(false);
  const [assignmentSuccess, setAssignmentSuccess] = useState('');

  // Load asset hierarchy from backend
  useEffect(() => {
    const loadHierarchy = async () => {
      setHierarchyLoading(true);
      try {
        // Try full hierarchy endpoint first, fall back to flat list
        let assets = [];
        try {
          const res = await assetService.getHierarchy();
          const payload = res.data?.data || res.data;
          assets = Array.isArray(payload) ? payload : [];
        } catch {
          const res = await assetService.getAll();
          const payload = res.data?.data?.content || res.data?.data || res.data?.content || res.data || [];
          assets = Array.isArray(payload) ? payload : [];
        }

        if (assets.length === 0) {
          setHierarchyData([]);
          return;
        }

        // If the data already has children arrays (tree), use as-is
        const hasChildren = assets[0]?.children !== undefined;
        if (hasChildren) {
          const addLevels = (nodes, level = 0) =>
            nodes.map(n => ({
              ...n,
              id: getAssetId(n),
              type: n.type || n.assetType || 'Asset',
              level,
              children: addLevels(n.children || [], level + 1),
            }));
          const tree = addLevels(assets);
          setHierarchyData(tree);
          if (tree.length > 0) setExpandedIds(new Set([tree[0].id]));
        } else {
          // Build tree from parentAssetId / parentId
          const normalizedAssets = assets.map((a) => ({ ...a, id: getAssetId(a) }));
          const idSet = new Set(normalizedAssets.map((a) => a.id).filter(Boolean));
          const getParentId = (i) => i.parentAssetId ?? i.parentId ?? null;

          const roots = normalizedAssets.filter((i) => {
            const parent = getParentId(i);
            return parent === null || parent === undefined || parent === 0 || !idSet.has(parent);
          });

          const buildTree = (items, parentId, level = 0) =>
            items
              .filter(i => getParentId(i) === parentId)
              .map(i => ({
                ...i,
                type: i.type || i.assetType || 'Asset',
                level,
                children: buildTree(items, i.id, level + 1),
              }));

          const tree = roots.map((root) => ({
            ...root,
            type: root.type || root.assetType || 'Asset',
            level: 0,
            children: buildTree(normalizedAssets, root.id, 1),
          }));

          const result = tree.length > 0
            ? tree
            : normalizedAssets.map(a => ({ ...a, type: a.type || a.assetType || 'Asset', level: 0, children: [] }));
          setHierarchyData(result);
          if (result.length > 0) setExpandedIds(new Set([result[0].id]));
        }
      } catch (error) {
        console.error('Failed to load asset hierarchy:', error);
        setHierarchyData([]);
      } finally {
        setHierarchyLoading(false);
      }
    };
    loadHierarchy();
  }, []);

  const loadWorkOrdersData = useCallback(async () => {
    setWorkOrdersLoading(true);
    setWorkOrdersError('');
    try {
      const response = await workOrderService.getAll();
      const list = normalizeListResponse(response?.data);
      setWorkOrders(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error('Failed to load work orders:', error);
      setWorkOrders([]);
      setWorkOrdersError(error?.response?.data?.message || 'Failed to load work orders from backend');
    } finally {
      setWorkOrdersLoading(false);
    }
  }, []);

  // Load work orders from backend
  useEffect(() => {
    loadWorkOrdersData();
  }, [loadWorkOrdersData]);

  const loadCrewsData = useCallback(async () => {
    setCrewsLoading(true);
    try {
      const response = await crewService.getAll();
      const list = normalizeListResponse(response?.data);
      setCrews(
        Array.isArray(list)
          ? list.map((c) => ({
              ...c,
              id: c.id ?? c.crewId,
              name: c.name || c.crewName || c.teamName || c.contactInfo,
              email: c.email || c.contactInfo,
              crewType: c.crewType || c.type || c.skillset,
              status: c.status || c.crewStatus || c.availability,
            }))
          : []
      );
    } catch (error) {
      console.error('Failed to load crews:', error);
      setCrews([]);
    } finally {
      setCrewsLoading(false);
    }
  }, []);

  // Load crews from backend
  useEffect(() => {
    loadCrewsData();
  }, [loadCrewsData]);

  // Hierarchy expand/collapse
  const handleExpandToggle = useCallback((nodeId) => {
    setExpandedIds(prev => {
      const updated = new Set(prev);
      if (updated.has(nodeId)) {
        updated.delete(nodeId);
      } else {
        updated.add(nodeId);
      }
      return updated;
    });
  }, []);

  // Search with auto-expand
  const handleHierarchySearch = useCallback((query) => {
    setHierarchySearch(query);
    if (query.length > 0) {
      const matchingIds = new Set();
      const collectMatching = (nodes) => {
        nodes.forEach(node => {
          const nodeName = node.name || '';
          if (nodeName.toLowerCase().includes(query.toLowerCase())) {
            matchingIds.add(node.id);
          }
          if (node.children) collectMatching(node.children);
        });
      };
      collectMatching(hierarchyData);
      setExpandedIds(matchingIds);
    }
  }, [hierarchyData]);

  // Select asset and pre-fill form
  const handleAssetSelect = (asset) => {
    setSelectedAsset(asset);
    setFormData(prev => ({ ...prev, assetId: getAssetId(asset) || '' }));
  };

  // Form field change
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Validate work order form
  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = 'Title is required';
    if (!formData.assetId) errors.assetId = 'Asset is required';
    if (!formData.scheduledStartDate) errors.scheduledStartDate = 'Start date is required';
    if (!formData.scheduledEndDate) errors.scheduledEndDate = 'End date is required';
    if (!formData.estimatedDurationHours || Number(formData.estimatedDurationHours) <= 0)
      errors.estimatedDurationHours = 'Duration must be greater than 0';
    if (!formData.estimatedCost || Number(formData.estimatedCost) <= 0)
      errors.estimatedCost = 'Cost must be greater than 0';
    return errors;
  };

  // Create work order
  // Create work order via backend API
  const handleCreateWorkOrder = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const numericAssetId = Number(formData.assetId);
      if (!Number.isFinite(numericAssetId) || numericAssetId <= 0) {
        setFormErrors({ assetId: 'Please select a valid asset' });
        setIsSubmitting(false);
        return;
      }

      const payload = {
        title: formData.title,
        description: formData.description || undefined,
        assetId: numericAssetId,
        workType: formData.workType,
        priority: formData.priority,
        scheduledStartDate: formData.scheduledStartDate,
        scheduledEndDate: formData.scheduledEndDate,
        estimatedDurationHours: Number(formData.estimatedDurationHours),
        estimatedCost: Number(formData.estimatedCost),
        maintenanceProfileId: Number(formData.maintenanceProfileId) || 1,
        plannerId: Number(user?.id) || 1,
      };

      await workOrderService.create(payload);
      await loadWorkOrdersData();
      setWorkOrderSuccess('Work order created successfully!');
      setTimeout(() => setWorkOrderSuccess(''), 4000);

      // Reset form
      setFormData({
        title: '',
        description: '',
        assetId: '',
        workType: 'PREVENTIVE_MAINTENANCE',
        priority: 'MEDIUM',
        scheduledStartDate: '',
        scheduledEndDate: '',
        estimatedDurationHours: '',
        estimatedCost: '',
        maintenanceProfileId: 1,
      });
      setFormErrors({});
      setSelectedAsset(null);
    } catch (error) {
      console.error('Failed to create work order:', error);
      setFormErrors({ submit: error.response?.data?.message || 'Failed to create work order. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Assign crew to work order via backend API
  const handleAssignCrew = async () => {
    if (!selectedWorkOrder || !selectedCrew) {
      alert('Please select both a work order and a crew');
      return;
    }
    try {
      await crewService.assignToWorkOrder(getWorkOrderId(selectedWorkOrder), getCrewId(selectedCrew));
      await loadWorkOrdersData();
      setAssignmentSuccess(`Crew "${selectedCrew.name}" assigned to "${selectedWorkOrder.title}" successfully!`);
      setTimeout(() => setAssignmentSuccess(''), 4000);
      setSelectedWorkOrder(null);
      setSelectedCrew(null);
    } catch (error) {
      console.error('Failed to assign crew:', error);
      alert(error.response?.data?.message || 'Failed to assign crew. Please try again.');
    }
  };

  // Flatten nested hierarchy into a single list for dropdowns
  const flattenAssets = (nodes) => {
    const result = [];
    const traverse = (list) => list.forEach(n => { result.push(n); if (n.children) traverse(n.children); });
    traverse(nodes);
    return result;
  };
  const allAssets = flattenAssets(hierarchyData).filter((a) => getAssetId(a));

  const unassignedWOs = workOrders.filter(wo => !wo.assignedCrew && !wo.crewId);
  const getAssetName = (assetId) => {
    const findAsset = (nodes) => {
      for (let node of nodes) {
        if (node.id === assetId) return node.name;
        if (node.children) {
          const found = findAsset(node.children);
          if (found) return found;
        }
      }
      return 'Unknown Asset';
    };
    return findAsset(hierarchyData);
  };

  return (
    <section className="dashboard-panel planner-dashboard-enhanced">
      <div className="dashboard-header planner-header-enhanced">
        <div className="dashboard-meta">
          <span className="dashboard-label">Planner Cockpit</span>
          <h2 className="dashboard-title"><FaTree style={{marginRight: '12px'}} /> Maintenance Planning & Crew Readiness</h2>
          <p className="dashboard-description">
            Efficiently manage asset hierarchies, create work orders, and allocate crews for seamless maintenance execution
          </p>
        </div>
        <div className="dashboard-stats-row">
          <div className="dashboard-stat-box">
            <div className="stat-number">{workOrders.length}</div>
            <div className="stat-label">Work Orders</div>
          </div>
          <div className="dashboard-stat-box">
            <div className="stat-number">{workOrders.filter(wo => wo.assignedCrew).length}</div>
            <div className="stat-label">Assigned</div>
          </div>
          <div className="dashboard-stat-box">
            <div className="stat-number">{crews.length}</div>
            <div className="stat-label">Available Crews</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="planner-tabs-container">
        <div className="planner-tabs-header">
          <h3>Select an action</h3>
        </div>
        <div className="planner-tabs">
        <button
          className={`tab-btn ${activeTab === 'hierarchy' ? 'active' : ''}`}
          onClick={() => setActiveTab('hierarchy')}
        >
          <FaTree className="tab-icon" /> Asset Hierarchy
        </button>
        <button
          className={`tab-btn ${activeTab === 'work-orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('work-orders')}
        >
          <FaClipboardList className="tab-icon" /> Create Work Order
        </button>
        <button
          className={`tab-btn ${activeTab === 'assign-crew' ? 'active' : ''}`}
          onClick={() => setActiveTab('assign-crew')}
        >
          <FaUsers className="tab-icon" /> Assign Crews
        </button>
        </div>
      </div>

      {/* Asset Hierarchy Tab */}
      {activeTab === 'hierarchy' && (
        <div className="tab-content">
          <h3>Asset Hierarchy for Planning</h3>
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search assets..."
              value={hierarchySearch}
              onChange={(e) => handleHierarchySearch(e.target.value)}
              className="search-input"
            />
          </div>

          {hierarchyLoading ? (
            <div className="loading">Loading asset hierarchy...</div>
          ) : hierarchyData.length === 0 ? (
            <div className="empty">No assets available</div>
          ) : (
            <div className="hierarchy-tree">
              {hierarchyData.map((root, index) => (
                <HierarchyTreeNode
                  key={root.id ?? `root-${index}`}
                  node={root}
                  expandedIds={expandedIds}
                  onExpandToggle={handleExpandToggle}
                  onSelect={handleAssetSelect}
                  searchQuery={hierarchySearch}
                />
              ))}
            </div>
          )}

          {selectedAsset && (
            <div className="selected-asset-box">
              <strong>Selected:</strong> {selectedAsset.name} ({selectedAsset.type || selectedAsset.assetType || 'Asset'})
            </div>
          )}
        </div>
      )}

      {/* Work Order Creation Tab */}
      {activeTab === 'work-orders' && (
        <div className="tab-content">
          <h3>Create Work Order</h3>
          {workOrdersError && <div className="error-text" style={{ marginBottom: '10px' }}>{workOrdersError}</div>}
          {workOrderSuccess && <div className="success-msg">{workOrderSuccess}</div>}

          <form onSubmit={handleCreateWorkOrder} className="work-order-form">
            <div className="form-row">
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  placeholder="e.g., Monthly preventive maintenance"
                  className={formErrors.title ? 'error' : ''}
                />
                {formErrors.title && <span className="error-text">{formErrors.title}</span>}
              </div>
              <div className="form-group">
                <label>Type</label>
                <select name="workType" value={formData.workType} onChange={handleFormChange}>
                  <option value="PREVENTIVE_MAINTENANCE">Preventive Maintenance</option>
                  <option value="CORRECTIVE_MAINTENANCE">Corrective Maintenance</option>
                  <option value="EMERGENCY_REPAIR">Emergency Repair</option>
                  <option value="INSPECTION">Inspection</option>
                  <option value="INSTALLATION">Installation</option>
                  <option value="REPLACEMENT">Replacement</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Asset *</label>
                <select
                  name="assetId"
                  value={formData.assetId}
                  onChange={handleFormChange}
                  className={formErrors.assetId ? 'error' : ''}
                >
                  <option value="">-- Select an asset --</option>
                  {allAssets.map(asset => (
                    <option key={getAssetId(asset)} value={getAssetId(asset)}>
                      {'— '.repeat(asset.level || 0)}{asset.name} ({asset.type || asset.assetType || 'Asset'})
                    </option>
                  ))}
                </select>
                {formErrors.assetId && <span className="error-text">{formErrors.assetId}</span>}
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select name="priority" value={formData.priority} onChange={handleFormChange}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Scheduled Start Date *</label>
                <input
                  type="datetime-local"
                  name="scheduledStartDate"
                  value={formData.scheduledStartDate}
                  onChange={handleFormChange}
                  className={formErrors.scheduledStartDate ? 'error' : ''}
                />
                {formErrors.scheduledStartDate && <span className="error-text">{formErrors.scheduledStartDate}</span>}
              </div>
              <div className="form-group">
                <label>Scheduled End Date *</label>
                <input
                  type="datetime-local"
                  name="scheduledEndDate"
                  value={formData.scheduledEndDate}
                  onChange={handleFormChange}
                  className={formErrors.scheduledEndDate ? 'error' : ''}
                />
                {formErrors.scheduledEndDate && <span className="error-text">{formErrors.scheduledEndDate}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Estimated Duration (hours) *</label>
                <input
                  type="number"
                  name="estimatedDurationHours"
                  value={formData.estimatedDurationHours}
                  onChange={handleFormChange}
                  placeholder="e.g., 8.5"
                  min="0"
                  step="0.5"
                  className={formErrors.estimatedDurationHours ? 'error' : ''}
                />
                {formErrors.estimatedDurationHours && <span className="error-text">{formErrors.estimatedDurationHours}</span>}
              </div>
              <div className="form-group">
                <label>Estimated Cost *</label>
                <input
                  type="number"
                  name="estimatedCost"
                  value={formData.estimatedCost}
                  onChange={handleFormChange}
                  placeholder="e.g., 2500"
                  min="0"
                  step="100"
                  className={formErrors.estimatedCost ? 'error' : ''}
                />
                {formErrors.estimatedCost && <span className="error-text">{formErrors.estimatedCost}</span>}
              </div>
            </div>

            <div className="form-group full-width">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                placeholder="Add details about the maintenance work..."
                rows="3"
              />
            </div>

            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Work Order'}
            </button>
            {formErrors.submit && <div style={{color:'#ff6b6b',marginTop:'12px',fontSize:'0.9rem'}}>{formErrors.submit}</div>}
          </form>

          {workOrders.length > 0 && (
            <div className="work-orders-list-section">
              <h4>Recent Work Orders ({workOrders.length})</h4>
              <div className="work-orders-list">
                {workOrders.slice(0, 5).map((wo, index) => (
                  <div key={getWorkOrderId(wo) ?? `recent-wo-${index}`} className="work-order-card">
                    <div className="wo-header">
                      <strong>{wo.title}</strong>
                      <span className={`status-badge status-${(wo.status || 'unknown').toLowerCase()}`}>
                        {(wo.status === 'PENDING' || wo.status === 'PLANNED') && <MdPending style={{marginRight: '6px'}} />}
                        {(wo.status === 'ACTIVE' || wo.status === 'IN_PROGRESS' || wo.status === 'ASSIGNED') && <FaCheckCircle style={{marginRight: '6px'}} />}
                        {wo.status === 'COMPLETED' && <MdCheckCircle style={{marginRight: '6px'}} />}
                        {wo.status || 'UNKNOWN'}
                      </span>
                    </div>
                    <div className="wo-details">
                      <div><small>Asset:</small> {getAssetName(wo.assetId)}</div>
                      <div><small>Type:</small> {wo.workType || wo.type} | <small>Priority:</small> {wo.priority}</div>
                      <div><small>Start:</small> {wo.scheduledStartDate ? new Date(wo.scheduledStartDate).toLocaleDateString() : wo.scheduledDate} | <small>Duration:</small> {wo.estimatedDurationHours || wo.duration}h</div>
                      {(wo.assignedCrew || wo.crewId) && <div><small>Crew:</small> {wo.assignedCrew?.name || `Crew #${wo.crewId}`}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Crew Assignment Tab */}
      {activeTab === 'assign-crew' && (
        <div className="tab-content">
          <h3>Assign Crews to Work Orders</h3>
          {workOrdersError && <div className="error-text" style={{ marginBottom: '10px' }}>{workOrdersError}</div>}
          {assignmentSuccess && <div className="success-msg">{assignmentSuccess}</div>}

          <div className="crew-assignment-container">
            <div className="column">
              <h4>Unassigned Work Orders ({unassignedWOs.length})</h4>
              {workOrdersLoading ? (
                <div className="loading">Loading work orders...</div>
              ) : workOrders.length === 0 ? (
                <div className="loading">No work orders yet</div>
              ) : unassignedWOs.length === 0 ? (
                <div className="empty">All work orders assigned!</div>
              ) : (
                <div className="list">
                  {unassignedWOs.map((wo, index) => (
                    <div
                      key={getWorkOrderId(wo) ?? `unassigned-wo-${index}`}
                      className={`list-item ${getWorkOrderId(selectedWorkOrder) === getWorkOrderId(wo) ? 'selected' : ''}`}
                      onClick={() => setSelectedWorkOrder(wo)}
                    >
                      <div className="item-title">{wo.title}</div>
                      <div className="item-meta">{wo.workType || wo.type || 'N/A'} • {wo.priority || 'N/A'}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="column">
              <h4>Available Crews ({crews.length})</h4>
              {crewsLoading ? (
                <div className="loading">Loading...</div>
              ) : crews.length === 0 ? (
                <div className="empty">No crews available</div>
              ) : (
                <div className="list">
                  {crews.map((crew, index) => (
                    <div
                      key={getCrewId(crew) ?? `crew-${index}`}
                      className={`list-item ${getCrewId(selectedCrew) === getCrewId(crew) ? 'selected' : ''}`}
                      onClick={() => setSelectedCrew(crew)}
                    >
                      <div className="item-title">{crew.name || crew.crewName || crew.teamName || crew.email || `Crew #${getCrewId(crew)}`}</div>
                      <div className="item-meta">
                        {(crew.leader || crew.supervisorName || crew.leadName || crew.crewType || crew.type || crew.skillset) &&
                          `${crew.leader || crew.supervisorName || crew.leadName || crew.crewType || crew.type || crew.skillset} • `}
                        {crew.status || crew.crewStatus || crew.availability || 'AVAILABLE'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {selectedWorkOrder && selectedCrew && (
            <div className="assignment-confirm">
              <p><strong>Work Order:</strong> {selectedWorkOrder.title}</p>
              <p><strong>Crew:</strong> {selectedCrew.name}</p>
              <button onClick={handleAssignCrew} className="btn-primary">Confirm Assignment</button>
            </div>
          )}

          {workOrders.filter(wo => wo.assignedCrew || wo.crewId || wo.crew).length > 0 && (
            <div className="assigned-list">
              <h4>Assigned Work Orders</h4>
              <table className="assigned-table">
                <thead>
                  <tr>
                    <th>Work Order</th>
                    <th>Assigned Crew</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {workOrders.filter(wo => wo.assignedCrew || wo.crewId || wo.crew).map((wo, index) => (
                    <tr key={getWorkOrderId(wo) ?? `assigned-wo-${index}`}>
                      <td>{wo.title}</td>
                      <td>{wo.assignedCrew?.name || wo.crew?.name || `Crew #${wo.crewId}`}</td>
                      <td><span className={`status-badge status-${(wo.status || 'unknown').toLowerCase()}`}>
                        {(wo.status === 'PENDING' || wo.status === 'PLANNED') && <MdPending style={{marginRight: '6px'}} />}
                        {(wo.status === 'ACTIVE' || wo.status === 'IN_PROGRESS' || wo.status === 'ASSIGNED') && <FaCheckCircle style={{marginRight: '6px'}} />}
                        {wo.status === 'COMPLETED' && <MdCheckCircle style={{marginRight: '6px'}} />}
                        {wo.status || 'UNKNOWN'}
                      </span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}