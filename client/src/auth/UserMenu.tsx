import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from './AuthContext';
import { useTheme } from '../theme/ThemeContext';
import './UserMenu.css';

export function UserMenu() {
  const { user, loading, login, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!user?.isAdmin) { setPendingCount(0); return; }
    fetch('/api/admin/transactions/pending', { credentials: 'include' })
      .then(r => r.ok ? r.json() as Promise<{ transactions: unknown[] }> : { transactions: [] })
      .then(d => setPendingCount(d.transactions.length))
      .catch(() => {});
  }, [user]);

  if (loading) return null;

  if (user) {
    return (
      <div className="user-menu">
        <button className="user-menu__trigger" onClick={() => setOpen(o => !o)} aria-label="Account menu">
          {user.picture
            ? <img className="user-menu__avatar" src={user.picture} alt="" referrerPolicy="no-referrer" />
            : <span className="user-menu__avatar user-menu__avatar--fallback">👤</span>}
          {pendingCount > 0 && (
            <span className="user-menu__badge">{pendingCount > 9 ? '9+' : pendingCount}</span>
          )}
        </button>
        {open && (
          <>
            <div className="user-menu__backdrop" onClick={() => setOpen(false)} />
            <div className="user-menu__dropdown">
              {user.isAdmin && (
                <Link to="/admin" className="user-menu__item" onClick={() => setOpen(false)}>
                  <span className="user-menu__item-icon">⚙️</span> Admin
                </Link>
              )}
              <div className="user-menu__theme">
                <span className="user-menu__theme-label">
                  {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
                </span>
                <label className="user-menu__toggle">
                  <input type="checkbox" checked={theme === 'light'} onChange={toggleTheme} />
                  <span className="user-menu__toggle-track" />
                </label>
              </div>
              <button className="user-menu__item user-menu__item--signout" onClick={() => void logout()}>
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="user-menu">
      <GoogleLogin
        useOneTap
        onSuccess={(response) => {
          if (response.credential) void login(response.credential);
        }}
        onError={() => console.warn('Google login failed')}
        size="medium"
        theme="filled_black"
      />
    </div>
  );
}
