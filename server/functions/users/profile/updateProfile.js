import { requireAuth } from "../../../utils/auth.js";
import { parseBody } from "../../../utils/validators.js";
import {
  success,
  conflict,
  badRequest,
  serverError,
} from "../../../utils/responses.js";
import { userService } from "../../../services/user.service.js";

const updateProfileHandler = async (event) => {
  try {
    const user = event.user;
    const body = parseBody(event);
    const { name, email } = body;

    // Delegar al servicio
    const updatedUser = await userService.updateProfile(user.id, user.email, {
      name,
      email,
    });

    return success({
      success: true,
      message: "Perfil actualizado exitosamente",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error en updateProfile:", error);

    // Manejo de errores específicos
    if (error.message === "Body inválido") {
      return badRequest(error.message);
    }

    if (error.name === "ValidationError") {
      return badRequest(error.message);
    }

    if (error.name === "EmailExistsError") {
      return conflict(error.message);
    }

    return serverError("Error al actualizar perfil");
  }
};

export const updateProfile = requireAuth(updateProfileHandler);
