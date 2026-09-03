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

    const shutdown = (signal: string): Promise<void> => {
      console.log(`${signal} received. Shutting down gracefully...`);

      return new Promise<void>((resolve) => {
        let httpClosed = false;
        let dbClosed = false;
        const finish = (): void => {
          if (httpClosed && dbClosed) resolve();
        };

        server.close((err) => {
          if (err) console.error("Error closing HTTP server:", err);
          else console.log("HTTP server closed.");
          httpClosed = true;
          finish();
        });

        mongoose.connection
          .close()
          .then(() => {
            console.log("MongoDB connection closed.");
          })
          .catch((err) => {
            console.error("Error closing MongoDB connection:", err);
          })
          .finally(() => {
            dbClosed = true;
            finish();
          });

        setTimeout(() => {
          console.warn("Shutdown timed out after 10s, forcing exit.");
          process.exit(1);
        }, 10000).unref();
      }).then(() => {
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => {
      void shutdown("SIGTERM");
    });
    process.on("SIGINT", () => {
      void shutdown("SIGINT");
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

void start();