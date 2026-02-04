import { userRepository } from "../repositories/user.repository.js";

class UserService {
  //Obtener perfil del usuario autenticado

  async getProfile(userId) {
    const profile = await userRepository.getProfile(userId);

    if (!profile) {
      const error = new Error("Usuario no encontrado");
      error.name = "UserNotFoundError";
      throw error;
    }

    return profile;
  }
}

export const userService = new UserService();
