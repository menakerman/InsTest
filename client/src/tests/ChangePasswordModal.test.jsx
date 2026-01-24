import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChangePasswordModal from '../components/ChangePasswordModal';

// Mock useAuth
vi.mock('../contexts/useAuth', () => ({
  useAuth: vi.fn()
}));

import { useAuth } from '../contexts/useAuth';

describe('ChangePasswordModal', () => {
  const mockChangePassword = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      changePassword: mockChangePassword
    });
  });

  it('should render password change form', () => {
    render(<ChangePasswordModal onClose={mockOnClose} />);

    expect(screen.getByLabelText('סיסמה נוכחית')).toBeInTheDocument();
    expect(screen.getByLabelText('סיסמה חדשה')).toBeInTheDocument();
    expect(screen.getByLabelText('אישור סיסמה חדשה')).toBeInTheDocument();
  });

  it('should call onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<ChangePasswordModal onClose={mockOnClose} />);

    await user.click(screen.getByText('ביטול'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call onClose when clicking overlay', async () => {
    const user = userEvent.setup();
    render(<ChangePasswordModal onClose={mockOnClose} />);

    const overlay = document.querySelector('.modal-overlay');
    await user.click(overlay);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should show error when new password is too short', async () => {
    const user = userEvent.setup();
    render(<ChangePasswordModal onClose={mockOnClose} />);

    await user.type(screen.getByLabelText('סיסמה נוכחית'), 'current123');
    await user.type(screen.getByLabelText('סיסמה חדשה'), '123');
    await user.type(screen.getByLabelText('אישור סיסמה חדשה'), '123');
    await user.click(screen.getByText('שנה סיסמה'));

    expect(screen.getByText(/6 תווים/)).toBeInTheDocument();
    expect(mockChangePassword).not.toHaveBeenCalled();
  });

  it('should show error when passwords do not match', async () => {
    const user = userEvent.setup();
    render(<ChangePasswordModal onClose={mockOnClose} />);

    await user.type(screen.getByLabelText('סיסמה נוכחית'), 'current123');
    await user.type(screen.getByLabelText('סיסמה חדשה'), 'newpass123');
    await user.type(screen.getByLabelText('אישור סיסמה חדשה'), 'different123');
    await user.click(screen.getByText('שנה סיסמה'));

    expect(screen.getByText(/אינן תואמות/)).toBeInTheDocument();
    expect(mockChangePassword).not.toHaveBeenCalled();
  });

  it('should call changePassword with correct params on valid submit', async () => {
    const user = userEvent.setup();
    mockChangePassword.mockResolvedValue({});
    render(<ChangePasswordModal onClose={mockOnClose} />);

    await user.type(screen.getByLabelText('סיסמה נוכחית'), 'current123');
    await user.type(screen.getByLabelText('סיסמה חדשה'), 'newpass123');
    await user.type(screen.getByLabelText('אישור סיסמה חדשה'), 'newpass123');
    await user.click(screen.getByText('שנה סיסמה'));

    await waitFor(() => {
      expect(mockChangePassword).toHaveBeenCalledWith('current123', 'newpass123');
    });
  });

  it('should show success message after successful change', async () => {
    const user = userEvent.setup();
    mockChangePassword.mockResolvedValue({});
    render(<ChangePasswordModal onClose={mockOnClose} />);

    await user.type(screen.getByLabelText('סיסמה נוכחית'), 'current123');
    await user.type(screen.getByLabelText('סיסמה חדשה'), 'newpass123');
    await user.type(screen.getByLabelText('אישור סיסמה חדשה'), 'newpass123');
    await user.click(screen.getByText('שנה סיסמה'));

    await waitFor(() => {
      expect(screen.getByText(/בהצלחה/)).toBeInTheDocument();
    });
  });

  it('should show error from API on failure', async () => {
    const user = userEvent.setup();
    mockChangePassword.mockRejectedValue(new Error('הסיסמה הנוכחית שגויה'));
    render(<ChangePasswordModal onClose={mockOnClose} />);

    await user.type(screen.getByLabelText('סיסמה נוכחית'), 'wrongpass');
    await user.type(screen.getByLabelText('סיסמה חדשה'), 'newpass123');
    await user.type(screen.getByLabelText('אישור סיסמה חדשה'), 'newpass123');
    await user.click(screen.getByText('שנה סיסמה'));

    await waitFor(() => {
      expect(screen.getByText('הסיסמה הנוכחית שגויה')).toBeInTheDocument();
    });
  });

  it('should show loading state while submitting', async () => {
    const user = userEvent.setup();
    mockChangePassword.mockImplementation(() => new Promise(() => {}));
    render(<ChangePasswordModal onClose={mockOnClose} />);

    await user.type(screen.getByLabelText('סיסמה נוכחית'), 'current123');
    await user.type(screen.getByLabelText('סיסמה חדשה'), 'newpass123');
    await user.type(screen.getByLabelText('אישור סיסמה חדשה'), 'newpass123');
    await user.click(screen.getByText('שנה סיסמה'));

    await waitFor(() => {
      expect(screen.getByText('שומר...')).toBeInTheDocument();
    });
  });
});
