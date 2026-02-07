import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserMenu from '../components/UserMenu';

// Mock useAuth
vi.mock('../contexts/useAuth', () => ({
  useAuth: vi.fn()
}));

import { useAuth } from '../contexts/useAuth';

describe('UserMenu', () => {
  const mockLogout = vi.fn();
  const mockChangePassword = vi.fn();
  const mockUser = {
    first_name: 'Test',
    last_name: 'User',
    email: 'test@test.com',
    role: 'admin'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      user: mockUser,
      logout: mockLogout,
      changePassword: mockChangePassword
    });
  });

  it('should render nothing when no user', () => {
    useAuth.mockReturnValue({
      user: null,
      logout: mockLogout,
      changePassword: mockChangePassword
    });

    const { container } = render(<UserMenu />);
    expect(container.firstChild).toBeNull();
  });

  it('should render user name and role', () => {
    render(<UserMenu />);

    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('מנהל')).toBeInTheDocument();
  });

  it('should toggle dropdown on click', async () => {
    const user = userEvent.setup();
    render(<UserMenu />);

    // Dropdown should not be visible initially
    expect(screen.queryByText('שינוי סיסמה')).not.toBeInTheDocument();

    // Click to open - get the button with the user name
    await user.click(screen.getByText('Test User').closest('button'));
    expect(screen.getByText('שינוי סיסמה')).toBeInTheDocument();

    // Click the toggle button again to close (not the dropdown items)
    await user.click(screen.getByText('Test User').closest('button'));

    await waitFor(() => {
      expect(screen.queryByText('שינוי סיסמה')).not.toBeInTheDocument();
    });
  });

  it('should show user email in dropdown', async () => {
    const user = userEvent.setup();
    render(<UserMenu />);

    await user.click(screen.getByText('Test User').closest('button'));
    expect(screen.getByText('test@test.com')).toBeInTheDocument();
  });

  it('should call logout when clicking logout button', async () => {
    const user = userEvent.setup();
    render(<UserMenu />);

    await user.click(screen.getByText('Test User').closest('button'));
    await user.click(screen.getByText('התנתק'));

    expect(mockLogout).toHaveBeenCalled();
  });

  it('should show correct role label for instructor', () => {
    useAuth.mockReturnValue({
      user: { ...mockUser, role: 'instructor' },
      logout: mockLogout,
      changePassword: mockChangePassword
    });

    render(<UserMenu />);
    expect(screen.getByText('מדריך')).toBeInTheDocument();
  });

  it('should show correct role label for tester', () => {
    useAuth.mockReturnValue({
      user: { ...mockUser, role: 'tester' },
      logout: mockLogout,
      changePassword: mockChangePassword
    });

    render(<UserMenu />);
    expect(screen.getByText('בוחן')).toBeInTheDocument();
  });

  it('should show correct role label for student', () => {
    useAuth.mockReturnValue({
      user: { ...mockUser, role: 'student' },
      logout: mockLogout,
      changePassword: mockChangePassword
    });

    render(<UserMenu />);
    expect(screen.getByText('חניך')).toBeInTheDocument();
  });

  it('should close dropdown when clicking outside', async () => {
    const user = userEvent.setup();

    render(
      <div>
        <div data-testid="outside">Outside</div>
        <UserMenu />
      </div>
    );

    // Open dropdown
    await user.click(screen.getByText('Test User').closest('button'));
    expect(screen.getByText('שינוי סיסמה')).toBeInTheDocument();

    // Click outside
    await user.click(screen.getByTestId('outside'));

    await waitFor(() => {
      expect(screen.queryByText('שינוי סיסמה')).not.toBeInTheDocument();
    });
  });

  it('should open change password modal when clicking change password', async () => {
    const user = userEvent.setup();
    render(<UserMenu />);

    await user.click(screen.getByText('Test User').closest('button'));
    await user.click(screen.getByText('שינוי סיסמה'));

    // Modal should appear
    await waitFor(() => {
      expect(screen.getByText('סיסמה נוכחית')).toBeInTheDocument();
    });
  });
});
