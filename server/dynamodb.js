import { DynamoDBClient, ListTablesCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import config from "./config.js";

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

// Test de conexión a DynamoDB
export async function testDynamoDB() {
  try {
    // Intentar listar las tablas (operación simple para verificar conexión)
    const command = new ListTablesCommand({});
    const result = await docClient.send(command);

    console.log("✅ Conexión a DynamoDB establecida correctamente");
    console.log(`📊 Región: ${config.AWS_REGION}`);
    console.log(`📋 Tablas disponibles: ${result.TableNames?.length || 0}`);

    // Verificar si nuestra tabla existe
    if (result.TableNames?.includes(TABLE_NAME)) {
      console.log(`✅ Tabla "${TABLE_NAME}" encontrada`);
    } else {
      console.log(
        `⚠️  Tabla "${TABLE_NAME}" no encontrada. Asegúrate de crearla primero.`,
      );
    }

    return true;
  } catch (error) {
    console.error("❌ Error al conectar con DynamoDB:", error.message);
    if (
      error.name === "UnrecognizedClientException" ||
      error.name === "InvalidSignatureException"
    ) {
      console.error("💡 Verifica tus credenciales de AWS (aws configure)");
    }
    throw error;
  }
}
