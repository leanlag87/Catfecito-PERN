import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  InitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import config from "../config.js";
import { userRepository } from "../repositories/user.repository.js";
import { buildAuthParams } from "../utils/cognitoHelpers.js";

const cognitoClient = new CognitoIdentityProviderClient({
  region: config.AWS_REGION,
});

class AuthService {
  //Registrar nuevo usuario

  async register(name, email, password) {
    // Validar que el email no exista en DynamoDB
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      const error = new Error("El email ya está registrado");
      error.name = "EmailExistsError";
      throw error;
    }

    // Crear usuario en Cognito
    let cognitoUserId;
    try {
      const createUserCommand = new AdminCreateUserCommand({
        UserPoolId: config.COGNITO_USER_POOL_ID,
        Username: email.toLowerCase(),
        UserAttributes: [
          { Name: "email", Value: email.toLowerCase() },
          { Name: "email_verified", Value: "true" },
          { Name: "name", Value: name },
        ],
        MessageAction: "SUPPRESS",
        TemporaryPassword: password,
      });

      const cognitoResponse = await cognitoClient.send(createUserCommand);
      cognitoUserId = cognitoResponse.User.Username;

      // Establecer contraseña permanente
      await cognitoClient.send(
        new AdminSetUserPasswordCommand({
          UserPoolId: config.COGNITO_USER_POOL_ID,
          Username: email.toLowerCase(),
          Password: password,
          Permanent: true,
        }),
      );
    } catch (error) {
      // Mapear errores de Cognito
      if (
        error.name === "UsernameExistsException" ||
        error.name === "AliasExistsException"
      ) {
        const customError = new Error("El email ya está registrado");
        customError.name = "EmailExistsError";
        throw customError;
      }

      if (error.name === "InvalidPasswordException") {
        const customError = new Error(
          "La contraseña no cumple con los requisitos de seguridad",
        );
        customError.name = "InvalidPasswordError";
        throw customError;
      }

      throw error;
    }

    // Crea perfil del usuario en DynamoDB
    const user = await userRepository.create({
      cognitoUserId,
      name,
      email,
      role: "user",
    });

    return user;
  }

  async login(email, password) {
    try {
      // Preparar parámetros de autenticación
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

      // Extraer tokens
      const { IdToken, AccessToken, RefreshToken } =
        authResponse.AuthenticationResult;

      return {
        token: IdToken,
        accessToken: AccessToken,
        refreshToken: RefreshToken,
      };
    } catch (error) {
      // Mapear errores de Cognito a errores de negocio
      if (
        error.name === "NotAuthorizedException" ||
        error.name === "UserNotFoundException"
      ) {
        const customError = new Error("Credenciales inválidas");
        customError.name = "InvalidCredentialsError";
        throw customError;
      }

      if (error.name === "UserNotConfirmedException") {
        const customError = new Error("Usuario no confirmado");
        customError.name = "UserNotConfirmedError";
        throw customError;
      }

      // Re-lanzar otros errores
      throw error;
    }
  }
}

export const authService = new AuthService();
