import { requireAuth } from "../../../utils/auth.js";
import { success, notFound, serverError } from "../../../utils/responses.js";
import { userService } from "../../../services/user.service.js";

const getProfileHandler = async (event) => {
  try {
    const userId = event.user.id; // Inyectado por requireAuth

    // Delega lógica al servicio
    const profile = await userService.getProfile(userId);

    return success({
      success: true,
      user: profile,
    });
  } catch (error) {
    console.error("Error al obtener perfil:", error);

    // Manejo de errores específicos
    if (error.name === "UserNotFoundError") {
      return notFound(error.message);
    }

    return serverError("Error al obtener perfil");
  }
};

export const getProfile = requireAuth(getProfileHandler);
