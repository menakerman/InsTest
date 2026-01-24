import { useState, useEffect } from 'react';
import { useAuth } from '../contexts';
import { getInstructors, createInstructor, updateInstructor, deleteInstructor, getEvaluations } from '../utils/api';

function ManageInstructors() {
  const { user } = useAuth();
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [instructorEvaluations, setInstructorEvaluations] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [createdInstructorInfo, setCreatedInstructorInfo] = useState(null);
  const [editingInstructor, setEditingInstructor] = useState(null);
  const [deletingInstructor, setDeletingInstructor] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: ''
  });

  // Only admin can edit instructors
  const canEdit = user && user.role === 'admin';

  useEffect(() => {
    fetchInstructors();
  }, []);

  const fetchInstructors = async () => {
    try {
      setLoading(true);
      const data = await getInstructors();
      setInstructors(data);
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
    setEditingInstructor(null);
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: ''
    });
    setShowModal(true);
  };

  const openEditModal = (instructor) => {
    setEditingInstructor(instructor);
    setFormData({
      first_name: instructor.first_name,
      last_name: instructor.last_name,
      email: instructor.email || '',
      phone: instructor.phone || ''
    });
    setShowModal(true);
  };

  const openDeleteModal = (instructor) => {
    setDeletingInstructor(instructor);
    setShowDeleteModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingInstructor(null);
    setError(null);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingInstructor(null);
  };

  const openProfileModal = async (instructor) => {
    setSelectedInstructor(instructor);
    setShowProfileModal(true);
    setLoadingProfile(true);
    try {
      const allEvaluations = await getEvaluations();
      const instructorEvals = allEvaluations.filter(e => e.instructor_id === instructor.id);
      setInstructorEvaluations(instructorEvals);
    } catch (err) {
      console.error('Failed to load instructor evaluations:', err);
      setInstructorEvaluations([]);
    } finally {
      setLoadingProfile(false);
    }
  };

  const closeProfileModal = () => {
    setShowProfileModal(false);
    setSelectedInstructor(null);
    setInstructorEvaluations([]);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingInstructor) {
        await updateInstructor(editingInstructor.id, formData);
        await fetchInstructors();
        closeModal();
      } else {
        const result = await createInstructor(formData);
        await fetchInstructors();
        closeModal();
        // Show the default password to the admin
        if (result.default_password) {
          setCreatedInstructorInfo({
            name: `${result.first_name} ${result.last_name}`,
            email: result.email,
            password: result.default_password
          });
          setShowPasswordModal(true);
        }
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteInstructor(deletingInstructor.id);
      await fetchInstructors();
      closeDeleteModal();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="loading">טוען מדריכים...</div>;
  }

  return (
    <div className="instructors-page">
      <div className="students-header">
        <h2>ניהול מדריכים</h2>
        {canEdit && (
          <button className="btn btn-primary" onClick={openCreateModal}>
            + הוסף מדריך
          </button>
        )}
      </div>

      {error && <div className="error">{error}</div>}

      {instructors.length === 0 ? (
        <div className="empty-state">
          <p>אין מדריכים עדיין.{canEdit && ' לחץ על "הוסף מדריך" כדי להוסיף.'}</p>
        </div>
      ) : (
        <div className="students-table">
          <table>
            <thead>
              <tr>
                <th>שם</th>
                <th>אימייל</th>
                <th>טלפון</th>
                <th>קורסים</th>
                {canEdit && <th>פעולות</th>}
              </tr>
            </thead>
            <tbody>
              {instructors.map(instructor => (
                <tr
                  key={instructor.id}
                  onClick={() => openProfileModal(instructor)}
                  className="clickable-row"
                >
                  <td data-label="שם">{instructor.first_name} {instructor.last_name}</td>
                  <td data-label="אימייל">{instructor.email || '-'}</td>
                  <td data-label="טלפון">{instructor.phone || '-'}</td>
                  <td data-label="קורסים">
                    {instructor.courses && instructor.courses.length > 0 ? (
                      <div className="course-tags">
                        {instructor.courses.map((course, idx) => (
                          <span key={idx} className="course-tag">{course.name}</span>
                        ))}
                      </div>
                    ) : (
                      <span className="no-courses">-</span>
                    )}
                  </td>
                  {canEdit && (
                    <td className="actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => openEditModal(instructor)}
                      >
                        עריכה
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => openDeleteModal(instructor)}
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
            <h3>{editingInstructor ? 'עריכת מדריך' : 'הוספת מדריך'}</h3>
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
                {!editingInstructor && (
                  <small className="form-hint">המדריך ישתמש באימייל זה כדי להתחבר למערכת</small>
                )}
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
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  ביטול
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingInstructor ? 'שמור שינויים' : 'הוסף מדריך'}
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
              <h3>מחיקת מדריך</h3>
              <p>
                האם אתה בטוח שברצונך למחוק את{' '}
                <strong>{deletingInstructor.first_name} {deletingInstructor.last_name}</strong>?
                לא ניתן לבטל פעולה זו.
              </p>
              <p className="warning-text">
                פעולה זו תמחק גם את חשבון המשתמש של המדריך.
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

      {showPasswordModal && createdInstructorInfo && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="password-info">
              <h3>מדריך נוצר בהצלחה</h3>
              <p>
                נוצר חשבון משתמש עבור <strong>{createdInstructorInfo.name}</strong>
              </p>
              <div className="credentials-box">
                <div className="credential-row">
                  <span className="credential-label">אימייל:</span>
                  <span className="credential-value">{createdInstructorInfo.email}</span>
                </div>
                <div className="credential-row">
                  <span className="credential-label">סיסמה ראשונית:</span>
                  <span className="credential-value password">{createdInstructorInfo.password}</span>
                </div>
              </div>
              <p className="warning-text">
                שמור את הסיסמה הראשונית - היא לא תוצג שוב.
                <br />
                המדריך יכול לשנות את הסיסמה לאחר ההתחברות הראשונה.
              </p>
              <div className="form-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => setShowPasswordModal(false)}
                >
                  הבנתי
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showProfileModal && selectedInstructor && (
        <div className="modal-overlay" onClick={closeProfileModal}>
          <div className="modal modal-large" onClick={e => e.stopPropagation()}>
            <div className="profile-modal">
              <h3>פרופיל מדריך</h3>
              <div className="profile-details">
                <div className="profile-field">
                  <span className="profile-label">שם:</span>
                  <span className="profile-value">{selectedInstructor.first_name} {selectedInstructor.last_name}</span>
                </div>
                <div className="profile-field">
                  <span className="profile-label">אימייל:</span>
                  <span className="profile-value">{selectedInstructor.email || '-'}</span>
                </div>
                <div className="profile-field">
                  <span className="profile-label">טלפון:</span>
                  <span className="profile-value">{selectedInstructor.phone || '-'}</span>
                </div>
              </div>

              <div className="profile-evaluations">
                <h4>הערכות שבוצעו ({instructorEvaluations.length})</h4>
                {loadingProfile ? (
                  <div className="loading-small">טוען...</div>
                ) : instructorEvaluations.length === 0 ? (
                  <p className="empty-text">אין הערכות</p>
                ) : (
                  <div className="evaluations-list">
                    {instructorEvaluations.slice(0, 10).map(evaluation => (
                      <div key={evaluation.id} className="evaluation-list-item">
                        <div className="evaluation-list-info">
                          <span className="evaluation-student">
                            {evaluation.student_first_name} {evaluation.student_last_name}
                          </span>
                          <span className="evaluation-subject">{evaluation.subject_name}</span>
                          {evaluation.lesson_name && (
                            <span className="evaluation-lesson">{evaluation.lesson_name}</span>
                          )}
                        </div>
                        <div className="evaluation-list-meta">
                          <span className="evaluation-date">{formatDate(evaluation.evaluation_date)}</span>
                          <span
                            className="evaluation-score"
                            style={{
                              color: evaluation.is_passing && !evaluation.has_critical_fail ? '#28a745' : '#dc3545'
                            }}
                          >
                            {Math.round(evaluation.percentage_score)}%
                          </span>
                        </div>
                      </div>
                    ))}
                    {instructorEvaluations.length > 10 && (
                      <p className="more-text">ועוד {instructorEvaluations.length - 10} הערכות...</p>
                    )}
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button className="btn btn-primary" onClick={closeProfileModal}>
                  סגור
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageInstructors;
