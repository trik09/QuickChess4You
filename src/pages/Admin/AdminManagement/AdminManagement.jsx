import { useState, useEffect } from 'react';
import { FaUserShield, FaPlus, FaEdit, FaTrash, FaLock, FaKey, FaShieldAlt } from 'react-icons/fa';
import { adminAPI } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import styles from './AdminManagement.module.css';

const AVAILABLE_PERMISSIONS = [
  { key: 'create_puzzle', label: 'Create Puzzle', category: 'Puzzles' },
  { key: 'edit_puzzle', label: 'Edit Puzzle', category: 'Puzzles' },
  { key: 'delete_puzzle', label: 'Delete Puzzle', category: 'Puzzles' },
  
  { key: 'create_competition', label: 'Create Competition', category: 'Competitions' },
  { key: 'edit_competition', label: 'Edit Competition', category: 'Competitions' },
  { key: 'delete_competition', label: 'Delete Competition', category: 'Competitions' },
  
  { key: 'create_category', label: 'Create Category', category: 'Categories' },
  { key: 'edit_category', label: 'Edit Category', category: 'Categories' },
  { key: 'delete_category', label: 'Delete Category', category: 'Categories' },

  { key: 'create_event', label: 'Create Event', category: 'Events' },
  { key: 'edit_event', label: 'Edit Event', category: 'Events' },
  { key: 'delete_event', label: 'Delete Event', category: 'Events' },

  { key: 'create_exam', label: 'Create Exam', category: 'Exams' },
  { key: 'edit_exam', label: 'Edit Exam', category: 'Exams' },
  { key: 'delete_exam', label: 'Delete Exam', category: 'Exams' },
];

