import express from "express";
import cors from "cors";
import morgan from "morgan";
import authRoutes from "./router/auth.routes.js";
import userRoutes from "./router/user.routes.js";

const app = express();

app.use(cors());

app.use(morgan("dev"));

app.use(express.json());

app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) =>
  res.json({ message: "Bienvenidos a la API de Catfecito" })
);

app.use("/api", authRoutes);
app.use("/api", userRoutes);

// Middleware para manejar errores
app.use((err, req, res, next) => {
  res.status(500).json({ status: "error", message: err.message });
});

export default app;
