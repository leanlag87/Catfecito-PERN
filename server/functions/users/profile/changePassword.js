import {
  CognitoIdentityProviderClient,
  ChangePasswordCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import config from "../../../config.js";
import { requireAuth } from "../../../utils/auth.js";
import { parseBody, validateRequired } from "../../../utils/validators.js";
import {
  success,
  badRequest,
  unauthorized,
  serverError,
} from "../../../utils/responses.js";

const cognitoClient = new CognitoIdentityProviderClient({
  region: config.AWS_REGION,
});

const changePasswordHandler = async (event) => {
  try {
    const body = parseBody(event);
    const { currentPassword, newPassword } = body;

    // Validar campos requeridos
    validateRequired(body, ["currentPassword", "newPassword"]);

    // Validar longitud de la nueva contraseña
    if (newPassword.length < 8) {
      return badRequest("La nueva contraseña debe tener al menos 8 caracteres");
    }

    // Validar que la nueva contraseña sea diferente
    if (currentPassword === newPassword) {
      return badRequest("La nueva contraseña debe ser diferente a la actual");
    }

    // Obtener el access token del header
    const authHeader =
      event.headers?.authorization || event.headers?.Authorization;
    const accessToken = authHeader.split(" ")[1];

    // Cambiar contraseña en Cognito
    await cognitoClient.send(
      new ChangePasswordCommand({
        AccessToken: accessToken,
        PreviousPassword: currentPassword,
        ProposedPassword: newPassword,
      }),
    );

    return success({
      success: true,
      message: "Contraseña actualizada exitosamente",
    });
  } catch (error) {
    console.error("Error en changePassword:", error);

    // Manejar errores específicos de Cognito
    if (error.name === "NotAuthorizedException") {
      return unauthorized("La contraseña actual es incorrecta");
    }

    if (error.name === "InvalidPasswordException") {
      return badRequest(
        "La nueva contraseña no cumple con los requisitos de seguridad",
      );
    }

    if (error.name === "LimitExceededException") {
      return badRequest("Demasiados intentos. Intenta más tarde");
    }

    return serverError("Error al cambiar la contraseña");
  }
};

// Exportar con middleware de autenticación
export const changePassword = requireAuth(changePasswordHandler);
