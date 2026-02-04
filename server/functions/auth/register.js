import { parseBody, validateRequired } from "../../utils/validators.js";
import {
  created,
  badRequest,
  conflict,
  serverError,
} from "../../utils/responses.js";
import { authService } from "../../services/auth.service.js";

export const createUser = async (event) => {
  try {
    // Parsear y validar entrada
    const body = parseBody(event);
    const { name, email, password } = body;

    validateRequired(body, ["name", "email", "password"]);

    // Delega lógica al servicio
    const user = await authService.register(name, email, password);

    // Formatear respuesta
    return created({
      message: "Usuario registrado exitosamente",
      user,
    });
  } catch (error) {
    console.error("Error en register:", error);

    // Manejo de errores específicos
    if (error.message.startsWith("Campos requeridos")) {
      return badRequest(error.message);
    }

    if (error.message === "Body inválido") {
      return badRequest(error.message);
    }

    if (error.name === "EmailExistsError") {
      return conflict(error.message);
    }

    if (error.name === "InvalidPasswordError") {
      return badRequest(error.message);
    }

    return serverError();
  }
};
