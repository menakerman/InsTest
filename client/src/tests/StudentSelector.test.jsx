import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StudentSelector from '../components/StudentSelector';

vi.mock('../utils/api', () => ({
  getStudents: vi.fn()
}));

import { getStudents } from '../utils/api';

describe('StudentSelector', () => {
  const mockOnChange = vi.fn();
  const mockStudents = [
    { id: 1, first_name: 'דני', last_name: 'כהן' },
    { id: 2, first_name: 'רונה', last_name: 'לוי' },
    { id: 3, first_name: 'יוסי', last_name: 'מזרחי' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    getStudents.mockResolvedValue(mockStudents);
  });

  it('should show loading state initially', async () => {
    getStudents.mockImplementation(() => new Promise(() => {}));
    render(<StudentSelector value={null} onChange={mockOnChange} />);

    expect(screen.getByText('טוען תלמידים...')).toBeInTheDocument();
  });

  it('should show placeholder when no student selected', async () => {
    render(<StudentSelector value={null} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.getByText('בחר תלמיד')).toBeInTheDocument();
    });
  });

  it('should display selected student name', async () => {
    render(<StudentSelector value={1} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.getByText('דני כהן')).toBeInTheDocument();
    });
  });

  it('should open dropdown when clicked', async () => {
    const user = userEvent.setup();
    render(<StudentSelector value={null} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.getByText('בחר תלמיד')).toBeInTheDocument();
    });

    await user.click(screen.getByText('בחר תלמיד'));

    expect(screen.getByPlaceholderText('חיפוש...')).toBeInTheDocument();
    expect(screen.getByText('דני כהן')).toBeInTheDocument();
    expect(screen.getByText('רונה לוי')).toBeInTheDocument();
  });

  it('should filter students by search term', async () => {
    const user = userEvent.setup();
    render(<StudentSelector value={null} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.getByText('בחר תלמיד')).toBeInTheDocument();
    });

    await user.click(screen.getByText('בחר תלמיד'));
    await user.type(screen.getByPlaceholderText('חיפוש...'), 'רונה');

    expect(screen.getByText('רונה לוי')).toBeInTheDocument();
    expect(screen.queryByText('דני כהן')).not.toBeInTheDocument();
  });

  it('should show empty message when no students match', async () => {
    const user = userEvent.setup();
    render(<StudentSelector value={null} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.getByText('בחר תלמיד')).toBeInTheDocument();
    });

    await user.click(screen.getByText('בחר תלמיד'));
    await user.type(screen.getByPlaceholderText('חיפוש...'), 'xyz');

    expect(screen.getByText('לא נמצאו תלמידים')).toBeInTheDocument();
  });

  it('should call onChange when student is selected', async () => {
    const user = userEvent.setup();
    render(<StudentSelector value={null} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.getByText('בחר תלמיד')).toBeInTheDocument();
    });

    await user.click(screen.getByText('בחר תלמיד'));
    await user.click(screen.getByText('רונה לוי'));

    expect(mockOnChange).toHaveBeenCalledWith(2);
  });

  it('should close dropdown after selection', async () => {
    const user = userEvent.setup();
    render(<StudentSelector value={null} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.getByText('בחר תלמיד')).toBeInTheDocument();
    });

    await user.click(screen.getByText('בחר תלמיד'));
    expect(screen.getByPlaceholderText('חיפוש...')).toBeInTheDocument();

    await user.click(screen.getByText('רונה לוי'));

    await waitFor(() => {
      expect(screen.queryByPlaceholderText('חיפוש...')).not.toBeInTheDocument();
    });
  });

  it('should close dropdown when clicking outside', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <StudentSelector value={null} onChange={mockOnChange} />
      </div>
    );

    await waitFor(() => {
      expect(screen.getByText('בחר תלמיד')).toBeInTheDocument();
    });

    await user.click(screen.getByText('בחר תלמיד'));
    expect(screen.getByPlaceholderText('חיפוש...')).toBeInTheDocument();

    await user.click(screen.getByTestId('outside'));

    await waitFor(() => {
      expect(screen.queryByPlaceholderText('חיפוש...')).not.toBeInTheDocument();
    });
  });

  it('should handle API error gracefully', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    getStudents.mockRejectedValue(new Error('API Error'));

    render(<StudentSelector value={null} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.getByText('בחר תלמיד')).toBeInTheDocument();
    });

    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('should render hidden required input when required', async () => {
    const { container } = render(
      <StudentSelector value={1} onChange={mockOnChange} required />
    );

    await waitFor(() => {
      expect(container.querySelector('input[type="hidden"][required]')).toBeInTheDocument();
    });
  });

  it('should highlight selected option in dropdown', async () => {
    const user = userEvent.setup();
    render(<StudentSelector value={1} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.getByText('דני כהן')).toBeInTheDocument();
    });

    await user.click(screen.getByText('דני כהן'));

    const options = screen.getAllByText('דני כהן');
    const dropdownOption = options.find(el => el.classList.contains('selector-option'));
    expect(dropdownOption).toHaveClass('selected');
  });
});
