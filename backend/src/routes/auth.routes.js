import express from "express";

import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  refreshAccessToken,
  listUsers,
} from "../controller/authController.js";

import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/refresh", refreshAccessToken);

// Logout and current user
router.post("/logout", logoutUser);
router.get("/me", authenticate, getCurrentUser);
router.get("/users", authenticate, listUsers);

export default router;
