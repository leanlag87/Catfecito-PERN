// const express = require("express");
// const cors = require("cors");
// const morgan = require("morgan");
// const { CLIENT_URL, NODE_ENV } = require("./config");

// // Crear aplicación Express
// const app = express();

// // Middlewares de logging
// if (NODE_ENV === "development") {
//   app.use(morgan("dev"));
// } else {
//   app.use(morgan("combined"));
// }

// // Configuración de CORS
// app.use(
//   cors({
//     origin: CLIENT_URL,
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// );

// // Parsear JSON y URL encoded
// app.use(
//   express.json({
//     limit: "10mb",
//     type: "application/json",
//   })
// );

// app.use(
//   express.urlencoded({
//     extended: true,
//     limit: "10mb",
//   })
// );

// // Middleware para headers de seguridad básicos
// app.use((req, res, next) => {
//   res.header("X-Content-Type-Options", "nosniff");
//   res.header("X-Frame-Options", "DENY");
//   res.header("X-XSS-Protection", "1; mode=block");
//   next();
// });

// // Ruta de bienvenida y health check
// app.get("/", (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: "🐱 ¡Bienvenido a la API de Catfecito! ☕",
//     data: {
//       service: "Catfecito E-commerce API",
//       version: "1.0.0",
//       environment: NODE_ENV,
//       status: "OK",
//       timestamp: new Date().toISOString(),
//       endpoints: {
//         auth: "/api/auth",
//         productos: "/api/productos",
//         usuarios: "/api/usuarios",
//         categorias: "/api/categorias",
//         pedidos: "/api/pedidos",
//       },
//     },
//   });
// });

// // Health check endpoint
// app.get("/health", (req, res) => {
//   res.status(200).json({
//     success: true,
//     status: "OK",
//     timestamp: new Date().toISOString(),
//     uptime: process.uptime(),
//     memory: process.memoryUsage(),
//     version: process.version,
//   });
// });

// // ========================================
// // RUTAS DE LA API
// // ========================================

// // Importar rutas (las crearemos después)
// // const authRoutes = require('./router/auth.routes');
// // const productosRoutes = require('./router/productos.routes');
// // const usuariosRoutes = require('./router/usuarios.routes');
// // const categoriasRoutes = require('./router/categorias.routes');
// // const pedidosRoutes = require('./router/pedidos.routes');

// // Usar rutas (descomenta cuando las rutas estén creadas)
// // app.use('/api/auth', authRoutes);
// // app.use('/api/productos', productosRoutes);
// // app.use('/api/usuarios', usuariosRoutes);
// // app.use('/api/categorias', categoriasRoutes);
// // app.use('/api/pedidos', pedidosRoutes);

// // ========================================
// // MANEJO DE ERRORES
// // ========================================

// // Middleware para rutas no encontradas (404)
// app.use("*", (req, res) => {
//   res.status(404).json({
//     success: false,
//     message: "Endpoint no encontrado",
//     error: {
//       path: req.originalUrl,
//       method: req.method,
//       timestamp: new Date().toISOString(),
//     },
//     suggestion: "Verifica la URL y el método HTTP utilizados",
//   });
// });

// // Middleware global de manejo de errores
// app.use((error, req, res, next) => {
//   console.error("❌ Error capturado por middleware global:");
//   console.error("   URL:", req.originalUrl);
//   console.error("   Método:", req.method);
//   console.error("   Error:", error.message);
//   console.error("   Stack:", error.stack);

//   // Error de validación de express-validator
//   if (error.name === "ValidationError") {
//     return res.status(400).json({
//       success: false,
//       message: "Error de validación en los datos enviados",
//       errors: error.errors || error.message,
//     });
//   }

//   // Error de JWT
//   if (error.name === "JsonWebTokenError") {
//     return res.status(401).json({
//       success: false,
//       message: "Token de autenticación inválido",
//     });
//   }

//   // Error de JWT expirado
//   if (error.name === "TokenExpiredError") {
//     return res.status(401).json({
//       success: false,
//       message: "Token de autenticación expirado",
//     });
//   }

//   // Error de base de datos PostgreSQL
//   if (error.code && error.code.startsWith("23")) {
//     let message = "Error en la base de datos";

//     if (error.code === "23505") {
//       message = "Ya existe un registro con esos datos únicos";
//     } else if (error.code === "23503") {
//       message = "Error de referencia en la base de datos";
//     } else if (error.code === "23514") {
//       message = "Error de validación en la base de datos";
//     }

//     return res.status(400).json({
//       success: false,
//       message,
//       ...(NODE_ENV === "development" && {
//         details: error.detail,
//         constraint: error.constraint,
//       }),
//     });
//   }

//   // Error genérico del servidor
//   res.status(error.status || 500).json({
//     success: false,
//     message:
//       NODE_ENV === "development" ? error.message : "Error interno del servidor",
//     ...(NODE_ENV === "development" && {
//       stack: error.stack,
//       type: error.name,
//     }),
//   });
// });

// module.exports = app;

import express from "express";

const app = express();
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));

export default app;
