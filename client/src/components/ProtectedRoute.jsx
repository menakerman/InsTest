import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading">טוען...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If no specific roles required, allow any authenticated user
  if (!allowedRoles || allowedRoles.length === 0) {
    return children;
  }

  // Check if user has one of the allowed roles
  if (!allowedRoles.includes(user.role)) {
    // Students get redirected to no-access page
    if (user.role === 'student') {
      return <Navigate to="/no-access" replace />;
    }
    // Other unauthorized users get redirected to home
    return <Navigate to="/" replace />;
  }

  return children;
}
