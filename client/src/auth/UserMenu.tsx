import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from './AuthContext';
import './UserMenu.css';

export function UserMenu() {
  const { user, loading, login, logout } = useAuth();

  if (loading) return null;

  if (user) {
    return (
      <div className="user-menu">
        {user.picture && <img className="user-menu__avatar" src={user.picture} alt="" referrerPolicy="no-referrer" />}
        <span className="user-menu__name">{user.name}</span>
        <button className="user-menu__logout" onClick={() => void logout()}>
          Sign out
        </button>
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
