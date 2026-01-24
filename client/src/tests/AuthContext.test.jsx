import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useState } from 'react';
import { AuthProvider, useAuth } from '../contexts';

// Test component that uses auth context
function TestComponent() {
  const { user, isAuthenticated, loading, login, logout, hasRole } = useAuth();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div data-testid="authenticated">{isAuthenticated ? 'yes' : 'no'}</div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'null'}</div>
      <div data-testid="hasAdmin">{hasRole('admin') ? 'yes' : 'no'}</div>
      <button onClick={() => login('test@test.com', 'password')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.getItem.mockReturnValue(null);
  });

  it('should be unauthenticated initially without token', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
    });
  });

  it('should fetch user when token exists', async () => {
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVzdEB0ZXN0LmNvbSIsInJvbGUiOiJhZG1pbiIsImV4cCI6OTk5OTk5OTk5OX0.test';
    window.localStorage.getItem.mockReturnValue(mockToken);

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        id: 1,
        email: 'test@test.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'admin'
      })
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
    });
  });

  it('should logout and clear token on expired token', async () => {
    // Token with exp in the past
    const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVzdEB0ZXN0LmNvbSIsInJvbGUiOiJhZG1pbiIsImV4cCI6MX0.test';
    window.localStorage.getItem.mockReturnValue(expiredToken);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('token');
    });
  });

  it('should login successfully', async () => {
    const user = userEvent.setup();

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        token: 'new-token',
        user: {
          id: 1,
          email: 'test@test.com',
          first_name: 'Test',
          last_name: 'User',
          role: 'admin'
        }
      })
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    await user.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(window.localStorage.setItem).toHaveBeenCalledWith('token', 'new-token');
    });
  });

  it('should throw error on failed login', async () => {
    const user = userEvent.setup();

    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Invalid credentials' })
    });

    // Create component that catches and displays login errors
    function ErrorTestComponent() {
      const { login } = useAuth();
      const [error, setError] = useState(null);

      const handleLogin = async () => {
        try {
          await login('test@test.com', 'wrong');
        } catch (e) {
          setError(e.message);
        }
      };

      return (
        <div>
          <button onClick={handleLogin}>Login</button>
          {error && <div data-testid="error">{error}</div>}
        </div>
      );
    }

    render(
      <AuthProvider>
        <ErrorTestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Login')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Invalid credentials');
    });
  });

  it('should logout and clear storage', async () => {
    const user = userEvent.setup();
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVzdEB0ZXN0LmNvbSIsInJvbGUiOiJhZG1pbiIsImV4cCI6OTk5OTk5OTk5OX0.test';
    window.localStorage.getItem.mockReturnValue(mockToken);

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        id: 1,
        email: 'test@test.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'admin'
      })
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
    });

    await user.click(screen.getByText('Logout'));

    await waitFor(() => {
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('token');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
    });
  });

  it('should correctly check hasRole', async () => {
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVzdEB0ZXN0LmNvbSIsInJvbGUiOiJhZG1pbiIsImV4cCI6OTk5OTk5OTk5OX0.test';
    window.localStorage.getItem.mockReturnValue(mockToken);

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        id: 1,
        email: 'test@test.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'admin'
      })
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('hasAdmin')).toHaveTextContent('yes');
    });
  });

  it('should throw error when useAuth is used outside provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAuth must be used within an AuthProvider');

    consoleError.mockRestore();
  });
});
