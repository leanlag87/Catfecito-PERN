// server/src/controllers/auth.controller.js
import { pool } from "../db.js";
import bcrypt from "bcrypt";
import { signAccessToken } from "../libs/jwt.js";

export async function register(req, res) {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res
      .status(400)
      .json({ message: "name, email y password son requeridos" });

  try {
    const exists = await pool.query(
      "SELECT 1 FROM users WHERE lower(email) = lower($1)",
      [email]
    );
    if (exists.rowCount > 0) {
      return res.status(409).json({ message: "El email ya está registrado" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, role, is_active, created_at, updated_at`,
      [name, email, passwordHash]
    );

    const user = result.rows[0];
    const token = await signAccessToken({ id: user.id, role: user.role });

    return res.status(201).json({ user, token });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ message: "El email ya está registrado" });
    }
    console.error(err);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
}
