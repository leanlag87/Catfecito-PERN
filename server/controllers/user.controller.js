import { BCRYPT_ROUNDS } from "../config.js";
import bcrypt from "bcrypt";
import { pool } from "../db.js";

// Obtener perfil del usuario autenticado
export async function getProfile(req, res) {
  try {
    const result = await pool.query(
      `SELECT id, name, email, role, is_active, created_at, last_login_at,
              default_country, default_address, default_address2, 
              default_city, default_state, default_zip, default_phone
       FROM users 
       WHERE id = $1`,
      [req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    return res.status(200).json({
      success: true,
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Error en getProfile:", error);
    return res.status(500).json({ message: "Error al obtener perfil" });
  }
}

// Actualizar perfil del usuario autenticado
// Nos permite actualizar los campos juntos o separados
// Ej: nombre solo o correo solo
export async function updateProfile(req, res) {
  const { name, email } = req.body;
  const userId = req.user.id;

  try {
    // Verificar si el nuevo email ya existe (si cambió)
    if (email) {
      const emailExists = await pool.query(
        "SELECT 1 FROM users WHERE lower(email) = lower($1) AND id != $2",
        [email, userId]
      );

      if (emailExists.rowCount > 0) {
        return res.status(409).json({ message: "El email ya está en uso" });
      }
    }

    const result = await pool.query(
      `UPDATE users 
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           updated_at = NOW()
       WHERE id = $3
       RETURNING id, name, email, role, is_active`,
      [name, email, userId]
    );

    return res.status(200).json({
      success: true,
      message: "Perfil actualizado exitosamente",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Error en updateProfile:", error);
    return res.status(500).json({ message: "Error al actualizar perfil" });
  }
}

// Actualizar dirección predeterminada del usuario autenticado
export async function updateAddress(req, res) {
  const {
    default_country,
    default_address,
    default_address2,
    default_city,
    default_state,
    default_zip,
    default_phone,
  } = req.body;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `UPDATE users 
       SET default_country = $1,
           default_address = $2,
           default_address2 = $3,
           default_city = $4,
           default_state = $5,
           default_zip = $6,
           default_phone = $7,
           updated_at = NOW()
       WHERE id = $8
       RETURNING id, name, email, default_country, default_address, default_address2, 
                 default_city, default_state, default_zip, default_phone`,
      [
        default_country,
        default_address,
        default_address2,
        default_city,
        default_state,
        default_zip,
        default_phone,
        userId,
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    return res.status(200).json({
      success: true,
      message: "Dirección actualizada exitosamente",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Error en updateAddress:", error);
    return res.status(500).json({ message: "Error al actualizar dirección" });
  }
}

// Cambiar contraseña del usuario autenticado
export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  // Validaciones
  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      message: "Contraseña actual y nueva contraseña son requeridas",
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      message: "La nueva contraseña debe tener al menos 8 caracteres",
    });
  }

  if (currentPassword === newPassword) {
    return res.status(400).json({
      message: "La nueva contraseña debe ser diferente a la actual",
    });
  }

  try {
    // Obtener contraseña actual del usuario
    const userResult = await pool.query(
      "SELECT password_hash FROM users WHERE id = $1",
      [userId]
    );

    if (userResult.rowCount === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Verificar contraseña actual
    const isValidPassword = await bcrypt.compare(
      currentPassword,
      userResult.rows[0].password_hash
    );

    if (!isValidPassword) {
      return res.status(401).json({
        message: "La contraseña actual es incorrecta",
      });
    }

    // Hash de la nueva contraseña
    const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    // Actualizar contraseña
    await pool.query(
      `UPDATE users 
       SET password_hash = $1, updated_at = NOW() 
       WHERE id = $2`,
      [newPasswordHash, userId]
    );

    return res.status(200).json({
      success: true,
      message: "Contraseña actualizada exitosamente",
    });
  } catch (error) {
    console.error("Error en changePassword:", error);
    return res.status(500).json({
      message: "Error al cambiar la contraseña",
    });
  }
}

// FUNCIONES SOLO ADMIN

// Obtener todos los usuarios (solo admin)
export async function getAllUsers(req, res) {
  try {
    const result = await pool.query(
      `SELECT id, name, email, role, is_active, created_at, last_login_at, updated_at
       FROM users 
       ORDER BY created_at DESC`
    );

    return res.status(200).json({
      success: true,
      count: result.rowCount,
      users: result.rows,
    });
  } catch (error) {
    console.error("Error en getAllUsers:", error);
    return res.status(500).json({ message: "Error al obtener usuarios" });
  }
}

// Obtener un usuario por ID (solo admin)
export async function getUserById(req, res) {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT id, name, email, role, is_active, created_at, last_login_at, updated_at
       FROM users 
       WHERE id = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    return res.status(200).json({
      success: true,
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Error en getUserById:", error);
    return res.status(500).json({ message: "Error al obtener usuario" });
  }
}

// Actualizar rol de usuario (solo admin)
export async function updateUserRole(req, res) {
  const { id } = req.params;
  const { role } = req.body;

  // Validar rol
  if (!["user", "admin"].includes(role)) {
    return res.status(400).json({ message: "Rol inválido" });
  }

  try {
    // Evitar que el único admin se quite su propio rol
    if (role === "user" && req.user.id === parseInt(id)) {
      const adminCount = await pool.query(
        "SELECT COUNT(*) FROM users WHERE role = 'admin'"
      );

      if (parseInt(adminCount.rows[0].count) === 1) {
        return res.status(400).json({
          message: "No puedes quitar el rol de admin al único administrador",
        });
      }
    }

    const result = await pool.query(
      `UPDATE users 
       SET role = $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING id, name, email, role, is_active`,
      [role, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    return res.status(200).json({
      success: true,
      message: "Rol actualizado exitosamente",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Error en updateUserRole:", error);
    return res.status(500).json({ message: "Error al actualizar rol" });
  }
}

// Desactivar/activar usuario (solo admin)
/**
 * si el usuario esta activo lo desactiva con una peticion PATCH
 * Para activarlo de nuevo se hace la misma peticion PATCH, se invierte el valor
 * No requiere body, solo el id en params
 * Es decir que no hace falta poner en el body el estado en el que queremos dejar al usuario
 *
 */
export async function toggleUserStatus(req, res) {
  const { id } = req.params;

  try {
    // Evitar que el admin se desactive a sí mismo
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({
        message: "No puedes desactivar tu propia cuenta",
      });
    }

    const result = await pool.query(
      `UPDATE users 
       SET is_active = NOT is_active, updated_at = NOW() 
       WHERE id = $1 
       RETURNING id, name, email, role, is_active`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    return res.status(200).json({
      success: true,
      message: `Usuario ${
        result.rows[0].is_active ? "activado" : "desactivado"
      } exitosamente`,
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Error en toggleUserStatus:", error);
    return res.status(500).json({ message: "Error al cambiar estado" });
  }
}

// Eliminar usuario (solo admin)
export async function deleteUser(req, res) {
  const { id } = req.params;

  try {
    // Evitar que el admin se elimine a sí mismo
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({
        message: "No puedes eliminar tu propia cuenta",
      });
    }

    const result = await pool.query(
      "DELETE FROM users WHERE id = $1 RETURNING id, name, email",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    return res.status(200).json({
      success: true,
      message: "Usuario eliminado exitosamente",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Error en deleteUser:", error);
    return res.status(500).json({ message: "Error al eliminar usuario" });
  }
}
