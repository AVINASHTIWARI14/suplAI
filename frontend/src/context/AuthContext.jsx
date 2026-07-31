import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { fetchMe, login as apiLogin, register as apiRegister } from '../api/client.js';
import { TOKEN_KEY, REFRESH_KEY, setAuthClearedHandler } from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));

  const clearSession = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    setToken(null);
    setUser(null);
  };

  // If the axios refresh flow gives up, drop the session in React too.
  useEffect(() => {
    setAuthClearedHandler(() => {
      setToken(null);
      setUser(null);
    });
    return () => setAuthClearedHandler(null);
  }, []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchMe()
      .then((data) => setUser(data))
      .catch(() => clearSession())
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const persistTokens = (data) => {
    if (data.access_token) localStorage.setItem(TOKEN_KEY, data.access_token);
    if (data.refresh_token) localStorage.setItem(REFRESH_KEY, data.refresh_token);
    setToken(data.access_token);
    setUser(data.user);
  };

  const login = async (email, password) => {
    const data = await apiLogin(email, password);
    persistTokens(data);
    return data.user;
  };

  const register = async (email, password, fullName, companyId) => {
    const data = await apiRegister(email, password, fullName, companyId);
    persistTokens(data);
    return data.user;
  };

  const logout = () => clearSession();

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      register,
      logout,
      role: user?.role ?? null,
      isAdmin: user?.role === 'admin',
      isViewer: user?.role === 'viewer',
      canEdit: user?.role === 'admin',
      isAuthenticated: Boolean(user),
    }),
    [user, token, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
