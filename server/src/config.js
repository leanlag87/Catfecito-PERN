require("dotenv").config();

// Función para validar variables de entorno requeridas
const validateEnvVars = () => {
  const requiredVars = ["JWT_SECRET"];
  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error("❌ Variables de entorno faltantes:", missingVars.join(", "));
    console.error("💡 Asegúrate de configurar el archivo .env correctamente");
    process.exit(1);
  }
};

// Validar variables críticas
validateEnvVars();

module.exports = {
  // ========================================
  // CONFIGURACIÓN DEL SERVIDOR
  // ========================================
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",

  // ========================================
  // CONFIGURACIÓN DE BASE DE DATOS POSTGRESQL
  // ========================================
  DB_HOST: process.env.DB_HOST || "localhost",
  DB_PORT: process.env.DB_PORT || 5432,
  DB_NAME: process.env.DB_NAME || "catfecito_db",
  DB_USER: process.env.DB_USER || "postgres",
  DB_PASSWORD: process.env.DB_PASSWORD || "",

  // Pool de conexiones PostgreSQL
  DB_MAX_CONNECTIONS: parseInt(process.env.DB_MAX_CONNECTIONS) || 20,
  DB_IDLE_TIMEOUT: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
  DB_CONNECTION_TIMEOUT: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 2000,

  // ========================================
  // CONFIGURACIÓN JWT
  // ========================================
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "30d",

  // ========================================
  // CONFIGURACIÓN DE CORS
  // ========================================
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
    : ["http://localhost:3000", "http://localhost:3001"],

  // ========================================
  // CONFIGURACIÓN DE ENCRIPTACIÓN
  // ========================================
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 12,

  // ========================================
  // CONFIGURACIÓN DE ARCHIVOS
  // ========================================
  MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || "10mb",
  UPLOAD_PATH: process.env.UPLOAD_PATH || "./uploads",
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp"],

  // ========================================
  // CONFIGURACIÓN DE EMAIL (para futuras funcionalidades)
  // ========================================
  EMAIL_SERVICE: process.env.EMAIL_SERVICE || "gmail",
  EMAIL_USER: process.env.EMAIL_USER || "",
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD || "",
  EMAIL_FROM: process.env.EMAIL_FROM || "noreply@catfecito.com",

  // ========================================
  // CONFIGURACIÓN DE PAGINACIÓN
  // ========================================
  DEFAULT_PAGE_SIZE: parseInt(process.env.DEFAULT_PAGE_SIZE) || 10,
  MAX_PAGE_SIZE: parseInt(process.env.MAX_PAGE_SIZE) || 100,

  // ========================================
  // CONFIGURACIÓN DE RATE LIMITING
  // ========================================
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW) || 15, // minutos
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,

  // ========================================
  // CONFIGURACIÓN DE COOKIES
  // ========================================
  COOKIE_SECRET: process.env.COOKIE_SECRET || "catfecito-cookie-secret",
  COOKIE_MAX_AGE:
    parseInt(process.env.COOKIE_MAX_AGE) || 7 * 24 * 60 * 60 * 1000, // 7 días

  // ========================================
  // CONFIGURACIÓN DE PAGOS (para futuras integraciones)
  // ========================================

  // ========================================
  // CONFIGURACIÓN DE LOGS
  // ========================================
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
  LOG_FILE: process.env.LOG_FILE || "./logs/app.log",

  // ========================================
  // CONFIGURACIÓN DE REDIS (para caché futuro)
  // ========================================
  REDIS_HOST: process.env.REDIS_HOST || "localhost",
  REDIS_PORT: process.env.REDIS_PORT || 6379,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || "",

  // ========================================
  // UTILIDADES
  // ========================================

  // Verificar si estamos en producción
  isProduction: () => process.env.NODE_ENV === "production",

  // Verificar si estamos en desarrollo
  isDevelopment: () => process.env.NODE_ENV === "development",

  // Verificar si estamos en testing
  isTesting: () => process.env.NODE_ENV === "test",

  // URL completa de la base de datos
  getDatabaseURL: () => {
    const { DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME } = module.exports;
    return `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;
  },

  // Mostrar configuración (sin datos sensibles)
  showConfig: () => {
    console.log("🔧 Configuración de Catfecito Backend:");
    console.log(`   • Entorno: ${module.exports.NODE_ENV}`);
    console.log(`   • Puerto: ${module.exports.PORT}`);
    console.log(
      `   • Base de datos: ${module.exports.DB_HOST}:${module.exports.DB_PORT}/${module.exports.DB_NAME}`
    );
    console.log(`   • Cliente URL: ${module.exports.CLIENT_URL}`);
    console.log(`   • JWT Expiración: ${module.exports.JWT_EXPIRES_IN}`);
    console.log(`   • Rounds de Bcrypt: ${module.exports.BCRYPT_ROUNDS}`);
  },
};
