import crypto from "crypto";
if (!global.crypto) {
  global.crypto = crypto;
}
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, ".env") });

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import connectDB from "./src/config/db.js";
import authRoutes from "./src/routes/auth.routes.js";
import emailRoutes from "./src/routes/email.routes.js";
import { initSocket } from "./src/socket/socketHandler.js";

const app = express();
const httpServer = http.createServer(app);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

// Initialize Socket.IO with WebSocket + polling
initSocket(httpServer, allowedOrigins);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/email", emailRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "SmartMail Backend API is running with Nodemailer & Socket.IO",
    version: "2.0.0",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    httpServer.listen(PORT, () => {
      console.log(`Server & Socket.IO running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
};

startServer();
