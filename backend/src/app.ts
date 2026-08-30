import express from "express";
import cors from "cors";
import { env } from "./config/env";
import animeRoutes from "./routes/animeRoutes";
import authRoutes from "./routes/authRoutes";
import watchlistRoutes from "./routes/watchlistRoutes";
import historyRoutes from "./routes/historyRoutes";
import { errorMiddleware } from "./middleware/errorMiddleware";
import { notFoundMiddleware } from "./middleware/notFoundMiddleware";

const app = express();

app.use(cors({
  origin: env.CLIENT_URL,
  credentials: true,
}));

app.use(express.json({ limit: "10mb" }));

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