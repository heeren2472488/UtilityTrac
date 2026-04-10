import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { crewService, userService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './CrewPage.css';

const emptyForm = {
  name: '',
  email: '',
  crewType: 'ELECTRICAL',
  status: 'AVAILABLE',
  description: '',
  leaderId: '',
};

const normalizeListResponse = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.data?.content)) return payload.data.content;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data?.results)) return payload.data.results;
  return [];
};

const getCrewId = (crew) => (typeof crew === 'number' ? crew : (crew?.id ?? crew?.crewId ?? null));
const getUserId = (user) => (typeof user === 'number' ? user : (user?.id ?? user?.userId ?? null));

export default function CrewPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const roles = user?.roles || [];
  const canManageCrews = roles.includes('PLANNER') || roles.includes('ADMIN');
  const [crews, setCrews] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [memberUserId, setMemberUserId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');

    try {
      const crewRes = await crewService.getAll();
      setCrews(normalizeListResponse(crewRes?.data));
    } catch (e) {
      console.error('Crew load failed:', e);
      setError('Failed to load crews');
      setCrews([]);
    }

    try {
      const userRes = await userService.getAll();
      setUsers(normalizeListResponse(userRes?.data));
    } catch (e) {
      // keep page functional even if users API is restricted
      console.error('Users load failed:', e);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    if (!canManageCrews) {
      setError('Access denied: crew create/update requires PLANNER role');
      return;
    }
    setForm(emptyForm);
    setSelected(null);
    setError('');
    setModal('create');
  };

  const openEdit = (crew) => {
    if (!canManageCrews) {
      setError('Access denied: crew create/update requires PLANNER role');
      return;
    }
    setSelected(crew);
    setForm({
      name: crew.name || crew.crewName || crew.teamName || '',
      email: crew.email || crew.contactInfo || '',
      crewType: crew.crewType || crew.type || crew.skillset || 'ELECTRICAL',
      status: crew.status || crew.crewStatus || 'ON_DUTY',
      description: crew.description || '',
      leaderId: crew.leaderId || '',
    });
    setError('');
    setModal('edit');
  };

  const openMembers = (crew) => {
    if (!canManageCrews) {
      setError('Access denied: crew member assignment requires PLANNER role');
      return;
    }
    setSelected(crew);
    setMemberUserId('');
    setError('');
    setModal('members');
  };

  const closeModal = () => {
    setModal(null);
    setSelected(null);
    setError('');
  };

  const handleSave = async () => {
    if (!canManageCrews) {
      setError('Access denied: crew create/update requires PLANNER role');
      return;
    }

    setError('');

    if (!form.name.trim()) {
      setError('Crew name is required');
      return;
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Enter a valid email');
      return;
    }

    if (modal === 'create' && !form.email?.trim()) {
      setError('Crew Email is required');
      return;
    }

    const selectedLeader = users.find((u) => getUserId(u) === Number(form.leaderId));

    const createPayload = {
      name: form.name.trim(),
      skillset: form.crewType || 'ELECTRICAL',
      contactInfo: form.email?.trim() || null,
      leaderName: selectedLeader?.name || selectedLeader?.username || null,
      status: form.status || 'AVAILABLE',
      crewSize: 0,
    };

    const updatePayload = {
      name: form.name.trim(),
      skillset: form.crewType || 'ELECTRICAL',
      contactInfo: form.email?.trim() || null,
      status: form.status || 'ON_DUTY',
      description: form.description?.trim() || '',
      leaderId: form.leaderId ? Number(form.leaderId) : null,
    };

    try {
      if (modal === 'create') {
        await crewService.create(createPayload);
        setSuccess('Crew created successfully');
      } else {
        await crewService.update(getCrewId(selected), updatePayload);
        setSuccess('Crew updated successfully');
      }
      closeModal();
      await load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError(e.response?.data?.message || 'Save failed');
    }
  };

  const handleDelete = async (id) => {
    if (!canManageCrews) {
      setError('Access denied: crew delete requires PLANNER role');
      return;
    }
    if (!id) {
      setError('Invalid crew id');
      return;
    }
    if (!window.confirm('Delete this crew?')) return;
    try {
      await crewService.delete(id);
      setSuccess('Crew deleted successfully');
      await load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError(e.response?.data?.message || 'Delete failed');
    }
  };

  const handleAddMember = async () => {
    if (!canManageCrews) {
      setError('Access denied: crew member assignment requires PLANNER role');
      return;
    }
    if (!memberUserId) return;
    const crewId = getCrewId(selected);
    if (!crewId) {
      setError('Invalid crew selected');
      return;
    }
    try {
      await crewService.addMember(crewId, Number(memberUserId));
      setSuccess('Member added successfully');
      closeModal();
      await load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (crewId, userId) => {
    if (!canManageCrews) {
      setError('Access denied: crew member assignment requires PLANNER role');
      return;
    }
    if (!crewId || !userId) {
      setError('Invalid crew/member id');
      return;
    }
    try {
      await crewService.removeMember(crewId, userId);
      setSuccess('Member removed successfully');
      await load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to remove member');
    }
  };

  const filteredCrews = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return crews;

    return crews.filter((crew) => {
      const leader = users.find((u) => getUserId(u) === (crew.leaderId ?? crew.leader?.id));
      return (
        (crew.name || '').toLowerCase().includes(q) ||
        (crew.description || '').toLowerCase().includes(q) ||
        (leader?.username || '').toLowerCase().includes(q)
      );
    });
  }, [crews, users, search]);

  const stats = useMemo(() => {
    const totalCrews = crews.length;
    const crewsWithLeader = crews.filter((c) => c.leaderId || c.leader?.id).length;
    const memberCount = crews.reduce((sum, c) => sum + (c.members?.length || 0), 0);
    return { totalCrews, crewsWithLeader, memberCount };
  }, [crews]);

  const getLeaderName = (crew) => {
    const leaderId = crew.leaderId ?? crew.leader?.id;
    const leader = users.find((u) => getUserId(u) === leaderId);
    return (
      leader?.username ||
      leader?.name ||
      crew.leader?.username ||
      crew.leader?.name ||
      crew.leaderName ||
      'Not Assigned'
    );
  };

  const availableUsers = useMemo(() => {
    const memberIds = new Set((selected?.members || []).map((m) => getUserId(m)).filter(Boolean));
    return users.filter((u) => {
      const uid = getUserId(u);
      return uid && !memberIds.has(uid);
    });
  }, [selected, users]);

  return (
    <div className="crewx-page">
      <div className="crewx-header">
        <div className="crewx-title-group">
          <button className="crewx-back-btn" onClick={() => navigate('/dashboard')}>
            ← Back
          </button>
          <h1 className="crewx-title">Crew Management</h1>
          <p className="crewx-subtitle">Manage crews, crew leaders, and member assignment.</p>
        </div>

        <div className="crewx-header-actions">
          <input
            className="crewx-search"
            placeholder="Search crew, description, leader..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="crewx-btn crewx-btn-primary" onClick={openCreate} disabled={!canManageCrews}>
            + New Crew
          </button>
        </div>
      </div>

      <div className="crewx-stats-grid">
        <div className="crewx-stat-card">
          <span className="crewx-stat-label">Total Crews</span>
          <strong className="crewx-stat-value">{stats.totalCrews}</strong>
        </div>
        <div className="crewx-stat-card">
          <span className="crewx-stat-label">Crews with Leader</span>
          <strong className="crewx-stat-value">{stats.crewsWithLeader}</strong>
        </div>
        <div className="crewx-stat-card">
          <span className="crewx-stat-label">Assigned Members</span>
          <strong className="crewx-stat-value">{stats.memberCount}</strong>
        </div>
      </div>

      {error && <div className="crewx-alert crewx-alert-error">⚠ {error}</div>}
      {success && <div className="crewx-alert crewx-alert-success">✓ {success}</div>}
      {!canManageCrews && (
        <div className="crewx-alert crewx-alert-error">⚠ Read-only mode: backend permits crew create/assign only for PLANNER role.</div>
      )}

      <div className="crewx-table-wrap">
        <table className="crewx-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Leader</th>
              <th>Description</th>
              <th>Members</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="crewx-empty-row">Loading crews...</td></tr>
            ) : filteredCrews.length === 0 ? (
              <tr><td colSpan="6" className="crewx-empty-row">No crews found</td></tr>
            ) : (
              filteredCrews.map((c, crewIndex) => {
                const crewId = getCrewId(c);
                return (
                <tr key={crewId ?? `crew-row-${crewIndex}`}>
                  <td className="crewx-id-cell">{crewId ?? '—'}</td>
                  <td>{c.name || c.crewName || c.teamName || c.email || `Crew #${crewId ?? ''}`}</td>
                  <td>{getLeaderName(c)}</td>
                  <td>{c.description || c.crewType || c.type || '—'}</td>
                  <td>
                    {(c.members || []).length === 0 ? (
                      <span className="crewx-muted">No members</span>
                    ) : (c.members || []).map((m, memberIndex) => {
                      const memberId = getUserId(m);
                      return (
                      <span
                        key={memberId ?? `crew-${crewId ?? crewIndex}-member-${memberIndex}`}
                        className="crewx-member-chip"
                        onClick={() => handleRemoveMember(crewId, memberId)}
                        title="Click to remove member"
                      >
                        {m.username || m.name || `User ${memberId ?? ''}`} ×
                      </span>
                    )})}
                  </td>
                  <td className="crewx-actions">
                    <button className="crewx-btn crewx-btn-ghost" onClick={() => openEdit(c)} disabled={!canManageCrews}>Edit</button>
                    <button className="crewx-btn crewx-btn-ghost" onClick={() => openMembers(c)} disabled={!canManageCrews}>+ Member</button>
                    <button className="crewx-btn crewx-btn-danger" onClick={() => handleDelete(crewId)} disabled={!canManageCrews}>Delete</button>
                  </td>
                </tr>
              )})
            )}
          </tbody>
        </table>
      </div>

      {(modal === 'create' || modal === 'edit') && (
        <div className="crewx-modal-overlay" onClick={closeModal}>
          <div className="crewx-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="crewx-modal-title">{modal === 'create' ? 'Create Crew' : 'Edit Crew'}</h3>

            <label className="crewx-modal-label">Crew Name</label>
            <input
              className="crewx-modal-input"
              placeholder="Crew name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <label className="crewx-modal-label">Crew Email</label>
            <input
              className="crewx-modal-input"
              placeholder="crew@utilitrack.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            <label className="crewx-modal-label">Crew Type</label>
            <select
              className="crewx-modal-input"
              value={form.crewType}
              onChange={(e) => setForm({ ...form, crewType: e.target.value })}
            >
              <option value="ELECTRICAL">ELECTRICAL</option>
              <option value="MECHANICAL">MECHANICAL</option>
              <option value="CIVIL">CIVIL</option>
              <option value="INSPECTION">INSPECTION</option>
            </select>

            <label className="crewx-modal-label">Status</label>
            <select
              className="crewx-modal-input"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="ON_DUTY">ON_DUTY</option>
              <option value="AVAILABLE">AVAILABLE</option>
              <option value="OFF_DUTY">OFF_DUTY</option>
            </select>

            <label className="crewx-modal-label">Description</label>
            <input
              className="crewx-modal-input"
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />

            <label className="crewx-modal-label">Crew Leader</label>
            <select
              className="crewx-modal-input"
              value={form.leaderId}
              onChange={(e) => setForm({ ...form, leaderId: e.target.value })}
            >
              <option value="">Select leader</option>
              {users.map((u, index) => {
                const uid = getUserId(u);
                return (
                  <option key={uid ?? `leader-${index}`} value={uid ?? ''}>
                    {u.username || u.name || `User ${uid ?? ''}`}
                  </option>
                );
              })}
            </select>

            <div className="crewx-modal-actions">
              <button className="crewx-btn crewx-btn-ghost" onClick={closeModal}>Cancel</button>
              <button className="crewx-btn crewx-btn-primary" onClick={handleSave}>Save</button>
            </div>
          </div>
        </div>
      )}

      {modal === 'members' && (
        <div className="crewx-modal-overlay" onClick={closeModal}>
          <div className="crewx-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="crewx-modal-title">Add Member to {selected?.name}</h3>

            <label className="crewx-modal-label">User</label>
            <select className="crewx-modal-input" value={memberUserId} onChange={(e) => setMemberUserId(e.target.value)}>
              <option value="">Select user</option>
              {availableUsers.map((u, index) => {
                const uid = getUserId(u);
                return (
                  <option key={uid ?? `member-${index}`} value={uid ?? ''}>
                    {u.username || u.name || `User ${uid ?? ''}`}
                  </option>
                );
              })}
            </select>

            <div className="crewx-modal-actions">
              <button className="crewx-btn crewx-btn-ghost" onClick={closeModal}>Cancel</button>
              <button className="crewx-btn crewx-btn-primary" onClick={handleAddMember}>Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}