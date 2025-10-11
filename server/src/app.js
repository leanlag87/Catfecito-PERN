import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import morgan from "morgan";
import authRoutes from "./router/auth.routes.js";
import userRoutes from "./router/user.routes.js";
import categoryRoutes from "./router/category.routes.js";
import productRoutes from "./router/product.routes.js";
import cartRoutes from "./router/cart.routes.js";
import orderRoutes from "./router/order.routes.js";
import paymentRoutes from "./router/payment.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());

app.use(morgan("dev"));

app.use(express.json());

app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) =>
  res.json({ message: "Bienvenidos a la API de Catfecito" })
);

// Archivos estáticos (imágenes)
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);

// Middleware para manejar errores
app.use((err, req, res, next) => {
  res.status(500).json({ status: "error", message: err.message });
});

export default app;
