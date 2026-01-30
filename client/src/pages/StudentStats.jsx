import { useState, useEffect } from 'react';
import { getEvaluations, getEvaluation, getStudents, getCourses, exportFinalReport, getTestStructure, getStudentTests, saveStudentTests } from '../utils/api';
import { formatPercentage, getStatusColor, getStatusText, SCORE_VALUES } from '../utils/scoreCalculations';

function StudentStats() {
  const [evaluations, setEvaluations] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [exportingCourseId, setExportingCourseId] = useState(null);
  const [sortConfig, setSortConfig] = useState({ field: 'date', direction: 'desc' });
  const [testStructures, setTestStructures] = useState({});
  const [studentTestScores, setStudentTestScores] = useState({});
  const [loadingStudentTests, setLoadingStudentTests] = useState({});
  const [editingScores, setEditingScores] = useState({});
  const [savingScores, setSavingScores] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [evaluationsData, studentsData, coursesData] = await Promise.all([
        getEvaluations(),
        getStudents(),
        getCourses()
      ]);
      setEvaluations(evaluationsData);
      setStudents(studentsData);
      setCourses(coursesData);

      // Pre-load test structures for unique course types
      const courseTypes = [...new Set(coursesData.map(c => c.course_type).filter(Boolean))];
      const structures = {};
      for (const courseType of courseTypes) {
        try {
          structures[courseType] = await getTestStructure(courseType);
        } catch (err) {
          console.error(`Failed to load test structure for ${courseType}:`, err);
          structures[courseType] = [];
        }
      }
      setTestStructures(structures);

      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentTestScores = async (studentId) => {
    if (studentTestScores[studentId] || loadingStudentTests[studentId]) return;

    setLoadingStudentTests(prev => ({ ...prev, [studentId]: true }));
    try {
      const scores = await getStudentTests(studentId);
      setStudentTestScores(prev => ({ ...prev, [studentId]: scores }));
    } catch (err) {
      console.error(`Failed to load test scores for student ${studentId}:`, err);
      setStudentTestScores(prev => ({ ...prev, [studentId]: [] }));
    } finally {
      setLoadingStudentTests(prev => ({ ...prev, [studentId]: false }));
    }
  };

  const handleScoreChange = (studentId, testTypeId, scoreType, value) => {
    const key = `${studentId}-${testTypeId}`;
    setEditingScores(prev => ({ ...prev, [key]: value }));
  };

  const handleScoreBlur = async (studentId, testTypeId, scoreType) => {
    const key = `${studentId}-${testTypeId}`;
    const value = editingScores[key];

    if (value === undefined || value === '') return;

    setSavingScores(prev => ({ ...prev, [key]: true }));
    try {
      let scoreData = { test_type_id: testTypeId };

      // All types now use numeric input
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
        scoreData.score = Math.round(numValue);
        scoreData.passed = numValue >= 60;
      } else {
        return;
      }

      await saveStudentTests(studentId, [scoreData]);

      // Refresh scores
      const scores = await getStudentTests(studentId);
      setStudentTestScores(prev => ({ ...prev, [studentId]: scores }));
      setEditingScores(prev => {
        const newState = { ...prev };
        delete newState[key];
        return newState;
      });
    } catch (err) {
      console.error('Failed to save score:', err);
    } finally {
      setSavingScores(prev => ({ ...prev, [key]: false }));
    }
  };

  const getEditingValue = (studentId, testTypeId, currentValue) => {
    const key = `${studentId}-${testTypeId}`;
    return editingScores[key] !== undefined ? editingScores[key] : currentValue;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Group students by courses with their evaluations
  const getCoursesWithStudents = () => {
    // Build student evaluation map
    const studentEvaluationsMap = new Map();
    evaluations.forEach(evaluation => {
      const studentId = evaluation.student_id;
      if (!studentEvaluationsMap.has(studentId)) {
        studentEvaluationsMap.set(studentId, []);
      }
      studentEvaluationsMap.get(studentId).push(evaluation);
    });

    // Group students by course
    const courseMap = new Map();

    // Add "ללא קורס" for students without courses
    courseMap.set(0, {
      id: 0,
      name: 'ללא קורס',
      course_type: null,
      students: []
    });

    // Initialize all courses
    courses.forEach(course => {
      courseMap.set(course.id, {
        id: course.id,
        name: course.name,
        course_type: course.course_type,
        course_type_label: course.course_type_label,
        students: []
      });
    });

    // Assign students to their courses
    students.forEach(student => {
      const studentData = {
        id: student.id,
        firstName: student.first_name,
        lastName: student.last_name,
        evaluations: studentEvaluationsMap.get(student.id) || []
      };

      if (student.courses && student.courses.length > 0) {
        student.courses.forEach(course => {
          if (courseMap.has(course.id)) {
            courseMap.get(course.id).students.push(studentData);
          }
        });
      } else {
        courseMap.get(0).students.push(studentData);
      }
    });

    // Convert to array, filter out empty courses, and sort
    return Array.from(courseMap.values())
      .filter(course => course.students.length > 0)
      .map(course => ({
        ...course,
        students: course.students.sort((a, b) =>
          a.firstName.localeCompare(b.firstName, 'he')
        )
      }))
      .sort((a, b) => {
        // Keep "ללא קורס" at the end
        if (a.id === 0) return 1;
        if (b.id === 0) return -1;
        return a.name.localeCompare(b.name, 'he');
      });
  };

  const toggleCourse = (courseId) => {
    setExpandedCourse(expandedCourse === courseId ? null : courseId);
  };

  const toggleStudent = (studentId) => {
    if (expandedStudent !== studentId) {
      loadStudentTestScores(studentId);
    }
    setExpandedStudent(expandedStudent === studentId ? null : studentId);
  };

  const handleSort = (field) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortEvaluations = (evaluations) => {
    if (!evaluations || evaluations.length === 0) return evaluations;

    return [...evaluations].sort((a, b) => {
      let comparison = 0;

      switch (sortConfig.field) {
        case 'date':
          comparison = new Date(a.evaluation_date) - new Date(b.evaluation_date);
          break;
        case 'lesson':
          comparison = (a.lesson_name || '').localeCompare(b.lesson_name || '', 'he');
          break;
        case 'subject':
          comparison = (a.subject_name || '').localeCompare(b.subject_name || '', 'he');
          break;
        case 'status': {
          // Sort by passing status: passing first, then failing, then critical fail
          const getStatusOrder = (eval_) => {
            if (eval_.has_critical_fail) return 2;
            if (!eval_.is_passing) return 1;
            return 0;
          };
          comparison = getStatusOrder(a) - getStatusOrder(b);
          break;
        }
        default:
          comparison = 0;
      }

      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  };

  const getSortIcon = (field) => {
    if (sortConfig.field !== field) return '⇅';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  const handleExportCourse = async (e, courseId) => {
    e.stopPropagation();
    try {
      setExportingCourseId(courseId);
      await exportFinalReport(courseId);
    } catch (err) {
      console.error('Failed to export report:', err);
    } finally {
      setExportingCourseId(null);
    }
  };

  const openDetailModal = async (evaluationId) => {
    setShowDetailModal(true);
    setLoadingDetail(true);
    try {
      const data = await getEvaluation(evaluationId);
      setSelectedEvaluation(data);
    } catch (err) {
      console.error('Failed to load evaluation details:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedEvaluation(null);
  };

  const getScoreColor = (score) => {
    const scoreValue = SCORE_VALUES.find(s => s.value === score);
    return scoreValue ? scoreValue.color : '#6c757d';
  };

  const getScoreLabel = (score) => {
    const scoreValue = SCORE_VALUES.find(s => s.value === score);
    return scoreValue ? scoreValue.label : '';
  };

  // Get test score display for a student
  const getTestScoreDisplay = (studentId, testTypeId, scoreType) => {
    const scores = studentTestScores[studentId] || [];
    const score = scores.find(s => s.test_type_id === testTypeId);

    if (!score) {
      return { display: '-', color: '#999', passed: null };
    }

    if (scoreType === 'pass_fail') {
      return {
        display: score.passed ? 'עבר' : 'לא עבר',
        color: score.passed ? '#28a745' : '#dc3545',
        passed: score.passed
      };
    }

    if (scoreType === 'percentage') {
      const passed = score.score >= 60;
      return {
        display: score.score !== null ? `${score.score}%` : '-',
        color: passed ? '#28a745' : '#dc3545',
        passed
      };
    }

    if (scoreType === 'evaluation') {
      // For evaluation type, check if there's a linked evaluation
      if (score.evaluation_id) {
        return {
          display: score.passed ? 'עבר' : 'לא עבר',
          color: score.passed ? '#28a745' : '#dc3545',
          passed: score.passed
        };
      }
      return { display: '-', color: '#999', passed: null };
    }

    return { display: '-', color: '#999', passed: null };
  };

  // Render certification sections for a student based on course type
  const renderCertificationSections = (studentId, courseType) => {
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

    const isLoading = loadingStudentTests[studentId];

    const renderScoreInput = (test, scoreDisplay) => {
      const key = `${studentId}-${test.id}`;
      const isSaving = savingScores[key];

      // All fields use number input
      let currentValue = '';
      if (scoreDisplay.display !== '-') {
        // Extract number and round it
        const numMatch = scoreDisplay.display.match(/[\d.]+/);
        if (numMatch) {
          currentValue = Math.round(parseFloat(numMatch[0])).toString();
        }
      }
      const editValue = getEditingValue(studentId, test.id, currentValue);

      return (
        <>
          <input
            type="number"
            min="0"
            max="100"
            className={`test-score-input ${scoreDisplay.passed === false ? 'score-fail' : scoreDisplay.passed === true ? 'score-pass' : ''}`}
            value={editValue}
            disabled={isSaving}
            onChange={(e) => handleScoreChange(studentId, test.id, test.score_type, e.target.value)}
            onBlur={() => handleScoreBlur(studentId, test.id, test.score_type)}
            onClick={(e) => e.stopPropagation()}
          />
          {!editValue && <span className="empty-score-indicator">-</span>}
        </>
      );
    };

    return (
      <div className="certification-sections-compact">
        {structure.map(category => (
          <div key={category.category_id} className="certification-row">
            <span className="category-label">{category.category_name}:</span>
            <div className="category-tests-inline">
              {category.tests && category.tests.map((test, idx) => {
                const scoreDisplay = getTestScoreDisplay(studentId, test.id, test.score_type);
                return (
                  <span key={test.id} className="test-item-inline">
                    <span className="test-name-inline">{test.name_he}</span>
                    {isLoading ? (
                      <span className="test-score-inline">...</span>
                    ) : (
                      renderScoreInput(test, scoreDisplay)
                    )}
                    {idx < category.tests.length - 1 && <span className="test-separator">|</span>}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const coursesWithStudents = getCoursesWithStudents();

  if (loading) {
    return <div className="loading">טוען סטטיסטיקות...</div>;
  }

  return (
    <div className="student-stats-page">
      <div className="page-header">
        <h2>סטטיסטיקות חניכים</h2>
      </div>

      {error && <div className="error">{error}</div>}

      {coursesWithStudents.length === 0 ? (
        <div className="empty-state">
          <p>אין נתונים להצגה</p>
        </div>
      ) : (
        <div className="stats-by-course">
          {coursesWithStudents.map(course => (
            <div key={course.id} className="course-group">
              <div
                className="course-group-header"
                onClick={() => toggleCourse(course.id)}
              >
                <div className="course-group-info">
                  <h3>{course.name}</h3>
                  <div className="course-meta">
                    {course.course_type_label && (
                      <span className="course-type-badge">{course.course_type_label}</span>
                    )}
                    <span className="student-count">{course.students.length} חניכים</span>
                  </div>
                </div>
                <div className="course-group-actions">
                  {course.id !== 0 && (
                    <button
                      className="btn btn-export-header"
                      onClick={(e) => handleExportCourse(e, course.id)}
                      disabled={exportingCourseId === course.id}
                    >
                      {exportingCourseId === course.id ? 'מייצא...' : 'יצוא דוח Excel'}
                    </button>
                  )}
                  <span className={`expand-icon ${expandedCourse === course.id ? 'expanded' : ''}`}>
                    ▼
                  </span>
                </div>
              </div>

              {expandedCourse === course.id && (
                <div className="course-students">
                  {/* Student Cards with Certification Sections */}
                  <div className="student-stats-cards">
                    {course.students.map(student => (
                      <div key={student.id} className="student-stats-card">
                        <div
                          className="student-stats-card-header"
                          onClick={() => toggleStudent(student.id)}
                        >
                          <div className="student-stats-card-info">
                            <h4>{student.firstName} {student.lastName}</h4>
                            <span className="evaluation-count">
                              {student.evaluations.length} הערכות
                            </span>
                          </div>
                          <span className={`expand-icon ${expandedStudent === student.id ? 'expanded' : ''}`}>
                            ▼
                          </span>
                        </div>

                        {expandedStudent === student.id && (
                          <div className="student-stats-card-content">
                            {/* Certification Sections based on course type */}
                            {course.course_type && (
                              <div className="student-certification-wrapper">
                                <h5 className="section-title">ציוני מבחנים</h5>
                                {renderCertificationSections(student.id, course.course_type)}
                              </div>
                            )}

                            {/* Evaluations Section */}
                            <div className="student-evaluations-wrapper">
                              <h5 className="section-title">הערכות ביצוע</h5>
                              <div className="mobile-sort-controls">
                                <span className="sort-label">מיון:</span>
                                <select
                                  value={`${sortConfig.field}-${sortConfig.direction}`}
                                  onChange={(e) => {
                                    const [field, direction] = e.target.value.split('-');
                                    setSortConfig({ field, direction });
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <option value="date-desc">תאריך (חדש לישן)</option>
                                  <option value="date-asc">תאריך (ישן לחדש)</option>
                                  <option value="subject-asc">נושא (א-ת)</option>
                                  <option value="subject-desc">נושא (ת-א)</option>
                                  <option value="lesson-asc">שיעור (א-ת)</option>
                                  <option value="lesson-desc">שיעור (ת-א)</option>
                                  <option value="status-asc">סטטוס (עובר-נכשל)</option>
                                  <option value="status-desc">סטטוס (נכשל-עובר)</option>
                                </select>
                              </div>
                              {student.evaluations.length > 0 ? (
                                <div className="evaluations-list">
                                  {sortEvaluations(student.evaluations).map(evaluation => (
                                    <div
                                      key={evaluation.id}
                                      className="evaluation-item clickable-row"
                                      onClick={() => openDetailModal(evaluation.id)}
                                    >
                                      <div className="evaluation-item-header">
                                        <span className="evaluation-item-subject">{evaluation.subject_name}</span>
                                        <span
                                          className="score-badge-small"
                                          style={{
                                            backgroundColor: getStatusColor(evaluation.is_passing, evaluation.has_critical_fail)
                                          }}
                                        >
                                          {formatPercentage(evaluation.percentage_score)}
                                        </span>
                                      </div>
                                      <div className="evaluation-item-details">
                                        {evaluation.lesson_name && (
                                          <span className="evaluation-item-course">{evaluation.lesson_name}</span>
                                        )}
                                        <span className="evaluation-item-date">{formatDate(evaluation.evaluation_date)}</span>
                                        <span
                                          className="evaluation-item-status"
                                          style={{
                                            color: getStatusColor(evaluation.is_passing, evaluation.has_critical_fail)
                                          }}
                                        >
                                          {getStatusText(evaluation.is_passing, evaluation.has_critical_fail)}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="no-evaluations-message">אין הערכות</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showDetailModal && (
        <div className="modal-overlay" onClick={closeDetailModal}>
          <div className="modal modal-large" onClick={e => e.stopPropagation()}>
            {loadingDetail ? (
              <div className="loading-small">טוען פרטים...</div>
            ) : selectedEvaluation ? (
              <div className="evaluation-detail-modal">
                <h3>פירוט הערכה</h3>

                <div className="evaluation-detail-header">
                  <div className="evaluation-detail-info">
                    <div className="detail-field">
                      <span className="detail-label">חניך:</span>
                      <span className="detail-value">
                        {selectedEvaluation.student_first_name} {selectedEvaluation.student_last_name}
                      </span>
                    </div>
                    <div className="detail-field">
                      <span className="detail-label">נושא:</span>
                      <span className="detail-value">{selectedEvaluation.subject_name}</span>
                    </div>
                    {selectedEvaluation.lesson_name && (
                      <div className="detail-field">
                        <span className="detail-label">שיעור:</span>
                        <span className="detail-value">{selectedEvaluation.lesson_name}</span>
                      </div>
                    )}
                    <div className="detail-field">
                      <span className="detail-label">תאריך:</span>
                      <span className="detail-value">{formatDate(selectedEvaluation.evaluation_date)}</span>
                    </div>
                    {selectedEvaluation.instructor_first_name && (
                      <div className="detail-field">
                        <span className="detail-label">מעריך:</span>
                        <span className="detail-value">
                          {selectedEvaluation.instructor_first_name} {selectedEvaluation.instructor_last_name}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="evaluation-detail-score">
                    <div
                      className="score-circle-large"
                      style={{
                        backgroundColor: getStatusColor(
                          selectedEvaluation.is_passing,
                          selectedEvaluation.has_critical_fail
                        )
                      }}
                    >
                      {Math.round(selectedEvaluation.percentage_score)}%
                    </div>
                    <span
                      className="detail-status"
                      style={{
                        color: getStatusColor(
                          selectedEvaluation.is_passing,
                          selectedEvaluation.has_critical_fail
                        )
                      }}
                    >
                      {getStatusText(selectedEvaluation.is_passing, selectedEvaluation.has_critical_fail)}
                    </span>
                  </div>
                </div>

                <div className="evaluation-detail-scores">
                  <h4>ציוני קריטריונים</h4>
                  <div className="scores-list">
                    {selectedEvaluation.item_scores?.map((item, index) => (
                      <div
                        key={index}
                        className={`score-item ${item.is_critical ? 'critical' : ''}`}
                      >
                        <div className="score-item-info">
                          <span className="score-item-name">
                            {item.criterion_name}
                            {item.is_critical && <span className="critical-badge">*</span>}
                          </span>
                        </div>
                        <div className="score-item-value">
                          <span
                            className="score-badge"
                            style={{ backgroundColor: getScoreColor(item.score) }}
                          >
                            {item.score}
                          </span>
                          <span className="score-label">{getScoreLabel(item.score)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="scores-legend">
                    <span className="critical-indicator">*</span> = פריט קריטי
                  </div>
                </div>

                {selectedEvaluation.notes && (
                  <div className="evaluation-detail-notes">
                    <h4>הערות</h4>
                    <p>{selectedEvaluation.notes}</p>
                  </div>
                )}

                <div className="form-actions">
                  <button className="btn btn-primary" onClick={closeDetailModal}>
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

export default StudentStats;
