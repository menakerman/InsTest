import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('הסיסמאות אינן תואמות');
      return;
    }

    setLoading(true);

    try {
      await resetPassword(token, newPassword);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>הגדרת סיסמה חדשה</h1>
          <p>הזן סיסמה חדשה</p>
        </div>

        {success ? (
          <div className="success-container">
            <div className="success-message">
              הסיסמה אופסה בהצלחה! מעביר להתחברות...
            </div>
            <Link to="/login" className="btn btn-primary btn-full">
              התחבר עכשיו
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="login-form">
            {error && <div className="error">{error}</div>}

            <div className="form-group">
              <label htmlFor="newPassword">סיסמה חדשה</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">אישור סיסמה</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'שומר...' : 'אפס סיסמה'}
            </button>

            <div className="login-links">
              <Link to="/login">חזרה להתחברות</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
