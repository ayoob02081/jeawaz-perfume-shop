"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { loginApi, logoutApi } from "@/services/authServices";
import { getUserApi, updateUserApi } from "@/services/usersServices";
import { onSessionExpired } from "@/utils/authSessionEvents.mjs";
import { sessionLifecycle, SessionSupersededError } from "@/utils/sessionLifecycle.mjs";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Loading also covers later identity checks; initialization ends only once.
  const [initialized, setInitialized] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionExpiredAt, setSessionExpiredAt] = useState(null);
  const userRef = useRef(null);
  const confirmationRef = useRef(null);
  const mountedRef = useRef(true);

  const settle = useCallback(() => {
    setLoading(false);
    setInitialized(true);
  }, []);

  // One identity read per generation at a time. Automatic reconciliation and
  // Login's strict confirmation share the request; a failed confirmation can
  // be retried without replaying the accepted credential.
  const checkAuth = useCallback(({ requireUser = false } = {}) => {
    if (!sessionLifecycle.canConfirm()) {
      return requireUser ? Promise.reject(new SessionSupersededError()) : Promise.resolve();
    }
    const assertConfirmation = (captured, requireReady = false) => {
      sessionLifecycle.assertCurrent(captured, requireReady);
      if (!mountedRef.current || !sessionLifecycle.canConfirm()) throw new SessionSupersededError();
    };
    const generation = sessionLifecycle.generation();
    let confirmation = confirmationRef.current;
    if (!confirmation || confirmation.generation !== generation) {
      sessionLifecycle.pause();
      setSessionReady(false);
      setLoading(true);
      confirmation = { generation };
      const confirm = async (me) => {
        sessionLifecycle.assertCurrent(generation);
        if (!mountedRef.current) throw new SessionSupersededError();
        const identity = me?.id ?? null;
        let captured = generation;
        if (sessionLifecycle.identity() !== undefined && sessionLifecycle.identity() !== identity) {
          captured = sessionLifecycle.invalidate("confirmed-identity");
        }
        await sessionLifecycle.wait(captured);
        assertConfirmation(captured);
        sessionLifecycle.confirm(captured, identity);
        assertConfirmation(captured, true);
        confirmation.acceptedGeneration = captured;
        userRef.current = me;
        setUser(me);
        setSessionReady(true);
        settle();
        return me;
      };
      confirmation.promise = (async () => {
        try {
          const me = await getUserApi();
          if (!me?.id) throw new Error("Authenticated user was not confirmed");
          return await confirm(me);
        } catch (error) {
          if (sessionLifecycle.current(generation) && mountedRef.current) {
            if (error?.response?.status === 401) await confirm(null);
            else { sessionLifecycle.unconfirmed(); settle(); } // Keep mutations suspended when identity is unknown.
          }
          throw error;
        } finally {
          if (confirmationRef.current === confirmation) confirmationRef.current = null;
        }
      })();
      confirmationRef.current = confirmation;
    }
    return confirmation.promise.then((me) => {
      if (requireUser) {
        assertConfirmation(confirmation.acceptedGeneration, true);
        if (!me?.id) throw new Error("Authenticated user was not confirmed");
        return me;
      }
    }, (error) => { if (requireUser) throw error; });
  }, [settle]);

  // A layout effect: every layout effect runs before any passive effect, so the
  // stored session marker is replayed before descendant queries dispatch. As a
  // passive parent effect it ran after them and superseded their requests.
  useLayoutEffect(() => {
    mountedRef.current = true;
    const unsubscribe = sessionLifecycle.subscribe((event) => {
      if (event.type === "invalidate") {
        userRef.current = null;
        setUser(null);
        setSessionReady(false);
        setLoading(true);
      } else if (event.type === "reconcile" || (event.type === "settled" && !event.changing)) {
        if (event.reason === "logout" && event.success) {
          const captured = sessionLifecycle.generation();
          void sessionLifecycle.wait(captured).then(() => {
            if (!mountedRef.current || !sessionLifecycle.canConfirm()) return;
            sessionLifecycle.confirm(captured, null);
            sessionLifecycle.assertCurrent(captured, true);
            userRef.current = null;
            setUser(null);
            setSessionReady(true);
            settle();
          }).catch(() => {});
        } else void checkAuth();
      }
    });
    const disconnect = sessionLifecycle.connect(window);
    void checkAuth();
    return () => { mountedRef.current = false; unsubscribe(); disconnect(); sessionLifecycle.unconfirmed(); };
  }, [checkAuth, settle]);

  useEffect(() => onSessionExpired(() => {
    if (!userRef.current) return;
    setSessionExpiredAt(Date.now());
    const captured = sessionLifecycle.invalidate("session-expired");
    sessionLifecycle.announce();
    void sessionLifecycle.wait(captured).then(() => {
      if (!mountedRef.current || !sessionLifecycle.canConfirm()) return;
      sessionLifecycle.confirm(captured, null);
      sessionLifecycle.assertCurrent(captured, true);
      setSessionReady(true);
      settle();
    }).catch(() => {});
  }), [settle]);

  const login = useCallback(async (data, { requireUser = false } = {}) => {
    await loginApi(data);
    await checkAuth({ requireUser });
  }, [checkAuth]);

  const updateUser = useCallback(async (data) => {
    await updateUserApi(data);
    await checkAuth();
  }, [checkAuth]);

  const logout = useCallback(async () => {
    await logoutApi();
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      initializing: !initialized,
      sessionReady,
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
      sessionReady,
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
