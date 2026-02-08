import { useState, useEffect } from 'react';
import { useAuth } from '../contexts';
import { getLessons, createLesson, updateLesson, deleteLesson, getEvaluationSubjects } from '../utils/api';

function ManageLessons() {
  const { user } = useAuth();
  const [lessons, setLessons] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [deletingLesson, setDeletingLesson] = useState(null);
  const [filterSubject, setFilterSubject] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    subject_id: '',
    description: '',
    display_order: 0
  });

  // Only admin can CRUD
  const canEdit = user && user.role === 'admin';

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchLessons();
  }, [filterSubject]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [lessonsData, subjectsData] = await Promise.all([
        getLessons(),
        getEvaluationSubjects()
      ]);
      setLessons(lessonsData);
      setSubjects(subjectsData);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLessons = async () => {
    try {
      const filters = {};
      if (filterSubject) filters.subject_id = filterSubject;
      const data = await getLessons(filters);
      setLessons(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openCreateModal = () => {
    setEditingLesson(null);
    setFormData({
      name: '',
      subject_id: subjects.length > 0 ? subjects[0].id : '',
      description: '',
      display_order: 0
    });
    setShowModal(true);
  };

  const openEditModal = (lesson) => {
    setEditingLesson(lesson);
    setFormData({
      name: lesson.name,
      subject_id: lesson.subject_id,
      description: lesson.description || '',
      display_order: lesson.display_order || 0,
      is_active: lesson.is_active
    });
    setShowModal(true);
  };

  const openDeleteModal = (lesson) => {
    setDeletingLesson(lesson);
    setShowDeleteModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingLesson(null);
    setError(null);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingLesson(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingLesson) {
        await updateLesson(editingLesson.id, formData);
      } else {
        await createLesson(formData);
      }
      await fetchLessons();
      closeModal();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteLesson(deletingLesson.id);
      await fetchLessons();
      closeDeleteModal();
    } catch (err) {
      setError(err.message);
    }
  };

  // Group lessons by subject
  const groupedLessons = lessons.reduce((acc, lesson) => {
    const subjectName = lesson.subject_name || 'ללא נושא';
    if (!acc[subjectName]) {
      acc[subjectName] = [];
    }
    acc[subjectName].push(lesson);
    return acc;
  }, {});

  if (loading) {
    return <div className="loading">טוען שיעורים...</div>;
  }

  return (
    <div className="lessons-page">
      <div className="page-header">
        <h2>ניהול שיעורים</h2>
        {canEdit && (
          <button className="btn btn-primary" onClick={openCreateModal}>
            + הוסף שיעור
          </button>
        )}
      </div>

      <div className="filters-section">
        <div className="filter-group">
          <label>סנן לפי נושא הערכה</label>
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
          >
            <option value="">כל הנושאים</option>
            {subjects.map(subject => (
              <option key={subject.id} value={subject.id}>{subject.name_he}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {lessons.length === 0 ? (
        <div className="empty-state">
          <p>אין שיעורים עדיין.{canEdit && ' לחץ על "הוסף שיעור" כדי להוסיף.'}</p>
        </div>
      ) : (
        <div className="lessons-grouped">
          {Object.entries(groupedLessons).map(([subjectName, subjectLessons]) => (
            <div key={subjectName} className="lessons-group">
              <h3 className="lessons-group-title">{subjectName}</h3>
              <div className="lessons-table">
                <table>
                  <thead>
                    <tr>
                      <th>שם השיעור</th>
                      <th>תיאור</th>
                      <th>סדר תצוגה</th>
                      <th>סטטוס</th>
                      {canEdit && <th>פעולות</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {subjectLessons.map(lesson => (
                      <tr key={lesson.id}>
                        <td data-label="שם השיעור">{lesson.name}</td>
                        <td data-label="תיאור">{lesson.description || '-'}</td>
                        <td data-label="סדר תצוגה">{lesson.display_order}</td>
                        <td data-label="סטטוס">
                          <span className={`status-badge ${lesson.is_active ? 'active' : 'inactive'}`}>
                            {lesson.is_active ? 'פעיל' : 'לא פעיל'}
                          </span>
                        </td>
                        {canEdit && (
                          <td className="actions">
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => openEditModal(lesson)}
                            >
                              עריכה
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => openDeleteModal(lesson)}
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
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={closeModal} type="button">✕</button>
            <h3>{editingLesson ? 'עריכת שיעור' : 'הוספת שיעור'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">שם השיעור *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="subject_id">נושא הערכה *</label>
                <select
                  id="subject_id"
                  name="subject_id"
                  value={formData.subject_id}
                  onChange={handleInputChange}
                  className="form-select"
                  required
                >
                  <option value="">בחר נושא...</option>
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>{subject.name_he}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="description">תיאור</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label htmlFor="display_order">סדר תצוגה</label>
                <input
                  type="number"
                  id="display_order"
                  name="display_order"
                  value={formData.display_order}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>

              {editingLesson && (
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active !== false}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    />
                    שיעור פעיל
                  </label>
                </div>
              )}

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  ביטול
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingLesson ? 'שמור שינויים' : 'הוסף שיעור'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={closeDeleteModal} type="button">✕</button>
            <div className="delete-confirm">
              <h3>מחיקת שיעור</h3>
              <p>
                האם אתה בטוח שברצונך למחוק את השיעור{' '}
                <strong>{deletingLesson.name}</strong>?
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

export default ManageLessons;
