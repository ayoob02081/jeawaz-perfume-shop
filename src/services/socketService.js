import { io } from "socket.io-client";

let socket = null;

export function connectSocket() {
  if (socket) return socket;

  socket = io(process.env.NEXT_PUBLIC_API_URL, {
    withCredentials: true,
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => {
    console.log("🟢 Socket Connected:", socket.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("🔴 Socket Disconnected:", reason);
  });

  socket.on("connect_error", (err) => {
    console.error("Socket Error:", err.message);
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (!socket) return;

  socket.removeAllListeners();
  socket.disconnect();

  socket = null;
}

export function onSocket(event, callback) {
  socket?.on(event, callback);
}

export function offSocket(event, callback) {
  socket?.off(event, callback);
}

export function emitSocket(event, payload) {
  socket?.emit(event, payload);
}
