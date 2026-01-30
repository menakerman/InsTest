import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts';
import ChangePasswordModal from './ChangePasswordModal';

export default function UserMenu() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const roleLabels = {
    admin: 'מנהל',
    madar: 'מד"ר',
    instructor: 'מדריך',
    tester: 'בוחן',
    student: 'תלמיד'
  };

  return (
    <>
      <div className="user-menu" ref={menuRef}>
        <button
          className="user-menu-toggle"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="user-name">{user.first_name} {user.last_name}</span>
          <span className="user-role">{roleLabels[user.role]}</span>
          <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
        </button>

        {isOpen && (
          <div className="user-menu-dropdown">
            <div className="user-menu-info">
              <div className="user-email">{user.email}</div>
            </div>
            <div className="user-menu-divider" />
            <button
              className="user-menu-item"
              onClick={() => {
                setIsOpen(false);
                setShowPasswordModal(true);
              }}
            >
              שינוי סיסמה
            </button>
            <button
              className="user-menu-item user-menu-logout"
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
            >
              התנתק
            </button>
          </div>
        )}
      </div>

      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
    </>
  );
}
