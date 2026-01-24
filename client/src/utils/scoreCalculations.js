// Score values and their Hebrew labels
export const SCORE_VALUES = [
  { value: 1, label: 'לא עבר', color: '#dc3545' },
  { value: 4, label: 'בסיסי', color: '#fd7e14' },
  { value: 7, label: 'טוב', color: '#0dcaf0' },
  { value: 10, label: 'מצוין', color: '#198754' }
];

/**
 * Calculate raw score from item scores
 * @param {Object} scores - Object with criterion_id as key and score as value
 * @returns {number} Sum of all scores
 */
export function calculateRawScore(scores) {
  return Object.values(scores).reduce((sum, score) => sum + (score || 0), 0);
}

/**
 * Calculate percentage score
 * @param {number} rawScore - The raw score
 * @param {number} maxScore - The maximum possible score
 * @returns {number} Percentage (0-100)
 */
export function calculatePercentage(rawScore, maxScore) {
  if (maxScore === 0) return 0;
  return (rawScore / maxScore) * 100;
}

/**
 * Check if any critical item has failed (scored 1)
 * @param {Object} scores - Object with criterion_id as key and score as value
 * @param {Array} criteria - Array of criterion objects with is_critical flag
 * @returns {boolean} True if any critical item scored 1
 */
export function hasCriticalFail(scores, criteria) {
  return criteria.some(criterion =>
    criterion.is_critical && scores[criterion.id] === 1
  );
}

/**
 * Check if evaluation is passing
 * @param {number} percentageScore - The percentage score
 * @param {number} passingThreshold - The minimum passing percentage
 * @param {boolean} criticalFail - Whether there's a critical fail
 * @returns {boolean} True if passing
 */
export function isPassing(percentageScore, passingThreshold, criticalFail) {
  if (criticalFail) return false;
  return percentageScore >= passingThreshold;
}

/**
 * Calculate all scores for an evaluation
 * @param {Object} itemScores - Object with criterion_id as key and score as value
 * @param {Array} criteria - Array of criterion objects
 * @param {number} maxRawScore - Maximum possible raw score
 * @param {number} passingRawScore - Minimum passing raw score
 * @returns {Object} Calculated scores
 */
export function calculateEvaluationScores(itemScores, criteria, maxRawScore, passingRawScore) {
  const rawScore = calculateRawScore(itemScores);
  const percentageScore = calculatePercentage(rawScore, maxRawScore);
  const passingPercentage = calculatePercentage(passingRawScore, maxRawScore);
  const criticalFail = hasCriticalFail(itemScores, criteria);
  const passing = isPassing(percentageScore, passingPercentage, criticalFail);

  return {
    rawScore,
    percentageScore: Math.round(percentageScore * 100) / 100,
    finalScore: Math.round(percentageScore * 100) / 100,
    hasCriticalFail: criticalFail,
    isPassing: passing,
    passingPercentage: Math.round(passingPercentage * 100) / 100
  };
}

/**
 * Get score color based on value
 * @param {number} score - The score value (1, 4, 7, or 10)
 * @returns {string} Color hex code
 */
export function getScoreColor(score) {
  const scoreInfo = SCORE_VALUES.find(s => s.value === score);
  return scoreInfo ? scoreInfo.color : '#6c757d';
}

/**
 * Get score label based on value
 * @param {number} score - The score value (1, 4, 7, or 10)
 * @returns {string} Hebrew label
 */
export function getScoreLabel(score) {
  const scoreInfo = SCORE_VALUES.find(s => s.value === score);
  return scoreInfo ? scoreInfo.label : '-';
}

/**
 * Format percentage for display
 * @param {number} percentage - The percentage value
 * @returns {string} Formatted percentage string
 */
export function formatPercentage(percentage) {
  return `${Math.round(percentage)}%`;
}

/**
 * Get status color based on pass/fail
 * @param {boolean} passing - Whether the evaluation passed
 * @param {boolean} criticalFail - Whether there's a critical fail
 * @returns {string} Color hex code
 */
export function getStatusColor(passing, criticalFail) {
  if (criticalFail) return '#dc3545';
  return passing ? '#198754' : '#dc3545';
}

/**
 * Get status text
 * @param {boolean} passing - Whether the evaluation passed
 * @param {boolean} criticalFail - Whether there's a critical fail
 * @returns {string} Hebrew status text
 */
export function getStatusText(passing, criticalFail) {
  if (criticalFail) return 'נכשל (פריט קריטי)';
  return passing ? 'עבר' : 'נכשל';
}

export default {
  SCORE_VALUES,
  calculateRawScore,
  calculatePercentage,
  hasCriticalFail,
  isPassing,
  calculateEvaluationScores,
  getScoreColor,
  getScoreLabel,
  formatPercentage,
  getStatusColor,
  getStatusText
};
