import { createContext, useContext, useState, useEffect } from 'react';
import { googleLogout } from '@react-oauth/google';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  // Separate state for the login action — avoids unmounting the Google GSI
  // script mid-flow (which causes the gsi/transform hang)
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.success) {
        setUser(data.data);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const loginWithCredential = async (credential) => {
    // NOTE: do NOT set isLoadingAuth here — that would unmount the login page
    // while Google's GSI iframe is still mid-flow, causing gsi/transform to hang.
    setIsLoggingIn(true);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.data);
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: 'Network error during login' };
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      googleLogout();
      setUser(null);
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoadingAuth,
    isLoggingIn,
    loginWithCredential,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
