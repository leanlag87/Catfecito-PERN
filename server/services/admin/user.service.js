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
}

export const adminUserService = new AdminUserService();
