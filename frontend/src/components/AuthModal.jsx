import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const AuthModal = ({ mode, onClose, onSwitchMode }) => {
  const { login, register } = useAuth();
  const isLogin = mode === 'login';
  const [email, setEmail] = useState(isLogin ? 'admin@suplai.com' : '');
  const [password, setPassword] = useState(isLogin ? 'admin123' : '');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, fullName, null);
      }
      onClose();
    } catch (err) {
      const detail = err.response?.data?.detail;
      const msg = typeof detail === 'string' ? detail : err.message;
      if (err.response?.status === 404) {
        setError('Backend auth not found. Restart API: python -m uvicorn main:app --port 8000 --reload');
      } else if (err.code === 'ERR_NETWORK') {
        setError('Cannot reach backend. Start: python -m uvicorn main:app --port 8000');
      } else {
        setError(msg || 'Request failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose}>×</button>
        <h2>{isLogin ? 'Sign in' : 'Register'}</h2>
        <form onSubmit={onSubmit} className="auth-form">
          {!isLogin && (
            <>
              <label>Full name</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </>
          )}
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <div className="auth-error">{error}</div>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Please wait…' : isLogin ? 'Login' : 'Create account'}
          </button>
        </form>
        <p className="auth-footer">
          {isLogin ? (
            <>No account? <button type="button" className="link-btn" onClick={() => onSwitchMode('register')}>Register</button></>
          ) : (
            <>Have an account? <button type="button" className="link-btn" onClick={() => onSwitchMode('login')}>Login</button></>
          )}
        </p>
        {isLogin && <p className="auth-hint">Demo: admin@suplai.com / admin123</p>}
      </div>
    </div>
  );
};

export default AuthModal;
