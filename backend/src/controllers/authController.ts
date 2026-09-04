import { Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import path from "path";
import fs from "fs/promises";
import User from "../models/User";
import Watchlist from "../models/Watchlist";
import History from "../models/History";
import { env } from "../config/env";
import { AuthRequest } from "../middleware/authMiddleware";
import type { ApiResponse, AuthPayload } from "../types";

function generateToken(payload: AuthPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "7d" });
}

export async function register(req: AuthRequest, res: Response): Promise<void> {
  try {
    const username = typeof req.body.username === "string" ? req.body.username.trim() : "";
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";

    if (!username || !email || !password) {
      res
        .status(400)
        .json({ success: false, message: "All fields are required" });
      return;
    }

    if (username.length < 3) {
      res
        .status(400)
        .json({
          success: false,
          message: "Username must be at least 3 characters",
        });
      return;
    }

    if (password.length < 6) {
      res
        .status(400)
        .json({
          success: false,
          message: "Password must be at least 6 characters",
        });
      return;
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      res
        .status(409)
        .json({ success: false, message: "Email or username already exists" });
      return;
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    let user;
    try {
      user = await User.create({
        username,
        email,
        password: hashedPassword,
      });
    } catch (createError: unknown) {
      const err = createError as { code?: number; keyPattern?: Record<string, number> };
      if (err?.code === 11000) {
        const field = err.keyPattern?.email
          ? "email"
          : err.keyPattern?.username
            ? "username"
            : "email or username";
        res
          .status(409)
          .json({ success: false, message: `That ${field} is already registered` });
        return;
      }
      throw createError;
    }

    const payload: AuthPayload = {
      userId: user._id.toString(),
      email: user.email,
    };

    const token = generateToken(payload);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Registration failed";
    res.status(500).json({ success: false, message });
  }
}

export async function login(req: AuthRequest, res: Response): Promise<void> {
  try {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";

    if (!email || !password) {
      res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
      return;
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      res.status(401).json({ success: false, message: "Invalid credentials" });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      res.status(401).json({ success: false, message: "Invalid credentials" });
      return;
    }

    const payload: AuthPayload = {
      userId: user._id.toString(),
      email: user.email,
    };

    const token = generateToken(payload);

    res.json({
      success: true,
      data: {
        token,
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    res.status(500).json({ success: false, message });
  }
}

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = await User.findById(req.user!.userId);

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    const response: ApiResponse<any> = {
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
    };
    res.json(response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch user";
    res.status(500).json({ success: false, message });
  }
}

export async function updateProfile(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const username = typeof req.body.username === "string" ? req.body.username.trim() : "";
    const { avatar } = req.body;

    const updateData: Record<string, string> = {};
    if (username) {
      if (username.length < 3) {
        res
          .status(400)
          .json({
            success: false,
            message: "Username must be at least 3 characters",
          });
        return;
      }
      updateData.username = username;

      const existingUser = await User.findOne({
        username,
        _id: { $ne: req.user!.userId },
      });
      if (existingUser) {
        res.status(409).json({ success: false, message: "Username already exists" });
        return;
      }
    }
    if (avatar !== undefined && typeof avatar === "string") {
      updateData.avatar = avatar;
    } else if (avatar !== undefined) {
      res.status(400).json({ success: false, message: "Avatar must be a string" });
      return;
    }

    const user = await User.findByIdAndUpdate(req.user!.userId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    res.json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update profile";
    res.status(500).json({ success: false, message });
  }
}

export async function changePassword(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const currentPassword = typeof req.body.currentPassword === "string" ? req.body.currentPassword : "";
    const newPassword = typeof req.body.newPassword === "string" ? req.body.newPassword : "";

    if (!currentPassword || !newPassword) {
      res
        .status(400)
        .json({
          success: false,
          message: "Current and new password are required",
        });
      return;
    }

    if (newPassword.length < 6) {
      res
        .status(400)
        .json({
          success: false,
          message: "New password must be at least 6 characters",
        });
      return;
    }

    const user = await User.findById(req.user!.userId).select("+password");

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      res
        .status(401)
        .json({ success: false, message: "Current password is incorrect" });
      return;
    }

    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ success: true, data: null, message: "Password changed successfully" });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to change password";
    res.status(500).json({ success: false, message });
  }
}

export async function deleteAccount(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const userId = req.user!.userId;
    await Promise.all([
      User.findByIdAndDelete(userId),
      Watchlist.deleteMany({ userId }),
      History.deleteMany({ userId }),
    ]);
    res.json({ success: true, message: "Account deleted successfully" });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete account";
    res.status(500).json({ success: false, message });
  }
}

export async function uploadAvatar(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, message: "No file uploaded" });
      return;
    }

    const user = await User.findById(req.user!.userId);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    const oldAvatar = user.avatar;
    if (oldAvatar && oldAvatar.startsWith("/uploads/")) {
      const relativePath = oldAvatar.startsWith("/") ? oldAvatar.slice(1) : oldAvatar;
      const oldPath = path.join(__dirname, "..", "..", relativePath);
      fs.unlink(oldPath).catch(() => {});
    }

    user.avatar = `/uploads/avatars/${file.filename}`;
    await user.save();

    res.json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to upload avatar";
    res.status(500).json({ success: false, message });
  }
}
