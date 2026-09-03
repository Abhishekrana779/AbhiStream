import mongoose from "mongoose";
import { env } from "./config/env";
import { connectDB } from "./config/db";
import app from "./app";

const killConflictingProcess = async (port: number): Promise<void> => {
  try {
    const { exec } = await import("child_process");
    await new Promise<void>((resolve) => {
      exec(`lsof -ti:${port}`, (err, stdout) => {
        if (err || !stdout) return resolve();
        const pids = stdout.trim().split("\n").filter(Boolean);
        for (const pid of pids) {
          process.kill(Number(pid), "SIGKILL");
          console.log(`Killed conflicting process (PID: ${pid}) on port ${port}`);
        }
        resolve();
      });
    });
  } catch {
    // ignore
  }
};

const start = async (): Promise<void> => {
  await connectDB();

  const attemptStart = async (retries = 2): Promise<void> => {
    try {
      const server = app.listen(env.PORT, () => {
        console.log(`AbhiStream server running on port ${env.PORT}`);
        console.log(`API: http://localhost:${env.PORT}/api`);
      });

      const shutdown = async (signal: string) => {
        console.log(`\n${signal} received. Shutting down gracefully...`);
        server.close(() => {
          console.log("HTTP server closed.");
        });
        try {
          await mongoose.connection.close();
          console.log("MongoDB connection closed.");
        } catch (err) {
          console.error("Error closing MongoDB connection:", err);
        }
        process.exit(0);
      };

      process.on("SIGTERM", () => shutdown("SIGTERM"));
      process.on("SIGINT", () => shutdown("SIGINT"));
    } catch (err: any) {
      if (err.code === "EADDRINUSE" && retries > 0) {
        console.warn(`Port ${env.PORT} in use. Killing conflicting process and retrying... (${retries} retries left)`);
        await killConflictingProcess(env.PORT);
        await new Promise((r) => setTimeout(r, 1000));
        await attemptStart(retries - 1);
      } else {
        console.error("Failed to start server:", err);
        process.exit(1);
      }
    }
  };

  await attemptStart();
};

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});