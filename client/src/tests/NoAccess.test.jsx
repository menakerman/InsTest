import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import NoAccess from '../pages/NoAccess';

// Mock useAuth
vi.mock('../contexts/useAuth', () => ({
  useAuth: vi.fn()
}));

import { useAuth } from '../contexts/useAuth';

describe('NoAccess Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render no access message', () => {
    useAuth.mockReturnValue({
      user: { first_name: 'Test', last_name: 'User', role: 'student' }
    });

    render(<NoAccess />);

    expect(screen.getByText(/אין גישה/i)).toBeInTheDocument();
  });

  it('should display user first name', () => {
    useAuth.mockReturnValue({
      user: { first_name: 'שלום', last_name: 'כהן', role: 'student' }
    });

    render(<NoAccess />);

    expect(screen.getByText(/שלום שלום/i)).toBeInTheDocument();
  });

  it('should show help message', () => {
    useAuth.mockReturnValue({
      user: { first_name: 'Test', last_name: 'User', role: 'student' }
    });

    render(<NoAccess />);

    expect(screen.getByText(/מנהל המערכת/i)).toBeInTheDocument();
  });

  it('should render no access icon', () => {
    useAuth.mockReturnValue({
      user: { first_name: 'Test', last_name: 'User', role: 'student' }
    });

    render(<NoAccess />);

    const iconContainer = document.querySelector('.no-access-icon');
    expect(iconContainer).toBeInTheDocument();
    expect(iconContainer.querySelector('svg')).toBeInTheDocument();
  });
});
