import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ManageUsers from '../pages/ManageUsers';

// Mock api functions
vi.mock('../utils/api', () => ({
  getUsers: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn()
}));

import { getUsers, createUser, updateUser, deleteUser } from '../utils/api';

describe('ManageUsers', () => {
  const mockUsers = [
    { id: 1, first_name: 'Admin', last_name: 'User', email: 'admin@test.com', role: 'admin', is_active: true },
    { id: 2, first_name: 'Test', last_name: 'Instructor', email: 'instructor@test.com', role: 'instructor', is_active: true },
    { id: 3, first_name: 'Inactive', last_name: 'User', email: 'inactive@test.com', role: 'student', is_active: false }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    getUsers.mockResolvedValue(mockUsers);
  });

  it('should show loading state initially', async () => {
    getUsers.mockImplementation(() => new Promise(() => {}));
    render(<ManageUsers />);
    expect(screen.getByText('טוען...')).toBeInTheDocument();
  });

  it('should display users after loading', async () => {
    render(<ManageUsers />);

    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });

    expect(screen.getByText('Test Instructor')).toBeInTheDocument();
    expect(screen.getByText('Inactive User')).toBeInTheDocument();
  });

  it('should show role labels in Hebrew', async () => {
    render(<ManageUsers />);

    await waitFor(() => {
      expect(screen.getByText('מנהל')).toBeInTheDocument();
    });

    expect(screen.getByText('מדריך')).toBeInTheDocument();
    expect(screen.getByText('חניך')).toBeInTheDocument();
  });

  it('should show active/inactive status', async () => {
    render(<ManageUsers />);

    await waitFor(() => {
      expect(screen.getAllByText('פעיל').length).toBe(2);
      expect(screen.getByText('לא פעיל')).toBeInTheDocument();
    });
  });

  it('should show empty state when no users', async () => {
    getUsers.mockResolvedValue([]);
    render(<ManageUsers />);

    await waitFor(() => {
      expect(screen.getByText('אין משתמשים')).toBeInTheDocument();
    });
  });

  it('should show error message on fetch failure', async () => {
    getUsers.mockRejectedValue(new Error('Failed to fetch'));
    render(<ManageUsers />);

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
    });
  });

  it('should open create user modal', async () => {
    const user = userEvent.setup();
    render(<ManageUsers />);

    await waitFor(() => {
      expect(screen.getByText('הוסף משתמש')).toBeInTheDocument();
    });

    await user.click(screen.getByText('הוסף משתמש'));

    expect(screen.getByText('הוספת משתמש')).toBeInTheDocument();
    expect(screen.getByLabelText('שם פרטי')).toBeInTheDocument();
  });

  it('should open edit user modal', async () => {
    const user = userEvent.setup();
    render(<ManageUsers />);

    await waitFor(() => {
      expect(screen.getAllByText('ערוך')[0]).toBeInTheDocument();
    });

    await user.click(screen.getAllByText('ערוך')[0]);

    expect(screen.getByText('עריכת משתמש')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Admin')).toBeInTheDocument();
  });

  it('should close modal when clicking cancel', async () => {
    const user = userEvent.setup();
    render(<ManageUsers />);

    await waitFor(() => {
      expect(screen.getByText('הוסף משתמש')).toBeInTheDocument();
    });

    await user.click(screen.getByText('הוסף משתמש'));
    expect(screen.getByText('הוספת משתמש')).toBeInTheDocument();

    await user.click(screen.getByText('ביטול'));
    expect(screen.queryByText('הוספת משתמש')).not.toBeInTheDocument();
  });

  it('should create new user', async () => {
    const user = userEvent.setup();
    const newUser = {
      id: 4,
      first_name: 'New',
      last_name: 'User',
      email: 'new@test.com',
      role: 'student',
      is_active: true
    };
    createUser.mockResolvedValue(newUser);

    render(<ManageUsers />);

    await waitFor(() => {
      expect(screen.getByText('הוסף משתמש')).toBeInTheDocument();
    });

    await user.click(screen.getByText('הוסף משתמש'));

    await user.type(screen.getByLabelText('שם פרטי'), 'New');
    await user.type(screen.getByLabelText('שם משפחה'), 'User');
    await user.type(screen.getByLabelText('אימייל'), 'new@test.com');
    await user.type(screen.getByLabelText('סיסמה'), 'password123');

    await user.click(screen.getByText('שמור'));

    await waitFor(() => {
      expect(createUser).toHaveBeenCalled();
    });
  });

  it('should show error for short password on create', async () => {
    const user = userEvent.setup();

    render(<ManageUsers />);

    await waitFor(() => {
      expect(screen.getByText('הוסף משתמש')).toBeInTheDocument();
    });

    await user.click(screen.getByText('הוסף משתמש'));

    await user.type(screen.getByLabelText('שם פרטי'), 'New');
    await user.type(screen.getByLabelText('שם משפחה'), 'User');
    await user.type(screen.getByLabelText('אימייל'), 'new@test.com');
    await user.type(screen.getByLabelText('סיסמה'), '123');

    await user.click(screen.getByText('שמור'));

    expect(screen.getByText(/6 תווים/)).toBeInTheDocument();
  });

  it('should update existing user', async () => {
    const user = userEvent.setup();
    const updatedUser = { ...mockUsers[0], first_name: 'Updated' };
    updateUser.mockResolvedValue(updatedUser);

    render(<ManageUsers />);

    await waitFor(() => {
      expect(screen.getAllByText('ערוך')[0]).toBeInTheDocument();
    });

    await user.click(screen.getAllByText('ערוך')[0]);

    await user.clear(screen.getByLabelText('שם פרטי'));
    await user.type(screen.getByLabelText('שם פרטי'), 'Updated');

    await user.click(screen.getByText('שמור'));

    await waitFor(() => {
      expect(updateUser).toHaveBeenCalledWith(1, expect.objectContaining({
        first_name: 'Updated'
      }));
    });
  });

  it('should show delete confirmation dialog', async () => {
    const user = userEvent.setup();

    render(<ManageUsers />);

    await waitFor(() => {
      expect(screen.getAllByText('מחק')[0]).toBeInTheDocument();
    });

    await user.click(screen.getAllByText('מחק')[0]);

    expect(screen.getByText('מחיקת משתמש')).toBeInTheDocument();
    // The confirm dialog shows the user name in bold
    expect(screen.getByRole('strong')).toHaveTextContent('Admin User');
  });

  it('should delete user after confirmation', async () => {
    const user = userEvent.setup();
    deleteUser.mockResolvedValue({});

    render(<ManageUsers />);

    await waitFor(() => {
      expect(screen.getAllByText('מחק')[0]).toBeInTheDocument();
    });

    await user.click(screen.getAllByText('מחק')[0]);

    // Click confirm delete button (there are two "מחק" buttons now)
    const deleteButtons = screen.getAllByText('מחק');
    await user.click(deleteButtons[deleteButtons.length - 1]);

    await waitFor(() => {
      expect(deleteUser).toHaveBeenCalledWith(1);
    });
  });

  it('should cancel delete confirmation', async () => {
    const user = userEvent.setup();

    render(<ManageUsers />);

    await waitFor(() => {
      expect(screen.getAllByText('מחק')[0]).toBeInTheDocument();
    });

    await user.click(screen.getAllByText('מחק')[0]);
    expect(screen.getByText('מחיקת משתמש')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'ביטול' }));

    expect(screen.queryByText('מחיקת משתמש')).not.toBeInTheDocument();
    expect(deleteUser).not.toHaveBeenCalled();
  });
});
