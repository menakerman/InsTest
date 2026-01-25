import { SCORE_VALUES } from '../utils/scoreCalculations';

// Color mapping for different score values
const getScoreColor = (value, maxScore) => {
  if (maxScore === 5) {
    // 5-point scale: 0, 2, 4, 5
    if (value === 0) return '#dc3545';  // red
    if (value === 2) return '#fd7e14';  // orange
    if (value === 4) return '#0dcaf0';  // cyan
    if (value === 5) return '#198754';  // green
  }
  // Default 10-point scale: 1, 4, 7, 10
  const scoreInfo = SCORE_VALUES.find(s => s.value === value);
  return scoreInfo ? scoreInfo.color : '#6c757d';
};

function CriterionCard({ criterion, score, onScoreChange, scoreDescriptions = {} }) {
  const handleScoreSelect = (value) => {
    // Toggle off if clicking the same score
    if (score === value) {
      onScoreChange(criterion.id, null);
    } else {
      onScoreChange(criterion.id, value);
    }
  };

  // Get available score values from the scoreDescriptions keys
  const availableScores = Object.keys(scoreDescriptions)
    .map(k => parseInt(k))
    .sort((a, b) => a - b);

  // Determine max score from criterion or from available scores
  const maxScore = criterion.max_score || Math.max(...availableScores, 10);

  // Use available scores if they exist, otherwise fall back to default SCORE_VALUES
  const scoreOptions = availableScores.length > 0
    ? availableScores.map(value => ({ value, color: getScoreColor(value, maxScore) }))
    : SCORE_VALUES;

  // Check if this is a quality scoring section (has explicit max_score that differs from default 10)
  const isQualitySection = criterion.max_score != null;

  return (
    <div className={`criterion-card-new ${criterion.is_critical ? 'critical' : ''} ${isQualitySection ? 'quality-scale' : ''}`}>
      <div className="criterion-header-new">
        <h4 className="criterion-title">
          {criterion.name_he}
          {isQualitySection && (
            <span className="quality-tag">עד {maxScore} נקודות</span>
          )}
          {criterion.is_critical && (
            <span className="critical-tag">כישלון בציון 1</span>
          )}
        </h4>
      </div>

      <div className="score-options">
        {scoreOptions.map(({ value, color }) => {
          const description = scoreDescriptions[value] || '';
          const isSelected = score === value;
          const isCriticalFail = criterion.is_critical && value === 1;

          return (
            <div
              key={value}
              className={`score-option ${isSelected ? 'selected' : ''} ${isCriticalFail && isSelected ? 'critical-selected' : ''}`}
              onClick={() => handleScoreSelect(value)}
              style={{
                borderColor: isSelected ? color : undefined,
                backgroundColor: isSelected ? `${color}10` : undefined
              }}
            >
              <div className="score-option-number" style={{ color: isSelected ? color : undefined }}>
                {value}
                {isCriticalFail && <span className="warning-icon">⚠</span>}
              </div>
              <div className="score-option-description">
                {description || '-'}
              </div>
            </div>
          );
        })}
      </div>

      {criterion.is_critical && score === 1 && (
        <div className="critical-fail-banner">
          ציון 1 בפריט קריטי - המבחן נכשל אוטומטית
        </div>
      )}
    </div>
  );
}

export default CriterionCard;
