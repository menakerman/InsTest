import { useState, useEffect } from 'react';
import { getEvaluations, getEvaluation } from '../utils/api';
import { formatPercentage, getStatusColor, getStatusText, SCORE_VALUES } from '../utils/scoreCalculations';

function StudentStats() {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    fetchEvaluations();
  }, []);

  const fetchEvaluations = async () => {
    try {
      setLoading(true);
      const data = await getEvaluations();
      setEvaluations(data);
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

  // Group evaluations by student and sort alphabetically by first_name
  const getStudentsWithEvaluations = () => {
    const studentMap = new Map();

    evaluations.forEach(evaluation => {
      const studentId = evaluation.student_id;
      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, {
          id: studentId,
          firstName: evaluation.student_first_name,
          lastName: evaluation.student_last_name,
          evaluations: []
        });
      }
      studentMap.get(studentId).evaluations.push(evaluation);
    });

    // Convert to array and sort by first name
    return Array.from(studentMap.values())
      .sort((a, b) => a.firstName.localeCompare(b.firstName, 'he'));
  };

  const toggleStudent = (studentId) => {
    setExpandedStudent(expandedStudent === studentId ? null : studentId);
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

  const studentsWithEvaluations = getStudentsWithEvaluations();

  if (loading) {
    return <div className="loading">טוען סטטיסטיקות...</div>;
  }

  return (
    <div className="student-stats-page">
      <div className="page-header">
        <h2>סטטיסטיקות תלמידים</h2>
      </div>

      {error && <div className="error">{error}</div>}

      {studentsWithEvaluations.length === 0 ? (
        <div className="empty-state">
          <p>אין נתונים להצגה</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="stats-table">
            <table>
              <thead>
                <tr>
                  <th>שם תלמיד</th>
                  <th>נושא</th>
                  <th>קורס</th>
                  <th>תאריך</th>
                  <th>ציון</th>
                  <th>סטטוס</th>
                </tr>
              </thead>
              <tbody>
                {studentsWithEvaluations.map(student => (
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
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="stats-cards">
            {studentsWithEvaluations.map(student => (
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
                    {student.evaluations.map(evaluation => (
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
                )}
              </div>
            ))}
          </div>
        </>
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
