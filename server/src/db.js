import pg from "pg";
import config from "./config.js";

export const pool = new pg.Pool({
  host: config.DB_HOST,
  port: config.DB_PORT,
  database: config.DB_NAME,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
});

pool.on("connect", () => {
  console.log("Conexión a la base de datos establecida");
});

pool.on("error", (err) => {
  console.error("Error en la conexión a la base de datos", err);
});

export default pool;
