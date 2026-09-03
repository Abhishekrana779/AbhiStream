import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { uploadAvatar as uploadAvatarMiddleware } from "../middleware/upload";
import {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  deleteAccount,
  uploadAvatar,
} from "../controllers/authController";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authMiddleware, getMe);
router.patch("/profile", authMiddleware, updateProfile);
router.patch("/password", authMiddleware, changePassword);
router.delete("/account", authMiddleware, deleteAccount);
router.post("/avatar", authMiddleware, uploadAvatarMiddleware.single("avatar"), uploadAvatar);

export default router;