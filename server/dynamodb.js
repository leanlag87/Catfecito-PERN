import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import config from "./config";

// Configurar cliente DynamoDB
const dynamoClient = new DynamoDBClient({
  region: config.AWS_REGION,
});

//Lo que hacemos aqui es crear un cliente de alto nivel para trabajar con DynamoDB
export const docClient = DynamoDBDocumentClient.from(dynamoClient);

//Lo que hacemos aqui es exportar el nombre de la tabla que vamos a usar en DynamoDB
export const TABLE_NAME = config.DYNAMODB_TABLE;

// Helper para generar timestamps
export function getTimestamp() {
  return new Date().toISOString();
}

// Helper para generar IDs únicos
export function generateId() {
  return crypto.randomUUID();
}
