import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import type { AuthPayload } from "../types";

export interface AuthRequest extends Request {
  user?: AuthPayload;
  file?: Express.Multer.File;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ success: false, message: "Authentication required" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}