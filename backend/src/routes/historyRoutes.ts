import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import {
  getHistory,
  addHistory,
  updateHistory,
  deleteHistory,
  clearHistory,
} from "../controllers/historyController";

const router = Router();

router.use(authMiddleware);

// Specific routes must come before generic :id routes
router.get("/", getHistory);
router.post("/", addHistory);
router.patch("/:id", updateHistory);
router.delete("/clear", clearHistory);
router.delete("/:id", deleteHistory);

export default router;
