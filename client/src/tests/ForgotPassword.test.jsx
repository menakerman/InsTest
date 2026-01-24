import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ForgotPassword from '../pages/ForgotPassword';

// Mock useAuth
vi.mock('../contexts/useAuth', () => ({
  useAuth: vi.fn()
}));

import { useAuth } from '../contexts/useAuth';

describe('ForgotPassword Page', () => {
  const mockForgotPassword = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      forgotPassword: mockForgotPassword
    });
  });

  it('should render forgot password form', () => {
    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    expect(screen.getByText(/איפוס סיסמה/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/אימייל/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /שלח קישור/i })).toBeInTheDocument();
  });

  it('should show link to login page', () => {
    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    expect(screen.getByText(/חזרה להתחברות/i)).toBeInTheDocument();
  });

  it('should call forgotPassword with email on submit', async () => {
    const user = userEvent.setup();
    mockForgotPassword.mockResolvedValue({});

    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/אימייל/i), 'test@test.com');
    await user.click(screen.getByRole('button', { name: /שלח קישור/i }));

    await waitFor(() => {
      expect(mockForgotPassword).toHaveBeenCalledWith('test@test.com');
    });
  });

  it('should show success message after submit', async () => {
    const user = userEvent.setup();
    mockForgotPassword.mockResolvedValue({});

    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/אימייל/i), 'test@test.com');
    await user.click(screen.getByRole('button', { name: /שלח קישור/i }));

    await waitFor(() => {
      expect(screen.getByText(/נשלח אליו קישור/i)).toBeInTheDocument();
    });
  });

  it('should show error message on failure', async () => {
    const user = userEvent.setup();
    mockForgotPassword.mockRejectedValue(new Error('שגיאה'));

    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/אימייל/i), 'test@test.com');
    await user.click(screen.getByRole('button', { name: /שלח קישור/i }));

    await waitFor(() => {
      expect(screen.getByText(/שגיאה/i)).toBeInTheDocument();
    });
  });

  it('should show loading state while submitting', async () => {
    const user = userEvent.setup();
    mockForgotPassword.mockImplementation(() => new Promise(() => {}));

    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/אימייל/i), 'test@test.com');
    await user.click(screen.getByRole('button', { name: /שלח קישור/i }));

    await waitFor(() => {
      expect(screen.getByText(/שולח/i)).toBeInTheDocument();
    });
  });
});
