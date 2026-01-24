import ScoreButton from './ScoreButton';
import { SCORE_VALUES } from '../utils/scoreCalculations';

function CriterionCard({ criterion, score, onScoreChange, scoreDescriptions = {} }) {
  return (
    <div className={`criterion-card ${criterion.is_critical ? 'critical' : ''}`}>
      <div className="criterion-header">
        <span className="criterion-name">
          {criterion.name_he}
          {criterion.is_critical && <span className="critical-badge">*</span>}
        </span>
        {criterion.description_he && (
          <span className="criterion-description">{criterion.description_he}</span>
        )}
      </div>

      <div className="criterion-scores">
        {SCORE_VALUES.map(({ value }) => (
          <ScoreButton
            key={value}
            value={value}
            selectedValue={score}
            onChange={(newScore) => onScoreChange(criterion.id, newScore)}
            description={scoreDescriptions[value] || ''}
          />
        ))}
      </div>

      {criterion.is_critical && score === 1 && (
        <div className="critical-fail-warning">
          ציון 1 בפריט קריטי - המבחן נכשל
        </div>
      )}
    </div>
  );
}

export default CriterionCard;
