
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { User } from "../model/User.js";

import {
  generateAccessToken,
  generateRefreshToken,
  hashToken
} from "../utils/generateTokens.js";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/"
};

const setRefreshCookie = (res, token) => {
  res.cookie("refreshToken", token, cookieOptions);
};

const clearRefreshCookie = (res) => {
  const { maxAge, ...options } = cookieOptions;
  res.clearCookie("refreshToken", options);
};



export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required"
      });
    }

    if (typeof name !== "string" ||
        typeof email !== "string" ||
        typeof password !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid input types"
      });
    }

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (normalizedName.length < 2 || normalizedName.length > 50) {
      return res.status(400).json({
        success: false,
        message: "Name must contain 2 to 50 characters"
      });
    }

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email"
      });
    }

    if (password.length < 8 || password.length > 72) {
      return res.status(400).json({
        success: false,
        message: "Password must be between 8 and 72 characters"
      });
    }

    // Check existing user
    const existingUser = await User.findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered"
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password: hashedPassword
    });

    // Generate tokens
    const accessToken = generateAccessToken(user._id.toString());

    const refreshToken = generateRefreshToken(user._id.toString());

    // Store hashed refresh token
    user.refreshTokenHash = hashToken(refreshToken);
    await user.save();

    // Set HTTP-only cookie
    setRefreshCookie(res, refreshToken);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email already registered"
      });
    }

    console.error("Register error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Explicitly select password because select:false
    const user = await User.findOne({
      email: normalizedEmail
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const accessToken = generateAccessToken(user._id.toString());

    const refreshToken = generateRefreshToken(user._id.toString());

    // Rotate refresh token
    user.refreshTokenHash = hashToken(refreshToken);
    await user.save();

    setRefreshCookie(res, refreshToken);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};



export const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token missing"
      });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decoded.userId)
      .select("+refreshTokenHash");

    if (
      !user ||
      !user.refreshTokenHash ||
      user.refreshTokenHash !== hashToken(refreshToken)
    ) {
      clearRefreshCookie(res);

      return res.status(401).json({
        success: false,
        message: "Invalid or revoked refresh token"
      });
    }

    // Rotate refresh token on every refresh
    const newAccessToken = generateAccessToken(user._id.toString());
    const newRefreshToken = generateRefreshToken(user._id.toString());

    user.refreshTokenHash = hashToken(newRefreshToken);
    await user.save();

    setRefreshCookie(res, newRefreshToken);

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      accessToken: newAccessToken
    });

  } catch (error) {
    clearRefreshCookie(res);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token"
    });
  }
};


export const logoutUser = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      try {
        const decoded = jwt.verify(
          refreshToken,
          process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decoded.userId)
          .select("+refreshTokenHash");

        if (
          user &&
          user.refreshTokenHash === hashToken(refreshToken)
        ) {
          user.refreshTokenHash = null;
          await user.save();
        }
      } catch {
        // Expired or invalid token: still clear the cookie.
      }
    }

    clearRefreshCookie(res);

    return res.status(200).json({
      success: true,
      message: "Logout successful"
    });

  } catch (error) {
    console.error("Logout error:", error);

    clearRefreshCookie(res);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error("Get current user error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const listUsers = async (req, res) => {
  try {
    const currentUserId = req.user?.userId;
    const search = req.query.search ? req.query.search.trim() : "";

    const query = currentUserId ? { _id: { $ne: currentUserId } } : {};
    if (search) {
      const regex = new RegExp(search, "i");
      query.$or = [{ name: regex }, { email: regex }];
    }

    const users = await User.find(query)
      .select("name email createdAt")
      .sort({ name: 1 })
      .limit(50);

    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("List users error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

