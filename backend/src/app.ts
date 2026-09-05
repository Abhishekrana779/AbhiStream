import express from "express";
import cors from "cors";
import path from "path";
import { env } from "./config/env";
import animeRoutes from "./routes/animeRoutes";
import authRoutes from "./routes/authRoutes";
import watchlistRoutes from "./routes/watchlistRoutes";
import historyRoutes from "./routes/historyRoutes";
import { errorMiddleware } from "./middleware/errorMiddleware";
import { notFoundMiddleware } from "./middleware/notFoundMiddleware";

const app = express();

app.set("trust proxy", 1);

const LOCALHOST_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const allowed = [
        env.CLIENT_URL,
        ...env.ALLOWED_ORIGINS,
        ...LOCALHOST_ORIGINS,
      ].filter(Boolean);

      if (allowed.includes(origin)) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));

app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "AbhiStream API is running" });
});

app.use("/api/anime", animeRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/watchlist", watchlistRoutes);
app.use("/api/history", historyRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;