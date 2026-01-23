import { docClient, TABLE_NAME, getTimestamp } from "../../dynamodb.js";
import { QueryCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import config from "../../config.js";

const cognitoClient = new CognitoIdentityProviderClient({
  region: config.AWS_REGION,
});

export const createUser = async (event) => {
  // Parsear body (API Gateway puede venir como string)
  let body;
  try {
    body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
  } catch (error) {
    console.error("❌ Error parsing body:", error);
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ message: "Body inválido" }),
    };
  }

  const { name, email, password } = body;
  // Validaciones
  if (!name || !email || !password) {
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "name, email y password son requeridos",
      }),
    };
  }

  try {
    // 1. Verificar si el email ya existe usando GSI
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
      return {
        statusCode: 409,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ message: "El email ya está registrado" }),
      };
    }

    const createUserCommand = new AdminCreateUserCommand({
      UserPoolId: config.COGNITO_USER_POOL_ID,
      Username: email.toLowerCase(),
      UserAttributes: [
        { Name: "email", Value: email.toLowerCase() },
        { Name: "email_verified", Value: "true" },
        { Name: "name", Value: name },
      ],
      MessageAction: "SUPPRESS", // No enviar email de bienvenida
      TemporaryPassword: password, // Temporal, luego lo hacemos permanente
    });

    const cognitoResponse = await cognitoClient.send(createUserCommand);
    const cognitoUserId = cognitoResponse.User.Username;

    // 3. Establecer contraseña permanente (para que no requiera cambio en primer login)
    await cognitoClient.send(
      new AdminSetUserPasswordCommand({
        UserPoolId: config.COGNITO_USER_POOL_ID,
        Username: email.toLowerCase(),
        Password: password,
        Permanent: true,
      }),
    );

    // 4. Crear perfil del usuario en DynamoDB
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

    // 5. Preparar datos del usuario
    const user = {
      id: cognitoUserId,
      name,
      email: email.toLowerCase(),
      role: "user",
      is_active: true,
      created_at: now,
      updated_at: now,
    };

    // 6. Retornar respuesta exitosa
    // El token JWT lo generará Cognito en el login, no aquí
    return {
      statusCode: 201,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "Usuario registrado exitosamente",
        user,
        // No retornamos token aquí, el usuario debe hacer login
      }),
    };
  } catch (error) {
    console.error("❌ Error en register:", error);
    // Manejar errores específicos de Cognito
    if (
      error.name === "UsernameExistsException" ||
      error.name === "AliasExistsException"
    ) {
      return {
        statusCode: 409,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ message: "El email ya está registrado" }),
      };
    }

    // Manejar error de política de contraseñas
    if (error.name === "InvalidPasswordException") {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "La contraseña no cumple con los requisitos de seguridad",
          details: error.message,
        }),
      };
    }

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ message: "Error interno del servidor" }),
    };
  }
};
