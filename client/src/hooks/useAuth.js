import { useCallback, useEffect, useMemo, useState } from 'react';
import { firebaseEnabled } from '../firebase/config.js';

const guestIdKey = 'blackjack.guestId';
const guestNameKey = 'blackjack.guestName';

function getGuestId() {
  const existing = localStorage.getItem(guestIdKey);
  if (existing) return existing;

  const created = `guest_${crypto.randomUUID()}`;
  localStorage.setItem(guestIdKey, created);
  return created;
}

function createGuestProfile(username = 'Guest Player') {
  const guestName = username.trim().slice(0, 24) || 'Guest Player';
  localStorage.setItem(guestNameKey, guestName);
  return {
    id: getGuestId(),
    username: guestName,
    avatar: '',
    email: '',
    emailVerified: false,
    isGuest: true
  };
}

function profileFromFirebaseUser(user) {
  if (!user) return null;
  return {
    id: user.uid,
    username: user.displayName || user.email?.split('@')[0] || 'Casino Player',
    avatar: user.photoURL || '',
    email: user.email || '',
    emailVerified: user.emailVerified,
    isGuest: false
  };
}

export function useAuth() {
  const [profile, setProfile] = useState(() => {
    const savedName = localStorage.getItem(guestNameKey);
    return savedName ? createGuestProfile(savedName) : null;
  });
  const [authMode, setAuthMode] = useState('guest');
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(firebaseEnabled);

  useEffect(() => {
    if (!firebaseEnabled) {
      setLoading(false);
      return undefined;
    }

    let unsubscribe = () => {};
    import('../firebase/client.js')
      .then(({ authApi }) => {
        unsubscribe = authApi.onChange((user) => {
          if (user) {
            setProfile(profileFromFirebaseUser(user));
            setAuthMode('firebase');
          }
          setLoading(false);
        });
      })
      .catch((error) => {
        setAuthError(error.message);
        setLoading(false);
      });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email, password) => {
    setAuthError('');
    try {
      const { authApi } = await import('../firebase/client.js');
      const credential = await authApi.login(email, password);
      setProfile(profileFromFirebaseUser(credential.user));
      setAuthMode('firebase');
    } catch (error) {
      setAuthError(error.message);
      throw error;
    }
  }, []);

  const register = useCallback(async (email, password, username) => {
    setAuthError('');
    try {
      const { authApi } = await import('../firebase/client.js');
      const credential = await authApi.register(email, password, username);
      setProfile(profileFromFirebaseUser(credential.user));
      setAuthMode('firebase');
    } catch (error) {
      setAuthError(error.message);
      throw error;
    }
  }, []);

  const resetPassword = useCallback(async (email) => {
    setAuthError('');
    try {
      const { authApi } = await import('../firebase/client.js');
      await authApi.resetPassword(email);
    } catch (error) {
      setAuthError(error.message);
      throw error;
    }
  }, []);

  const guestLogin = useCallback((username) => {
    const guest = createGuestProfile(username);
    setProfile(guest);
    setAuthMode('guest');
    setAuthError('');
  }, []);

  const logout = useCallback(async () => {
    if (authMode === 'firebase') {
      const { authApi } = await import('../firebase/client.js');
      await authApi.logout();
    }
    localStorage.removeItem(guestNameKey);
    setProfile(null);
    setAuthMode('guest');
  }, [authMode]);

  const getToken = useCallback(async () => {
    if (!firebaseEnabled || profile?.isGuest) return null;
    const { auth } = await import('../firebase/client.js');
    return auth.currentUser?.getIdToken() ?? null;
  }, [profile]);

  return useMemo(() => ({
    profile,
    authMode,
    authError,
    firebaseEnabled,
    loading,
    login,
    register,
    resetPassword,
    guestLogin,
    logout,
    getToken
  }), [authError, authMode, getToken, guestLogin, loading, login, logout, profile, register, resetPassword]);
}
