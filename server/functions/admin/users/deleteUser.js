import { docClient, TABLE_NAME } from "../../../dynamodb.js";
import {
  CognitoIdentityProviderClient,
  AdminDeleteUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { DeleteCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import config from "../../../config.js";
import { requireAdmin } from "../../../utils/auth.js";
import {
  success,
  badRequest,
  notFound,
  serverError,
} from "../../../utils/responses.js";

const cognitoClient = new CognitoIdentityProviderClient({
  region: config.AWS_REGION,
});

const deleteUserHandler = async (event) => {
  try {
    const adminUser = event.user;
    const { id } = event.pathParameters;

    // Evitar que el admin se elimine a sí mismo
    if (adminUser.id === id) {
      return badRequest("No puedes eliminar tu propia cuenta");
    }

    // Primero obtener el email del usuario (necesario para Cognito)
    const getUserResult = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${id}`,
          SK: "METADATA",
        },
      }),
    );

    if (!getUserResult.Item) {
      return notFound("Usuario no encontrado");
    }

    const userEmail = getUserResult.Item.email;
    const userName = getUserResult.Item.name;

    // Intentar eliminar usuario de Cognito
    try {
      await cognitoClient.send(
        new AdminDeleteUserCommand({
          UserPoolId: config.COGNITO_USER_POOL_ID,
          Username: userEmail,
        }),
      );
    } catch (cognitoError) {
      // Si el usuario no existe en Cognito, continuar de todos modos
      if (cognitoError.name === "UserNotFoundException") {
      } else {
        throw cognitoError; // Re-lanzar otros errores
      }
    }

    // Eliminar usuario de DynamoDB
    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${id}`,
          SK: "METADATA",
        },
      }),
    );

    return success({
      success: true,
      message: "Usuario eliminado exitosamente",
      user: {
        id: id,
        name: userName,
        email: userEmail,
      },
    });
  } catch (error) {
    console.error("Error en deleteUser:", error);
    return serverError("Error al eliminar usuario");
  }
};

export const deleteUser = requireAdmin(deleteUserHandler);
