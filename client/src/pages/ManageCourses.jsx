import { useState, useEffect } from 'react';
import { useAuth } from '../contexts';
import { getCourses, getCourse, createCourse, updateCourse, deleteCourse, getStudents, getInstructors, exportFinalReport } from '../utils/api';
import StudentMultiSelect from '../components/StudentMultiSelect';
import InstructorMultiSelect from '../components/InstructorMultiSelect';

const courseTypeOptions = [
  { value: 'מדריך_עוזר', label: 'מדריך עוזר' },
  { value: 'מדריך', label: 'מדריך' },
  { value: 'מדריך_עוזר_משולב_עם_מדריך', label: 'מדריך עוזר משולב עם מדריך' },
  { value: 'קרוסאובר', label: 'קרוסאובר' }
];

function ManageCourses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [instructorsLoading, setInstructorsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [deletingCourse, setDeletingCourse] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    course_type: 'מדריך',
    start_date: '',
    end_date: '',
    description: '',
    student_ids: [],
    instructor_ids: []
  });

  // Check permissions - only admin can create/edit courses
  const isAdmin = user && user.role === 'admin';
  const canEdit = isAdmin;
  const canDelete = isAdmin;

  useEffect(() => {
    fetchCourses();
    if (isAdmin) {
      fetchStudents();
      fetchInstructors();
    }
  }, [isAdmin]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const data = await getCourses();
      setCourses(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      setStudentsLoading(true);
      const data = await getStudents();
      setStudents(data);
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setStudentsLoading(false);
    }
  };

  const fetchInstructors = async () => {
    try {
      setInstructorsLoading(true);
      const data = await getInstructors();
      setInstructors(data);
    } catch (err) {
      console.error('Error fetching instructors:', err);
    } finally {
      setInstructorsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStudentIdsChange = (newIds) => {
    setFormData(prev => ({ ...prev, student_ids: newIds }));
  };

  const handleInstructorIdsChange = (newIds) => {
    setFormData(prev => ({ ...prev, instructor_ids: newIds }));
  };

  const openCreateModal = () => {
    setEditingCourse(null);
    setFormData({
      name: '',
      course_type: 'מדריך',
      start_date: '',
      end_date: '',
      description: '',
      student_ids: [],
      instructor_ids: []
    });
    setShowModal(true);
  };

  const openEditModal = async (course) => {
    try {
      // Fetch full course data with students and instructors
      const fullCourse = await getCourse(course.id);
      setEditingCourse(fullCourse);
      setFormData({
        name: fullCourse.name,
        course_type: fullCourse.course_type,
        start_date: fullCourse.start_date.split('T')[0],
        end_date: fullCourse.end_date.split('T')[0],
        description: fullCourse.description || '',
        student_ids: fullCourse.students ? fullCourse.students.map(s => s.id) : [],
        instructor_ids: fullCourse.instructors ? fullCourse.instructors.map(i => i.id) : []
      });
      setShowModal(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const openDeleteModal = (course) => {
    setDeletingCourse(course);
    setShowDeleteModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCourse(null);
    setError(null);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingCourse(null);
  };

  const openDetailsModal = async (course) => {
    setShowDetailsModal(true);
    setDetailsLoading(true);
    try {
      const fullCourse = await getCourse(course.id);
      setSelectedCourse(fullCourse);
    } catch (err) {
      setError(err.message);
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedCourse(null);
  };

  const handleExportCourseReport = async () => {
    if (!selectedCourse) return;
    try {
      setExporting(true);
      await exportFinalReport(selectedCourse.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCourse) {
        await updateCourse(editingCourse.id, formData);
      } else {
        await createCourse(formData);
      }
      await fetchCourses();
      closeModal();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCourse(deletingCourse.id);
      await fetchCourses();
      closeDeleteModal();
    } catch (err) {
      setError(err.message);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL');
  };

  const getCourseTypeBadgeClass = (courseType) => {
    switch (courseType) {
      case 'מדריך_עוזר':
        return 'course-type-badge assistant';
      case 'מדריך':
        return 'course-type-badge instructor';
      case 'מדריך_עוזר_משולב_עם_מדריך':
        return 'course-type-badge combined';
      default:
        return 'course-type-badge';
    }
  };

  if (loading) {
    return <div className="loading">טוען קורסים...</div>;
  }

  return (
    <div className="courses-page">
      <div className="page-header">
        <h2>ניהול קורסים</h2>
        {canEdit && (
          <button className="btn btn-primary" onClick={openCreateModal}>
            + הוסף קורס
          </button>
        )}
      </div>

      {error && <div className="error">{error}</div>}

      {courses.length === 0 ? (
        <div className="empty-state">
          <p>אין קורסים עדיין.{canEdit && ' לחץ על "הוסף קורס" כדי להוסיף.'}</p>
        </div>
      ) : (
        <div className="courses-table">
          <table>
            <thead>
              <tr>
                <th>שם הקורס</th>
                <th>סוג קורס</th>
                <th>תאריך התחלה</th>
                <th>תאריך סיום</th>
                <th>מספר חניכים</th>
                <th>סטטוס</th>
                {(canEdit || canDelete) && <th>פעולות</th>}
              </tr>
            </thead>
            <tbody>
              {courses.map(course => (
                <tr key={course.id} className="clickable-row" onClick={() => openDetailsModal(course)}>
                  <td data-label="שם הקורס">{course.name}</td>
                  <td data-label="סוג קורס">
                    <span className={getCourseTypeBadgeClass(course.course_type)}>
                      {course.course_type_label}
                    </span>
                  </td>
                  <td data-label="תאריך התחלה">{formatDate(course.start_date)}</td>
                  <td data-label="תאריך סיום">{formatDate(course.end_date)}</td>
                  <td data-label="מספר חניכים">
                    <span className="student-count-badge">{course.student_count}</span>
                  </td>
                  <td data-label="סטטוס">
                    <span className={`status-badge ${course.is_active ? 'active' : 'inactive'}`}>
                      {course.is_active ? 'פעיל' : 'לא פעיל'}
                    </span>
                  </td>
                  {(canEdit || canDelete) && (
                    <td className="actions" onClick={(e) => e.stopPropagation()}>
                      {canEdit && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => openEditModal(course)}
                        >
                          עריכה
                        </button>
                      )}
                      {canDelete && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => openDeleteModal(course)}
                        >
                          מחיקה
                        </button>
                      )}
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
          <div className="modal modal-large" onClick={e => e.stopPropagation()}>
            <h3>{editingCourse ? 'עריכת קורס' : 'הוספת קורס'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">שם הקורס *</label>
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
                <label htmlFor="course_type">סוג קורס *</label>
                <select
                  id="course_type"
                  name="course_type"
                  value={formData.course_type}
                  onChange={handleInputChange}
                  className="form-select"
                  required
                >
                  {courseTypeOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="start_date">תאריך התחלה *</label>
                  <input
                    type="date"
                    id="start_date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="end_date">תאריך סיום *</label>
                  <input
                    type="date"
                    id="end_date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    min={formData.start_date}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>חניכים</label>
                <StudentMultiSelect
                  students={students}
                  selectedIds={formData.student_ids}
                  onChange={handleStudentIdsChange}
                  loading={studentsLoading}
                />
              </div>

              <div className="form-group">
                <label>מדריכים</label>
                <InstructorMultiSelect
                  instructors={instructors}
                  selectedIds={formData.instructor_ids}
                  onChange={handleInstructorIdsChange}
                  loading={instructorsLoading}
                />
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

              {editingCourse && (
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active !== false}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    />
                    קורס פעיל
                  </label>
                </div>
              )}

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  ביטול
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCourse ? 'שמור שינויים' : 'הוסף קורס'}
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
              <h3>מחיקת קורס</h3>
              <p>
                האם אתה בטוח שברצונך למחוק את הקורס{' '}
                <strong>{deletingCourse.name}</strong>?
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

      {showDetailsModal && (
        <div className="modal-overlay" onClick={closeDetailsModal}>
          <div className="modal modal-large" onClick={e => e.stopPropagation()}>
            {detailsLoading ? (
              <div className="loading-small">טוען פרטי קורס...</div>
            ) : selectedCourse ? (
              <div className="course-detail-modal">
                <h3>פרטי קורס</h3>

                <div className="course-detail-header">
                  <div className="course-detail-info">
                    <div className="detail-field">
                      <span className="detail-label">שם הקורס:</span>
                      <span className="detail-value">{selectedCourse.name}</span>
                    </div>
                    <div className="detail-field">
                      <span className="detail-label">סוג קורס:</span>
                      <span className="detail-value">
                        <span className={getCourseTypeBadgeClass(selectedCourse.course_type)}>
                          {courseTypeOptions.find(opt => opt.value === selectedCourse.course_type)?.label || selectedCourse.course_type}
                        </span>
                      </span>
                    </div>
                    <div className="detail-field">
                      <span className="detail-label">תאריך התחלה:</span>
                      <span className="detail-value">{formatDate(selectedCourse.start_date)}</span>
                    </div>
                    <div className="detail-field">
                      <span className="detail-label">תאריך סיום:</span>
                      <span className="detail-value">{formatDate(selectedCourse.end_date)}</span>
                    </div>
                    <div className="detail-field">
                      <span className="detail-label">סטטוס:</span>
                      <span className="detail-value">
                        <span className={`status-badge ${selectedCourse.is_active ? 'active' : 'inactive'}`}>
                          {selectedCourse.is_active ? 'פעיל' : 'לא פעיל'}
                        </span>
                      </span>
                    </div>
                    {selectedCourse.description && (
                      <div className="detail-field">
                        <span className="detail-label">תיאור:</span>
                        <span className="detail-value">{selectedCourse.description}</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedCourse.instructors && selectedCourse.instructors.length > 0 && (
                  <div className="course-detail-students">
                    <h4>מדריכים ({selectedCourse.instructors.length})</h4>
                    <div className="students-list">
                      {selectedCourse.instructors.map(instructor => (
                        <div key={instructor.id} className="student-item">
                          <span className="student-name">
                            {instructor.first_name} {instructor.last_name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedCourse.students && selectedCourse.students.length > 0 && (
                  <div className="course-detail-students">
                    <h4>חניכים ({selectedCourse.students.length})</h4>
                    <div className="students-list">
                      {selectedCourse.students.map(student => (
                        <div key={student.id} className="student-item">
                          <span className="student-name">
                            {student.first_name} {student.last_name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="form-actions">
                  <button
                    className="btn btn-success"
                    onClick={handleExportCourseReport}
                    disabled={exporting}
                  >
                    {exporting ? 'מייצא...' : 'יצוא דוח Excel'}
                  </button>
                  {canEdit && (
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        closeDetailsModal();
                        openEditModal(selectedCourse);
                      }}
                    >
                      עריכה
                    </button>
                  )}
                  <button className="btn btn-primary" onClick={closeDetailsModal}>
                    סגור
                  </button>
                </div>
              </div>
            ) : (
              <div className="error">שגיאה בטעינת הנתונים</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageCourses;
