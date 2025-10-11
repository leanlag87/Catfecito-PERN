import { Router } from "express";
import { verifyToken, verifyAdmin } from "../middlewares/auth.middleware.js";
import {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  getOrderByIdAdmin,
  updateOrderStatus,
} from "../controllers/order.controller.js";

const router = Router();

// USUARIO AUTENTICADO
router.post("/", verifyToken, createOrder);
router.get("/", verifyToken, getMyOrders);
router.get("/:id", verifyToken, getOrderById);

// SOLO ADMIN
router.get("/admin/all", verifyToken, verifyAdmin, getAllOrders);
router.get("/admin/:id", verifyToken, verifyAdmin, getOrderByIdAdmin);
router.patch("/:id/status", verifyToken, verifyAdmin, updateOrderStatus);

export default router;
