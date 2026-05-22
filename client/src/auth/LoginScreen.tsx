import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from './AuthContext';
import { ThemeToggle } from '../theme/ThemeToggle';
import './LoginScreen.css';

export function LoginScreen() {
  const { login } = useAuth();

  return (
    <div className="login-screen">
      <div className="login-screen__theme-toggle">
        <ThemeToggle />
      </div>
      <div className="login-screen__card">
        <div className="login-screen__logo">📷</div>
        <h1 className="login-screen__title">MaiPhotos</h1>
        <p className="login-screen__subtitle">Sign in to continue</p>
        <GoogleLogin
          onSuccess={(response) => {
            if (response.credential) void login(response.credential);
          }}
          onError={() => console.warn('Google login failed')}
        />
      </div>
    </div>
  );
}
