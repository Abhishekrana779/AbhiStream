import { Request, Response, NextFunction } from "express";

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error("Error:", err.message);

  const e = err as { statusCode?: number; status?: number };
  const status = e.statusCode || e.status || 500;
  const message =
    status === 500
      ? "Internal server error"
      : err.message || "Something went wrong";

  res.status(status).json({
    success: false,
    message,
  });
}