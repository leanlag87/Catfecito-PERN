import { userRepository } from "../../repositories/user.repository.js";

class AdminUserService {
  //Obtener todos los usuarios
  async getAllUsers() {
    const users = await userRepository.findAll();

    return {
      count: users.length,
      users,
    };
  }

  async getUserById(userId) {
    const user = await userRepository.findById(userId);

    if (!user) {
      const error = new Error("Usuario no encontrado");
      error.name = "UserNotFoundError";
      throw error;
    }

    return {
      id: userId,
      name: user.name,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }

  async updateUserRole(adminId, userId, newRole) {
    // Validar rol
    if (!["user", "admin"].includes(newRole)) {
      const error = new Error("Rol inválido. Debe ser 'user' o 'admin'");
      error.name = "ValidationError";
      throw error;
    }

    // Evitar que el único admin se quite su propio rol
    if (newRole === "user" && adminId === userId) {
      const adminCount = await userRepository.countAdmins();

      if (adminCount === 1) {
        const error = new Error(
          "No puedes quitar el rol de admin al único administrador",
        );
        error.name = "LastAdminError";
        throw error;
      }
    }

    // Actualizar rol
    const updatedUser = await userRepository.updateRole(userId, newRole);

    if (!updatedUser) {
      const error = new Error("Usuario no encontrado");
      error.name = "UserNotFoundError";
      throw error;
    }

    return updatedUser;
  }
}

export const adminUserService = new AdminUserService();
