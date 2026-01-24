import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Login from '../pages/Login';

// Mock useAuth
vi.mock('../contexts/useAuth', () => ({
  useAuth: vi.fn()
}));

import { useAuth } from '../contexts/useAuth';

describe('Login Page', () => {
  const mockLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      login: mockLogin
    });
  });

  it('should render login form', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(screen.getByLabelText(/אימייל/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/סיסמה/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /התחבר/i })).toBeInTheDocument();
  });

  it('should show forgot password link', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(screen.getByText(/שכחתי סיסמה/i)).toBeInTheDocument();
  });

  it('should call login with form data on submit', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({ role: 'admin' });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/אימייל/i), 'test@test.com');
    await user.type(screen.getByLabelText(/סיסמה/i), 'password123');
    await user.click(screen.getByRole('button', { name: /התחבר/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@test.com', 'password123');
    });
  });

  it('should show error message on failed login', async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValue(new Error('אימייל או סיסמה שגויים'));

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/אימייל/i), 'test@test.com');
    await user.type(screen.getByLabelText(/סיסמה/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /התחבר/i }));

    await waitFor(() => {
      expect(screen.getByText(/אימייל או סיסמה שגויים/i)).toBeInTheDocument();
    });
  });

  it('should show loading state while logging in', async () => {
    const user = userEvent.setup();
    mockLogin.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/אימייל/i), 'test@test.com');
    await user.type(screen.getByLabelText(/סיסמה/i), 'password123');
    await user.click(screen.getByRole('button', { name: /התחבר/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /מתחבר/i })).toBeInTheDocument();
    });
  });

  it('should redirect student to no-access after login', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({ role: 'student' });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/no-access" element={<div>No Access</div>} />
        </Routes>
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/אימייל/i), 'student@test.com');
    await user.type(screen.getByLabelText(/סיסמה/i), 'password123');
    await user.click(screen.getByRole('button', { name: /התחבר/i }));

    await waitFor(() => {
      expect(screen.getByText('No Access')).toBeInTheDocument();
    });
  });

  it('should redirect non-student to home after login', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({ role: 'admin' });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<div>Home Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/אימייל/i), 'admin@test.com');
    await user.type(screen.getByLabelText(/סיסמה/i), 'password123');
    await user.click(screen.getByRole('button', { name: /התחבר/i }));

    await waitFor(() => {
      expect(screen.getByText('Home Page')).toBeInTheDocument();
    });
  });

  it('should disable submit button while loading', async () => {
    const user = userEvent.setup();
    mockLogin.mockImplementation(() => new Promise(() => {}));

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/אימייל/i), 'test@test.com');
    await user.type(screen.getByLabelText(/סיסמה/i), 'password123');
    await user.click(screen.getByRole('button', { name: /התחבר/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /מתחבר/i })).toBeDisabled();
    });
  });
});
