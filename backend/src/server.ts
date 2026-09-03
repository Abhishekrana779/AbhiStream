import mongoose from "mongoose";
import { env } from "./config/env";
import { connectDB } from "./config/db";
import app from "./app";

const start = async (): Promise<void> => {
  try {
    await connectDB();

    const server = app.listen(env.PORT, () => {
      console.log(`AbhiStream server running on port ${env.PORT}`);
      console.log(`Health check: /api/health`);
    });

    const shutdown = async (signal: string) => {
      console.log(`${signal} received. Shutting down gracefully...`);

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
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

start();