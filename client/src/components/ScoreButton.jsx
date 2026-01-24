import { SCORE_VALUES } from '../utils/scoreCalculations';

function ScoreButton({ value, selectedValue, onChange, disabled = false, description = '' }) {
  const scoreInfo = SCORE_VALUES.find(s => s.value === value);
  const isSelected = selectedValue === value;

  return (
    <button
      type="button"
      className={`score-button ${isSelected ? 'selected' : ''}`}
      style={{
        '--score-color': scoreInfo.color,
        backgroundColor: isSelected ? scoreInfo.color : 'transparent',
        borderColor: scoreInfo.color,
        color: isSelected ? 'white' : scoreInfo.color
      }}
      onClick={() => onChange(value)}
      disabled={disabled}
      title={description}
    >
      <span className="score-value">{value}</span>
      <span className="score-label">{scoreInfo.label}</span>
    </button>
  );
}

export default ScoreButton;
