import { useEffect } from "react";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";

import {
  connectSocket,
  disconnectSocket,
  offSocket,
  onSocket,
} from "@/services/socketService";
import { notificationKeys } from "./useNotification";
import { useNotificationSocket } from "./useNotificationSocket";

jest.mock("react", () => ({
  useEffect: jest.fn(),
}), { virtual: true });
jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: { success: jest.fn() },
}), { virtual: true });
jest.mock("@tanstack/react-query", () => ({
  useQueryClient: jest.fn(),
}), { virtual: true });
jest.mock("@/services/socketService", () => ({
  connectSocket: jest.fn(),
  disconnectSocket: jest.fn(),
  onSocket: jest.fn(),
  offSocket: jest.fn(),
}));
jest.mock("./useNotification", () => ({
  notificationKeys: {
    lists: () => ["notifications", "list"],
    unreadCount: () => ["notifications", "unread-count"],
  },
}));

describe("useNotificationSocket", () => {
  const queryClient = {
    invalidateQueries: jest.fn(),
    setQueryData: jest.fn(),
  };
  let effect;

  beforeEach(() => {
    jest.clearAllMocks();
    useQueryClient.mockReturnValue(queryClient);
    useEffect.mockImplementation((callback) => {
      effect = callback;
    });
  });

  it("connects and subscribes for an authenticated user", () => {
    useNotificationSocket(true);
    effect();

    expect(connectSocket).toHaveBeenCalledTimes(1);
    expect(onSocket).toHaveBeenCalledWith(
      "notification:new",
      expect.any(Function),
    );
  });

  it("does not connect for an unauthenticated user", () => {
    useNotificationSocket(false);
    effect();

    expect(connectSocket).not.toHaveBeenCalled();
    expect(onSocket).not.toHaveBeenCalled();
    expect(disconnectSocket).toHaveBeenCalledTimes(1);
  });

  it("removes the listener and disconnects on logout or unmount", () => {
    useNotificationSocket(true);
    const cleanup = effect();
    const handler = onSocket.mock.calls[0][1];

    cleanup();

    expect(offSocket).toHaveBeenCalledWith("notification:new", handler);
    expect(disconnectSocket).toHaveBeenCalledTimes(1);
  });

  it("cleans up before remounting without retaining duplicate listeners", () => {
    useNotificationSocket(true);
    const firstCleanup = effect();
    const firstHandler = onSocket.mock.calls[0][1];
    firstCleanup();

    useNotificationSocket(true);
    effect();
    const secondHandler = onSocket.mock.calls[1][1];

    expect(offSocket).toHaveBeenCalledWith(
      "notification:new",
      firstHandler,
    );
    expect(firstHandler).not.toBe(secondHandler);
    expect(onSocket).toHaveBeenCalledTimes(2);
  });

  it("keeps the toast and invalidates authoritative notification caches", () => {
    useNotificationSocket(true);
    effect();
    const handler = onSocket.mock.calls[0][1];
    const notification = { id: 9, title: "New notification" };

    handler(notification);

    expect(toast.success).toHaveBeenCalledWith("New notification", {
      id: "notification-9",
    });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: notificationKeys.lists(),
    });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: notificationKeys.unreadCount(),
      exact: true,
    });
  });

  it("never overwrites InfiniteData with the incomplete socket payload", () => {
    const infiniteData = {
      pages: [{ data: [], meta: { page: 1 } }],
      pageParams: [1],
    };
    useNotificationSocket(true);
    effect();
    const handler = onSocket.mock.calls[0][1];

    handler({ id: 9, title: "New notification" });
    handler({ id: 9, title: "New notification" });

    expect(queryClient.setQueryData).not.toHaveBeenCalled();
    expect(infiniteData).toEqual({
      pages: [{ data: [], meta: { page: 1 } }],
      pageParams: [1],
    });
    expect(queryClient.invalidateQueries).toHaveBeenCalledTimes(4);
  });
});
