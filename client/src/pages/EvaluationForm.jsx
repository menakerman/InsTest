import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEvaluationSubject, getEvaluation, createEvaluation, updateEvaluation } from '../utils/api';
import { calculateEvaluationScores } from '../utils/scoreCalculations';
import StudentSelector from '../components/StudentSelector';
import InstructorSelector from '../components/InstructorSelector';
import CriterionCard from '../components/CriterionCard';
import ScoreSummary from '../components/ScoreSummary';

function EvaluationForm() {
  const { subjectCode, evaluationId } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!evaluationId;

  const [subject, setSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [studentId, setStudentId] = useState(null);
  const [instructorId, setInstructorId] = useState(null);
  const [lessonName, setLessonName] = useState('');
  const [notes, setNotes] = useState('');
  const [scores, setScores] = useState({});

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      if (isEditMode) {
        const evalData = await getEvaluation(evaluationId);
        const subjectData = await getEvaluationSubject(evalData.subject_code);

        setSubject(subjectData);
        setStudentId(evalData.student_id);
        setInstructorId(evalData.instructor_id);
        setLessonName(evalData.lesson_name || '');
        setNotes(evalData.notes || '');

        const existingScores = {};
        evalData.item_scores?.forEach(item => {
          existingScores[item.criterion_id] = item.score;
        });
        setScores(existingScores);
      } else {
        const data = await getEvaluationSubject(subjectCode);
        setSubject(data);
      }

      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isEditMode, evaluationId, subjectCode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleScoreChange = (criterionId, score) => {
    setScores(prev => ({
      ...prev,
      [criterionId]: score
    }));
  };

  const getCalculatedScores = () => {
    if (!subject) return null;
    return calculateEvaluationScores(
      scores,
      subject.criteria || [],
      subject.max_raw_score,
      subject.passing_raw_score
    );
  };

  const answeredCount = Object.keys(scores).length;
  const totalCount = subject?.criteria?.length || 0;
  const allAnswered = answeredCount === totalCount;
  const calculatedScores = getCalculatedScores();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!studentId) {
      setError('נא לבחור תלמיד');
      return;
    }

    if (!allAnswered) {
      setError('נא לענות על כל הקריטריונים');
      return;
    }

    try {
      setSaving(true);

      const itemScores = Object.entries(scores).map(([criterionId, score]) => ({
        criterion_id: parseInt(criterionId),
        score
      }));

      const evaluationData = {
        student_id: studentId,
        subject_id: subject.id,
        instructor_id: instructorId,
        lesson_name: lessonName,
        notes,
        raw_score: calculatedScores.rawScore,
        percentage_score: calculatedScores.percentageScore,
        final_score: calculatedScores.finalScore,
        is_passing: calculatedScores.isPassing,
        has_critical_fail: calculatedScores.hasCriticalFail,
        item_scores: itemScores
      };

      if (isEditMode) {
        await updateEvaluation(evaluationId, evaluationData);
      } else {
        await createEvaluation(evaluationData);
      }

      navigate('/evaluations/history');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading">טוען טופס הערכה...</div>;
  }

  if (!subject) {
    return <div className="error">נושא הערכה לא נמצא</div>;
  }

  return (
    <div className="evaluation-form-page">
      <div className="page-header">
        <h2>{isEditMode ? 'עריכת הערכה' : 'הערכה חדשה'}: {subject.name_he}</h2>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          ביטול
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      <form onSubmit={handleSubmit} className="evaluation-form">
        <div className="form-layout">
          <div className="form-main">
            <div className="form-fields">
              <div className="form-row">
                <div className="form-group">
                  <label>תלמיד *</label>
                  <StudentSelector
                    value={studentId}
                    onChange={setStudentId}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>מדריך מעריך</label>
                  <InstructorSelector
                    value={instructorId}
                    onChange={setInstructorId}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>שם השיעור / נושא</label>
                <input
                  type="text"
                  value={lessonName}
                  onChange={(e) => setLessonName(e.target.value)}
                  placeholder="לדוגמה: שיעור ציוד ABC, צלילה באילת"
                />
              </div>
            </div>

            <div className="criteria-section">
              <h3>קריטריוני הערכה</h3>
              <p className="criteria-legend">
                <span className="critical-indicator">*</span> = פריט קריטי (ציון 1 = כישלון אוטומטי)
              </p>

              <div className="criteria-list">
                {subject.criteria?.map(criterion => (
                  <CriterionCard
                    key={criterion.id}
                    criterion={criterion}
                    score={scores[criterion.id]}
                    onScoreChange={handleScoreChange}
                  />
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>הערות</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="הערות נוספות להערכה..."
              />
            </div>
          </div>

          <div className="form-sidebar">
            {calculatedScores && (
              <ScoreSummary
                rawScore={calculatedScores.rawScore}
                maxRawScore={subject.max_raw_score}
                percentageScore={calculatedScores.percentageScore}
                passingPercentage={calculatedScores.passingPercentage}
                isPassing={calculatedScores.isPassing}
                hasCriticalFail={calculatedScores.hasCriticalFail}
                answeredCount={answeredCount}
                totalCount={totalCount}
              />
            )}

            <button
              type="submit"
              className="btn btn-primary btn-submit"
              disabled={saving || !allAnswered || !studentId}
            >
              {saving ? 'שומר...' : (isEditMode ? 'עדכון הערכה' : 'שמור הערכה')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default EvaluationForm;
