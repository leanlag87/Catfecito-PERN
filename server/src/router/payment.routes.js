import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import {
  createPreference,
  webhook,
  getPaymentStatus,
} from "../controllers/payment.controller.js";

const router = Router();

// RUTAS DE USUARIO AUTENTICADO
router.post("/create-preference", verifyToken, createPreference);
router.get("/status/:order_id", verifyToken, getPaymentStatus);

// WEBHOOK (publico - MercadoPago lo llama)
router.post("/webhook", webhook);

export default router;
