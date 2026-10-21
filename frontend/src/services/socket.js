import { io } from "socket.io-client";
import { SOCKET_URL } from "./api";

let socketInstance = null;

export function connectSocket(token) {
  if (socketInstance) {
    if (socketInstance.connected) return socketInstance;
    socketInstance.connect();
    return socketInstance;
  }

  const authToken = token || localStorage.getItem("token");
  if (!authToken) return null;

  socketInstance = io(SOCKET_URL, {
    auth: { token: authToken },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socketInstance.on("connect", () => {
    console.log("ConnectHearts Socket.IO connected:", socketInstance.id);
  });

  socketInstance.on("connect_error", (error) => {
    console.warn("Socket connection error:", error.message);
  });

  return socketInstance;
}

export function getSocket() {
  return socketInstance;
}

export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
