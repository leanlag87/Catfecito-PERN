import { Router } from "express";
import { verifyToken, verifyAdmin } from "../middlewares/auth.middleware.js";
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  toggleCategoryStatus,
  deleteCategory,
} from "../controllers/category.controller.js";

const router = Router();

// User + Admin
router.get("/", getAllCategories);
router.get("/:id", getCategoryById);

// SOLO ADMIN
router.post("/", verifyToken, verifyAdmin, createCategory);
router.put("/:id", verifyToken, verifyAdmin, updateCategory);
router.patch("/:id/status", verifyToken, verifyAdmin, toggleCategoryStatus);
router.delete("/:id", verifyToken, verifyAdmin, deleteCategory);

export default router;
