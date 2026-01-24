import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InstructorSelector from '../components/InstructorSelector';

vi.mock('../utils/api', () => ({
  getInstructors: vi.fn()
}));

import { getInstructors } from '../utils/api';

describe('InstructorSelector', () => {
  const mockOnChange = vi.fn();
  const mockInstructors = [
    { id: 1, first_name: 'משה', last_name: 'כהן' },
    { id: 2, first_name: 'שרה', last_name: 'לוי' },
    { id: 3, first_name: 'דוד', last_name: 'ישראלי' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    getInstructors.mockResolvedValue(mockInstructors);
  });

  it('should show loading state initially', async () => {
    getInstructors.mockImplementation(() => new Promise(() => {}));
    render(<InstructorSelector value={null} onChange={mockOnChange} />);

    expect(screen.getByText('טוען מדריכים...')).toBeInTheDocument();
  });

  it('should show placeholder when no instructor selected', async () => {
    render(<InstructorSelector value={null} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.getByText('בחר מדריך (אופציונלי)')).toBeInTheDocument();
    });
  });

  it('should display selected instructor name', async () => {
    render(<InstructorSelector value={1} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.getByText('משה כהן')).toBeInTheDocument();
    });
  });

  it('should open dropdown when clicked', async () => {
    const user = userEvent.setup();
    render(<InstructorSelector value={null} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.getByText('בחר מדריך (אופציונלי)')).toBeInTheDocument();
    });

    await user.click(screen.getByText('בחר מדריך (אופציונלי)'));

    expect(screen.getByPlaceholderText('חיפוש...')).toBeInTheDocument();
    expect(screen.getByText('משה כהן')).toBeInTheDocument();
    expect(screen.getByText('שרה לוי')).toBeInTheDocument();
  });

  it('should filter instructors by search term', async () => {
    const user = userEvent.setup();
    render(<InstructorSelector value={null} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.getByText('בחר מדריך (אופציונלי)')).toBeInTheDocument();
    });

    await user.click(screen.getByText('בחר מדריך (אופציונלי)'));
    await user.type(screen.getByPlaceholderText('חיפוש...'), 'שרה');

    expect(screen.getByText('שרה לוי')).toBeInTheDocument();
    expect(screen.queryByText('משה כהן')).not.toBeInTheDocument();
  });

  it('should show empty message when no instructors match', async () => {
    const user = userEvent.setup();
    render(<InstructorSelector value={null} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.getByText('בחר מדריך (אופציונלי)')).toBeInTheDocument();
    });

    await user.click(screen.getByText('בחר מדריך (אופציונלי)'));
    await user.type(screen.getByPlaceholderText('חיפוש...'), 'xyz');

    expect(screen.getByText('לא נמצאו מדריכים')).toBeInTheDocument();
  });

  it('should call onChange when instructor is selected', async () => {
    const user = userEvent.setup();
    render(<InstructorSelector value={null} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.getByText('בחר מדריך (אופציונלי)')).toBeInTheDocument();
    });

    await user.click(screen.getByText('בחר מדריך (אופציונלי)'));
    await user.click(screen.getByText('שרה לוי'));

    expect(mockOnChange).toHaveBeenCalledWith(2);
  });

  it('should close dropdown after selection', async () => {
    const user = userEvent.setup();
    render(<InstructorSelector value={null} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.getByText('בחר מדריך (אופציונלי)')).toBeInTheDocument();
    });

    await user.click(screen.getByText('בחר מדריך (אופציונלי)'));
    expect(screen.getByPlaceholderText('חיפוש...')).toBeInTheDocument();

    await user.click(screen.getByText('שרה לוי'));

    await waitFor(() => {
      expect(screen.queryByPlaceholderText('חיפוש...')).not.toBeInTheDocument();
    });
  });

  it('should show clear button when instructor is selected', async () => {
    render(<InstructorSelector value={1} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.getByText('משה כהן')).toBeInTheDocument();
    });

    expect(screen.getByText('✕')).toBeInTheDocument();
  });

  it('should clear selection when clear button is clicked', async () => {
    const user = userEvent.setup();
    render(<InstructorSelector value={1} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.getByText('משה כהן')).toBeInTheDocument();
    });

    await user.click(screen.getByText('✕'));
    expect(mockOnChange).toHaveBeenCalledWith(null);
  });

  it('should not open dropdown when clear button is clicked', async () => {
    const user = userEvent.setup();
    render(<InstructorSelector value={1} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.getByText('משה כהן')).toBeInTheDocument();
    });

    await user.click(screen.getByText('✕'));

    expect(screen.queryByPlaceholderText('חיפוש...')).not.toBeInTheDocument();
  });

  it('should close dropdown when clicking outside', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <InstructorSelector value={null} onChange={mockOnChange} />
      </div>
    );

    await waitFor(() => {
      expect(screen.getByText('בחר מדריך (אופציונלי)')).toBeInTheDocument();
    });

    await user.click(screen.getByText('בחר מדריך (אופציונלי)'));
    expect(screen.getByPlaceholderText('חיפוש...')).toBeInTheDocument();

    await user.click(screen.getByTestId('outside'));

    await waitFor(() => {
      expect(screen.queryByPlaceholderText('חיפוש...')).not.toBeInTheDocument();
    });
  });

  it('should handle API error gracefully', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    getInstructors.mockRejectedValue(new Error('API Error'));

    render(<InstructorSelector value={null} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.getByText('בחר מדריך (אופציונלי)')).toBeInTheDocument();
    });

    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('should render hidden required input when required', async () => {
    const { container } = render(
      <InstructorSelector value={1} onChange={mockOnChange} required />
    );

    await waitFor(() => {
      expect(container.querySelector('input[type="hidden"][required]')).toBeInTheDocument();
    });
  });

  it('should highlight selected option in dropdown', async () => {
    const user = userEvent.setup();
    render(<InstructorSelector value={1} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.getByText('משה כהן')).toBeInTheDocument();
    });

    await user.click(screen.getByText('משה כהן'));

    const options = screen.getAllByText('משה כהן');
    const dropdownOption = options.find(el => el.classList.contains('selector-option'));
    expect(dropdownOption).toHaveClass('selected');
  });

  it('should toggle dropdown open/closed on click', async () => {
    const user = userEvent.setup();
    render(<InstructorSelector value={null} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.getByText('בחר מדריך (אופציונלי)')).toBeInTheDocument();
    });

    // Open
    await user.click(screen.getByText('בחר מדריך (אופציונלי)'));
    expect(screen.getByPlaceholderText('חיפוש...')).toBeInTheDocument();

    // Close
    await user.click(screen.getByText('בחר מדריך (אופציונלי)'));
    await waitFor(() => {
      expect(screen.queryByPlaceholderText('חיפוש...')).not.toBeInTheDocument();
    });
  });
});
