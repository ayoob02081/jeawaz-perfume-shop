// Definitive session loss, signalled from the HTTP client to the auth state
// without either importing the other: httpClient.js reports a refresh that
// the backend rejected (it has then cleared the auth cookies), AuthProvider
// listens and becomes logged out. Only a 401 from /auth/refresh counts; a
// network or server error leaves the session state alone.

export const AUTH_SESSION_EXPIRED_EVENT = "jeawaz:auth-session-expired";

export function isDefinitiveRefreshFailure(error) {
  return error?.response?.status === 401;
}

export function notifySessionExpired(target = globalThis) {
  if (typeof target?.dispatchEvent !== "function") return;
  target.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT));
}

// Returns the unsubscribe function (for a React effect cleanup).
export function onSessionExpired(listener, target = globalThis) {
  if (typeof target?.addEventListener !== "function") return () => {};
  target.addEventListener(AUTH_SESSION_EXPIRED_EVENT, listener);
  return () => target.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, listener);
}
