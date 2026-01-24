import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ScoreButton from '../components/ScoreButton';

describe('ScoreButton', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render score value and label', () => {
    render(
      <ScoreButton value={10} selectedValue={null} onChange={mockOnChange} />
    );

    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('מצוין')).toBeInTheDocument();
  });

  it('should apply selected class when selected', () => {
    render(
      <ScoreButton value={7} selectedValue={7} onChange={mockOnChange} />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('selected');
  });

  it('should not apply selected class when not selected', () => {
    render(
      <ScoreButton value={7} selectedValue={10} onChange={mockOnChange} />
    );

    const button = screen.getByRole('button');
    expect(button).not.toHaveClass('selected');
  });

  it('should call onChange with value when clicked', async () => {
    const user = userEvent.setup();
    render(
      <ScoreButton value={4} selectedValue={null} onChange={mockOnChange} />
    );

    await user.click(screen.getByRole('button'));
    expect(mockOnChange).toHaveBeenCalledWith(4);
  });

  it('should be disabled when disabled prop is true', () => {
    render(
      <ScoreButton value={1} selectedValue={null} onChange={mockOnChange} disabled />
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should not call onChange when disabled', async () => {
    const user = userEvent.setup();
    render(
      <ScoreButton value={1} selectedValue={null} onChange={mockOnChange} disabled />
    );

    await user.click(screen.getByRole('button'));
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('should render all score types correctly', () => {
    const scores = [
      { value: 1, label: 'לא עבר' },
      { value: 4, label: 'בסיסי' },
      { value: 7, label: 'טוב' },
      { value: 10, label: 'מצוין' }
    ];

    scores.forEach(score => {
      const { unmount } = render(
        <ScoreButton value={score.value} selectedValue={null} onChange={mockOnChange} />
      );
      expect(screen.getByText(String(score.value))).toBeInTheDocument();
      expect(screen.getByText(score.label)).toBeInTheDocument();
      unmount();
    });
  });

  it('should apply inline styles based on score color', () => {
    render(
      <ScoreButton value={10} selectedValue={10} onChange={mockOnChange} />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveStyle({ backgroundColor: '#198754' });
  });
});
