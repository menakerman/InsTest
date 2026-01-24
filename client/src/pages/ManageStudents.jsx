import { useState, useEffect } from 'react';
import { useAuth } from '../contexts';
import { getStudents, createStudent, updateStudent, deleteStudent } from '../utils/api';

function ManageStudents() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [deletingStudent, setDeletingStudent] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    unit_id: ''
  });

  // Check if user can edit (admin or instructor)
  const canEdit = user && (user.role === 'admin' || user.role === 'instructor');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const data = await getStudents();
      setStudents(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openCreateModal = () => {
    setEditingStudent(null);
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      unit_id: ''
    });
    setShowModal(true);
  };

  const openEditModal = (student) => {
    setEditingStudent(student);
    setFormData({
      first_name: student.first_name,
      last_name: student.last_name,
      email: student.email,
      phone: student.phone || '',
      unit_id: student.unit_id || ''
    });
    setShowModal(true);
  };

  const openDeleteModal = (student) => {
    setDeletingStudent(student);
    setShowDeleteModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingStudent(null);
    setError(null);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingStudent(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        await updateStudent(editingStudent.id, formData);
      } else {
        await createStudent(formData);
      }
      await fetchStudents();
      closeModal();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteStudent(deletingStudent.id);
      await fetchStudents();
      closeDeleteModal();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="loading">טוען תלמידים...</div>;
  }

  return (
    <div className="students-page">
      <div className="students-header">
        <h2>ניהול תלמידים</h2>
        {canEdit && (
          <button className="btn btn-primary" onClick={openCreateModal}>
            + הוסף תלמיד
          </button>
        )}
      </div>

      {error && <div className="error">{error}</div>}

      {students.length === 0 ? (
        <div className="empty-state">
          <p>אין תלמידים עדיין.{canEdit && ' לחץ על "הוסף תלמיד" כדי להוסיף.'}</p>
        </div>
      ) : (
        <div className="students-table">
          <table>
            <thead>
              <tr>
                <th>שם</th>
                <th>אימייל</th>
                <th>טלפון</th>
                <th>מספר יחידה</th>
                <th>קורסים</th>
                {canEdit && <th>פעולות</th>}
              </tr>
            </thead>
            <tbody>
              {students.map(student => (
                <tr key={student.id}>
                  <td data-label="שם">{student.first_name} {student.last_name}</td>
                  <td data-label="אימייל">{student.email}</td>
                  <td data-label="טלפון">{student.phone || '-'}</td>
                  <td data-label="מספר יחידה">{student.unit_id || '-'}</td>
                  <td data-label="קורסים">
                    {student.courses && student.courses.length > 0 ? (
                      <div className="course-tags">
                        {student.courses.map((course, idx) => (
                          <span key={idx} className="course-tag">{course.name}</span>
                        ))}
                      </div>
                    ) : (
                      <span className="no-courses">-</span>
                    )}
                  </td>
                  {canEdit && (
                    <td className="actions">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => openEditModal(student)}
                      >
                        עריכה
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => openDeleteModal(student)}
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

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editingStudent ? 'עריכת תלמיד' : 'הוספת תלמיד'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="first_name">שם פרטי *</label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="last_name">שם משפחה *</label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">אימייל *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="phone">טלפון</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="unit_id">מספר יחידה</label>
                <input
                  type="text"
                  id="unit_id"
                  name="unit_id"
                  value={formData.unit_id}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  ביטול
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingStudent ? 'שמור שינויים' : 'הוסף תלמיד'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="delete-confirm">
              <h3>מחיקת תלמיד</h3>
              <p>
                האם אתה בטוח שברצונך למחוק את{' '}
                <strong>{deletingStudent.first_name} {deletingStudent.last_name}</strong>?
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

export default ManageStudents;
