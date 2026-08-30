import { Request, Response, NextFunction } from "express";

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error("Error:", err.message);

  const status = (err as { statusCode?: number }).statusCode || 500;
  const message =
    status === 500
      ? "Internal server error"
      : err.message || "Something went wrong";

  res.status(status).json({
    success: false,
    message,
  });
}