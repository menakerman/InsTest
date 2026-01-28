import { useState, useEffect } from 'react';
import { getEvaluations, getEvaluation, getStudents, getCourses, exportFinalReport } from '../utils/api';
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
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
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
      students: []
    });

    // Initialize all courses
    courses.forEach(course => {
      courseMap.set(course.id, {
        id: course.id,
        name: course.name,
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
    setExpandedStudent(expandedStudent === studentId ? null : studentId);
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
                  <span className="student-count">{course.students.length} חניכים</span>
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
                  {/* Desktop Table View */}
                  <div className="stats-table">
                    <table>
                      <thead>
                        <tr>
                          <th>שם תלמיד</th>
                          <th>נושא</th>
                          <th>שיעור</th>
                          <th>תאריך</th>
                          <th>ציון</th>
                          <th>סטטוס</th>
                        </tr>
                      </thead>
                      <tbody>
                        {course.students.map(student => (
                          student.evaluations.length > 0 ? (
                            student.evaluations.map((evaluation, evalIndex) => (
                              <tr
                                key={evaluation.id}
                                className="student-row clickable-row"
                                onClick={() => openDetailModal(evaluation.id)}
                              >
                                {evalIndex === 0 ? (
                                  <td rowSpan={student.evaluations.length} className="student-name-cell">
                                    {student.firstName} {student.lastName}
                                  </td>
                                ) : null}
                                <td>{evaluation.subject_name}</td>
                                <td>{evaluation.lesson_name || '-'}</td>
                                <td>{formatDate(evaluation.evaluation_date)}</td>
                                <td>
                                  <span
                                    className="score-badge-small"
                                    style={{
                                      backgroundColor: getStatusColor(evaluation.is_passing, evaluation.has_critical_fail)
                                    }}
                                  >
                                    {formatPercentage(evaluation.percentage_score)}
                                  </span>
                                </td>
                                <td>
                                  <span
                                    className="status-text"
                                    style={{
                                      color: getStatusColor(evaluation.is_passing, evaluation.has_critical_fail)
                                    }}
                                  >
                                    {getStatusText(evaluation.is_passing, evaluation.has_critical_fail)}
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr key={student.id} className="student-row no-evaluations">
                              <td className="student-name-cell">
                                {student.firstName} {student.lastName}
                              </td>
                              <td colSpan={5} className="no-data-cell">אין הערכות</td>
                            </tr>
                          )
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="stats-cards">
                    {course.students.map(student => (
                      <div key={student.id} className="student-card">
                        <div
                          className="student-card-header"
                          onClick={() => toggleStudent(student.id)}
                        >
                          <div className="student-card-info">
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
                          <div className="student-card-evaluations">
                            {student.evaluations.length > 0 ? (
                              student.evaluations.map(evaluation => (
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
                              ))
                            ) : (
                              <div className="no-evaluations-message">אין הערכות</div>
                            )}
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
                      <span className="detail-label">תלמיד:</span>
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
