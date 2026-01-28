import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEvaluationSubject, getEvaluation, createEvaluation, updateEvaluation, getLessons } from '../utils/api';
import { calculateEvaluationScores } from '../utils/scoreCalculations';
import StudentSelector from '../components/StudentSelector';
import InstructorSelector from '../components/InstructorSelector';
import CriterionCard from '../components/CriterionCard';
import ScoreSummary from '../components/ScoreSummary';

// Subject codes that should show the stopwatch
const STOPWATCH_SUBJECT_CODES = ['equipment_lesson', 'pre_dive_briefing', 'lecture_delivery'];

function EvaluationForm() {
  const { subjectCode, evaluationId } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!evaluationId;

  const [subject, setSubject] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [studentId, setStudentId] = useState(null);
  const [instructorId, setInstructorId] = useState(null);
  const [lessonName, setLessonName] = useState('');
  const [lessonNameSelection, setLessonNameSelection] = useState('');
  const [customLessonName, setCustomLessonName] = useState('');
  const [isFinalTest, setIsFinalTest] = useState(false);
  const [notes, setNotes] = useState('');
  const [scores, setScores] = useState({});

  // Stopwatch state
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const stopwatchInterval = useRef(null);

  // Subjects that support test vs training selection
  const subjectsWithTestOption = ['intro_dive', 'equipment_lesson', 'pre_dive_briefing', 'lecture_delivery', 'water_lesson'];

  // Check if current subject should show stopwatch
  const showStopwatch = subject && STOPWATCH_SUBJECT_CODES.includes(subject.code);

  // Stopwatch effect
  useEffect(() => {
    if (stopwatchRunning) {
      stopwatchInterval.current = setInterval(() => {
        setStopwatchTime(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(stopwatchInterval.current);
    }
    return () => clearInterval(stopwatchInterval.current);
  }, [stopwatchRunning]);

  // Format time as HH:MM:SS
  const formatStopwatchTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleStartStopwatch = () => setStopwatchRunning(true);
  const handleStopStopwatch = () => setStopwatchRunning(false);
  const handleResetStopwatch = () => {
    setStopwatchRunning(false);
    setStopwatchTime(0);
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      if (isEditMode) {
        const evalData = await getEvaluation(evaluationId);
        const subjectData = await getEvaluationSubject(evalData.subject_code);

        setSubject(subjectData);
        setStudentId(evalData.student_id);
        setInstructorId(evalData.instructor_id);

        // Fetch lessons for this subject
        const subjectLessons = await getLessons({ subject_id: subjectData.id, is_active: true });
        setLessons(subjectLessons);

        // Handle lesson name for edit mode
        const savedLessonName = evalData.lesson_name || '';
        setLessonName(savedLessonName);
        const lessonNames = subjectLessons.map(l => l.name);
        if (lessonNames.includes(savedLessonName)) {
          setLessonNameSelection(savedLessonName);
        } else if (savedLessonName && subjectLessons.length > 0) {
          setLessonNameSelection('__other__');
          setCustomLessonName(savedLessonName);
        } else {
          setLessonNameSelection(savedLessonName);
        }

        setNotes(evalData.notes || '');
        setIsFinalTest(evalData.is_final_test || false);

        const existingScores = {};
        evalData.item_scores?.forEach(item => {
          existingScores[item.criterion_id] = item.score;
        });
        setScores(existingScores);
      } else {
        const data = await getEvaluationSubject(subjectCode);
        setSubject(data);

        // Fetch lessons for this subject
        const subjectLessons = await getLessons({ subject_id: data.id, is_active: true });
        setLessons(subjectLessons);
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

    if (lessons.length > 0 && !lessonName) {
      setError('נא לבחור שם שיעור');
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
        is_final_test: subjectsWithTestOption.includes(subject.code) ? isFinalTest : false,
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

      {showStopwatch && (
        <div className="stopwatch-container">
          <div className="stopwatch-display">
            <span className="stopwatch-label">זמן השיעור:</span>
            <span className={`stopwatch-time ${stopwatchRunning ? 'running' : ''}`}>
              {formatStopwatchTime(stopwatchTime)}
            </span>
          </div>
          <div className="stopwatch-controls">
            {!stopwatchRunning ? (
              <button type="button" className="btn btn-stopwatch start" onClick={handleStartStopwatch}>
                התחל
              </button>
            ) : (
              <button type="button" className="btn btn-stopwatch stop" onClick={handleStopStopwatch}>
                עצור
              </button>
            )}
            <button type="button" className="btn btn-stopwatch reset" onClick={handleResetStopwatch}>
              אפס
            </button>
          </div>
        </div>
      )}

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
                <label>
                  שם השיעור / נושא
                  {lessons.length > 0 && ' *'}
                </label>
                {lessons.length > 0 ? (
                  <>
                    <select
                      value={lessonNameSelection}
                      onChange={(e) => {
                        const value = e.target.value;
                        setLessonNameSelection(value);
                        if (value !== '__other__') {
                          setLessonName(value);
                          setCustomLessonName('');
                        } else {
                          setLessonName('');
                        }
                      }}
                      required
                      className="lesson-name-select"
                    >
                      <option value="">-- בחר שיעור --</option>
                      {lessons.map((lesson) => (
                        <option key={lesson.id} value={lesson.name}>{lesson.name}</option>
                      ))}
                      <option value="__other__">אחר (הזן ידנית)</option>
                    </select>
                    {lessonNameSelection === '__other__' && (
                      <input
                        type="text"
                        value={customLessonName}
                        onChange={(e) => {
                          setCustomLessonName(e.target.value);
                          setLessonName(e.target.value);
                        }}
                        placeholder="הזן שם שיעור"
                        className="lesson-name-other-input"
                        style={{ marginTop: '8px' }}
                        required
                      />
                    )}
                  </>
                ) : (
                  <input
                    type="text"
                    value={lessonName}
                    onChange={(e) => setLessonName(e.target.value)}
                    placeholder="לדוגמה: שיעור ציוד ABC, צלילה באילת"
                  />
                )}
              </div>

              {subject && subjectsWithTestOption.includes(subject.code) && (
                <div className="form-group evaluation-type-toggle">
                  <label>סוג הערכה</label>
                  <div className="toggle-buttons">
                    <button
                      type="button"
                      className={`toggle-btn ${!isFinalTest ? 'active training' : ''}`}
                      onClick={() => setIsFinalTest(false)}
                    >
                      תרגול
                    </button>
                    <button
                      type="button"
                      className={`toggle-btn ${isFinalTest ? 'active test' : ''}`}
                      onClick={() => setIsFinalTest(true)}
                    >
                      מבחן
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="criteria-section">
              <h3>קריטריוני הערכה</h3>

              <div className="criteria-list">
                {subject.criteria?.map(criterion => (
                  <CriterionCard
                    key={criterion.id}
                    criterion={criterion}
                    score={scores[criterion.id]}
                    onScoreChange={handleScoreChange}
                    scoreDescriptions={criterion.score_descriptions || {}}
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
              disabled={saving || !allAnswered || !studentId || (lessons.length > 0 && !lessonName)}
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
