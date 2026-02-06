import { requireAuth } from "../../../utils/auth.js";
import { parseBody, validateRequired } from "../../../utils/validators.js";
import {
  success,
  badRequest,
  unauthorized,
  serverError,
} from "../../../utils/responses.js";
import { authService } from "../../../services/auth.service.js";

const changePasswordHandler = async (event) => {
  try {
    const body = parseBody(event);
    const { currentPassword, newPassword } = body;

    // Validar campos requeridos
    validateRequired(body, ["currentPassword", "newPassword"]);

    // Obtener el access token del header
    const authHeader =
      event.headers?.authorization || event.headers?.Authorization;
    const accessToken = authHeader.split(" ")[1];

    // Delegar al servicio
    await authService.changePassword(accessToken, currentPassword, newPassword);

    return success({
      success: true,
      message: "Contraseña actualizada exitosamente",
    });
  } catch (error) {
    console.error("Error en changePassword:", error);

    // Manejo de errores específicos
    if (error.message === "Body inválido") {
      return badRequest(error.message);
    }

    if (error.message.startsWith("Campos requeridos")) {
      return badRequest(error.message);
    }

    if (error.name === "InvalidPasswordError") {
      return badRequest(error.message);
    }

    if (error.name === "SamePasswordError") {
      return badRequest(error.message);
    }

    if (error.name === "WrongPasswordError") {
      return unauthorized(error.message);
    }

    if (error.name === "RateLimitError") {
      return badRequest(error.message);
    }

    return serverError("Error al cambiar la contraseña");
  }
};

export const changePassword = requireAuth(changePasswordHandler);
