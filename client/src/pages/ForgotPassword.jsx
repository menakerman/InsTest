import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts';

export default function ForgotPassword() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await forgotPassword(email);
      setSuccess(true);
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
          <h1>איפוס סיסמה</h1>
          <p>הזן את כתובת האימייל שלך</p>
        </div>

        {success ? (
          <div className="success-container">
            <div className="success-message">
              אם האימייל קיים במערכת, נשלח אליו קישור לאיפוס סיסמה.
            </div>
            <Link to="/login" className="btn btn-primary btn-full">
              חזרה להתחברות
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="login-form">
            {error && <div className="error">{error}</div>}

            <div className="form-group">
              <label htmlFor="email">אימייל</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'שולח...' : 'שלח קישור איפוס'}
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
