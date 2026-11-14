import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let io = null;

export const initSocket = (httpServer, allowedOrigins) => {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(null, true); // Dev convenience
      },
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  // Socket Authentication Middleware
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(" ")[1];

      if (!token) {
        return next(new Error("Authentication token required for Socket connection"));
      }

      const secret = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET;
      const decoded = jwt.verify(token, secret);
      socket.userId = decoded.userId;
      next();
    } catch (err) {
      console.error("Socket authentication error:", err.message);
      return next(new Error("Invalid or expired socket token"));
    }
  });

  // On Client Connection
  io.on("connection", (socket) => {
    const userId = socket.userId;
    const userRoom = `user:${userId}`;

    // Join user-specific room
    socket.join(userRoom);
    console.log(`[Socket.IO] User ${userId} connected and joined room ${userRoom} (socket: ${socket.id})`);

    // Client can also explicitly request room joining
    socket.on("join_room", (customRoom) => {
      if (customRoom) {
        socket.join(customRoom);
      }
    });

    // Client can ping for unread count
    socket.on("request_unread_count", async () => {
      // handled via controller or direct emit
    });

    socket.on("disconnect", () => {
      console.log(`[Socket.IO] User ${userId} disconnected (socket: ${socket.id})`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO has not been initialized yet!");
  }
  return io;
};

// Send real-time notification of new incoming email
export const notifyNewEmail = (emailData, recipientUserId, unreadCount) => {
  if (!io) return;
  const userRoom = `user:${recipientUserId}`;

  io.to(userRoom).emit("new_email", {
    email: emailData,
    unreadCount,
    timestamp: new Date().toISOString(),
  });

  io.to(userRoom).emit("update_unread_count", {
    unreadCount,
  });

  console.log(`[Socket.IO] Emitted new_email & unreadCount (${unreadCount}) to room ${userRoom}`);
};

// Update unread count for user in real-time
export const notifyUnreadCount = (userId, unreadCount) => {
  if (!io) return;
  const userRoom = `user:${userId}`;
  io.to(userRoom).emit("update_unread_count", { unreadCount });
};
