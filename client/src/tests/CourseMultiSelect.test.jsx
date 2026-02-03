import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CourseMultiSelect from '../components/CourseMultiSelect';

describe('CourseMultiSelect', () => {
  const mockOnChange = vi.fn();
  const mockCourses = [
    { id: 1, name: 'קורס מדריך עוזר', course_type: 'מדריך_עוזר', course_type_label: 'מדריך עוזר' },
    { id: 2, name: 'קורס מדריך', course_type: 'מדריך', course_type_label: 'מדריך' },
    { id: 3, name: 'קורס קרוסאובר', course_type: 'קרוסאובר', course_type_label: 'קרוסאובר' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show placeholder when no courses selected', () => {
    render(
      <CourseMultiSelect
        courses={mockCourses}
        selectedIds={[]}
        onChange={mockOnChange}
        loading={false}
      />
    );

    expect(screen.getByText('בחר קורסים...')).toBeInTheDocument();
  });

  it('should display selected course chips', () => {
    render(
      <CourseMultiSelect
        courses={mockCourses}
        selectedIds={[1, 2]}
        onChange={mockOnChange}
        loading={false}
      />
    );

    expect(screen.getByText('קורס מדריך עוזר')).toBeInTheDocument();
    expect(screen.getByText('קורס מדריך')).toBeInTheDocument();
  });

  it('should show +N more chip when more than 2 courses selected', () => {
    render(
      <CourseMultiSelect
        courses={mockCourses}
        selectedIds={[1, 2, 3]}
        onChange={mockOnChange}
        loading={false}
      />
    );

    expect(screen.getByText('+1 נוספים')).toBeInTheDocument();
  });

  it('should open dropdown when clicked', async () => {
    const user = userEvent.setup();
    render(
      <CourseMultiSelect
        courses={mockCourses}
        selectedIds={[]}
        onChange={mockOnChange}
        loading={false}
      />
    );

    await user.click(screen.getByText('בחר קורסים...'));

    expect(screen.getByPlaceholderText('חיפוש קורס...')).toBeInTheDocument();
    expect(screen.getByText('קורס מדריך עוזר')).toBeInTheDocument();
  });

  it('should filter courses by search term', async () => {
    const user = userEvent.setup();
    render(
      <CourseMultiSelect
        courses={mockCourses}
        selectedIds={[]}
        onChange={mockOnChange}
        loading={false}
      />
    );

    await user.click(screen.getByText('בחר קורסים...'));
    await user.type(screen.getByPlaceholderText('חיפוש קורס...'), 'קרוסאובר');

    expect(screen.getByText('קורס קרוסאובר')).toBeInTheDocument();
    expect(screen.queryByText('קורס מדריך עוזר')).not.toBeInTheDocument();
  });

  it('should show empty message when no courses match filter', async () => {
    const user = userEvent.setup();
    render(
      <CourseMultiSelect
        courses={mockCourses}
        selectedIds={[]}
        onChange={mockOnChange}
        loading={false}
      />
    );

    await user.click(screen.getByText('בחר קורסים...'));
    await user.type(screen.getByPlaceholderText('חיפוש קורס...'), 'xyz');

    expect(screen.getByText('לא נמצאו קורסים')).toBeInTheDocument();
  });

  it('should show loading state', async () => {
    const user = userEvent.setup();
    render(
      <CourseMultiSelect
        courses={[]}
        selectedIds={[]}
        onChange={mockOnChange}
        loading={true}
      />
    );

    await user.click(screen.getByText('בחר קורסים...'));

    expect(screen.getByText('טוען קורסים...')).toBeInTheDocument();
  });

  it('should toggle course selection when checkbox clicked', async () => {
    const user = userEvent.setup();
    render(
      <CourseMultiSelect
        courses={mockCourses}
        selectedIds={[]}
        onChange={mockOnChange}
        loading={false}
      />
    );

    await user.click(screen.getByText('בחר קורסים...'));
    await user.click(screen.getByRole('checkbox', { name: /קורס מדריך עוזר/ }));

    expect(mockOnChange).toHaveBeenCalledWith([1]);
  });

  it('should remove course from selection when checkbox unchecked', async () => {
    const user = userEvent.setup();
    render(
      <CourseMultiSelect
        courses={mockCourses}
        selectedIds={[1, 2]}
        onChange={mockOnChange}
        loading={false}
      />
    );

    await user.click(screen.getByText('קורס מדריך עוזר'));
    await user.click(screen.getByRole('checkbox', { name: /קורס מדריך עוזר/ }));

    expect(mockOnChange).toHaveBeenCalledWith([2]);
  });

  it('should remove course when chip remove button clicked', async () => {
    const user = userEvent.setup();
    render(
      <CourseMultiSelect
        courses={mockCourses}
        selectedIds={[1, 2]}
        onChange={mockOnChange}
        loading={false}
      />
    );

    const removeButtons = screen.getAllByText('×');
    await user.click(removeButtons[0]);

    expect(mockOnChange).toHaveBeenCalledWith([2]);
  });

  it('should close dropdown when clicking outside', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <CourseMultiSelect
          courses={mockCourses}
          selectedIds={[]}
          onChange={mockOnChange}
          loading={false}
        />
      </div>
    );

    await user.click(screen.getByText('בחר קורסים...'));
    expect(screen.getByPlaceholderText('חיפוש קורס...')).toBeInTheDocument();

    await user.click(screen.getByTestId('outside'));

    await waitFor(() => {
      expect(screen.queryByPlaceholderText('חיפוש קורס...')).not.toBeInTheDocument();
    });
  });

  it('should toggle dropdown open/closed on display click', async () => {
    const user = userEvent.setup();
    render(
      <CourseMultiSelect
        courses={mockCourses}
        selectedIds={[]}
        onChange={mockOnChange}
        loading={false}
      />
    );

    // Open
    await user.click(screen.getByText('בחר קורסים...'));
    expect(screen.getByPlaceholderText('חיפוש קורס...')).toBeInTheDocument();

    // Close
    await user.click(screen.getByText('▲'));
    await waitFor(() => {
      expect(screen.queryByPlaceholderText('חיפוש קורס...')).not.toBeInTheDocument();
    });
  });

  it('should show selected count in footer', async () => {
    const user = userEvent.setup();
    render(
      <CourseMultiSelect
        courses={mockCourses}
        selectedIds={[1, 2]}
        onChange={mockOnChange}
        loading={false}
      />
    );

    await user.click(screen.getByText('קורס מדריך עוזר'));

    expect(screen.getByText('2 קורסים נבחרו')).toBeInTheDocument();
  });

  it('should display course type label in dropdown', async () => {
    const user = userEvent.setup();
    render(
      <CourseMultiSelect
        courses={mockCourses}
        selectedIds={[]}
        onChange={mockOnChange}
        loading={false}
      />
    );

    await user.click(screen.getByText('בחר קורסים...'));

    expect(screen.getByText('מדריך עוזר')).toBeInTheDocument();
    expect(screen.getByText('מדריך')).toBeInTheDocument();
    expect(screen.getByText('קרוסאובר')).toBeInTheDocument();
  });

  it('should show arrow indicator based on open state', () => {
    render(
      <CourseMultiSelect
        courses={mockCourses}
        selectedIds={[]}
        onChange={mockOnChange}
        loading={false}
      />
    );

    expect(screen.getByText('▼')).toBeInTheDocument();
  });

  it('should mark selected courses as checked in dropdown', async () => {
    const user = userEvent.setup();
    render(
      <CourseMultiSelect
        courses={mockCourses}
        selectedIds={[1]}
        onChange={mockOnChange}
        loading={false}
      />
    );

    await user.click(screen.getByText('קורס מדריך עוזר'));

    const checkbox = screen.getByRole('checkbox', { name: /קורס מדריך עוזר/ });
    expect(checkbox).toBeChecked();
  });
});
