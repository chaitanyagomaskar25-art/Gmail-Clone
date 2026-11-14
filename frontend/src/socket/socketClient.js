import { io } from "socket.io-client";

let socket = null;

export const connectSocket = (token) => {
  if (socket && socket.connected) {
    return socket;
  }

  // Connect to backend
  const socketUrl =
    import.meta.env.VITE_SOCKET_URL ||
    (typeof window !== "undefined" && window.location.port === "5173"
      ? "http://localhost:5000"
      : window.location.origin);

  socket = io(socketUrl, {
    auth: {
      token,
    },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 15,
    reconnectionDelay: 1000,
    withCredentials: true,
  });

  socket.on("connect", () => {
    console.log("[Socket.IO] Connected to server, socket id:", socket.id);
  });

  socket.on("connect_error", (err) => {
    console.warn("[Socket.IO] Connection error:", err.message);
  });

  socket.on("disconnect", (reason) => {
    console.log("[Socket.IO] Disconnected:", reason);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log("[Socket.IO] Socket disconnected manually.");
  }
};

export const getSocket = () => socket;
