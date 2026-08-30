import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  checkWatchlist,
} from "../controllers/watchlistController";

const router = Router();

router.use(authMiddleware);

// Specific routes must come before generic :animeId routes
router.get("/check/:animeId", checkWatchlist);
router.get("/", getWatchlist);
router.post("/", addToWatchlist);
router.delete("/:animeId", removeFromWatchlist);

export default router;
