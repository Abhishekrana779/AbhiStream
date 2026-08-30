import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  deleteAccount,
} from "../controllers/authController";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authMiddleware, getMe);
router.patch("/profile", authMiddleware, updateProfile);
router.patch("/password", authMiddleware, changePassword);
router.delete("/account", authMiddleware, deleteAccount);

export default router;