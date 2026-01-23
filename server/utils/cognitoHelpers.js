import { createHmac } from "crypto";

export const calculateSecretHash = (username, clientId, clientSecret) => {
  return createHmac("sha256", clientSecret)
    .update(username + clientId)
    .digest("base64");
};

export const buildAuthParams = (email, password, clientId, clientSecret) => {
  const authParams = {
    USERNAME: email.toLowerCase(),
    PASSWORD: password,
  };

  if (clientSecret) {
    authParams.SECRET_HASH = calculateSecretHash(
      email.toLowerCase(),
      clientId,
      clientSecret,
    );
  }

  return authParams;
};
