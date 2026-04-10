import React, { useEffect, useState } from 'react';
import { userService } from '../services/api';
import './UsersPage.css';

const ROLES = [
  'OPERATION PLANNER',
  'FIELD TECHNICIAN',
  'CONTROL ROOM OPERATOR',
  'BILLING AND CUSTOMER OPS',
  'REGULATORY ANALYST',
  'UTILITY ADMIN',
  'TECHNICIAN'
];

const ROLE_DESCRIPTIONS = {
  'OPERATION PLANNER': 'Plans and schedules utility operations to optimize resource allocation and system efficiency.',
  'FIELD TECHNICIAN': 'Performs on-site maintenance, repairs, and inspections of utility infrastructure.',
  'CONTROL ROOM OPERATOR': 'Monitors and controls utility systems from the control center, ensuring safe operations.',
  'BILLING AND CUSTOMER OPS': 'Manages customer accounts, billing, and customer service operations.',
  'REGULATORY ANALYST': 'Ensures compliance with regulatory requirements and industry standards.',
  'UTILITY ADMIN': 'Administers overall utility system operations and strategic planning.',
  'TECHNICIAN': 'Provides technical support and maintenance for utility systems.'
};

const emptyForm = { 
  fullName: '',
  email: '',
  password: '',
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewUser, setViewUser] = useState(null);

  const load = () => {
    setLoading(true);
    setError('');

    userService.getAll()
      .then(res => {
        console.log("API Response:", res);
        
        let usersList = [];
        
        if (res?.data?.data?.content && Array.isArray(res.data.data.content)) {
          usersList = res.data.data.content;
        } else if (res?.data?.data && Array.isArray(res.data.data)) {
          usersList = res.data.data;
        } else if (res?.data && Array.isArray(res.data)) {
          usersList = res.data;
        } else if (res?.content && Array.isArray(res.content)) {
          usersList = res.content;
        }
        
        setUsers(Array.isArray(usersList) ? usersList : []);
      })
      .catch((err) => {
        console.error("Error loading users:", err);
        setError("Failed to load users. Please try again.");
        setUsers([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setSelectedRoles([]);
    setError('');
    setModal('create');
  };

  const openEdit = (u) => {
    setSelected(u);
    setForm({
      fullName: u.name || '',
      email: u.email,
      password: ''
    });
    setSelectedRoles([]);
    setError('');
    setModal('edit');
  };

  const openRoles = (u) => {
    setSelected(u);
    setSelectedRoles(u.roles || []);
    setError('');
    setModal('roles');
  };

  const handleSave = async () => {
    setError('');

    if (!form.fullName.trim() || !form.email.trim()) {
      setError("Please fill in all required fields");
      return;
    }

    const payload = {
      name: form.fullName,
      email: form.email,
      temporaryPassword: form.password,
      roleNames: selectedRoles
    };

    try {
      if (modal === 'create') {
        if (!form.password.trim()) {
          setError("Password is required for new users");
          return;
        }
        await userService.create(payload);
        setSuccess("User created successfully");
      } else {
        await userService.update(selected.id, payload);
        setSuccess("User updated successfully");
      }

      setModal(null);
      load();
      setTimeout(() => setSuccess(''), 3000);

    } catch (e) {
      console.error("Save error:", e);
      setError(e.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await userService.delete(id);
      setSuccess("User deleted successfully");
      load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      console.error("Delete error:", e);
      setError(e.response?.data?.message || "Delete failed");
    }
  };

  const toggleRole = (role) => {
    setSelectedRoles(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const handleRemoveRole = async (id, role) => {
    try {
      await userService.removeRoles(id, { roleNames: [role] });
      setSuccess("Role removed successfully");
      load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      console.error("Remove role error:", e);
      setError("Failed to remove role");
    }
  };

  return (
    <div className="users-page">
      <div className="users-header">
        <div className="users-title-group">
          <h1 className="users-title">Users Management</h1>
          <p className="users-subtitle">Manage system users and their access roles</p>
        </div>
        <button className="users-btn-create" onClick={openCreate}>
          Add User
        </button>
      </div>

      {error && <div className="users-alert users-alert-error">
        <span className="users-alert-icon">⚠</span>
        {error}
      </div>}
      {success && <div className="users-alert users-alert-success">
        <span className="users-alert-icon">✓</span>
        {success}
      </div>}

      <div className="users-grid">
        {loading ? (
          <div className="users-loading-state">
            <div className="users-spinner"></div>
            <p>Loading users…</p>
          </div>
        ) : users.length === 0 ? (
          <div className="users-empty-state">
            <h3>No Users Yet</h3>
            <p>Create your first user to get started</p>
            <button className="users-btn-create" onClick={openCreate}>
              Create First User
            </button>
          </div>
        ) : (
          users.map(u => (
            <div key={u.id} className="users-card">
              <div className="users-card-header">
                <div className="users-avatar-large">{u.name?.charAt(0)?.toUpperCase() || '?'}</div>
                <div className="users-card-title">
                  <h3 className="users-card-name">{u.name}</h3>
                  <p className="users-card-email">{u.email}</p>
                </div>
              </div>

              <div className="users-card-roles">
                {(u.roles || []).length > 0 ? (
                  <div className="users-roles-container">
                    {(u.roles || []).map(r => (
                      <button
                        key={r}
                        className="users-role-tag"
                        onClick={() => setViewUser({ ...u, viewRole: r })}
                        title={ROLE_DESCRIPTIONS[r]}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="users-no-roles">No roles assigned</p>
                )}
              </div>

              <div className="users-card-actions">
                <button 
                  className="users-action-btn users-action-edit" 
                  onClick={() => openEdit(u)}
                  title="Edit user"
                >
                  Edit
                </button>
                <button 
                  className="users-action-btn users-action-roles" 
                  onClick={() => openRoles(u)}
                  title="Manage roles"
                >
                  Roles
                </button>
                <button 
                  className="users-action-btn users-action-delete" 
                  onClick={() => handleDelete(u.id)}
                  title="Delete user"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* USER DETAIL CARD */}
      {viewUser && (
        <div className="users-modal-overlay" onClick={() => setViewUser(null)}>
          <div className="users-detail-card" onClick={e => e.stopPropagation()}>
            <button className="users-detail-close" onClick={() => setViewUser(null)}>×</button>
            
            <div className="users-detail-header">
              <div className="users-detail-avatar">{viewUser.name?.charAt(0)?.toUpperCase() || '?'}</div>
              <div className="users-detail-info">
                <h2 className="users-detail-name">{viewUser.name}</h2>
                <p className="users-detail-email">{viewUser.email}</p>
              </div>
            </div>

            {viewUser.viewRole && (
              <div className="users-detail-role">
                <h3 className="users-detail-role-title">Role Information</h3>
                <div className="users-detail-role-badge">{viewUser.viewRole}</div>
                <p className="users-detail-role-description">
                  {ROLE_DESCRIPTIONS[viewUser.viewRole]}
                </p>
              </div>
            )}

            <div className="users-detail-all-roles">
              <h3 className="users-detail-roles-title">All Assigned Roles</h3>
              <div className="users-detail-roles-list">
                {(viewUser.roles || []).map(r => (
                  <div key={r} className="users-detail-role-item">
                    <span className="users-detail-role-name">{r}</span>
                    <p className="users-detail-role-desc">{ROLE_DESCRIPTIONS[r]}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="users-detail-footer">
              <button 
                className="users-btn-secondary" 
                onClick={() => {
                  setViewUser(null);
                  openEdit(viewUser);
                }}
              >
                Edit User
              </button>
              <button 
                className="users-btn-accent" 
                onClick={() => {
                  setViewUser(null);
                  openRoles(viewUser);
                }}
              >
                Manage Roles
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE/EDIT USER MODAL */}
      {(modal === 'create' || modal === 'edit') && (
        <div className="users-modal-overlay" onClick={() => setModal(null)}>
          <div className="users-modal" onClick={e => e.stopPropagation()}>
            <div className="users-modal-header">
              <h2 className="users-modal-title">
                {modal === 'create' ? 'Create New User' : 'Edit User'}
              </h2>
              <button className="users-modal-close" onClick={() => setModal(null)}>×</button>
            </div>

            <div className="users-modal-body">
              <div className="users-form-group">
                <label className="users-form-label">Full Name</label>
                <input
                  className="users-form-input"
                  value={form.fullName}
                  onChange={e => setForm({ ...form, fullName: e.target.value })}
                  placeholder="John Doe"
                />
              </div>

              <div className="users-form-group">
                <label className="users-form-label">Email Address</label>
                <input
                  className="users-form-input"
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>

              {modal === 'create' && (
                <div className="users-form-group">
                  <label className="users-form-label">Temporary Password</label>
                  <input
                    type="password"
                    className="users-form-input"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="Enter temporary password"
                  />
                  <p className="users-form-hint">User will be prompted to change on first login</p>
                </div>
              )}

              {modal === 'create' && (
                <div className="users-form-group">
                  <label className="users-form-label">Assign Roles</label>
                  <div className="users-role-checkboxes">
                    {ROLES.map(role => (
                      <label key={role} className="users-checkbox-item">
                        <input
                          type="checkbox"
                          checked={selectedRoles.includes(role)}
                          onChange={() => toggleRole(role)}
                        />
                        <span className="users-checkbox-label">{role}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="users-modal-footer">
              <button className="users-btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="users-btn-accent" onClick={handleSave}>
                {modal === 'create' ? 'Create User' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANAGE ROLES MODAL */}
      {modal === 'roles' && (
        <div className="users-modal-overlay" onClick={() => setModal(null)}>
          <div className="users-modal users-modal-large" onClick={e => e.stopPropagation()}>
            <div className="users-modal-header">
              <h2 className="users-modal-title">Manage Roles for {selected?.name}</h2>
              <button className="users-modal-close" onClick={() => setModal(null)}>×</button>
            </div>

            <div className="users-modal-body">
              <div className="users-roles-section">
                <h3 className="users-section-title">Current Roles</h3>
                <div className="users-current-roles-list">
                  {(selected?.roles || []).length > 0 ? (
                    (selected?.roles || []).map(role => (
                      <div key={role} className="users-role-current-item">
                        <div className="users-role-current-info">
                          <span className="users-role-current-name">{role}</span>
                          <p className="users-role-current-desc">{ROLE_DESCRIPTIONS[role]}</p>
                        </div>
                        <button
                          className="users-role-remove-btn"
                          onClick={() => handleRemoveRole(selected.id, role)}
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="users-empty-roles">No roles assigned yet</p>
                  )}
                </div>
              </div>

              <div className="users-roles-divider"></div>

              <div className="users-roles-section">
                <h3 className="users-section-title">Available Roles</h3>
                <div className="users-available-roles-grid">
                  {ROLES.map(role => {
                    const isAssigned = (selected?.roles || []).includes(role);
                    const isSelected = selectedRoles.includes(role);
                    return (
                      <button
                        key={role}
                        className={`users-role-available-item ${isAssigned ? 'is-assigned' : ''} ${isSelected ? 'is-selected' : ''}`}
                        onClick={() => {
                          if (!isAssigned) {
                            toggleRole(role);
                          }
                        }}
                        disabled={isAssigned}
                      >
                        <span className="users-role-available-check">
                          {isAssigned ? 'Assigned' : isSelected ? 'Selected' : 'Add'}
                        </span>
                        <div className="users-role-available-info">
                          <span className="users-role-available-name">{role}</span>
                          <p className="users-role-available-desc">{ROLE_DESCRIPTIONS[role]}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="users-modal-footer">
              <button className="users-btn-secondary" onClick={() => setModal(null)}>
                Close
              </button>
              {selectedRoles.length > 0 && (
                <button
                  className="users-btn-accent"
                  onClick={async () => {
                    try {
                      await userService.assignRoles(selected.id, { roleNames: selectedRoles });
                      setSuccess("Roles assigned successfully");
                      setModal(null);
                      setSelectedRoles([]);
                      load();
                    } catch (e) {
                      console.error("Assign roles error:", e);
                      setError("Failed to assign roles");
                    }
                  }}
                >
                  Assign {selectedRoles.length} Role(s)
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}