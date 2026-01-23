import { docClient, TABLE_NAME, getTimestamp } from "../../dynamodb.js";
import { QueryCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import config from "../../config.js";
import { parseBody, validateRequired } from "../../utils/validators.js";
import {
  success,
  badRequest,
  conflict,
  serverError,
} from "../../utils/responses.js";

const cognitoClient = new CognitoIdentityProviderClient({
  region: config.AWS_REGION,
});

export const createUser = async (event) => {
  try {
    // Parsear y validar body
    const body = parseBody(event);
    const { name, email, password } = body;

    validateRequired(body, ["name", "email", "password"]);

    // Verificar si el email ya existe usando GSI
    const emailCheck = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :emailKey",
        ExpressionAttributeValues: {
          ":emailKey": `USER#EMAIL#${email.toLowerCase()}`,
        },
      }),
    );

    if (emailCheck.Items && emailCheck.Items.length > 0) {
      return conflict("El email ya está registrado");
    }

    // Crear usuario en Cognito
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
    const cognitoUserId = cognitoResponse.User.Username;

    // Establecer contraseña permanente
    await cognitoClient.send(
      new AdminSetUserPasswordCommand({
        UserPoolId: config.COGNITO_USER_POOL_ID,
        Username: email.toLowerCase(),
        Password: password,
        Permanent: true,
      }),
    );

    // Crear perfil del usuario en DynamoDB
    const now = getTimestamp();
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `USER#${cognitoUserId}`,
          SK: "METADATA",
          GSI1PK: `USER#EMAIL#${email.toLowerCase()}`,
          GSI1SK: `USER#${cognitoUserId}`,
          name,
          email: email.toLowerCase(),
          role: "user",
          is_active: true,
          created_at: now,
          updated_at: now,
          entityType: "USER",
        },
      }),
    );

    // Preparar datos del usuario
    const user = {
      id: cognitoUserId,
      name,
      email: email.toLowerCase(),
      role: "user",
      is_active: true,
      created_at: now,
      updated_at: now,
    };

    return success(
      {
        message: "Usuario registrado exitosamente",
        user,
      },
      201,
    );
  } catch (error) {
    console.error("Error en register:", error);

    // Validación de campos requeridos
    if (error.message.startsWith("Campos requeridos")) {
      return badRequest(error.message);
    }

    // Body inválido
    if (error.message === "Body inválido") {
      return badRequest(error.message);
    }

    // Errores de Cognito
    if (
      error.name === "UsernameExistsException" ||
      error.name === "AliasExistsException"
    ) {
      return conflict("El email ya está registrado");
    }

    if (error.name === "InvalidPasswordException") {
      return badRequest(
        "La contraseña no cumple con los requisitos de seguridad",
      );
    }

    return serverError();
  }
};
