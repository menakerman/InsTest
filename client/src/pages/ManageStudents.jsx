import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts';
import { getStudents, createStudent, updateStudent, deleteStudent, getExternalTests, saveExternalTests, getStudentSkills, saveStudentSkills, getCourses, getEvaluations, uploadStudentPhoto, deleteStudentPhoto, getTestStructure, getStudentTests, saveStudentTests } from '../utils/api';
import CourseMultiSelect from '../components/CourseMultiSelect';
import {
  EXTERNAL_TESTS_PASSING_THRESHOLD,
  isInInstructorCourse,
  getExternalTestsStatusColor,
  getExternalTestsStatusText,
  calculateRetakeRecommendations
} from '../utils/externalTestsCalculations';

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
    unit_id: '',
    id_number: '',
    course_ids: []
  });
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [evaluationScores, setEvaluationScores] = useState({
    intro_dive: null,      // צלילת הכרות
    pre_dive_briefing: null, // תדריך
    equipment_lesson: null   // ציוד
  });
  const [photoUploading, setPhotoUploading] = useState(false);
  const photoInputRef = useRef(null);
  const [testStructures, setTestStructures] = useState({});
  const [studentTestScores, setStudentTestScores] = useState([]);
  const [editingScores, setEditingScores] = useState({});
  const [savingScores, setSavingScores] = useState({});

  // Check if user can edit (admin only)
  const canEdit = user && user.role === 'admin';

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

  const handleCourseIdsChange = (newIds) => {
    setFormData(prev => ({ ...prev, course_ids: newIds }));
  };

  const fetchCourses = async () => {
    try {
      setCoursesLoading(true);
      const data = await getCourses();
      setCourses(data);
    } catch (err) {
      console.error('Error fetching courses:', err);
    } finally {
      setCoursesLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingStudent(null);
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      unit_id: '',
      id_number: '',
      course_ids: []
    });
    fetchCourses();
    setShowModal(true);
  };

  const openEditModal = (student) => {
    setEditingStudent(student);
    setFormData({
      first_name: student.first_name,
      last_name: student.last_name,
      email: student.email,
      phone: student.phone || '',
      unit_id: student.unit_id || '',
      id_number: student.id_number || '',
      course_ids: student.courses ? student.courses.map(c => c.id) : []
    });
    fetchCourses();
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
    setEditingScores({});
    try {
      const [testsData, skillsResult, evaluationsData, certTestScores] = await Promise.all([
        getExternalTests(student.id),
        getStudentSkills(student.id),
        getEvaluations({ student_id: student.id }),
        getStudentTests(student.id)
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
      setStudentTestScores(certTestScores);

      // Load test structures for student's courses
      if (student.courses && student.courses.length > 0) {
        const courseTypes = [...new Set(student.courses.map(c => c.course_type).filter(Boolean))];
        const structures = { ...testStructures };
        for (const courseType of courseTypes) {
          if (!structures[courseType]) {
            try {
              structures[courseType] = await getTestStructure(courseType);
            } catch (err) {
              console.error(`Failed to load test structure for ${courseType}:`, err);
              structures[courseType] = [];
            }
          }
        }
        setTestStructures(structures);
      }

      // Process evaluations to find highest score for each lesson type
      const lessonTypes = ['intro_dive', 'pre_dive_briefing', 'equipment_lesson'];
      const bestScores = {};
      lessonTypes.forEach(type => {
        const typeEvaluations = evaluationsData.filter(e => e.subject_code === type);
        if (typeEvaluations.length > 0) {
          const best = typeEvaluations.reduce((max, e) =>
            e.percentage_score > max.percentage_score ? e : max
          );
          bestScores[type] = {
            score: best.percentage_score,
            is_passing: best.is_passing,
            date: best.evaluation_date
          };
        } else {
          bestScores[type] = null;
        }
      });
      setEvaluationScores(bestScores);
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
    setEvaluationScores({
      intro_dive: null,
      pre_dive_briefing: null,
      equipment_lesson: null
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

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedStudent) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('ניתן להעלות קבצי תמונה בלבד (jpeg, png, gif, webp)');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('גודל הקובץ המקסימלי הוא 5MB');
      return;
    }

    try {
      setPhotoUploading(true);
      const result = await uploadStudentPhoto(selectedStudent.id, file);
      // Update selected student with new photo URL
      setSelectedStudent(prev => ({ ...prev, photo_url: result.photo_url }));
      // Update students list
      setStudents(prev => prev.map(s =>
        s.id === selectedStudent.id ? { ...s, photo_url: result.photo_url } : s
      ));
    } catch (err) {
      setError(err.message);
    } finally {
      setPhotoUploading(false);
      // Reset file input
      if (photoInputRef.current) {
        photoInputRef.current.value = '';
      }
    }
  };

  const handlePhotoDelete = async () => {
    if (!selectedStudent?.photo_url) return;

    if (!window.confirm('האם למחוק את תמונת החניך?')) return;

    try {
      setPhotoUploading(true);
      await deleteStudentPhoto(selectedStudent.id);
      // Update selected student
      setSelectedStudent(prev => ({ ...prev, photo_url: null }));
      // Update students list
      setStudents(prev => prev.map(s =>
        s.id === selectedStudent.id ? { ...s, photo_url: null } : s
      ));
    } catch (err) {
      setError(err.message);
    } finally {
      setPhotoUploading(false);
    }
  };

  // Certification test score handlers
  const handleCertScoreChange = (testTypeId, value) => {
    const key = `${testTypeId}`;
    setEditingScores(prev => ({ ...prev, [key]: value }));
  };

  const handleCertScoreBlur = async (testTypeId) => {
    if (!selectedStudent) return;
    const key = `${testTypeId}`;
    const value = editingScores[key];

    if (value === undefined || value === '') return;

    setSavingScores(prev => ({ ...prev, [key]: true }));
    try {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
        const scoreData = {
          test_type_id: testTypeId,
          score: Math.round(numValue),
          passed: numValue >= 60
        };
        await saveStudentTests(selectedStudent.id, [scoreData]);
        // Refresh scores
        const scores = await getStudentTests(selectedStudent.id);
        setStudentTestScores(scores);
        setEditingScores(prev => {
          const newState = { ...prev };
          delete newState[key];
          return newState;
        });
      }
    } catch (err) {
      console.error('Failed to save score:', err);
    } finally {
      setSavingScores(prev => ({ ...prev, [key]: false }));
    }
  };

  const getCertEditingValue = (testTypeId, currentValue) => {
    const key = `${testTypeId}`;
    return editingScores[key] !== undefined ? editingScores[key] : currentValue;
  };

  const getTestScoreDisplay = (testTypeId, scoreType) => {
    const score = studentTestScores.find(s => s.test_type_id === testTypeId);
    if (!score) {
      return { display: '-', color: '#999', passed: null, value: '' };
    }
    const passed = score.score >= 60;
    return {
      display: score.score !== null ? `${Math.round(score.score)}` : '-',
      color: passed ? '#28a745' : '#dc3545',
      passed,
      value: score.score !== null ? Math.round(score.score).toString() : ''
    };
  };

  // Calculate average for מבחנים עיוניים category
  const calculateTheoryTestsAverage = (tests) => {
    if (!tests || tests.length === 0) return null;

    const scores = tests.map(test => {
      const scoreRecord = studentTestScores.find(s => s.test_type_id === test.id);
      if (scoreRecord && scoreRecord.score !== null && scoreRecord.score !== undefined) {
        return parseFloat(scoreRecord.score);
      }
      return null;
    }).filter(s => s !== null && !isNaN(s));

    if (scores.length === 0) return null;
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return avg.toFixed(1);
  };

  // Calculate recommendations for improving מבחנים עיוניים average
  const calculateTheoryTestsRecommendations = (tests) => {
    if (!tests || tests.length === 0) return [];

    const testNames = {
      'ext_physics': 'פיזיקה',
      'ext_physiology': 'פיזיולוגיה',
      'ext_eye_contact': 'קשר עין',
      'ext_equipment': 'ציוד',
      'ext_decompression': 'דקומפרסיה'
    };

    const scoresWithTests = tests.map(test => {
      const score = studentTestScores.find(s => s.test_type_id === test.id);
      return {
        testCode: test.code,
        testName: test.name_he || testNames[test.code] || test.code,
        currentScore: score?.score ?? null
      };
    }).filter(s => s.currentScore !== null && s.currentScore < 100);

    // Sort by current score (lowest first) to prioritize improvements
    scoresWithTests.sort((a, b) => a.currentScore - b.currentScore);

    return scoresWithTests.slice(0, 3).map(item => ({
      testName: item.testName,
      currentScore: Math.round(item.currentScore),
      targetScore: Math.min(100, Math.round(item.currentScore) + 10),
      improvement: 10
    }));
  };

  const renderCertificationSections = (courseType) => {
    const structure = testStructures[courseType];
    if (!structure || structure.length === 0) {
      if (courseType === 'קרוסאובר') {
        return (
          <div className="certification-section empty-section">
            <p className="empty-message">מבנה הבחינות לקרוסאובר יוגדר בהמשך</p>
          </div>
        );
      }
      return null;
    }

    return (
      <div className="certification-sections-compact">
        {structure.map(category => {
          const isTheoryTests = category.category_code === 'instructor_external_tests' || category.category_name === 'מבחנים עיוניים';
          const theoryAverage = isTheoryTests ? calculateTheoryTestsAverage(category.tests) : null;
          const theoryRecommendations = isTheoryTests && theoryAverage !== null && parseFloat(theoryAverage) < EXTERNAL_TESTS_PASSING_THRESHOLD
            ? calculateTheoryTestsRecommendations(category.tests)
            : [];

          return (
            <div key={category.category_id} className="certification-category-block">
              <div className="certification-row">
                <span className="category-label">{category.category_name}:</span>
                <div className="category-tests-inline">
                  {category.tests && category.tests.map((test, idx) => {
                    const scoreDisplay = getTestScoreDisplay(test.id, test.score_type);
                    const key = `${test.id}`;
                    const isSaving = savingScores[key];
                    const editValue = getCertEditingValue(test.id, scoreDisplay.value);

                    return (
                      <span key={test.id} className="test-item-inline">
                        <span className="test-name-inline">{test.name_he}</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          className={`test-score-input ${scoreDisplay.passed === false ? 'score-fail' : scoreDisplay.passed === true ? 'score-pass' : ''}`}
                          value={editValue}
                          disabled={isSaving || !canEdit}
                          onChange={(e) => handleCertScoreChange(test.id, e.target.value)}
                          onBlur={() => handleCertScoreBlur(test.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        {!editValue && <span className="empty-score-indicator">-</span>}
                        {idx < category.tests.length - 1 && <span className="test-separator">|</span>}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Average and recommendations for מבחנים עיוניים */}
              {isTheoryTests && theoryAverage !== null && (
                <div className="theory-tests-summary">
                  <div className="external-tests-average">
                    <span className="average-label">ממוצע:</span>
                    <span className="average-value">{theoryAverage}%</span>
                  </div>

                  {selectedStudent && isInInstructorCourse(selectedStudent.courses) && (
                    <div className="external-tests-status-section">
                      <div className="status-row">
                        <span className="status-label">סטטוס:</span>
                        <span className={`status-badge external-tests-status ${getExternalTestsStatusColor(parseFloat(theoryAverage))}`}>
                          {getExternalTestsStatusText(parseFloat(theoryAverage))}
                        </span>
                        <span className="threshold-indicator">סף מעבר: {EXTERNAL_TESTS_PASSING_THRESHOLD}%</span>
                      </div>

                      {theoryRecommendations.length > 0 && (
                        <div className="retake-recommendations">
                          <h5>המלצות לשיפור הממוצע:</h5>
                          {theoryRecommendations.map((rec, index) => (
                            <div key={index} className="recommendation-item">
                              <span className="recommendation-bullet">•</span>
                              <span className="recommendation-text">
                                {rec.testName}: שפר מ-{rec.currentScore} ל-{rec.targetScore} (+{rec.improvement} נקודות)
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return <div className="loading">טוען חניכים...</div>;
  }

  return (
    <div className="students-page">
      <div className="students-header">
        <h2>ניהול חניכים</h2>
        {canEdit && (
          <button className="btn btn-primary" onClick={openCreateModal}>
            + הוסף חניך
          </button>
        )}
      </div>

      {error && <div className="error">{error}</div>}

      {students.length === 0 ? (
        <div className="empty-state">
          <p>אין חניכים עדיין.{canEdit && ' לחץ על "הוסף חניך" כדי להוסיף.'}</p>
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
                <th>מספר יחידה</th>
                <th>קורסים</th>
                {canEdit && <th>פעולות</th>}
              </tr>
            </thead>
            <tbody>
              {students.map(student => (
                <tr key={student.id} className="clickable-row" onClick={() => openExternalTestsModal(student)}>
                  <td data-label="שם">{student.first_name} {student.last_name}</td>
                  <td data-label="ת.ז.">{student.id_number || '-'}</td>
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
            <h3>{editingStudent ? 'עריכת חניך' : 'הוספת חניך'}</h3>
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
                <label htmlFor="id_number">מספר תעודת זהות *</label>
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
              <div className="form-group">
                <label>קורסים</label>
                <CourseMultiSelect
                  courses={courses}
                  selectedIds={formData.course_ids}
                  onChange={handleCourseIdsChange}
                  loading={coursesLoading}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  ביטול
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingStudent ? 'שמור שינויים' : 'הוסף חניך'}
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
              <h3>מחיקת חניך</h3>
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
            <div className="student-details-header">
              <div className="student-photo-section">
                {selectedStudent.photo_url ? (
                  <img
                    src={`http://localhost:3001${selectedStudent.photo_url}`}
                    alt={`${selectedStudent.first_name} ${selectedStudent.last_name}`}
                    className="student-photo"
                  />
                ) : (
                  <img
                    src="/tidf-logo.png"
                    alt="TIDF Logo"
                    className="student-photo student-photo-placeholder-logo"
                  />
                )}
                {canEdit && (
                  <div className="photo-actions">
                    <input
                      type="file"
                      ref={photoInputRef}
                      onChange={handlePhotoUpload}
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => photoInputRef.current?.click()}
                      disabled={photoUploading}
                    >
                      {photoUploading ? 'מעלה...' : (selectedStudent.photo_url ? 'החלף תמונה' : 'העלה תמונה')}
                    </button>
                    {selectedStudent.photo_url && (
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={handlePhotoDelete}
                        disabled={photoUploading}
                      >
                        מחק
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="student-details-info">
                <h3>{selectedStudent.first_name} {selectedStudent.last_name}</h3>
                {selectedStudent.id_number && <p className="student-id-number">ת.ז.: {selectedStudent.id_number}</p>}
              </div>
            </div>
            {externalTestsLoading ? (
              <div className="loading-small">טוען נתונים...</div>
            ) : (
              <form onSubmit={handleSaveExternalTests}>
                {/* Certification Tests Section */}
                {selectedStudent.courses && selectedStudent.courses.length > 0 && (
                  <div className="certification-tests-section">
                    <h4 className="section-title">ציוני מבחנים</h4>
                    {[...new Set(selectedStudent.courses.map(c => c.course_type).filter(Boolean))].map(courseType => (
                      <div key={courseType} className="course-type-tests">
                        {renderCertificationSections(courseType)}
                      </div>
                    ))}
                  </div>
                )}

                {/* Skills section - only for מדריך עוזר courses */}
                {selectedStudent?.courses?.some(c => c.course_type === 'מדריך_עוזר' || c.course_type === 'מדריך_עוזר_משולב_עם_מדריך') && (
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
                )}

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
