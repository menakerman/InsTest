import { formatPercentage, getStatusColor, getStatusText } from '../utils/scoreCalculations';

function ScoreSummary({
  rawScore,
  maxRawScore,
  percentageScore,
  passingPercentage,
  isPassing,
  hasCriticalFail,
  answeredCount,
  totalCount
}) {
  const statusColor = getStatusColor(isPassing, hasCriticalFail);
  const statusText = getStatusText(isPassing, hasCriticalFail);
  const allAnswered = answeredCount === totalCount;

  return (
    <div className="score-summary">
      <div className="summary-header">
        <h3>סיכום ציונים</h3>
      </div>

      <div className="summary-stats">
        <div className="stat-row">
          <span className="stat-label">פריטים שנענו:</span>
          <span className="stat-value">{answeredCount} / {totalCount}</span>
        </div>

        <div className="stat-row">
          <span className="stat-label">ציון גולמי:</span>
          <span className="stat-value">{rawScore} / {maxRawScore}</span>
        </div>

        <div className="stat-row">
          <span className="stat-label">אחוז:</span>
          <span className="stat-value">{formatPercentage(percentageScore)}</span>
        </div>

        <div className="stat-row">
          <span className="stat-label">סף מעבר:</span>
          <span className="stat-value">{formatPercentage(passingPercentage)}</span>
        </div>
      </div>

      <div
        className="summary-status"
        style={{ backgroundColor: allAnswered ? statusColor : '#6c757d' }}
      >
        {allAnswered ? statusText : 'ממתין להשלמה'}
      </div>

      {hasCriticalFail && (
        <div className="critical-warning">
          נבחר ציון 1 בפריט קריטי - המבחן נכשל אוטומטית
        </div>
      )}
    </div>
  );
}

export default ScoreSummary;
