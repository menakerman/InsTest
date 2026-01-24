import { useState, useEffect } from 'react';
import { useAuth } from '../contexts';
import { getStudents, createStudent, updateStudent, deleteStudent, getExternalTests, saveExternalTests, getStudentSkills, saveStudentSkills } from '../utils/api';

function ManageStudents() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showExternalTestsModal, setShowExternalTestsModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [externalTestsLoading, setExternalTestsLoading] = useState(false);
  const [externalTestsSaving, setExternalTestsSaving] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [deletingStudent, setDeletingStudent] = useState(null);
  const [externalTestsData, setExternalTestsData] = useState({
    physics_score: '',
    physiology_score: '',
    eye_contact_score: '',
    equipment_score: '',
    decompression_score: ''
  });
  const [skillsData, setSkillsData] = useState({
    meters_30: false,
    meters_40: false,
    guidance: false
  });
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

  const openExternalTestsModal = async (student) => {
    setSelectedStudent(student);
    setShowExternalTestsModal(true);
    setExternalTestsLoading(true);
    try {
      const [testsData, skillsResult] = await Promise.all([
        getExternalTests(student.id),
        getStudentSkills(student.id)
      ]);
      setExternalTestsData({
        physics_score: testsData.physics_score ?? '',
        physiology_score: testsData.physiology_score ?? '',
        eye_contact_score: testsData.eye_contact_score ?? '',
        equipment_score: testsData.equipment_score ?? '',
        decompression_score: testsData.decompression_score ?? ''
      });
      setSkillsData({
        meters_30: skillsResult.meters_30 || false,
        meters_40: skillsResult.meters_40 || false,
        guidance: skillsResult.guidance || false
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setExternalTestsLoading(false);
    }
  };

  const closeExternalTestsModal = () => {
    setShowExternalTestsModal(false);
    setSelectedStudent(null);
    setExternalTestsData({
      physics_score: '',
      physiology_score: '',
      eye_contact_score: '',
      equipment_score: '',
      decompression_score: ''
    });
    setSkillsData({
      meters_30: false,
      meters_40: false,
      guidance: false
    });
  };

  const handleExternalTestChange = (e) => {
    const { name, value } = e.target;
    // Allow empty string or numbers 0-100
    if (value === '' || (parseFloat(value) >= 0 && parseFloat(value) <= 100)) {
      setExternalTestsData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSkillChange = (e) => {
    const { name, checked } = e.target;
    setSkillsData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSaveExternalTests = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;

    try {
      setExternalTestsSaving(true);
      await Promise.all([
        saveExternalTests(selectedStudent.id, {
          physics_score: externalTestsData.physics_score === '' ? null : parseFloat(externalTestsData.physics_score),
          physiology_score: externalTestsData.physiology_score === '' ? null : parseFloat(externalTestsData.physiology_score),
          eye_contact_score: externalTestsData.eye_contact_score === '' ? null : parseFloat(externalTestsData.eye_contact_score),
          equipment_score: externalTestsData.equipment_score === '' ? null : parseFloat(externalTestsData.equipment_score),
          decompression_score: externalTestsData.decompression_score === '' ? null : parseFloat(externalTestsData.decompression_score)
        }),
        saveStudentSkills(selectedStudent.id, skillsData)
      ]);
      closeExternalTestsModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setExternalTestsSaving(false);
    }
  };

  const calculateAverageScore = () => {
    const scores = [
      externalTestsData.physics_score,
      externalTestsData.physiology_score,
      externalTestsData.eye_contact_score,
      externalTestsData.equipment_score,
      externalTestsData.decompression_score
    ].filter(s => s !== '' && s !== null && s !== undefined).map(s => parseFloat(s));

    if (scores.length === 0) return null;
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return avg.toFixed(1);
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
                <tr key={student.id} className="clickable-row" onClick={() => openExternalTestsModal(student)}>
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
                    <td className="actions" onClick={(e) => e.stopPropagation()}>
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

      {showExternalTestsModal && selectedStudent && (
        <div className="modal-overlay" onClick={closeExternalTestsModal}>
          <div className="modal modal-large" onClick={e => e.stopPropagation()}>
            <h3>מבחנים חיצוניים - {selectedStudent.first_name} {selectedStudent.last_name}</h3>
            {externalTestsLoading ? (
              <div className="loading-small">טוען נתונים...</div>
            ) : (
              <form onSubmit={handleSaveExternalTests}>
                <div className="external-tests-grid">
                  <div className="form-group">
                    <label htmlFor="physics_score">פיזיקה</label>
                    <div className="score-input-wrapper">
                      <input
                        type="number"
                        id="physics_score"
                        name="physics_score"
                        value={externalTestsData.physics_score}
                        onChange={handleExternalTestChange}
                        min="0"
                        max="100"
                        step="0.1"
                        placeholder="0-100"
                        disabled={!canEdit}
                      />
                      <span className="score-suffix">%</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="physiology_score">פיזיולוגיה</label>
                    <div className="score-input-wrapper">
                      <input
                        type="number"
                        id="physiology_score"
                        name="physiology_score"
                        value={externalTestsData.physiology_score}
                        onChange={handleExternalTestChange}
                        min="0"
                        max="100"
                        step="0.1"
                        placeholder="0-100"
                        disabled={!canEdit}
                      />
                      <span className="score-suffix">%</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="eye_contact_score">קשר עין</label>
                    <div className="score-input-wrapper">
                      <input
                        type="number"
                        id="eye_contact_score"
                        name="eye_contact_score"
                        value={externalTestsData.eye_contact_score}
                        onChange={handleExternalTestChange}
                        min="0"
                        max="100"
                        step="0.1"
                        placeholder="0-100"
                        disabled={!canEdit}
                      />
                      <span className="score-suffix">%</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="equipment_score">ציוד</label>
                    <div className="score-input-wrapper">
                      <input
                        type="number"
                        id="equipment_score"
                        name="equipment_score"
                        value={externalTestsData.equipment_score}
                        onChange={handleExternalTestChange}
                        min="0"
                        max="100"
                        step="0.1"
                        placeholder="0-100"
                        disabled={!canEdit}
                      />
                      <span className="score-suffix">%</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="decompression_score">דקומפרסיה</label>
                    <div className="score-input-wrapper">
                      <input
                        type="number"
                        id="decompression_score"
                        name="decompression_score"
                        value={externalTestsData.decompression_score}
                        onChange={handleExternalTestChange}
                        min="0"
                        max="100"
                        step="0.1"
                        placeholder="0-100"
                        disabled={!canEdit}
                      />
                      <span className="score-suffix">%</span>
                    </div>
                  </div>
                </div>

                <div className="external-tests-average">
                  <span className="average-label">ממוצע:</span>
                  <span className="average-value">
                    {calculateAverageScore() !== null ? `${calculateAverageScore()}%` : '-'}
                  </span>
                </div>

                <div className="skills-section">
                  <h4>מיומנויות</h4>
                  <div className="skills-grid">
                    <label className="skill-checkbox">
                      <input
                        type="checkbox"
                        name="meters_30"
                        checked={skillsData.meters_30}
                        onChange={handleSkillChange}
                        disabled={!canEdit}
                      />
                      <span className="skill-label">30 מטר</span>
                    </label>

                    <label className="skill-checkbox">
                      <input
                        type="checkbox"
                        name="meters_40"
                        checked={skillsData.meters_40}
                        onChange={handleSkillChange}
                        disabled={!canEdit}
                      />
                      <span className="skill-label">40 מטר</span>
                    </label>

                    <label className="skill-checkbox">
                      <input
                        type="checkbox"
                        name="guidance"
                        checked={skillsData.guidance}
                        onChange={handleSkillChange}
                        disabled={!canEdit}
                      />
                      <span className="skill-label">הובלה</span>
                    </label>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={closeExternalTestsModal}>
                    {canEdit ? 'ביטול' : 'סגור'}
                  </button>
                  {canEdit && (
                    <button type="submit" className="btn btn-primary" disabled={externalTestsSaving}>
                      {externalTestsSaving ? 'שומר...' : 'שמור'}
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageStudents;
