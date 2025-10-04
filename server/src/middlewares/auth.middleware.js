import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config.js";

export const verifyToken = async (req, res, next) => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Token no proporcionado",
      });
    }

    // Extraer el token (formato: "Bearer TOKEN")
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Token no proporcionado",
      });
    }

    // Verificar y decodificar el token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Agregar datos del usuario al request
    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email,
    };

    // Continuar al siguiente middleware/controlador
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Token expirado",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        message: "Token inválido",
      });
    }

    console.error("Error en verifyToken:", error);
    return res.status(500).json({
      message: "Error al verificar token",
    });
  }
};

// Middleware adicional para verificar si es admin
export const verifyAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      message: "Acceso denegado. Se requieren permisos de administrador",
    });
  }
  next();
};
