import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import config from "../../config.js";

const cognitoClient = new CognitoIdentityProviderClient({
  region: config.AWS_REGION,
});

export const loginUser = async (event) => {
  const body =
    typeof event.body === "string" ? JSON.parse(event.body) : event.body;
  const { email, password } = body;

  try {
    const authResponse = await cognitoClient.send(
      new InitiateAuthCommand({
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: config.COGNITO_CLIENT_ID,
        AuthParameters: {
          USERNAME: email.toLowerCase(),
          PASSWORD: password,
        },
      }),
    );

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
    return {
      statusCode: 401,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ message: "Credenciales inválidas" }),
    };
  }
};
