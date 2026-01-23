import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { createHmac } from "crypto";
import config from "../../config.js";

const cognitoClient = new CognitoIdentityProviderClient({
  region: config.AWS_REGION,
});

// Función para calcular SECRET_HASH
const calculateSecretHash = (username, clientId, clientSecret) => {
  return createHmac("sha256", clientSecret)
    .update(username + clientId)
    .digest("base64");
};

export const loginUser = async (event) => {
  console.log("🔍 Event received:", JSON.stringify(event, null, 2));

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

  const { email, password } = body;

  console.log("👤 Login attempt for email:", email);
  console.log("🔐 Password provided:", password ? "***" : "NO");
  console.log("🏢 Cognito Client ID:", config.COGNITO_CLIENT_ID);
  console.log("🌎 AWS Region:", config.AWS_REGION);

  if (!email || !password) {
    console.error("❌ Missing email or password");
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ message: "Email y password son requeridos" }),
    };
  }

  try {
    console.log("🚀 Initiating auth with Cognito...");

    const authParams = {
      USERNAME: email.toLowerCase(),
      PASSWORD: password,
    };

    // Si existe CLIENT_SECRET, calcular SECRET_HASH
    if (config.COGNITO_CLIENT_SECRET) {
      const secretHash = calculateSecretHash(
        email.toLowerCase(),
        config.COGNITO_CLIENT_ID,
        config.COGNITO_CLIENT_SECRET,
      );
      authParams.SECRET_HASH = secretHash;
      console.log("🔑 SECRET_HASH calculated");
    }

    const authResponse = await cognitoClient.send(
      new InitiateAuthCommand({
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: config.COGNITO_CLIENT_ID,
        AuthParameters: authParams,
      }),
    );

    console.log("✅ Auth successful!");
    console.log("📦 Auth response:", JSON.stringify(authResponse, null, 2));

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "Login exitoso",
        token: authResponse.AuthenticationResult.IdToken,
        accessToken: authResponse.AuthenticationResult.AccessToken,
        refreshToken: authResponse.AuthenticationResult.RefreshToken,
      }),
    };
  } catch (error) {
    console.error("❌ Error en login:", error);
    console.error("❌ Error name:", error.name);
    console.error("❌ Error message:", error.message);
    console.error("❌ Error code:", error.$metadata?.httpStatusCode);
    console.error("❌ Full error:", JSON.stringify(error, null, 2));

    return {
      statusCode: 401,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "Credenciales inválidas",
        error: error.message,
      }),
    };
  }
};
