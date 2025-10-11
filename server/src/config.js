import dotenv from "dotenv";

// Cargar variables de entorno
dotenv.config();

const config = {
  // Servidor
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",

  // Base de datos
  DB_HOST: process.env.DB_HOST || "localhost",
  DB_PORT: process.env.DB_PORT || 5432,
  DB_NAME: process.env.DB_NAME || "catfecito_pern",
  DB_USER: process.env.DB_USER || "postgres",
  DB_PASSWORD: process.env.DB_PASSWORD || "",

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || "xyz12345",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",

  // CORS
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",

  // Bcrypt
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 10,

  // MercadoPago
  MP_ACCESS_TOKEN: process.env.MP_ACCESS_TOKEN,
  MP_PUBLIC_KEY: process.env.MP_PUBLIC_KEY,
  MP_WEBHOOK_SECRET: process.env.MP_WEBHOOK_SECRET,

  // URL pública (ngrok)
  BACKEND_URL: process.env.BACKEND_URL || "http://localhost:5000",
};

export default config;

export const {
  PORT,
  NODE_ENV,
  DB_HOST,
  DB_PORT,
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  CLIENT_URL,
  BCRYPT_ROUNDS,
  MP_ACCESS_TOKEN,
  MP_PUBLIC_KEY,
  MP_WEBHOOK_SECRET,
  BACKEND_URL,
} = config;
