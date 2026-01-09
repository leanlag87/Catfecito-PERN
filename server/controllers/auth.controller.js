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
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ message: "El email ya está registrado" });
    }
    console.error(error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
}

export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email y password son requeridos",
    });
  }

  try {
    // Buscar usuario por email
    const result = await pool.query(
      `SELECT id, name, email, password_hash, role, is_active, last_login_at, created_at 
       FROM users 
       WHERE lower(email) = lower($1)`,
      [email]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({
        message: "Credenciales inválidas",
      });
    }

    const user = result.rows[0];

    // Verificar si el usuario está activo
    if (!user.is_active) {
      return res.status(403).json({
        message: "Cuenta desactivada. Contacta al administrador",
      });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        message: "Credenciales inválidas",
      });
    }

    // Actualizar last_login_at
    await pool.query(`UPDATE users SET last_login_at = NOW() WHERE id = $1`, [
      user.id,
    ]);

    // Generar token JWT
    const token = await signAccessToken({
      id: user.id,
      role: user.role,
      email: user.email,
    });

    // Preparar datos del usuario (sin password_hash)
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      last_login_at: new Date().toISOString(),
      created_at: user.created_at,
    };

    return res.status(200).json({
      success: true,
      message: `Bienvenido ${user.role === "admin" ? "Administrador" : ""} ${
        user.name
      }`,
      user: userData,
      token,
      permissions: {
        isAdmin: user.role === "admin",
        canManageUsers: user.role === "admin",
        canManageProducts: user.role === "admin",
        canViewOrders: true,
        canManageOrders: user.role === "admin",
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
    return res.status(500).json({
      message: "Error interno del servidor",
    });
  }
}

export async function logout(req, res) {
  try {
    // Opcional: Registrar la hora de logout
    if (req.user?.id) {
      await pool.query(`UPDATE users SET updated_at = NOW() WHERE id = $1`, [
        req.user.id,
      ]);
    }

    return res.status(200).json({
      success: true,
      message: "Sesión cerrada exitosamente",
    });
  } catch (error) {
    console.error("Error en logout:", error);
    return res.status(500).json({
      message: "Error al cerrar sesión",
    });
  }
}
