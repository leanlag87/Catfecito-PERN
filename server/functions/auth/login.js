import { parseBody, validateRequired } from "../../utils/validators.js";
import { success, badRequest, unauthorized } from "../../utils/responses.js";
import { authService } from "../../services/auth.service.js";

export const loginUser = async (event) => {
  try {
    // Parsear y validar entrada
    const body = parseBody(event);
    const { email, password } = body;

    validateRequired(body, ["email", "password"]);

    // Delegar lógica al servicio
    const authResult = await authService.login(email, password);

    // Formatear respuesta
    return success({
      message: "Login exitoso",
      ...authResult,
    });
  } catch (error) {
    console.error("Error en login:", error);

    // Manejo de errores específicos
    if (error.message.startsWith("Campos requeridos")) {
      return badRequest(error.message);
    }

    if (error.message === "Body inválido") {
      return badRequest(error.message);
    }

    if (error.name === "InvalidCredentialsError") {
      return unauthorized(error.message);
    }

    if (error.name === "UserNotConfirmedError") {
      return unauthorized(error.message);
    }

    return unauthorized("Error de autenticación");
  }
};
