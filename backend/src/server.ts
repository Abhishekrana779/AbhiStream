import { env } from "./config/env";
import { connectDB } from "./config/db";
import app from "./app";

const start = async (): Promise<void> => {
  await connectDB();
  app.listen(env.PORT, () => {
    console.log(`AbhiStream server running on port ${env.PORT}`);
    console.log(`API: http://localhost:${env.PORT}/api`);
  });
};

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});