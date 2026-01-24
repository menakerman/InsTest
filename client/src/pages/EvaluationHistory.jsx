import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEvaluations, getEvaluation, deleteEvaluation } from '../utils/api';
import { formatPercentage, getStatusColor, getStatusText } from '../utils/scoreCalculations';

function EvaluationHistory() {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const navigate = useNavigate();

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

  const handleViewDetails = async (id) => {
    if (showDetails?.id === id) {
      setShowDetails(null);
      return;
    }

    try {
      setDetailsLoading(true);
      const data = await getEvaluation(id);
      setShowDetails(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleEdit = (evaluation) => {
    navigate(`/evaluations/edit/${evaluation.id}`);
  };

  const handleDelete = async () => {
    if (!showDeleteModal) return;

    try {
      await deleteEvaluation(showDeleteModal.id);
      await fetchEvaluations();
      setShowDeleteModal(null);
      if (showDetails?.id === showDeleteModal.id) {
        setShowDetails(null);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="loading">טוען היסטוריית הערכות...</div>;
  }

  return (
    <div className="evaluation-history-page">
      <div className="page-header">
        <h2>היסטוריית הערכות</h2>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => navigate('/grade')}>
            הערכה חדשה
          </button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {evaluations.length === 0 ? (
        <div className="empty-state">
          <p>אין הערכות עדיין. לחץ על "הערכה חדשה" כדי להתחיל.</p>
        </div>
      ) : (
        <div className="evaluations-list">
          {evaluations.map(evaluation => (
            <div key={evaluation.id} className="evaluation-card">
              <div className="evaluation-main" onClick={() => handleViewDetails(evaluation.id)}>
                <div className="evaluation-info">
                  <h4>
                    {evaluation.student_first_name} {evaluation.student_last_name}
                  </h4>
                  <span className="evaluation-subject">{evaluation.subject_name}</span>
                  {evaluation.lesson_name && (
                    <span className="evaluation-lesson">{evaluation.lesson_name}</span>
                  )}
                </div>

                <div className="evaluation-score">
                  <span
                    className="score-badge"
                    style={{
                      backgroundColor: getStatusColor(evaluation.is_passing, evaluation.has_critical_fail)
                    }}
                  >
                    {formatPercentage(evaluation.percentage_score)}
                  </span>
                  <span className="score-status">
                    {getStatusText(evaluation.is_passing, evaluation.has_critical_fail)}
                  </span>
                </div>

                <div className="evaluation-meta">
                  <span className="evaluation-date">{formatDate(evaluation.evaluation_date)}</span>
                  {evaluation.instructor_first_name && (
                    <span className="evaluation-instructor">
                      מעריך: {evaluation.instructor_first_name} {evaluation.instructor_last_name}
                    </span>
                  )}
                </div>

                <div className="evaluation-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleEdit(evaluation)}
                  >
                    עריכה
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => setShowDeleteModal(evaluation)}
                  >
                    מחיקה
                  </button>
                </div>
              </div>

              {showDetails?.id === evaluation.id && (
                <div className="evaluation-details">
                  {detailsLoading ? (
                    <div className="loading">טוען פרטים...</div>
                  ) : (
                    <>
                      <h5>פירוט ציונים</h5>
                      <div className="details-scores">
                        {showDetails.item_scores?.map(item => (
                          <div
                            key={item.id}
                            className={`detail-item ${item.is_critical ? 'critical' : ''}`}
                          >
                            <span className="detail-name">
                              {item.criterion_name}
                              {item.is_critical && <span className="critical-badge">*</span>}
                            </span>
                            <span className="detail-score">{item.score}</span>
                          </div>
                        ))}
                      </div>
                      {showDetails.notes && (
                        <div className="details-notes">
                          <h5>הערות</h5>
                          <p>{showDetails.notes}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-confirm">
              <h3>מחיקת הערכה</h3>
              <p>
                האם אתה בטוח שברצונך למחוק את הערכת{' '}
                <strong>{showDeleteModal.subject_name}</strong> של{' '}
                <strong>
                  {showDeleteModal.student_first_name} {showDeleteModal.student_last_name}
                </strong>?
                <br />
                לא ניתן לבטל פעולה זו.
              </p>
              <div className="form-actions">
                <button className="btn btn-secondary" onClick={() => setShowDeleteModal(null)}>
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

export default EvaluationHistory;
