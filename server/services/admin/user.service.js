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
}

export const adminUserService = new AdminUserService();
