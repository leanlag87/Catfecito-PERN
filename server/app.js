import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import morgan from "morgan";
import config from "./config.js";
import authRoutes from "./router/auth.routes.js";
import userRoutes from "./router/user.routes.js";
import categoryRoutes from "./router/category.routes.js";
import productRoutes from "./router/product.routes.js";
import cartRoutes from "./router/cart.routes.js";
import orderRoutes from "./router/order.routes.js";
import paymentRoutes from "./router/payment.routes.js";
import { pool } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Configurar CORS para producción y desarrollo
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sin origin (Postman, mobile apps, etc.)
    if (!origin) return callback(null, true);

    // Lista de orígenes permitidos
    const allowedOrigins = [
      config.CLIENT_URL,
      "http://localhost:3000",
      "http://localhost:5173",
      // Agregar aquí URLs adicionales si es necesario
    ].filter(Boolean); // Eliminar valores undefined/null

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // En desarrollo, permitir todos los orígenes
      if (config.NODE_ENV === "development") {
        callback(null, true);
      } else {
        callback(new Error("No permitido por CORS"));
      }
    }
  },
  credentials: false, // No usamos cookies, así que false
};

app.use(cors(corsOptions));

app.use(morgan("dev"));

app.use(express.json());

app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) =>
  res.json({ message: "Bienvenidos a la API de Catfecito" })
);

// Verificar conexión a la base de datos con la configuracion actual
app.get("/api/ping", async (req, res) => {
  const result = await pool.query("SELECT NOW() as now");
  res.json({ message: "pong", time: result.rows[0].now });
});

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
