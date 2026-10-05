"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { loginApi, logoutApi } from "@/services/authServices";
import { getUserApi, updateUserApi } from "@/services/usersServices";
import { onSessionExpired } from "@/utils/authSessionEvents.mjs";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // `loading` is also raised by every later login/re-check; `initialized`
  // marks the end of the first one, so screens can tell bootstrapping apart
  // from a re-check and keep their content (and form state) mounted.
  const [initialized, setInitialized] = useState(false);
  // Set when a signed-in session ended because its refresh was rejected.
  const [sessionExpiredAt, setSessionExpiredAt] = useState(null);
  const authGeneration = useRef(0);
  const userRef = useRef(null);
  userRef.current = user;

  const settle = useCallback(() => {
    setLoading(false);
    setInitialized(true);
  }, []);

  const checkAuth = useCallback(async () => {
    const generation = ++authGeneration.current;
    setLoading(true);

    try {
      const me = await getUserApi();

      if (generation !== authGeneration.current) return;

      setUser(me);
    } catch (error) {
      if (
        generation === authGeneration.current &&
        error?.response?.status === 401
      ) {
        setUser(null);
      }
    } finally {
      if (generation === authGeneration.current) {
        settle();
      }
    }
  }, [settle]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // The HTTP client signals a rejected refresh (the backend has cleared the
  // auth cookies). A guest's failed refresh is no session loss; a signed-in
  // user becomes logged out, and any pending re-check is superseded.
  useEffect(
    () =>
      onSessionExpired(() => {
        if (!userRef.current) return;
        authGeneration.current += 1;
        userRef.current = null;
        setUser(null);
        settle();
        setSessionExpiredAt(Date.now());
      }),
    [settle],
  );

  const login = useCallback(
    async (data) => {
      const generation = ++authGeneration.current;
      setLoading(true);

      try {
        await loginApi(data);
      } catch (error) {
        if (generation === authGeneration.current) {
          settle();
        }

        throw error;
      }

      if (generation === authGeneration.current) {
        await checkAuth();
      }
    },
    [checkAuth, settle],
  );

  const updateUser = useCallback(
    async (data) => {
      const generation = ++authGeneration.current;
      setLoading(true);

      try {
        await updateUserApi(data);
      } catch (error) {
        if (generation === authGeneration.current) {
          settle();
        }

        throw error;
      }

      if (generation === authGeneration.current) {
        await checkAuth();
      }
    },
    [checkAuth, settle],
  );

  const logout = useCallback(async () => {
    const generation = ++authGeneration.current;
    setLoading(true);

    try {
      await logoutApi();
    } catch (error) {
      if (generation === authGeneration.current) {
        settle();
      }

      throw error;
    }

    if (generation === authGeneration.current) {
      setUser(null);
      settle();
    }
  }, [settle]);

  const value = useMemo(
    () => ({
      user,
      loading,
      initializing: !initialized,
      sessionExpiredAt,
      isAuthenticated: !!user,
      checkAuth,
      login,
      updateUser,
      logout,
    }),
    [
      user,
      loading,
      initialized,
      sessionExpiredAt,
      checkAuth,
      login,
      updateUser,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
