import { useState, useEffect } from 'react';
import { getUsers, createUser, updateUser, deleteUser } from '../utils/api';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const roleLabels = {
    admin: 'מנהל',
    instructor: 'מדריך',
    tester: 'בוחן',
    student: 'תלמיד'
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingUser(null);
    setShowModal(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteUser(id);
      setUsers(users.filter((u) => u.id !== id));
      setShowDeleteConfirm(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSave = async (userData) => {
    if (editingUser) {
      const updated = await updateUser(editingUser.id, userData);
      setUsers(users.map((u) => (u.id === editingUser.id ? updated : u)));
    } else {
      const created = await createUser(userData);
      setUsers([created, ...users]);
    }
    setShowModal(false);
    setEditingUser(null);
  };

  if (loading) return <div className="loading">טוען...</div>;

  return (
    <div className="users-page">
      <div className="students-header">
        <h2>ניהול משתמשים</h2>
        <button className="btn btn-primary" onClick={handleCreate}>
          הוסף משתמש
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="students-table">
        <table>
          <thead>
            <tr>
              <th>שם</th>
              <th>אימייל</th>
              <th>תפקיד</th>
              <th>סטטוס</th>
              <th>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty-state">אין משתמשים</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td data-label="שם">{user.first_name} {user.last_name}</td>
                  <td data-label="אימייל">{user.email}</td>
                  <td data-label="תפקיד">{roleLabels[user.role]}</td>
                  <td data-label="סטטוס">
                    <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                      {user.is_active ? 'פעיל' : 'לא פעיל'}
                    </span>
                  </td>
                  <td className="actions" data-label="פעולות">
                    <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(user)}>
                      ערוך
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => setShowDeleteConfirm(user)}>
                      מחק
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <UserModal
          user={editingUser}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false);
            setEditingUser(null);
          }}
        />
      )}

      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-confirm">
              <h3>מחיקת משתמש</h3>
              <p>
                האם אתה בטוח שברצונך למחוק את המשתמש{' '}
                <strong>{showDeleteConfirm.first_name} {showDeleteConfirm.last_name}</strong>?
              </p>
              <div className="form-actions">
                <button className="btn btn-danger" onClick={() => handleDelete(showDeleteConfirm.id)}>
                  מחק
                </button>
                <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(null)}>
                  ביטול
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UserModal({ user, onSave, onClose }) {
  const [formData, setFormData] = useState({
    email: user?.email || '',
    password: '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    role: user?.role || 'student',
    is_active: user?.is_active ?? true
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!user && formData.password.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }

    if (user && formData.password && formData.password.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }

    setSaving(true);

    try {
      const dataToSave = { ...formData };
      if (user && !formData.password) {
        delete dataToSave.password;
      }
      await onSave(dataToSave);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{user ? 'עריכת משתמש' : 'הוספת משתמש'}</h3>

        <form onSubmit={handleSubmit}>
          {error && <div className="error">{error}</div>}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="first_name">שם פרטי</label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="last_name">שם משפחה</label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">אימייל</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              {user ? 'סיסמה חדשה (השאר ריק לשמירה על הקיימת)' : 'סיסמה'}
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required={!user}
              minLength={user ? 0 : 6}
              autoComplete="new-password"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="role">תפקיד</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="form-select"
              >
                <option value="admin">מנהל</option>
                <option value="instructor">מדריך</option>
                <option value="tester">בוחן</option>
                <option value="student">תלמיד</option>
              </select>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                />
                משתמש פעיל
              </label>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'שומר...' : 'שמור'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
