import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import config from "../../config.js";
import { parseBody, validateRequired } from "../../utils/validators.js";
import { success, badRequest, unauthorized } from "../../utils/responses.js";
import { buildAuthParams } from "../../utils/cognitoHelpers.js";

const cognitoClient = new CognitoIdentityProviderClient({
  region: config.AWS_REGION,
});

export const loginUser = async (event) => {
  try {
    // Parsear y validar body
    const body = parseBody(event);
    const { email, password } = body;

    validateRequired(body, ["email", "password"]);

    // parámetros de autenticación
    const authParams = buildAuthParams(
      email,
      password,
      config.COGNITO_CLIENT_ID,
      config.COGNITO_CLIENT_SECRET,
    );

    // Autenticar con Cognito
    const authResponse = await cognitoClient.send(
      new InitiateAuthCommand({
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: config.COGNITO_CLIENT_ID,
        AuthParameters: authParams,
      }),
    );

    return success({
      message: "Login exitoso",
      token: authResponse.AuthenticationResult.IdToken,
      accessToken: authResponse.AuthenticationResult.AccessToken,
      refreshToken: authResponse.AuthenticationResult.RefreshToken,
    });
  } catch (error) {
    console.error("Error en login:", error);

    // Validación de campos requeridos
    if (error.message.startsWith("Campos requeridos")) {
      return badRequest(error.message);
    }

    // Body inválido
    if (error.message === "Body inválido") {
      return badRequest(error.message);
    }

    // Credenciales inválidas
    if (
      error.name === "NotAuthorizedException" ||
      error.name === "UserNotFoundException"
    ) {
      return unauthorized("Credenciales inválidas");
    }

    return unauthorized("Error de autenticación");
  }
};
