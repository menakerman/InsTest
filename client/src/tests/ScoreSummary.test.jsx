import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ScoreSummary from '../components/ScoreSummary';

describe('ScoreSummary', () => {
  const defaultProps = {
    rawScore: 50,
    maxRawScore: 70,
    percentageScore: 71.43,
    passingPercentage: 70,
    isPassing: true,
    hasCriticalFail: false,
    answeredCount: 7,
    totalCount: 7
  };

  it('should render header', () => {
    render(<ScoreSummary {...defaultProps} />);
    expect(screen.getByText('סיכום ציונים')).toBeInTheDocument();
  });

  it('should display answered count', () => {
    render(<ScoreSummary {...defaultProps} />);
    expect(screen.getByText('7 / 7')).toBeInTheDocument();
  });

  it('should display raw score', () => {
    render(<ScoreSummary {...defaultProps} />);
    expect(screen.getByText('50 / 70')).toBeInTheDocument();
  });

  it('should display percentage', () => {
    render(<ScoreSummary {...defaultProps} />);
    expect(screen.getByText('71%')).toBeInTheDocument();
  });

  it('should display passing threshold', () => {
    render(<ScoreSummary {...defaultProps} />);
    expect(screen.getByText('70%')).toBeInTheDocument();
  });

  it('should show passing status when all answered and passing', () => {
    render(<ScoreSummary {...defaultProps} />);
    expect(screen.getByText('עבר')).toBeInTheDocument();
  });

  it('should show failing status when not passing', () => {
    render(<ScoreSummary {...defaultProps} isPassing={false} />);
    expect(screen.getByText('נכשל')).toBeInTheDocument();
  });

  it('should show waiting status when not all answered', () => {
    render(<ScoreSummary {...defaultProps} answeredCount={5} />);
    expect(screen.getByText('ממתין להשלמה')).toBeInTheDocument();
  });

  it('should show critical fail status and warning', () => {
    render(<ScoreSummary {...defaultProps} hasCriticalFail={true} isPassing={false} />);
    expect(screen.getByText('נכשל (פריט קריטי)')).toBeInTheDocument();
    expect(screen.getByText('נבחר ציון 1 בפריט קריטי - המבחן נכשל אוטומטית')).toBeInTheDocument();
  });

  it('should not show critical warning when no critical fail', () => {
    render(<ScoreSummary {...defaultProps} />);
    expect(screen.queryByText(/נבחר ציון 1 בפריט קריטי/)).not.toBeInTheDocument();
  });

  it('should display stat labels in Hebrew', () => {
    render(<ScoreSummary {...defaultProps} />);
    expect(screen.getByText('פריטים שנענו:')).toBeInTheDocument();
    expect(screen.getByText('ציון גולמי:')).toBeInTheDocument();
    expect(screen.getByText('אחוז:')).toBeInTheDocument();
    expect(screen.getByText('סף מעבר:')).toBeInTheDocument();
  });

  it('should apply green color for passing status', () => {
    const { container } = render(<ScoreSummary {...defaultProps} />);
    const statusDiv = container.querySelector('.summary-status');
    expect(statusDiv).toHaveStyle({ backgroundColor: '#198754' });
  });

  it('should apply red color for failing status', () => {
    const { container } = render(<ScoreSummary {...defaultProps} isPassing={false} />);
    const statusDiv = container.querySelector('.summary-status');
    expect(statusDiv).toHaveStyle({ backgroundColor: '#dc3545' });
  });

  it('should apply gray color when not all answered', () => {
    const { container } = render(<ScoreSummary {...defaultProps} answeredCount={3} />);
    const statusDiv = container.querySelector('.summary-status');
    expect(statusDiv).toHaveStyle({ backgroundColor: '#6c757d' });
  });
});
