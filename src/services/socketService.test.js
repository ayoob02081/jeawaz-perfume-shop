import { io } from "socket.io-client";
import { connectSocket, disconnectSocket } from "./socketService";

jest.mock("socket.io-client", () => ({
  io: jest.fn(),
}), { virtual: true });

describe("socketService singleton", () => {
  it("reuses one active socket and creates a new one only after disconnect", () => {
    const firstSocket = createSocket();
    const secondSocket = createSocket();
    io.mockReturnValueOnce(firstSocket).mockReturnValueOnce(secondSocket);

    expect(connectSocket()).toBe(firstSocket);
    expect(connectSocket()).toBe(firstSocket);
    expect(io).toHaveBeenCalledTimes(1);

    disconnectSocket();

    expect(firstSocket.removeAllListeners).toHaveBeenCalledTimes(1);
    expect(firstSocket.disconnect).toHaveBeenCalledTimes(1);
    expect(connectSocket()).toBe(secondSocket);
    expect(io).toHaveBeenCalledTimes(2);
  });
});

function createSocket() {
  return {
    id: "socket-id",
    on: jest.fn(),
    removeAllListeners: jest.fn(),
    disconnect: jest.fn(),
  };
}
