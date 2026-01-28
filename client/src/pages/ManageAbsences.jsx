import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts';
import {
  getAbsences,
  getStudents,
  createAbsence,
  updateAbsence,
  deleteAbsence
} from '../utils/api';

function ManageAbsences() {
  const { user } = useAuth();
  const [absences, setAbsences] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingAbsence, setEditingAbsence] = useState(null);
  const [deletingAbsence, setDeletingAbsence] = useState(null);
  const [filters, setFilters] = useState({
    student_id: '',
    from_date: '',
    to_date: ''
  });
  const [formData, setFormData] = useState({
    student_id: '',
    absence_date: '',
    reason: '',
    is_excused: false,
    notes: ''
  });

  // Check if user can edit (admin or instructor)
  const canEdit = user && (user.role === 'admin' || user.role === 'instructor');

  const fetchAbsences = useCallback(async () => {
    try {
      const cleanFilters = {};
      if (filters.student_id) cleanFilters.student_id = filters.student_id;
      if (filters.from_date) cleanFilters.from_date = filters.from_date;
      if (filters.to_date) cleanFilters.to_date = filters.to_date;

      const data = await getAbsences(cleanFilters);
      setAbsences(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, [filters]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [absencesData, studentsData] = await Promise.all([
          getAbsences(),
          getStudents()
        ]);
        setAbsences(absencesData);
        setStudents(studentsData);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    fetchAbsences();
  }, [fetchAbsences]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const openCreateModal = () => {
    setEditingAbsence(null);
    setFormData({
      student_id: '',
      absence_date: new Date().toISOString().split('T')[0],
      reason: '',
      is_excused: false,
      notes: ''
    });
    setShowModal(true);
  };

  const openEditModal = (absence) => {
    setEditingAbsence(absence);
    setFormData({
      student_id: absence.student_id,
      absence_date: absence.absence_date.split('T')[0],
      reason: absence.reason || '',
      is_excused: absence.is_excused || false,
      notes: absence.notes || ''
    });
    setShowModal(true);
  };

  const openDeleteModal = (absence) => {
    setDeletingAbsence(absence);
    setShowDeleteModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAbsence(null);
    setError(null);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingAbsence(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAbsence) {
        await updateAbsence(editingAbsence.id, formData);
      } else {
        await createAbsence(formData);
      }
      await fetchAbsences();
      closeModal();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAbsence(deletingAbsence.id);
      await fetchAbsences();
      closeDeleteModal();
    } catch (err) {
      setError(err.message);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return <div className="loading">טוען העדרויות...</div>;
  }

  return (
    <div className="absences-page">
      <div className="page-header">
        <h2>ניהול העדרויות</h2>
        {canEdit && (
          <button className="btn btn-primary" onClick={openCreateModal}>
            + הוסף העדרות
          </button>
        )}
      </div>

      {error && <div className="error">{error}</div>}

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-row">
          <div className="filter-group">
            <label htmlFor="filter-student">תלמיד</label>
            <select
              id="filter-student"
              name="student_id"
              value={filters.student_id}
              onChange={handleFilterChange}
            >
              <option value="">כל החניכים</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.first_name} {student.last_name}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="filter-from">מתאריך</label>
            <input
              type="date"
              id="filter-from"
              name="from_date"
              value={filters.from_date}
              onChange={handleFilterChange}
            />
          </div>
          <div className="filter-group">
            <label htmlFor="filter-to">עד תאריך</label>
            <input
              type="date"
              id="filter-to"
              name="to_date"
              value={filters.to_date}
              onChange={handleFilterChange}
            />
          </div>
        </div>
      </div>

      {absences.length === 0 ? (
        <div className="empty-state">
          <p>אין העדרויות רשומות.{canEdit && ' לחץ על "הוסף העדרות" כדי להוסיף.'}</p>
        </div>
      ) : (
        <div className="absences-table">
          <table>
            <thead>
              <tr>
                <th>שם התלמיד</th>
                <th>תאריך</th>
                <th>סיבה</th>
                <th>סטטוס</th>
                <th>הערות</th>
                {canEdit && <th>פעולות</th>}
              </tr>
            </thead>
            <tbody>
              {absences.map(absence => (
                <tr key={absence.id}>
                  <td data-label="שם התלמיד">
                    {absence.student_first_name} {absence.student_last_name}
                  </td>
                  <td data-label="תאריך">{formatDate(absence.absence_date)}</td>
                  <td data-label="סיבה">{absence.reason || '-'}</td>
                  <td data-label="סטטוס">
                    <span className={`status-badge ${absence.is_excused ? 'excused' : 'unexcused'}`}>
                      {absence.is_excused ? 'מאושר' : 'לא מאושר'}
                    </span>
                  </td>
                  <td data-label="הערות">{absence.notes || '-'}</td>
                  {canEdit && (
                    <td className="actions">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => openEditModal(absence)}
                      >
                        עריכה
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => openDeleteModal(absence)}
                      >
                        מחיקה
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editingAbsence ? 'עריכת העדרות' : 'הוספת העדרות'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="student_id">תלמיד *</label>
                <select
                  id="student_id"
                  name="student_id"
                  value={formData.student_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">בחר תלמיד</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.first_name} {student.last_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="absence_date">תאריך *</label>
                <input
                  type="date"
                  id="absence_date"
                  name="absence_date"
                  value={formData.absence_date}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="reason">סיבה</label>
                <input
                  type="text"
                  id="reason"
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  placeholder="סיבת ההעדרות"
                />
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="is_excused"
                    checked={formData.is_excused}
                    onChange={handleInputChange}
                  />
                  העדרות מאושרת
                </label>
              </div>
              <div className="form-group">
                <label htmlFor="notes">הערות</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="הערות נוספות"
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  ביטול
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingAbsence ? 'שמור שינויים' : 'הוסף העדרות'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="delete-confirm">
              <h3>מחיקת העדרות</h3>
              <p>
                האם אתה בטוח שברצונך למחוק את ההעדרות של{' '}
                <strong>{deletingAbsence.student_first_name} {deletingAbsence.student_last_name}</strong>
                {' '}מתאריך {formatDate(deletingAbsence.absence_date)}?
                <br />
                לא ניתן לבטל פעולה זו.
              </p>
              <div className="form-actions">
                <button className="btn btn-secondary" onClick={closeDeleteModal}>
                  ביטול
                </button>
                <button className="btn btn-danger" onClick={handleDelete}>
                  מחיקה
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageAbsences;
