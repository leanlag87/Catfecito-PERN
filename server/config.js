import dotenv from "dotenv";

// Cargar variables de entorno
dotenv.config();

const config = {
  // AWS DynamoDB
  AWS_REGION: process.env.AWS_REGION || "sa-east-1",
  DYNAMODB_TABLE: process.env.DYNAMODB_TABLE || "catfecito-backend-dev",
  S3_BUCKET: process.env.S3_BUCKET || "catfecito-backend-dev",

  //Cognito
  COGNITO_USER_POOL_ID: process.env.COGNITO_USER_POOL_ID,
  COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID,
  COGNITO_CLIENT_SECRET: process.env.COGNITO_CLIENT_SECRET || "",

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || "xyz12345",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",

  // MercadoPago
  MP_ACCESS_TOKEN: process.env.MP_ACCESS_TOKEN,
  MP_PUBLIC_KEY: process.env.MP_PUBLIC_KEY,
  MP_WEBHOOK_SECRET: process.env.MP_WEBHOOK_SECRET,
};

export default config;

export const {
  AWS_REGION,
  DYNAMODB_TABLE,
  COGNITO_USER_POOL_ID,
  COGNITO_CLIENT_ID,
  COGNITO_CLIENT_SECRET,
  S3_BUCKET,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  MP_ACCESS_TOKEN,
  MP_PUBLIC_KEY,
  MP_WEBHOOK_SECRET,
} = config;
