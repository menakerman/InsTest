import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';

// Mock useAuth hook
vi.mock('../contexts/useAuth', () => ({
  useAuth: vi.fn()
}));

import { useAuth } from '../contexts/useAuth';

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading state', () => {
    useAuth.mockReturnValue({
      user: null,
      loading: true,
      isAuthenticated: false
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('טוען...')).toBeInTheDocument();
  });

  it('should redirect to login when not authenticated', () => {
    useAuth.mockReturnValue({
      user: null,
      loading: false,
      isAuthenticated: false
    });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('should render children when authenticated without role requirement', () => {
    useAuth.mockReturnValue({
      user: { id: 1, role: 'student' },
      loading: false,
      isAuthenticated: true
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should render children when user has required role', () => {
    useAuth.mockReturnValue({
      user: { id: 1, role: 'admin' },
      loading: false,
      isAuthenticated: true
    });

    render(
      <MemoryRouter>
        <ProtectedRoute allowedRoles={['admin', 'instructor']}>
          <div>Admin Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });

  it('should redirect student to no-access page when accessing protected route', () => {
    useAuth.mockReturnValue({
      user: { id: 1, role: 'student' },
      loading: false,
      isAuthenticated: true
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/no-access" element={<div>No Access Page</div>} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <div>Admin Only</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('No Access Page')).toBeInTheDocument();
  });

  it('should redirect non-student unauthorized users to home', () => {
    useAuth.mockReturnValue({
      user: { id: 1, role: 'tester' },
      loading: false,
      isAuthenticated: true
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/" element={<div>Home Page</div>} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <div>Admin Only</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Home Page')).toBeInTheDocument();
  });

  it('should allow access when user role is in allowedRoles array', () => {
    useAuth.mockReturnValue({
      user: { id: 1, role: 'instructor' },
      loading: false,
      isAuthenticated: true
    });

    render(
      <MemoryRouter>
        <ProtectedRoute allowedRoles={['admin', 'instructor', 'tester']}>
          <div>Allowed Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Allowed Content')).toBeInTheDocument();
  });
});
