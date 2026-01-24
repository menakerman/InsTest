import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CriterionCard from '../components/CriterionCard';

describe('CriterionCard', () => {
  const mockOnScoreChange = vi.fn();

  const regularCriterion = {
    id: 1,
    name_he: 'ביצוע תרגיל',
    description_he: 'תיאור התרגיל',
    is_critical: false
  };

  const criticalCriterion = {
    id: 2,
    name_he: 'בטיחות',
    description_he: 'בדיקות בטיחות',
    is_critical: true
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render criterion name', () => {
    render(
      <CriterionCard
        criterion={regularCriterion}
        score={null}
        onScoreChange={mockOnScoreChange}
      />
    );

    expect(screen.getByText('ביצוע תרגיל')).toBeInTheDocument();
  });

  it('should render criterion description when provided', () => {
    render(
      <CriterionCard
        criterion={regularCriterion}
        score={null}
        onScoreChange={mockOnScoreChange}
      />
    );

    expect(screen.getByText('תיאור התרגיל')).toBeInTheDocument();
  });

  it('should not render description when not provided', () => {
    const criterionWithoutDesc = { ...regularCriterion, description_he: null };
    render(
      <CriterionCard
        criterion={criterionWithoutDesc}
        score={null}
        onScoreChange={mockOnScoreChange}
      />
    );

    expect(screen.queryByText('תיאור התרגיל')).not.toBeInTheDocument();
  });

  it('should show critical badge for critical criteria', () => {
    render(
      <CriterionCard
        criterion={criticalCriterion}
        score={null}
        onScoreChange={mockOnScoreChange}
      />
    );

    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('should not show critical badge for regular criteria', () => {
    render(
      <CriterionCard
        criterion={regularCriterion}
        score={null}
        onScoreChange={mockOnScoreChange}
      />
    );

    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  it('should apply critical class for critical criteria', () => {
    const { container } = render(
      <CriterionCard
        criterion={criticalCriterion}
        score={null}
        onScoreChange={mockOnScoreChange}
      />
    );

    expect(container.firstChild).toHaveClass('critical');
  });

  it('should render all 4 score buttons', () => {
    render(
      <CriterionCard
        criterion={regularCriterion}
        score={null}
        onScoreChange={mockOnScoreChange}
      />
    );

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('should call onScoreChange when score button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <CriterionCard
        criterion={regularCriterion}
        score={null}
        onScoreChange={mockOnScoreChange}
      />
    );

    await user.click(screen.getByText('7'));
    expect(mockOnScoreChange).toHaveBeenCalledWith(1, 7);
  });

  it('should show critical fail warning when critical item scores 1', () => {
    render(
      <CriterionCard
        criterion={criticalCriterion}
        score={1}
        onScoreChange={mockOnScoreChange}
      />
    );

    expect(screen.getByText('ציון 1 בפריט קריטי - המבחן נכשל')).toBeInTheDocument();
  });

  it('should not show critical fail warning for non-critical item with score 1', () => {
    render(
      <CriterionCard
        criterion={regularCriterion}
        score={1}
        onScoreChange={mockOnScoreChange}
      />
    );

    expect(screen.queryByText(/המבחן נכשל/)).not.toBeInTheDocument();
  });

  it('should not show critical fail warning for critical item with score other than 1', () => {
    render(
      <CriterionCard
        criterion={criticalCriterion}
        score={7}
        onScoreChange={mockOnScoreChange}
      />
    );

    expect(screen.queryByText(/המבחן נכשל/)).not.toBeInTheDocument();
  });
});
