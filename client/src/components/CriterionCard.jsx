import { SCORE_VALUES } from '../utils/scoreCalculations';

// Color gradient for incremental scores (1 to max)
const getIncrementalColor = (value, maxScore) => {
  const ratio = value / maxScore;
  if (ratio <= 0.25) return '#dc3545';  // red
  if (ratio <= 0.5) return '#fd7e14';   // orange
  if (ratio <= 0.75) return '#0dcaf0';  // cyan
  return '#198754';                      // green
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

  // Check if this is a quality scoring section (has explicit max_score)
  const isQualitySection = criterion.max_score != null;
  const maxScore = criterion.max_score || 10;

  // For quality sections, generate incremental scores 1 to max
  // For regular criteria, use the standard 1, 4, 7, 10 scale
  if (isQualitySection) {
    const incrementalScores = Array.from({ length: maxScore }, (_, i) => i + 1);
    const qualityDescription = criterion.description_he || '';

    return (
      <div className="criterion-card-new quality-scale">
        <div className="criterion-header-new">
          <h4 className="criterion-title">
            {criterion.name_he}
            <span className="quality-tag">עד {maxScore} נקודות</span>
          </h4>
        </div>

        {qualityDescription && (
          <p className="quality-description">{qualityDescription}</p>
        )}

        <div className="quality-score-selector">
          {incrementalScores.map(value => {
            const isSelected = score === value;
            const color = getIncrementalColor(value, maxScore);

            return (
              <button
                key={value}
                type="button"
                className={`quality-score-btn ${isSelected ? 'selected' : ''}`}
                onClick={() => handleScoreSelect(value)}
                style={{
                  borderColor: isSelected ? color : undefined,
                  backgroundColor: isSelected ? color : undefined,
                  color: isSelected ? 'white' : undefined
                }}
              >
                {value}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Standard criteria with 1, 4, 7, 10 scale and descriptions
  return (
    <div className={`criterion-card-new ${criterion.is_critical ? 'critical' : ''}`}>
      <div className="criterion-header-new">
        <h4 className="criterion-title">
          {criterion.name_he}
          {criterion.is_critical && (
            <span className="critical-tag">כישלון בציון 1</span>
          )}
        </h4>
      </div>

      <div className="score-options">
        {SCORE_VALUES.map(({ value, color }) => {
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
