import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTree, FaClipboardList, FaUsers, FaChevronDown, FaChevronRight, FaSearch, FaCheckCircle, FaCalendarAlt, FaChevronLeft, FaExternalLinkAlt, FaTools, FaClock } from 'react-icons/fa';
import { MdCheckCircle, MdPending } from 'react-icons/md';
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { workOrderService, crewService, assetService, notificationService, maintenanceProfileService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { normalizeRoles } from '../../utils/normalizeRole';
import NotificationBell from './NotificationBell';
import ThemeToggleButton from '../layout/ThemeToggleButton';
import './Dashboard.css';

const PLANNER_ALERTS = [
  { id: 1, type: 'warning',  title: 'Maintenance due', body: 'Transformer TRF-002 — preventive maintenance due in 2 days', time: '1 hr ago' },
  { id: 2, type: 'info',     title: 'Work order created', body: 'WO-0046 created and assigned to Crew C-03', time: '3 hr ago' },
  { id: 3, type: 'critical', title: 'Crew unavailable', body: 'Crew C-01 marked unavailable. WO-0042 unassigned.', time: '4 hr ago' },
  { id: 4, type: 'info',     title: 'Schedule updated', body: 'Feeder inspection FDR-001 rescheduled to Apr 18', time: '5 hr ago' },
];

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
const getAssetDisplayName = (asset, nameMapById) => {
  if (!asset || typeof asset !== 'object') return 'Unnamed Asset';
  const candidates = [
    asset.name,
    asset.assetName,
    asset.asset_label,
    asset.assetLabel,
    asset.displayName,
    asset.label,
    asset.title,
    asset.equipmentName,
  ];
  const resolved = candidates.find((v) => typeof v === 'string' && v.trim().length > 0);
  if (!resolved) {
    const id = getAssetId(asset);
    if (id != null && nameMapById?.has(id)) return nameMapById.get(id);
  }
  return resolved ? resolved.trim() : 'Unnamed Asset';
};

const getScheduledAnchorDate = (wo) => {
  const v = wo?.scheduledStartDate || wo?.scheduledDate || wo?.targetDate || wo?.dueDate || null;
  if (!v) return null;
  const dt = new Date(v);
  return Number.isFinite(dt.getTime()) ? dt : null;
};

const toDateKey = (value) => {
  const dt = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(dt.getTime())) return '';
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const startOfDay = (value) => {
  const dt = value instanceof Date ? new Date(value) : new Date(value);
  dt.setHours(0, 0, 0, 0);
  return dt;
};

const getStartOfWeek = (value) => {
  const dt = startOfDay(value);
  const day = dt.getDay();
  const diff = day === 0 ? -6 : 1 - day; // week starts Monday
  dt.setDate(dt.getDate() + diff);
  return dt;
};

const getStatusMeta = (wo) => {
  const status = String(wo?.status || wo?.workOrderStatus || 'UNKNOWN').toUpperCase();
  if (['COMPLETED', 'CLOSED'].includes(status)) return { status, tone: 'completed' };
  if (['CANCELLED'].includes(status)) return { status, tone: 'cancelled' };
  if (['IN_PROGRESS', 'ACTIVE', 'ASSIGNED'].includes(status)) return { status, tone: 'active' };
  if (['OPEN'].includes(status)) return { status, tone: 'open' };
  return { status, tone: 'pending' };
};

let workOrdersFetchPromise = null;
let workOrdersLastFetchAt = 0;
const WORK_ORDERS_FETCH_COOLDOWN_MS = 5000;

// Asset hierarchy tree node component - memoized for efficient rendering
const HierarchyTreeNode = React.memo(({ node, expandedIds, onExpandToggle, onSelect, searchQuery }) => {
  const isExpanded = expandedIds.has(node.id);
  const hasChildren = node.children && node.children.length > 0;
  const nodeName = getAssetDisplayName(node);
  
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
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [plannerAlerts, setPlannerAlerts] = useState(PLANNER_ALERTS);
  const [activeTab, setActiveTab] = useState('hierarchy');
  
  // Hierarchy state
  const [hierarchyData, setHierarchyData] = useState([]);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [hierarchySearch, setHierarchySearch] = useState('');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [hierarchyLoading, setHierarchyLoading] = useState(false);
  const [assetCatalog, setAssetCatalog] = useState([]);

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
  const [assignmentError, setAssignmentError] = useState('');
  const [calendarView, setCalendarView] = useState('month');
  const [calendarCursorDate, setCalendarCursorDate] = useState(() => startOfDay(new Date()));
  const [selectedCalendarTaskId, setSelectedCalendarTaskId] = useState(null);
  const [maintenanceProfiles, setMaintenanceProfiles] = useState([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [profilesError, setProfilesError] = useState('');

  const roleKeys = useMemo(() => normalizeRoles(user?.roles || []), [user?.roles]);

  const assetNameMapById = useMemo(() => {
    const map = new Map();
    (assetCatalog || []).forEach((asset) => {
      const id = getAssetId(asset);
      if (id == null) return;
      map.set(id, getAssetDisplayName(asset));
    });
    return map;
  }, [assetCatalog]);

  const tokenAuthorities = useMemo(() => {
    try {
      if (!token || String(token).split('.').length < 2) return [];
      const payload = JSON.parse(atob(String(token).split('.')[1]));
      const authorities = payload?.authorities || payload?.roles || payload?.scope || [];
      return Array.isArray(authorities) ? authorities : String(authorities || '').split(/[\s,]+/).filter(Boolean);
    } catch {
      return [];
    }
  }, [token]);

  const tokenRoleKeys = useMemo(() => normalizeRoles(tokenAuthorities), [tokenAuthorities]);
  const hasPlannerAccess =
    roleKeys.includes('PLANNER') ||
    roleKeys.includes('ADMIN') ||
    tokenRoleKeys.includes('PLANNER') ||
    tokenRoleKeys.includes('ADMIN');

  const initialDataLoadedRef = useRef(false);

  // Load asset hierarchy from backend
  const loadHierarchy = useCallback(async () => {
    setHierarchyLoading(true);
    try {
      // Pull both sources: core hierarchy + IAM assets (for robust names)
      const [hierarchyRes, catalogRes] = await Promise.allSettled([
        assetService.getHierarchy(),
        assetService.getAll(),
      ]);

      const hierarchyPayload =
        hierarchyRes.status === 'fulfilled'
          ? (hierarchyRes.value?.data?.data || hierarchyRes.value?.data || [])
          : [];

      const catalogPayload =
        catalogRes.status === 'fulfilled'
          ? (catalogRes.value?.data?.data?.content || catalogRes.value?.data?.data || catalogRes.value?.data?.content || catalogRes.value?.data || [])
          : [];

      const catalogList = Array.isArray(catalogPayload) ? catalogPayload : [];
      setAssetCatalog(catalogList);

      const catalogNameMap = new Map();
      catalogList.forEach((asset) => {
        const id = getAssetId(asset);
        if (id == null) return;
        catalogNameMap.set(id, getAssetDisplayName(asset));
      });

      // Prefer true hierarchy; if not available, fallback to flat catalog
      let assets = Array.isArray(hierarchyPayload) ? hierarchyPayload : [];
      if (assets.length === 0) {
        assets = catalogList;
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
              name: getAssetDisplayName(n, catalogNameMap),
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
                name: getAssetDisplayName(i, catalogNameMap),
                type: i.type || i.assetType || 'Asset',
                level,
                children: buildTree(items, i.id, level + 1),
              }));

          const tree = roots.map((root) => ({
            ...root,
            name: getAssetDisplayName(root, catalogNameMap),
            type: root.type || root.assetType || 'Asset',
            level: 0,
            children: buildTree(normalizedAssets, root.id, 1),
          }));

          const result = tree.length > 0
            ? tree
            : normalizedAssets.map(a => ({ ...a, name: getAssetDisplayName(a, catalogNameMap), type: a.type || a.assetType || 'Asset', level: 0, children: [] }));
          setHierarchyData(result);
          if (result.length > 0) setExpandedIds(new Set([result[0].id]));
        }
      } catch (error) {
        console.error('Failed to load asset hierarchy:', error);
        setHierarchyData([]);
      } finally {
        setHierarchyLoading(false);
      }
  }, []);

  // Load hierarchy on mount
  useEffect(() => {
    loadHierarchy();
  }, [loadHierarchy]);

  const loadWorkOrdersData = useCallback(async (force = false) => {
    if (workOrdersFetchPromise) {
      await workOrdersFetchPromise;
      return;
    }

    const now = Date.now();
    if (!force && now - workOrdersLastFetchAt < WORK_ORDERS_FETCH_COOLDOWN_MS) {
      return;
    }

    workOrdersLastFetchAt = now;

    workOrdersFetchPromise = (async () => {
    setWorkOrdersLoading(true);
    setWorkOrdersError('');
    try {
      const response = await workOrderService.getAll();
      const list = normalizeListResponse(response?.data);
      setWorkOrders(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error('Failed to load work orders:', error);
      setWorkOrders([]);
      if (error?.response?.status === 429) {
        setWorkOrdersError('Too many requests for work orders. Please slow down.');
      } else if (error?.response?.status === 403) {
        const roleMsg = roleKeys.length ? roleKeys.join(', ') : 'NONE';
        const tokenMsg = tokenAuthorities.length ? tokenAuthorities.join(', ') : 'NONE';
        setWorkOrdersError(`ACCESS DENIED (403): CANNOT LOAD WORK ORDERS. USER ROLES=${roleMsg}. TOKEN AUTHORITIES=${tokenMsg}. EXPECTED AUTHORITY LIKE OPERATIONS_PLANNER OR ROLE_OPERATIONS_PLANNER.`);
      } else {
        setWorkOrdersError(error?.response?.data?.message || 'Failed to load work orders from backend');
      }
    } finally {
      setWorkOrdersLoading(false);
      workOrdersFetchPromise = null;
    }
    })();

    await workOrdersFetchPromise;
  }, [roleKeys, tokenAuthorities]);

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

  const loadMaintenanceProfiles = useCallback(async () => {
    setProfilesLoading(true);
    setProfilesError('');
    try {
      const response = await maintenanceProfileService.getAll({ size: 100 });
      const list = normalizeListResponse(response?.data);
      setMaintenanceProfiles(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error('Failed to load maintenance profiles:', error);
      setMaintenanceProfiles([]);
      setProfilesError(error?.response?.data?.message || 'Failed to load maintenance profiles');
    } finally {
      setProfilesLoading(false);
    }
  }, []);

  // Load planner data once (prevents duplicate calls in dev StrictMode/re-renders)
  useEffect(() => {
    if (initialDataLoadedRef.current) return;
    initialDataLoadedRef.current = true;
    loadWorkOrdersData();
    loadCrewsData();
  }, [loadWorkOrdersData, loadCrewsData]);

  useEffect(() => {
    if (activeTab === 'maintenance-calendar' && maintenanceProfiles.length === 0 && !profilesLoading) {
      loadMaintenanceProfiles();
    }
  }, [activeTab, maintenanceProfiles.length, profilesLoading, loadMaintenanceProfiles]);

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
          const nodeName = getAssetDisplayName(node, assetNameMapById);
          if (nodeName.toLowerCase().includes(query.toLowerCase())) {
            matchingIds.add(node.id);
          }
          if (node.children) collectMatching(node.children);
        });
      };
      collectMatching(hierarchyData);
      setExpandedIds(matchingIds);
    }
  }, [hierarchyData, assetNameMapById]);

  // Select asset and pre-fill form
  const handleAssetSelect = (asset) => {
    setSelectedAsset(asset);
    setFormData(prev => ({ ...prev, assetId: getAssetId(asset) || '' }));
  };

  // Form field change
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    const preserveCaseFields = new Set([
      'assetId',
      'scheduledStartDate',
      'scheduledEndDate',
      'estimatedDurationHours',
      'estimatedCost',
      'maintenanceProfileId',
    ]);
    const nextValue = preserveCaseFields.has(name)
      ? value
      : typeof value === 'string'
        ? value.toUpperCase()
        : value;
    setFormData(prev => ({ ...prev, [name]: nextValue }));
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
      await loadWorkOrdersData(true);
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
      setAssignmentError('PLEASE SELECT BOTH A WORK ORDER AND A CREW.');
      return;
    }

    if (!hasPlannerAccess) {
      setAssignmentError(`ACCESS DENIED: CURRENT USER DOES NOT HAVE PLANNER ROLE. CURRENT ROLES: ${roleKeys.join(', ') || 'NONE'}.`);
      return;
    }

    setAssignmentError('');
    try {
      await crewService.assignToWorkOrder(getWorkOrderId(selectedWorkOrder), getCrewId(selectedCrew));

      const workOrderRef = String(selectedWorkOrder.referenceId || selectedWorkOrder.code || selectedWorkOrder.workOrderNo || selectedWorkOrder.id || getWorkOrderId(selectedWorkOrder));
      const taskType = String(selectedWorkOrder.workType || selectedWorkOrder.type || 'MAINTENANCE').toUpperCase();
      const urgency = String(selectedWorkOrder.priority || 'MEDIUM').toUpperCase();
      const assignedBy = String(user?.name || user?.username || user?.email || 'Planner');
      const notifyPayload = {
        crewId: getCrewId(selectedCrew),
        taskType,
        taskReferenceId: workOrderRef.startsWith('WO-') ? workOrderRef : `WO-${workOrderRef}`,
        urgency,
        assignedBy,
        message: `You have been assigned to ${taskType.replace(/_/g, ' ')} Work Order ${workOrderRef.startsWith('WO-') ? workOrderRef : `WO-${workOrderRef}`}. Priority: ${urgency}. Please review and take action.`,
      };

      try {
        await notificationService.triggerCrewAssignment(notifyPayload);
      } catch (notifyError) {
        console.error('Crew assignment notification trigger failed:', notifyError);
      }

      await loadWorkOrdersData(true);
      const crewName = String(selectedCrew.name || selectedCrew.crewName || `Crew #${getCrewId(selectedCrew)}`).toUpperCase();
      const woTitle = String(selectedWorkOrder.title || `WORK ORDER #${getWorkOrderId(selectedWorkOrder)}`).toUpperCase();
      setAssignmentSuccess(`CREW "${crewName}" ASSIGNED TO "${woTitle}" SUCCESSFULLY. NOTIFICATION SENT TO CREW MEMBERS.`);
      setPlannerAlerts((prev) => [
        {
          id: Date.now(),
          type: 'info',
          title: 'CREW ASSIGNMENT CONFIRMED',
          body: `${crewName} ASSIGNED TO ${woTitle}. CREW MEMBERS NOTIFIED.`,
          time: 'JUST NOW',
        },
        ...prev,
      ].slice(0, 8));
      setTimeout(() => setAssignmentSuccess(''), 4000);
      setSelectedWorkOrder(null);
      setSelectedCrew(null);
    } catch (error) {
      console.error('Failed to assign crew:', error);
      if (error?.response?.status === 403) {
        const roleMsg = roleKeys.length ? roleKeys.join(', ') : 'NONE';
        const authMsg = tokenAuthorities.length ? tokenAuthorities.join(', ') : 'NONE';
        setAssignmentError(`ACCESS DENIED: INSUFFICIENT PRIVILEGES. USER ROLES=${roleMsg}. TOKEN AUTHORITIES=${authMsg}. PLEASE LOGOUT/LOGIN AFTER ROLE UPDATE AND ENSURE BACKEND GRANTS ASSIGN-CREW PRIVILEGE TO PLANNER.`);
      } else {
        setAssignmentError((error.response?.data?.message || 'FAILED TO ASSIGN CREW. PLEASE TRY AGAIN.').toUpperCase());
      }
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

  const maintenanceAlerts = useMemo(() => {
    const now = Date.now();
    return (workOrders || [])
      .map((wo) => {
        const dueDate = getScheduledAnchorDate(wo);
        if (!dueDate) return null;

        const status = String(wo?.status || wo?.workOrderStatus || '').toUpperCase();
        if (['COMPLETED', 'CLOSED', 'CANCELLED'].includes(status)) return null;

        const msLeft = dueDate.getTime() - now;
        const dayMs = 24 * 60 * 60 * 1000;
        const daysLeft = Math.floor(msLeft / dayMs);
        const category = msLeft < 0 ? 'OVERDUE' : (daysLeft <= 2 ? 'DUE' : null);
        if (!category) return null;

        const id = getWorkOrderId(wo);
        const taskType = String(wo?.workType || wo?.type || 'MAINTENANCE').replace(/_/g, ' ');
        const urgency = String(wo?.priority || 'MEDIUM').toUpperCase();

        return {
          id,
          category,
          dueDate,
          title: String(wo?.title || `WORK ORDER #${id}`).toUpperCase(),
          taskType: taskType.toUpperCase(),
          urgency,
          message: category === 'OVERDUE'
            ? `OVERDUE BY ${Math.abs(daysLeft)} DAY(S)`
            : `DUE IN ${Math.max(daysLeft, 0)} DAY(S)`,
          workOrder: wo,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }, [workOrders]);

  const unassignedWOs = workOrders.filter(wo => !wo.assignedCrew && !wo.crewId);
  const getAssetName = (assetId) => {
    const findAsset = (nodes) => {
      for (let node of nodes) {
        if (node.id === assetId) return getAssetDisplayName(node, assetNameMapById);
        if (node.children) {
          const found = findAsset(node.children);
          if (found) return found;
        }
      }
      if (assetNameMapById.has(assetId)) return assetNameMapById.get(assetId);
      return 'Unknown Asset';
    };
    return findAsset(hierarchyData);
  };

  const calendarTasks = useMemo(() => {
    return (workOrders || [])
      .map((wo) => {
        const scheduledDate = getScheduledAnchorDate(wo);
        if (!scheduledDate) return null;
        const id = getWorkOrderId(wo);
        if (id == null) return null;
        const { status, tone } = getStatusMeta(wo);
        return {
          id,
          key: `task-${id}`,
          title: wo?.title || `WORK ORDER #${id}`,
          status,
          tone,
          priority: String(wo?.priority || 'MEDIUM').toUpperCase(),
          workType: String(wo?.workType || wo?.type || 'MAINTENANCE').replace(/_/g, ' '),
          scheduledDate,
          dateKey: toDateKey(scheduledDate),
          assetName: getAssetName(wo?.assetId),
          crewName: wo?.assignedCrew?.name || (wo?.crewId ? `Crew #${wo.crewId}` : 'Unassigned'),
          workOrder: wo,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
  }, [workOrders, getAssetName]);

  const calendarTasksByDate = useMemo(() => {
    const map = new Map();
    calendarTasks.forEach((task) => {
      const existing = map.get(task.dateKey) || [];
      existing.push(task);
      map.set(task.dateKey, existing);
    });
    return map;
  }, [calendarTasks]);

  const monthGridDays = useMemo(() => {
    const monthStart = new Date(calendarCursorDate.getFullYear(), calendarCursorDate.getMonth(), 1);
    const monthEnd = new Date(calendarCursorDate.getFullYear(), calendarCursorDate.getMonth() + 1, 0);
    const gridStart = getStartOfWeek(monthStart);
    const gridEnd = new Date(getStartOfWeek(monthEnd));
    gridEnd.setDate(gridEnd.getDate() + 6);

    const days = [];
    const cursor = new Date(gridStart);
    while (cursor <= gridEnd) {
      days.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  }, [calendarCursorDate]);

  const weekDays = useMemo(() => {
    const start = getStartOfWeek(calendarCursorDate);
    return Array.from({ length: 7 }, (_, idx) => {
      const dt = new Date(start);
      dt.setDate(start.getDate() + idx);
      return dt;
    });
  }, [calendarCursorDate]);

  const selectedDateKey = useMemo(() => toDateKey(calendarCursorDate), [calendarCursorDate]);

  const selectedDateTasks = useMemo(() => {
    return calendarTasksByDate.get(selectedDateKey) || [];
  }, [calendarTasksByDate, selectedDateKey]);

  const selectedCalendarTask = useMemo(() => {
    if (selectedCalendarTaskId == null) return null;
    return calendarTasks.find((task) => task.id === selectedCalendarTaskId) || null;
  }, [calendarTasks, selectedCalendarTaskId]);

  const shiftCalendarRange = useCallback((direction) => {
    setCalendarCursorDate((prev) => {
      const next = new Date(prev);
      if (calendarView === 'day') next.setDate(next.getDate() + direction);
      else if (calendarView === 'week') next.setDate(next.getDate() + (7 * direction));
      else next.setMonth(next.getMonth() + direction);
      return startOfDay(next);
    });
  }, [calendarView]);

  const jumpCalendarToToday = useCallback(() => {
    setCalendarCursorDate(startOfDay(new Date()));
  }, []);

  const calendarHeading = useMemo(() => {
    if (calendarView === 'month') {
      return calendarCursorDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    }
    if (calendarView === 'week') {
      const start = weekDays[0];
      const end = weekDays[6];
      const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
      const startLabel = start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const endLabel = sameMonth
        ? end.toLocaleDateString(undefined, { day: 'numeric', year: 'numeric' })
        : end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      return `${startLabel} - ${endLabel}`;
    }
    return calendarCursorDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }, [calendarCursorDate, calendarView, weekDays]);

  const handleCalendarTaskSelect = useCallback((task) => {
    setSelectedCalendarTaskId(task.id);
    setSelectedWorkOrder(task.workOrder);
  }, []);

  const profileUsageMap = useMemo(() => {
    const map = new Map();
    (workOrders || []).forEach((wo) => {
      const profileId = Number(wo?.maintenanceProfileId);
      if (!Number.isFinite(profileId) || profileId <= 0) return;
      map.set(profileId, (map.get(profileId) || 0) + 1);
    });
    return map;
  }, [workOrders]);

  const topProfileCards = useMemo(() => {
    return (maintenanceProfiles || [])
      .map((profile) => ({
        ...profile,
        id: Number(profile?.id),
        usage: profileUsageMap.get(Number(profile?.id)) || 0,
      }))
      .sort((a, b) => (b.usage - a.usage) || (Number(a.frequencyDays || 0) - Number(b.frequencyDays || 0)))
      .slice(0, 6);
  }, [maintenanceProfiles, profileUsageMap]);

  const profileSummary = useMemo(() => {
    const total = maintenanceProfiles.length;
    const standardized = maintenanceProfiles.filter((p) => !!p?.isStandardized).length;
    const usedInPlans = Array.from(profileUsageMap.keys()).length;
    return { total, standardized, usedInPlans };
  }, [maintenanceProfiles, profileUsageMap]);

  return (
    <section className="dashboard-panel planner-dashboard-enhanced">
      <ThemeToggleButton />
      <div className="dashboard-header planner-header-enhanced" style={{ position: 'relative' }}>
        <div className="dashboard-meta">
          <span className="dashboard-label">Operations Planner</span>
          <h2 className="dashboard-title"><FaTree style={{marginRight: '12px'}} /> Maintenance Planning &amp; Crew Readiness</h2>
          <p className="dashboard-description">
            Manage asset hierarchies, create and track work orders, allocate crews, and coordinate outages.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
          <NotificationBell alerts={plannerAlerts} />
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
      </div>

      {/* KPI Row */}
      <div className="dash-kpi-row">
        <div className="dash-kpi-card"><div className="dash-kpi-value">{workOrders.length}</div><div className="dash-kpi-label">Total Work Orders</div></div>
        <div className="dash-kpi-card kpi-alert"><div className="dash-kpi-value">{workOrders.filter(wo => wo.status === 'OPEN' || wo.status === 'PENDING').length || unassignedWOs.length}</div><div className="dash-kpi-label">Open / Unassigned</div></div>
        <div className="dash-kpi-card"><div className="dash-kpi-value">{workOrders.filter(wo => wo.assignedCrew || wo.crewId).length}</div><div className="dash-kpi-label">Crew-Assigned WOs</div></div>
        <div className="dash-kpi-card"><div className="dash-kpi-value">{crews.length}</div><div className="dash-kpi-label">Available Crews</div></div>
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, margin: '0 0 24px' }}>
        <div className="dashboard-card" style={{ padding: '20px 20px 10px' }}>
          <h3 className="dash-section-title" style={{ marginBottom: 16 }}>Work Orders by Status</h3>
          {(() => {
            const counts = workOrders.reduce((acc, wo) => {
              const s = wo.status || wo.workOrderStatus || 'UNKNOWN';
              acc[s] = (acc[s] || 0) + 1;
              return acc;
            }, {});
            const chartData = Object.entries(counts).map(([status, count]) => ({ status, count }));
            const colors = { OPEN: '#f87171', IN_PROGRESS: '#5ee6ff', COMPLETED: '#34d399', PENDING: '#fbbf24', UNKNOWN: '#a78bfa' };
            return chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={chartData} margin={{ left: -20, right: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#0f1530', border: '1px solid rgba(94,230,255,0.2)', borderRadius: 10, fontSize: 12 }} labelStyle={{ color: '#e7f6ff' }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={colors[entry.status] || '#a78bfa'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', color: 'rgba(199,220,246,0.45)', padding: '40px 0', fontSize: '0.85rem' }}>
                No work orders loaded yet
              </div>
            );
          })()}
        </div>

        <div className="dashboard-card" style={{ padding: '20px 20px 10px' }}>
          <h3 className="dash-section-title" style={{ marginBottom: 16 }}>Crew Allocation</h3>
          {(() => {
            const assigned  = workOrders.filter(wo => wo.assignedCrew || wo.crewId).length;
            const available = Math.max(crews.length - assigned, 0);
            const standby   = Math.max(crews.length - assigned, 0);
            const pieData = [
              { name: 'Assigned',  value: assigned  || 1 },
              { name: 'Available', value: available || crews.length || 3 },
              { name: 'Standby',   value: standby > 0 ? 1 : 0 },
            ].filter(d => d.value > 0);
            const COLORS = ['#5ee6ff', '#34d399', '#fbbf24'];
            return (
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={3}>
                    {pieData.map((entry, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0f1530', border: '1px solid rgba(94,230,255,0.2)', borderRadius: 10, fontSize: 12 }} itemStyle={{ color: '#e7f6ff' }} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: '0.78rem', color: 'rgba(199,220,246,0.75)' }} />
                </PieChart>
              </ResponsiveContainer>
            );
          })()}
        </div>
      </div>

      <div className="planner-maint-alerts" style={{ marginBottom: 18 }}>
        <div className="planner-maint-alerts-head">
          <h3 className="dash-section-title" style={{ margin: 0 }}>Maintenance Alerts</h3>
          <button className="dash-action-btn" onClick={() => loadWorkOrdersData(true)}>
            Refresh Alerts
          </button>
        </div>

        {maintenanceAlerts.length === 0 ? (
          <div className="planner-maint-alerts-empty">
            No due or overdue maintenance alerts. All scheduled work orders are on track.
          </div>
        ) : (
          <div className="planner-maint-alerts-list">
            {maintenanceAlerts.map((alert) => (
              <div key={`maint-alert-${alert.id}`} className={`planner-maint-item ${alert.category === 'OVERDUE' ? 'is-overdue' : 'is-due'}`}>
                <div className="planner-maint-item-main">
                  <div className="planner-maint-item-meta">
                    <span className={`planner-maint-chip ${alert.category === 'OVERDUE' ? 'chip-overdue' : 'chip-due'}`}>{alert.category}</span>
                    <span className="planner-maint-chip">{alert.taskType}</span>
                    <span className="planner-maint-chip">URGENCY: {alert.urgency}</span>
                    <span className="planner-maint-ref">WO-{alert.id}</span>
                  </div>
                  <div className="planner-maint-title">{alert.title}</div>
                  <div className="planner-maint-sub">{alert.message} • DUE DATE: {alert.dueDate.toLocaleString()}</div>
                </div>
                <button
                  className="dash-action-btn"
                  onClick={() => {
                    setActiveTab('work-orders');
                    setSelectedWorkOrder(alert.workOrder);
                  }}
                >
                  Open Work Order
                </button>
              </div>
            ))}
          </div>
        )}
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
        <button
          className={`tab-btn ${activeTab === 'maintenance-calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('maintenance-calendar')}
        >
          <FaCalendarAlt className="tab-icon" /> Maintenance Calendar
        </button>
        </div>
      </div>

      {/* Maintenance Calendar Tab */}
      {activeTab === 'maintenance-calendar' && (
        <div className="tab-content">
          <div className="planner-cal-header planner-cal-header-fancy">
            <div>
              <h3 className="planner-cal-title-glow"><FaCalendarAlt style={{ marginRight: 8 }} />Maintenance Calendar</h3>
              <p className="planner-cal-subtitle">Track and balance maintenance workload by day, week, or month.</p>
            </div>
            <div className="planner-cal-toolbar">
              <div className="planner-cal-view-switch" role="group" aria-label="Calendar view">
                <button className={`planner-cal-view-btn ${calendarView === 'day' ? 'active' : ''}`} onClick={() => setCalendarView('day')}>Day</button>
                <button className={`planner-cal-view-btn ${calendarView === 'week' ? 'active' : ''}`} onClick={() => setCalendarView('week')}>Week</button>
                <button className={`planner-cal-view-btn ${calendarView === 'month' ? 'active' : ''}`} onClick={() => setCalendarView('month')}>Month</button>
              </div>
              <button className="dash-action-btn" onClick={() => loadWorkOrdersData(true)}>Refresh Calendar</button>
              <button className="dash-action-btn planner-cal-open-profiles" onClick={() => navigate('/maintenance-profiles')}>
                <FaExternalLinkAlt size={12} /> Maintenance Profiles
              </button>
            </div>
          </div>

          {workOrdersError && <div className="error-text" style={{ marginBottom: '10px' }}>{workOrdersError}</div>}
          {profilesError && <div className="error-text" style={{ marginBottom: '10px' }}>{profilesError}</div>}

          <div className="planner-profile-overview">
            <div className="planner-profile-stat-card">
              <span className="planner-profile-stat-icon"><FaTools /></span>
              <div>
                <div className="planner-profile-stat-value">{profileSummary.total}</div>
                <div className="planner-profile-stat-label">Profiles</div>
              </div>
            </div>
            <div className="planner-profile-stat-card">
              <span className="planner-profile-stat-icon"><FaClock /></span>
              <div>
                <div className="planner-profile-stat-value">{profileSummary.usedInPlans}</div>
                <div className="planner-profile-stat-label">Used In Plans</div>
              </div>
            </div>
            <div className="planner-profile-stat-card">
              <span className="planner-profile-stat-icon"><FaCheckCircle /></span>
              <div>
                <div className="planner-profile-stat-value">{profileSummary.standardized}</div>
                <div className="planner-profile-stat-label">Standardized</div>
              </div>
            </div>
          </div>

          <div className="planner-profile-strip">
            <div className="planner-profile-strip-head">
              <h4>Maintenance Profiles Snapshot</h4>
              <button className="planner-cal-nav-btn" onClick={loadMaintenanceProfiles} disabled={profilesLoading}>
                {profilesLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
            {profilesLoading && maintenanceProfiles.length === 0 ? (
              <div className="planner-cal-empty-slot">Loading maintenance profiles...</div>
            ) : topProfileCards.length === 0 ? (
              <div className="planner-cal-empty-slot">No profiles available yet. Create one from Maintenance Profiles.</div>
            ) : (
              <div className="planner-profile-cards">
                {topProfileCards.map((profile) => (
                  <article key={`profile-${profile.id}`} className="planner-profile-card">
                    <div className="planner-profile-card-top">
                      <span className="planner-profile-chip">#{profile.id}</span>
                      <span className="planner-profile-chip chip-type">{String(profile.maintenanceType || 'GENERIC').replace(/_/g, ' ')}</span>
                    </div>
                    <h5>{profile.profileName || `Profile #${profile.id}`}</h5>
                    <p>
                      Every <strong>{profile.frequencyDays || '—'}</strong> days · Crew <strong>{profile.requiredCrewSize || '—'}</strong>
                    </p>
                    <div className="planner-profile-card-footer">
                      <span>Scheduled tasks: {profile.usage}</span>
                      {!!profile.isStandardized && <span className="planner-profile-chip chip-standard">STANDARD</span>}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="planner-cal-nav">
            <button className="planner-cal-nav-btn" onClick={() => shiftCalendarRange(-1)} aria-label="Previous range"><FaChevronLeft /></button>
            <div className="planner-cal-heading">{calendarHeading}</div>
            <button className="planner-cal-nav-btn" onClick={() => shiftCalendarRange(1)} aria-label="Next range"><FaChevronRight /></button>
            <button className="planner-cal-today-btn" onClick={jumpCalendarToToday}>Today</button>
          </div>

          {workOrdersLoading ? (
            <div className="loading">Loading calendar tasks...</div>
          ) : calendarTasks.length === 0 ? (
            <div className="empty">No scheduled maintenance tasks found.</div>
          ) : (
            <>
              {calendarView === 'month' && (
                <div className="planner-cal-month-wrap">
                  <div className="planner-cal-weekdays">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label) => (
                      <div key={label} className="planner-cal-weekday">{label}</div>
                    ))}
                  </div>
                  <div className="planner-cal-month-grid">
                    {monthGridDays.map((day) => {
                      const dateKey = toDateKey(day);
                      const tasks = calendarTasksByDate.get(dateKey) || [];
                      const isCurrentMonth = day.getMonth() === calendarCursorDate.getMonth();
                      const isToday = dateKey === toDateKey(new Date());
                      return (
                        <div key={dateKey} className={`planner-cal-day-cell ${isCurrentMonth ? '' : 'is-outside'} ${isToday ? 'is-today' : ''}`}>
                          <div className="planner-cal-day-number">{day.getDate()}</div>
                          <div className="planner-cal-day-items">
                            {tasks.slice(0, 4).map((task) => (
                              <button
                                key={task.key}
                                className={`planner-cal-task planner-cal-task-${task.tone} ${selectedCalendarTaskId === task.id ? 'is-selected' : ''}`}
                                onClick={() => handleCalendarTaskSelect(task)}
                              >
                                <span className="planner-cal-task-title">{task.title}</span>
                              </button>
                            ))}
                            {tasks.length > 4 && <div className="planner-cal-more">+{tasks.length - 4} more</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {calendarView === 'week' && (
                <div className="planner-cal-week-grid">
                  {weekDays.map((day) => {
                    const dateKey = toDateKey(day);
                    const tasks = calendarTasksByDate.get(dateKey) || [];
                    const isToday = dateKey === toDateKey(new Date());
                    return (
                      <div key={dateKey} className={`planner-cal-week-col ${isToday ? 'is-today' : ''}`}>
                        <div className="planner-cal-week-col-head">
                          <div>{day.toLocaleDateString(undefined, { weekday: 'short' })}</div>
                          <strong>{day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</strong>
                        </div>
                        <div className="planner-cal-week-col-body">
                          {tasks.length === 0 ? (
                            <div className="planner-cal-empty-slot">No tasks</div>
                          ) : tasks.map((task) => (
                            <button
                              key={task.key}
                              className={`planner-cal-task planner-cal-task-${task.tone} ${selectedCalendarTaskId === task.id ? 'is-selected' : ''}`}
                              onClick={() => handleCalendarTaskSelect(task)}
                            >
                              <span className="planner-cal-task-title">{task.title}</span>
                              <span className="planner-cal-task-meta">{task.status}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {calendarView === 'day' && (
                <div className="planner-cal-day-list">
                  {selectedDateTasks.length === 0 ? (
                    <div className="planner-cal-empty-slot">No tasks scheduled for this day.</div>
                  ) : selectedDateTasks.map((task) => (
                    <button
                      key={task.key}
                      className={`planner-cal-task planner-cal-task-${task.tone} planner-cal-day-task ${selectedCalendarTaskId === task.id ? 'is-selected' : ''}`}
                      onClick={() => handleCalendarTaskSelect(task)}
                    >
                      <div className="planner-cal-task-title">{task.title}</div>
                      <div className="planner-cal-task-meta">{task.status} · {task.workType} · PRIORITY {task.priority}</div>
                    </button>
                  ))}
                </div>
              )}

              {(selectedCalendarTask || selectedWorkOrder) && (
                <div className="planner-cal-details">
                  <div className="planner-cal-details-head">
                    <h4>Work Order Details</h4>
                    <button className="dash-action-btn" onClick={() => setActiveTab('work-orders')}>Open in Work Order Tab</button>
                  </div>
                  <div className="planner-cal-details-grid">
                    <div><span>ID:</span> <strong>{getWorkOrderId(selectedWorkOrder || selectedCalendarTask?.workOrder)}</strong></div>
                    <div><span>Status:</span> <strong>{String((selectedWorkOrder || selectedCalendarTask?.workOrder)?.status || (selectedWorkOrder || selectedCalendarTask?.workOrder)?.workOrderStatus || 'UNKNOWN').toUpperCase()}</strong></div>
                    <div><span>Title:</span> <strong>{(selectedWorkOrder || selectedCalendarTask?.workOrder)?.title || '—'}</strong></div>
                    <div><span>Asset:</span> <strong>{selectedCalendarTask?.assetName || getAssetName((selectedWorkOrder || selectedCalendarTask?.workOrder)?.assetId)}</strong></div>
                    <div><span>Type:</span> <strong>{String((selectedWorkOrder || selectedCalendarTask?.workOrder)?.workType || (selectedWorkOrder || selectedCalendarTask?.workOrder)?.type || 'MAINTENANCE').replace(/_/g, ' ')}</strong></div>
                    <div><span>Priority:</span> <strong>{String((selectedWorkOrder || selectedCalendarTask?.workOrder)?.priority || 'MEDIUM').toUpperCase()}</strong></div>
                    <div><span>Start:</span> <strong>{getScheduledAnchorDate((selectedWorkOrder || selectedCalendarTask?.workOrder)) ? new Date(getScheduledAnchorDate((selectedWorkOrder || selectedCalendarTask?.workOrder))).toLocaleString() : 'N/A'}</strong></div>
                    <div><span>Crew:</span> <strong>{selectedCalendarTask?.crewName || ((selectedWorkOrder || selectedCalendarTask?.workOrder)?.assignedCrew?.name || ((selectedWorkOrder || selectedCalendarTask?.workOrder)?.crewId ? `Crew #${(selectedWorkOrder || selectedCalendarTask?.workOrder).crewId}` : 'Unassigned'))}</strong></div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

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
              onChange={(e) => handleHierarchySearch((e.target.value || '').toUpperCase())}
              className="search-input"
            />
            <button className="dash-action-btn" onClick={() => loadHierarchy()} style={{ marginLeft: 'auto' }}>
              Refresh Assets
            </button>
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
              <strong>Selected:</strong> {getAssetDisplayName(selectedAsset, assetNameMapById)} ({selectedAsset.type || selectedAsset.assetType || 'Asset'})
            </div>
          )}
        </div>
      )}

      {/* Work Order Creation Tab */}
      {activeTab === 'work-orders' && (
        <div className="tab-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3>Create Work Order</h3>
            <button className="dash-action-btn" onClick={() => { loadHierarchy(); loadWorkOrdersData(true); }}>
              Refresh Data
            </button>
          </div>
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
                      {'— '.repeat(asset.level || 0)}{getAssetDisplayName(asset, assetNameMapById)} ({asset.type || asset.assetType || 'Asset'})
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
          {assignmentError && <div className="error-text" style={{ marginBottom: '10px' }}>{assignmentError}</div>}
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