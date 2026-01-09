import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from "../controllers/cart.controller.js";

const router = Router();

// Todas las rutas requieren autenticación
router.get("/", verifyToken, getCart);
router.post("/", verifyToken, addToCart);
router.put("/:id", verifyToken, updateCartItem);
router.delete("/:id", verifyToken, removeFromCart);
router.delete("/", verifyToken, clearCart);

export default router;
