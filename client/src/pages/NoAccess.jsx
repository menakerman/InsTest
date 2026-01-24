import { useAuth } from '../contexts';

export default function NoAccess() {
  const { user } = useAuth();

  return (
    <div className="no-access-page">
      <div className="no-access-container">
        <div className="no-access-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          </svg>
        </div>
        <h2>אין גישה</h2>
        <p>
          שלום {user?.first_name}, אין לך הרשאות גישה למערכת זו.
        </p>
        <p className="no-access-help">
          אם אתה סבור שמדובר בטעות, פנה למנהל המערכת.
        </p>
      </div>
    </div>
  );
}
