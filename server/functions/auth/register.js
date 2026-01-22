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
  console.log("🔍 Event received:", JSON.stringify(event, null, 2));
  // Parsear body (API Gateway puede venir como string)
  let body;
  try {
    body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
    console.log("📝 Parsed body:", body);
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
  console.log("👤 User data:", { name, email, password: "***" });

  // Validaciones
  if (!name || !email || !password) {
    console.error("❌ Missing required fields");
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
    console.log("🔍 Checking if email exists...");
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

    console.log("📊 Email check result:", emailCheck.Items?.length || 0);

    if (emailCheck.Items && emailCheck.Items.length > 0) {
      console.log("❌ Email already exists");
      return {
        statusCode: 409,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ message: "El email ya está registrado" }),
      };
    }

    console.log("🔐 Creating user in Cognito...");

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
    console.log("✅ User created in Cognito:", cognitoUserId);

    // 3. Establecer contraseña permanente (para que no requiera cambio en primer login)
    console.log("🔑 Setting permanent password...");
    await cognitoClient.send(
      new AdminSetUserPasswordCommand({
        UserPoolId: config.COGNITO_USER_POOL_ID,
        Username: email.toLowerCase(),
        Password: password,
        Permanent: true,
      }),
    );
    console.log("✅ Permanent password set");

    // 4. Crear perfil del usuario en DynamoDB
    const now = getTimestamp();
    console.log("💾 Creating user profile in DynamoDB...");
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
    console.log("✅ User profile created in DynamoDB");

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
    // Nota: El token JWT lo generará Cognito en el login, no aquí
    console.log("🎉 Registration completed successfully");
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
    console.error("❌ Error name:", error.name);
    console.error("❌ Error message:", error.message);
    console.error("❌ Error stack:", error.stack);

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
