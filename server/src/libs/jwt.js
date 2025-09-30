// server/src/libs/jwt.js
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

if (!JWT_SECRET) {
  console.warn("JWT_SECRET no está configurado. Configura tu .env.");
}

export function signAccessToken(payload, opts = {}) {
  return new Promise((resolve, reject) => {
    jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN, ...opts },
      (err, token) => (err ? reject(err) : resolve(token))
    );
  });
}

export function verifyAccessToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, JWT_SECRET, (err, decoded) =>
      err ? reject(err) : resolve(decoded)
    );
  });
}
