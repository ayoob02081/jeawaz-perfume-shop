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

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const authGeneration = useRef(0);

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
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(
    async (data) => {
      const generation = ++authGeneration.current;
      setLoading(true);

      try {
        await loginApi(data);
      } catch (error) {
        if (generation === authGeneration.current) {
          setLoading(false);
        }

        throw error;
      }

      if (generation === authGeneration.current) {
        await checkAuth();
      }
    },
    [checkAuth],
  );

  const updateUser = useCallback(
    async (data) => {
      const generation = ++authGeneration.current;
      setLoading(true);

      try {
        await updateUserApi(data);
      } catch (error) {
        if (generation === authGeneration.current) {
          setLoading(false);
        }

        throw error;
      }

      if (generation === authGeneration.current) {
        await checkAuth();
      }
    },
    [checkAuth],
  );

  const logout = useCallback(async () => {
    const generation = ++authGeneration.current;
    setLoading(true);

    try {
      await logoutApi();
    } catch (error) {
      if (generation === authGeneration.current) {
        setLoading(false);
      }

      throw error;
    }

    if (generation === authGeneration.current) {
      setUser(null);
      setLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      checkAuth,
      login,
      updateUser,
      logout,
    }),
    [user, loading, checkAuth, login, updateUser, logout],
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
