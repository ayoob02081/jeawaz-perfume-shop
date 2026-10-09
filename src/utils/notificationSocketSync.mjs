// Realtime notifications for one signed-in session. The socket is only a
// signal: every event, and every (re)connect, invalidates the persisted
// notification queries, which stay the source of truth.
//
// A transport failure leaves the socket active and Socket.IO reconnects by
// itself. A handshake the server rejected (expired or missing access cookie)
// leaves it inactive for good, so the session is renewed through the regular
// REST flow (`refreshAuth`: an authenticated request, which the HTTP client
// refreshes on 401) and the socket reconnects once. Renewal attempts are
// bounded until a connection succeeds; a refused refresh is left to the HTTP
// client's session-loss flow.

export const NOTIFICATION_EVENT = "notification:new";
export const MAX_SOCKET_AUTH_RETRIES = 2;

export function createNotificationSocketSync({
  socket,
  queryClient,
  keys,
  notify,
  refreshAuth,
  maxAuthRetries = MAX_SOCKET_AUTH_RETRIES,
}) {
  let stopped = false;
  let renewing = false;
  let authRetries = 0;

  const reconcile = () => {
    queryClient.invalidateQueries({ queryKey: keys.lists() });
    queryClient.invalidateQueries({ queryKey: keys.unreadCount(), exact: true });
  };

  const onNotification = (notification) => {
    notify(notification);
    reconcile();
  };

  // Also the first connect: anything created before it is fetched again.
  const onConnect = () => {
    authRetries = 0;
    reconcile();
  };

  const onConnectError = async () => {
    if (stopped || socket.active || renewing) return;
    if (authRetries >= maxAuthRetries) return;

    authRetries += 1;
    renewing = true;
    try {
      await refreshAuth();
    } catch {
      return;
    } finally {
      renewing = false;
    }

    if (!stopped) socket.connect();
  };

  return {
    start() {
      socket.on(NOTIFICATION_EVENT, onNotification);
      socket.on("connect", onConnect);
      socket.on("connect_error", onConnectError);
    },
    stop() {
      stopped = true;
      socket.off(NOTIFICATION_EVENT, onNotification);
      socket.off("connect", onConnect);
      socket.off("connect_error", onConnectError);
    },
  };
}
