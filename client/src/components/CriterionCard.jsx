import { SCORE_VALUES } from '../utils/scoreCalculations';

function CriterionCard({ criterion, score, onScoreChange, scoreDescriptions = {} }) {
  const handleScoreSelect = (value) => {
    // Toggle off if clicking the same score
    if (score === value) {
      onScoreChange(criterion.id, null);
    } else {
      onScoreChange(criterion.id, value);
    }
  };

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
