import { useState, useEffect } from 'react';
import { useAuth } from '../contexts';
import { getInstructors, createInstructor, updateInstructor, deleteInstructor, getEvaluations, getCourses } from '../utils/api';

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
    id_number: '',
    password: '',
    role: 'instructor',
    instructor_number: '',
    is_active: true,
    course_id: ''
  });
  const [courses, setCourses] = useState([]);

  // Only admin can edit instructors
  const canEdit = user && user.role === 'admin';

  useEffect(() => {
    fetchInstructors();
    fetchCourses();
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

  const fetchCourses = async () => {
    try {
      const data = await getCourses();
      setCourses(data.filter(c => c.is_active));
    } catch (err) {
      console.error('Error fetching courses:', err);
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
      id_number: '',
      password: '',
      role: 'instructor',
      instructor_number: '',
      is_active: true,
      course_id: ''
    });
    setError(null);
    setShowModal(true);
  };

  const openEditModal = (instructor) => {
    setEditingInstructor(instructor);
    setFormData({
      first_name: instructor.first_name,
      last_name: instructor.last_name,
      email: instructor.email || '',
      id_number: instructor.id_number || '',
      password: '',
      role: instructor.role || 'instructor',
      instructor_number: instructor.instructor_number || '',
      is_active: instructor.is_active ?? true,
      course_id: instructor.course_id || ''
    });
    setError(null);
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
                <th>ת.ז.</th>
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
                  <td data-label="ת.ז.">{instructor.id_number || '-'}</td>
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
              {error && <div className="error">{error}</div>}

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="first_name">שם פרטי</label>
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
                  <label htmlFor="last_name">שם משפחה</label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
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
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="id_number">תעודת זהות</label>
                <input
                  type="text"
                  id="id_number"
                  name="id_number"
                  value={formData.id_number}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">
                  {editingInstructor ? 'סיסמה חדשה (השאר ריק לשמירה על הקיימת)' : 'סיסמה'}
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required={!editingInstructor}
                  minLength={editingInstructor ? 0 : 6}
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
                    onChange={handleInputChange}
                    className="form-select"
                  >
                    <option value="instructor">מדריך</option>
                    <option value="tester">בוחן</option>
                  </select>
                </div>

                <div className="form-group checkbox-group-aligned">
                  <label className="checkbox-label-aligned">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    />
                    משתמש פעיל
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="instructor_number">מספר מדריך</label>
                <input
                  type="number"
                  id="instructor_number"
                  name="instructor_number"
                  value={formData.instructor_number}
                  onChange={handleInputChange}
                  min="1"
                  max="100000"
                  placeholder="1-100000"
                />
              </div>

              <div className="form-group">
                <label htmlFor="course_id">קורס משויך</label>
                <select
                  id="course_id"
                  name="course_id"
                  value={formData.course_id}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="">בחר קורס...</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {editingInstructor ? 'שמור שינויים' : 'הוסף מדריך'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  ביטול
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
                  <span className="profile-label">ת.ז.:</span>
                  <span className="profile-value">{selectedInstructor.id_number || '-'}</span>
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