function AdminManagement() {
  const { admin: currentAdmin } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [permissions, setPermissions] = useState({});

  useEffect(() => {
    fetchSubAdmins();
  }, []);

  const fetchSubAdmins = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getSubAdmins();
      if (res.success) {
        setAdmins(res.data || []);
      } else {
        setError(res.message || 'Failed to fetch sub-admins');
      }
    } catch (err) {
      setError(err?.message || 'Error connecting to the server');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingAdmin(null);
    setName('');
    setEmail('');
    setPassword('');
    // Init all permissions to false
    const initialPerms = {};
    AVAILABLE_PERMISSIONS.forEach(p => {
      initialPerms[p.key] = false;
    });
    setPermissions(initialPerms);
    setActionError('');
    setShowModal(true);
  };

  const handleOpenEditModal = (admin) => {
    setEditingAdmin(admin);
    setName(admin.name);
    setEmail(admin.email);
    setPassword(''); // keep blank unless changing password
    
    // Parse permissions from admin object
    const initialPerms = {};
    AVAILABLE_PERMISSIONS.forEach(p => {
      // Support Map or Standard Object
      let val = false;
      if (admin.permissions) {
        if (admin.permissions instanceof Map) {
          val = admin.permissions.get(p.key) === true;
        } else if (typeof admin.permissions === 'object') {
          val = admin.permissions[p.key] === true;
        }
      }
      initialPerms[p.key] = val;
    });
    setPermissions(initialPerms);
    setActionError('');
    setShowModal(true);
  };

  const handlePermissionToggle = (key) => {
    setPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSelectAllCategory = (category, value) => {
    setPermissions(prev => {
      const updated = { ...prev };
      AVAILABLE_PERMISSIONS.filter(p => p.category === category).forEach(p => {
        updated[p.key] = value;
      });
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionError('');

    const payload = {
      name,
      email,
      permissions
    };

    if (password) {
      payload.password = password;
    }

    try {
      if (editingAdmin) {
        const res = await adminAPI.updateSubAdmin(editingAdmin._id || editingAdmin.id, payload);
        if (res.success) {
          setShowModal(false);
          fetchSubAdmins();
        } else {
          setActionError(res.message || 'Failed to update sub-admin');
        }
      } else {
        if (!password) {
          setActionError('Password is required for new sub-admins');
          return;
        }
        const res = await adminAPI.createSubAdmin(payload);
        if (res.success) {
          setShowModal(false);
          fetchSubAdmins();
        } else {
          setActionError(res.message || 'Failed to create sub-admin');
        }
      }
    } catch (err) {
      setActionError(err?.message || 'Error processing request');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this sub-admin? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await adminAPI.deleteSubAdmin(id);
      if (res.success) {
        fetchSubAdmins();
      } else {
        alert(res.message || 'Failed to delete sub-admin');
      }
    } catch (err) {
      alert(err?.message || 'Error deleting sub-admin');
    }
  };

  // Determine if super admin
  const isSuper = currentAdmin?.role === 'super' || currentAdmin?.email === 'admin@admin.com';
  if (!isSuper) {
    return (
      <div className={styles.accessDenied}>
        <FaShieldAlt className={styles.deniedIcon} />
        <h2>Access Denied</h2>
        <p>Only the primary Super Admin has permission to view or manage sub-admins.</p>
      </div>
    );
  }

  return (
    <div className={styles.adminManagement}>
      <div className={styles.header}>
        <div>
          <h2><FaUserShield /> Sub-Admin Management</h2>
          <p>Create, manage, and customize permissions for sub-admins who assist with dashboard operations</p>
        </div>
        <button className={styles.addBtn} onClick={handleOpenAddModal}>
          <FaPlus /> Create Sub-Admin
        </button>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {loading ? (
        <div className={styles.loaderContainer}>
          <div className={styles.spinner}></div>
          <p>Loading sub-admins...</p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Login ID (Email)</th>
                <th>Permissions Summary</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.length === 0 ? (
                <tr>
                  <td colSpan="6" className={styles.noAdmins}>
                    No sub-admins created yet. Click "Create Sub-Admin" to add one!
                  </td>
                </tr>
              ) : (
                admins.map(admin => {
                  // Count active permissions
                  let activePermsCount = 0;
                  if (admin.permissions) {
                    if (admin.permissions instanceof Map) {
                      admin.permissions.forEach(val => { if (val) activePermsCount++; });
                    } else if (typeof admin.permissions === 'object') {
                      Object.values(admin.permissions).forEach(val => { if (val) activePermsCount++; });
                    }
                  }

                  return (
                    <tr key={admin._id || admin.id}>
                      <td>
                        <div className={styles.adminInfo}>
                          <div className={styles.avatar}>
                            {admin.name.charAt(0).toUpperCase()}
                          </div>
                          <div className={styles.nameDetails}>
                            <span className={styles.nameText}>{admin.name}</span>
                            <span className={styles.roleBadge}>{admin.role}</span>
                          </div>
                        </div>
                      </td>
                      <td>{admin.email}</td>
                      <td>
                        <span className={styles.permissionSummaryBadge}>
                          {activePermsCount} / {AVAILABLE_PERMISSIONS.length} Permissions
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${styles.active}`}>
                          Active
                        </span>
                      </td>
                      <td>{admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : 'N/A'}</td>
                      <td>
                        <div className={styles.actions}>
                          <button
                            className={styles.actionBtn}
                            title="Edit Permissions / Details"
                            onClick={() => handleOpenEditModal(admin)}
                          >
                            <FaEdit />
                          </button>
                          <button
                            className={`${styles.actionBtn} ${styles.delete}`}
                            title="Delete"
                            onClick={() => handleDelete(admin._id || admin.id)}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Elegant Add/Edit Modal */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>{editingAdmin ? 'Edit Sub-Admin' : 'Create Sub-Admin'}</h3>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>&times;</button>
            </div>

            {actionError && <div className={styles.actionErrorBanner}>{actionError}</div>}

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formColumns}>
                
                {/* Left Column: Credentials */}
                <div className={styles.credentialsColumn}>
                  <h4><FaLock /> Login Credentials</h4>
                  
                  <div className={styles.formGroup}>
                    <label>Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Login ID (Email Address)</label>
                    <input
                      type="email"
                      placeholder="e.g. john@quickchess.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>
                      Password {editingAdmin && <span className={styles.optionalText}>(Leave blank to keep current)</span>}
                    </label>
                    <input
                      type="password"
                      placeholder={editingAdmin ? "••••••••" : "Enter minimum 8 chars password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required={!editingAdmin}
                      minLength={8}
                    />
                  </div>

                  <div className={styles.infoBox}>
                    <FaKey />
                    <p>Share these login credentials securely with the sub-admin so they can access the panel.</p>
                  </div>
                </div>

                {/* Right Column: Permissions Checkboxes */}
                <div className={styles.permissionsColumn}>
                  <h4><FaShieldAlt /> Customize CRUD Access Permissions</h4>
                  
                  <div className={styles.permissionsGrid}>
                    {['Puzzles', 'Competitions', 'Categories', 'Events', 'Exams'].map(cat => {
                      const permsInCat = AVAILABLE_PERMISSIONS.filter(p => p.category === cat);
                      const allChecked = permsInCat.every(p => permissions[p.key]);
                      
                      return (
                        <div key={cat} className={styles.categoryBlock}>
                          <div className={styles.categoryHeader}>
                            <h5>{cat} Access</h5>
                            <button
                              type="button"
                              className={styles.bulkSelectBtn}
                              onClick={() => handleSelectAllCategory(cat, !allChecked)}
                            >
                              {allChecked ? 'Deselect All' : 'Select All'}
                            </button>
                          </div>
                          
                          <div className={styles.checkboxList}>
                            {permsInCat.map(p => (
                              <label key={p.key} className={styles.checkboxLabel}>
                                <input
                                  type="checkbox"
                                  checked={permissions[p.key] || false}
                                  onChange={() => handlePermissionToggle(p.key)}
                                />
                                <span>{p.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn}>
                  {editingAdmin ? 'Save Changes' : 'Create Admin Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminManagement;
