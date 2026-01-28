import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEvaluationSubjects } from '../utils/api';

function GradeStudents() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const data = await getEvaluationSubjects();
      setSubjects(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectClick = (subjectCode) => {
    navigate(`/evaluations/new/${subjectCode}`);
  };

  if (loading) {
    return <div className="loading">טוען נושאי הערכה...</div>;
  }

  return (
    <div className="grade-students-page">
      <div className="page-header">
        <h2>הערכת חניכים</h2>
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/evaluations/history')}
        >
          היסטוריית הערכות
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      <p className="page-description">
        בחר סוג הערכה כדי להתחיל הערכה חדשה
      </p>

      <div className="subjects-grid">
        {subjects.map(subject => (
          <div
            key={subject.id}
            className="subject-card"
            onClick={() => handleSubjectClick(subject.code)}
          >
            <h3>{subject.name_he}</h3>
            <p className="subject-description">{subject.description_he}</p>
            <div className="subject-meta">
              <span>{subject.criteria?.length || 0} קריטריונים</span>
              <span>מקסימום: {subject.max_raw_score} נק'</span>
            </div>
          </div>
        ))}
      </div>

      {subjects.length === 0 && !error && (
        <div className="empty-state">
          <p>אין נושאי הערכה זמינים. נא לוודא שהמסד נוצר כראוי.</p>
        </div>
      )}
    </div>
  );
}

export default GradeStudents;
