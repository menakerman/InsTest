import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ResetPassword from '../pages/ResetPassword';

// Mock useAuth
vi.mock('../contexts/useAuth', () => ({
  useAuth: vi.fn()
}));

import { useAuth } from '../contexts/useAuth';

describe('ResetPassword Page', () => {
  const mockResetPassword = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      resetPassword: mockResetPassword
    });
  });

  const renderWithRouter = () => {
    return render(
      <MemoryRouter initialEntries={['/reset-password/test-token-123']}>
        <Routes>
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('should render reset password form', () => {
    renderWithRouter();

    expect(screen.getByText(/הגדרת סיסמה חדשה/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/סיסמה חדשה$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/אישור סיסמה/i)).toBeInTheDocument();
  });

  it('should show error when password is too short', async () => {
    const user = userEvent.setup();
    renderWithRouter();

    await user.type(screen.getByLabelText(/סיסמה חדשה$/i), '123');
    await user.type(screen.getByLabelText(/אישור סיסמה/i), '123');
    await user.click(screen.getByRole('button', { name: /אפס סיסמה/i }));

    expect(screen.getByText(/6 תווים/i)).toBeInTheDocument();
    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  it('should show error when passwords do not match', async () => {
    const user = userEvent.setup();
    renderWithRouter();

    await user.type(screen.getByLabelText(/סיסמה חדשה$/i), 'password123');
    await user.type(screen.getByLabelText(/אישור סיסמה/i), 'different123');
    await user.click(screen.getByRole('button', { name: /אפס סיסמה/i }));

    expect(screen.getByText(/אינן תואמות/i)).toBeInTheDocument();
    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  it('should call resetPassword with token and new password', async () => {
    const user = userEvent.setup();
    mockResetPassword.mockResolvedValue({});
    renderWithRouter();

    await user.type(screen.getByLabelText(/סיסמה חדשה$/i), 'newpass123');
    await user.type(screen.getByLabelText(/אישור סיסמה/i), 'newpass123');
    await user.click(screen.getByRole('button', { name: /אפס סיסמה/i }));

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith('test-token-123', 'newpass123');
    });
  });

  it('should show success message after reset', async () => {
    const user = userEvent.setup();
    mockResetPassword.mockResolvedValue({});
    renderWithRouter();

    await user.type(screen.getByLabelText(/סיסמה חדשה$/i), 'newpass123');
    await user.type(screen.getByLabelText(/אישור סיסמה/i), 'newpass123');
    await user.click(screen.getByRole('button', { name: /אפס סיסמה/i }));

    await waitFor(() => {
      expect(screen.getByText(/בהצלחה/i)).toBeInTheDocument();
    });
  });

  it('should show error from API on failure', async () => {
    const user = userEvent.setup();
    mockResetPassword.mockRejectedValue(new Error('קישור האיפוס פג תוקף'));
    renderWithRouter();

    await user.type(screen.getByLabelText(/סיסמה חדשה$/i), 'newpass123');
    await user.type(screen.getByLabelText(/אישור סיסמה/i), 'newpass123');
    await user.click(screen.getByRole('button', { name: /אפס סיסמה/i }));

    await waitFor(() => {
      expect(screen.getByText(/פג תוקף/i)).toBeInTheDocument();
    });
  });

  it('should show loading state while submitting', async () => {
    const user = userEvent.setup();
    mockResetPassword.mockImplementation(() => new Promise(() => {}));
    renderWithRouter();

    await user.type(screen.getByLabelText(/סיסמה חדשה$/i), 'newpass123');
    await user.type(screen.getByLabelText(/אישור סיסמה/i), 'newpass123');
    await user.click(screen.getByRole('button', { name: /אפס סיסמה/i }));

    await waitFor(() => {
      expect(screen.getByText(/שומר/i)).toBeInTheDocument();
    });
  });

  it('should show link to login page', () => {
    renderWithRouter();
    expect(screen.getByText(/חזרה להתחברות/i)).toBeInTheDocument();
  });
});
