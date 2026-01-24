import { describe, it, expect } from 'vitest';
import {
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
} from '../utils/scoreCalculations';

describe('scoreCalculations', () => {
  describe('SCORE_VALUES', () => {
    it('should have 4 score values', () => {
      expect(SCORE_VALUES).toHaveLength(4);
    });

    it('should have correct values', () => {
      expect(SCORE_VALUES.map(s => s.value)).toEqual([1, 4, 7, 10]);
    });

    it('should have Hebrew labels', () => {
      expect(SCORE_VALUES[0].label).toBe('לא עבר');
      expect(SCORE_VALUES[3].label).toBe('מצוין');
    });
  });

  describe('calculateRawScore', () => {
    it('should sum all scores', () => {
      const scores = { 1: 7, 2: 10, 3: 4 };
      expect(calculateRawScore(scores)).toBe(21);
    });

    it('should handle empty scores', () => {
      expect(calculateRawScore({})).toBe(0);
    });

    it('should treat null/undefined as 0', () => {
      const scores = { 1: 7, 2: null, 3: undefined };
      expect(calculateRawScore(scores)).toBe(7);
    });
  });

  describe('calculatePercentage', () => {
    it('should calculate percentage correctly', () => {
      expect(calculatePercentage(50, 100)).toBe(50);
      expect(calculatePercentage(75, 100)).toBe(75);
    });

    it('should return 0 when maxScore is 0', () => {
      expect(calculatePercentage(50, 0)).toBe(0);
    });

    it('should handle decimal results', () => {
      expect(calculatePercentage(1, 3)).toBeCloseTo(33.33, 1);
    });
  });

  describe('hasCriticalFail', () => {
    const criteria = [
      { id: 1, is_critical: true },
      { id: 2, is_critical: false },
      { id: 3, is_critical: true }
    ];

    it('should return true when critical item scores 1', () => {
      const scores = { 1: 1, 2: 7, 3: 10 };
      expect(hasCriticalFail(scores, criteria)).toBe(true);
    });

    it('should return false when no critical items score 1', () => {
      const scores = { 1: 7, 2: 1, 3: 10 };
      expect(hasCriticalFail(scores, criteria)).toBe(false);
    });

    it('should return false with empty scores', () => {
      expect(hasCriticalFail({}, criteria)).toBe(false);
    });
  });

  describe('isPassing', () => {
    it('should return false if critical fail', () => {
      expect(isPassing(100, 70, true)).toBe(false);
    });

    it('should return true if score >= threshold', () => {
      expect(isPassing(70, 70, false)).toBe(true);
      expect(isPassing(80, 70, false)).toBe(true);
    });

    it('should return false if score < threshold', () => {
      expect(isPassing(69, 70, false)).toBe(false);
    });
  });

  describe('calculateEvaluationScores', () => {
    const criteria = [
      { id: 1, is_critical: true },
      { id: 2, is_critical: false }
    ];

    it('should calculate all scores correctly', () => {
      const itemScores = { 1: 10, 2: 10 };
      const result = calculateEvaluationScores(itemScores, criteria, 20, 14);

      expect(result.rawScore).toBe(20);
      expect(result.percentageScore).toBe(100);
      expect(result.hasCriticalFail).toBe(false);
      expect(result.isPassing).toBe(true);
    });

    it('should detect critical fail', () => {
      const itemScores = { 1: 1, 2: 10 };
      const result = calculateEvaluationScores(itemScores, criteria, 20, 14);

      expect(result.hasCriticalFail).toBe(true);
      expect(result.isPassing).toBe(false);
    });
  });

  describe('getScoreColor', () => {
    it('should return correct colors for each score', () => {
      expect(getScoreColor(1)).toBe('#dc3545');
      expect(getScoreColor(4)).toBe('#fd7e14');
      expect(getScoreColor(7)).toBe('#0dcaf0');
      expect(getScoreColor(10)).toBe('#198754');
    });

    it('should return gray for unknown score', () => {
      expect(getScoreColor(5)).toBe('#6c757d');
    });
  });

  describe('getScoreLabel', () => {
    it('should return correct labels for each score', () => {
      expect(getScoreLabel(1)).toBe('לא עבר');
      expect(getScoreLabel(4)).toBe('בסיסי');
      expect(getScoreLabel(7)).toBe('טוב');
      expect(getScoreLabel(10)).toBe('מצוין');
    });

    it('should return dash for unknown score', () => {
      expect(getScoreLabel(5)).toBe('-');
    });
  });

  describe('formatPercentage', () => {
    it('should format percentage with % sign', () => {
      expect(formatPercentage(75)).toBe('75%');
      expect(formatPercentage(100)).toBe('100%');
    });

    it('should round decimals', () => {
      expect(formatPercentage(75.5)).toBe('76%');
      expect(formatPercentage(75.4)).toBe('75%');
    });
  });

  describe('getStatusColor', () => {
    it('should return red for critical fail', () => {
      expect(getStatusColor(true, true)).toBe('#dc3545');
      expect(getStatusColor(false, true)).toBe('#dc3545');
    });

    it('should return green for passing', () => {
      expect(getStatusColor(true, false)).toBe('#198754');
    });

    it('should return red for failing', () => {
      expect(getStatusColor(false, false)).toBe('#dc3545');
    });
  });

  describe('getStatusText', () => {
    it('should return critical fail text', () => {
      expect(getStatusText(true, true)).toBe('נכשל (פריט קריטי)');
      expect(getStatusText(false, true)).toBe('נכשל (פריט קריטי)');
    });

    it('should return passing text', () => {
      expect(getStatusText(true, false)).toBe('עבר');
    });

    it('should return failing text', () => {
      expect(getStatusText(false, false)).toBe('נכשל');
    });
  });
});
