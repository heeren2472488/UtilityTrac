import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import SessionExpiredModal from '../components/SessionExpiredModal';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('iam_user');
    const storedToken = localStorage.getItem('iam_token');

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
    setLoading(false);
  }, []);

  const login = (userData, jwt) => {
    setUser(userData);
    setToken(jwt);
    localStorage.setItem('iam_user', JSON.stringify(userData));
    localStorage.setItem('iam_token', jwt);
  };

  // ✅ Normal logout
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('iam_user');
    localStorage.removeItem('iam_token');
  };

  // ✅ Session-expired logout
  const logoutExpired = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('iam_user');
    localStorage.removeItem('iam_token');
    setSessionExpired(true);
  }, []);

  useEffect(() => {
    const handleSessionExpired = () => {
      logoutExpired();
    };

    window.addEventListener('session-expired', handleSessionExpired);

    return () =>
      window.removeEventListener('session-expired', handleSessionExpired);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, logoutExpired, loading }}
    >
      {children}

      {/* ✅ GLOBAL POPUP */}
      {sessionExpired && (
        <SessionExpiredModal
          onLogin={() => (window.location.href = '/login')}
        />
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);