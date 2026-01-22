import {
  docClient,
  TABLE_NAME,
  generateId,
  getTimestamp,
} from "../../dynamodb.js";
import { QueryCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcrypt";
import { signAccessToken } from "../../libs/jwt.js";

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

    // 2. Generar ID único y timestamp
    const userId = generateId();
    const now = getTimestamp();
    console.log("🆔 Generated userId:", userId);

    // 3. Hash de contraseña
    console.log("🔒 Hashing password...");
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 4. Crear usuario en DynamoDB
    console.log("💾 Creating user in DynamoDB...");
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `USER#${userId}`,
          SK: "METADATA",
          GSI1PK: `USER#EMAIL#${email.toLowerCase()}`,
          GSI1SK: `USER#${userId}`,
          name,
          email: email.toLowerCase(),
          password_hash: passwordHash,
          role: "user", // Por defecto
          is_active: true,
          created_at: now,
          updated_at: now,
          entityType: "USER",
        },
      }),
    );

    // 5. Preparar datos del usuario (sin password_hash)
    const user = {
      id: userId,
      name,
      email: email.toLowerCase(),
      role: "user",
      is_active: true,
      created_at: now,
      updated_at: now,
    };

    // 6. Generar token JWT
    console.log("🔑 Generating JWT token...");
    const token = await signAccessToken({ id: userId, role: "user" });
    console.log("✅ JWT token generated successfully");

    // 7. Retornar respuesta exitosa
    console.log("🎉 Registration completed successfully");
    return {
      statusCode: 201,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ user, token }),
    };
  } catch (error) {
    console.error("Error en register:", error);
    console.error("❌ Error stack:", error.stack);
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

// En que parte de esta funcion iria lo de "aws cognito?"

// Podria ir en lugar de hacer el hash y guardar la contraseña en dynamodb, pero en este caso
// se deberia crear el usuario en cognito y guardar solo el userId y demas datos en dynamodb
// La logica cambiaria un poco, pero es factible.
//Entonces como quedaria la funcion completa si que que agregamos ahora mismo cognito?

// Para integrar AWS Cognito en la función de registro, se debe crear un usuario en Cognito
// y luego almacenar los datos adicionales en DynamoDB. Aquí te dejo un ejemplo de cómo podría
// quedar la función completa con Cognito integrado:

// import {
//   docClient,
//   TABLE_NAME,
//   generateId,
//   getTimestamp,
// } from "../../dynamodb.js";
// import { QueryCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
// import {
//   CognitoIdentityProviderClient,
//   AdminCreateUserCommand,
// } from "@aws-sdk/client-cognito-identity-provider";
// import { signAccessToken } from "../../libs/jwt.js";
// import bcrypt from "bcrypt";

// const cognitoClient = new CognitoIdentityProviderClient({
//   region: "us-east-1",
// });
// const USER_POOL_ID = "tu_user_pool_id"; // Reemplaza con tu User Pool ID

// export const handler = async (event) => {
//   // Parsear body (API Gateway puede venir como string)

//   let body;
//   try {
//     body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
//   } catch (error) {
//     return {
//       statusCode: 400,
//       headers: {
//         "Content-Type": "application/json",
//         "Access-Control-Allow-Origin": "*",
//       },
//       body: JSON.stringify({ message: "Body inválido" }),
//     };
//   }
//   const { name, email, password } = body;

//   // Validaciones
//   if (!name || !email || !password) {
//     return {
//       statusCode: 400,
//       headers: {
//         "Content-Type": "application/json",
//         "Access-Control-Allow-Origin": "*",
//       },
//       body: JSON.stringify({
//         message: "name, email y password son requeridos",
//       }),
//     };
//   }
//   try {
//     // 1. Crear usuario en Cognito
//     const createUserCommand = new AdminCreateUserCommand({
//       UserPoolId: USER_POOL_ID,
//       Username: email.toLowerCase(),
//       TemporaryPassword: password,
//       UserAttributes: [
//         { Name: "email", Value: email.toLowerCase() },
//         { Name: "name", Value: name },
//       ],
//       MessageAction: "SUPPRESS", // No enviar email de bienvenida
//     });
//     const cognitoResponse = await cognitoClient.send(createUserCommand);

//     const userId = cognitoResponse.User.Username;
//     const now = getTimestamp();

//     // 2. Crear usuario en DynamoDB
//     await docClient.send(
//       new PutCommand({
//         TableName: TABLE_NAME,
//         Item: {
//           PK: `USER#${userId}`,
//           SK: "METADATA",
//           GSI1PK: `USER#EMAIL#${email.toLowerCase()}`,
//           GSI1SK: `USER#${userId}`,
//           name,
//           email: email.toLowerCase(),
//           role: "user", // Por defecto
//           is_active: true,
//           created_at: now,
//           updated_at: now,
//           entityType: "USER",
//         },
//       }),
//     );
//     // 3. Preparar datos del usuario (sin password_hash)
//     const user = {
//       id: userId,
//       name,
//       email: email.toLowerCase(),
//       role: "user",
//       is_active: true,
//       created_at: now,
//       updated_at: now,
//     };
//     // 4. Generar token JWT
//     const token = await signAccessToken({ id: userId, role: "user" });
//     // 5. Retornar respuesta exitosa
//     return {
//       statusCode: 201,
//       headers: {
//         "Content-Type": "application/json",
//         "Access-Control-Allow-Origin": "*",
//       },
//       body: JSON.stringify({ user, token }),
//     };
//   } catch (error) {
//     console.error("Error en register:", error);
//     return {
//       statusCode: 500,
//       headers: {
//         "Content-Type": "application/json",
//         "Access-Control-Allow-Origin": "*",
//       },
//       body: JSON.stringify({ message: "Error interno del servidor" }),
//     };
//   }
// };
