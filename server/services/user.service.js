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

  async updateProfile(userId, currentEmail, updateData) {
    const { name, email } = updateData;

    // Validar que al menos un campo esté presente
    if (!name && !email) {
      const error = new Error(
        "Debes proporcionar al menos un campo para actualizar (name o email)",
      );
      error.name = "ValidationError";
      throw error;
    }

    // Si se está actualizando el email, verificar que no exista
    if (email && email.toLowerCase() !== currentEmail.toLowerCase()) {
      const existingUser = await userRepository.findByEmail(email);

      if (existingUser && existingUser.id !== userId) {
        const error = new Error("El email ya está en uso");
        error.name = "EmailExistsError";
        throw error;
      }
    }

    // Actualizar usuario
    const updatedUser = await userRepository.updateProfile(userId, updateData);

    return updatedUser;
  }

  async updateAddress(userId, addressData) {
    // Validar que al menos un campo esté presente
    const hasAddressData = Object.values(addressData).some(
      (value) => value !== undefined,
    );

    if (!hasAddressData) {
      const error = new Error(
        "Debes proporcionar al menos un campo de dirección para actualizar",
      );
      error.name = "ValidationError";
      throw error;
    }

    const updatedUser = await userRepository.updateAddress(userId, addressData);

    return updatedUser;
  }
}

export const userService = new UserService();
