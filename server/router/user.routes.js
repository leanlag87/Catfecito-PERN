import { Router } from "express";
import { verifyToken, verifyAdmin } from "../middlewares/auth.middleware.js";
import {
  getProfile,
  updateProfile,
  updateAddress,
  changePassword,
  getAllUsers,
  getUserById,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
} from "../controllers/user.controller.js";

const router = Router();

// Usuario + Admin
router.get("/profile", verifyToken, getProfile);
router.put("/profile", verifyToken, updateProfile);
router.put("/address", verifyToken, updateAddress);
router.put("/change-password", verifyToken, changePassword);

// RUTAS ADMIN
router.get("/", verifyToken, verifyAdmin, getAllUsers);
router.get("/:id", verifyToken, verifyAdmin, getUserById);
router.put("/:id/role", verifyToken, verifyAdmin, updateUserRole);
router.patch("/:id/status", verifyToken, verifyAdmin, toggleUserStatus);
router.delete("/:id", verifyToken, verifyAdmin, deleteUser);

export default router;
