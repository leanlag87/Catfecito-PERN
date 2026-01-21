import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// Configurar cliente DynamoDB
const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || "sa-east-1",
});

export const docClient = DynamoDBDocumentClient.from(dynamoClient);

export const TABLE_NAME = process.env.DYNAMODB_TABLE || "catfecito-backend-dev";

// Helper para generar timestamps
export function getTimestamp() {
  return new Date().toISOString();
}

// Helper para generar IDs únicos
export function generateId() {
  return crypto.randomUUID();
}