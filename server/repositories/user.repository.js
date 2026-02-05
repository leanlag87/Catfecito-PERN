import { docClient, TABLE_NAME, getTimestamp } from "../dynamodb.js";
import { QueryCommand, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

//Clase que contendra metodos personalizados para manejar usuarios en DynamoDB
class UserRepository {
  //Metodos personalizados para manejar usuarios en DynamoDB

  //Buscar usuario por email usando GSI
  async findByEmail(email) {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :emailKey",
        ExpressionAttributeValues: {
          ":emailKey": `USER#EMAIL#${email.toLowerCase()}`,
        },
      }),
    );

    return result.Items && result.Items.length > 0 ? result.Items[0] : null;
  }

  //Buscar usuario por ID
  async findById(userId) {
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: "METADATA",
        },
      }),
    );

    return result.Item || null;
  }

  //Obtener perfil de usuario por ID
  async getProfile(userId) {
    const user = await this.findById(userId);

    if (!user) {
      return null;
    }

    // Mapear todos los campos del perfil
    return {
      id: userId,
      name: user.name,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      created_at: user.created_at,
      updated_at: user.updated_at,
      // Campos de dirección opcionales
      default_country: user.default_country || null,
      default_address: user.default_address || null,
      default_address2: user.default_address2 || null,
      default_city: user.default_city || null,
      default_state: user.default_state || null,
      default_zip: user.default_zip || null,
      default_phone: user.default_phone || null,
    };
  }

  //Crear nuevo usuario en DynamoDB
  async create(userData) {
    const { cognitoUserId, name, email, role = "user" } = userData;
    const now = getTimestamp();

    const item = {
      PK: `USER#${cognitoUserId}`,
      SK: "METADATA",
      GSI1PK: `USER#EMAIL#${email.toLowerCase()}`,
      GSI1SK: `USER#${cognitoUserId}`,
      name,
      email: email.toLowerCase(),
      role,
      is_active: true,
      created_at: now,
      updated_at: now,
      entityType: "USER",
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
      }),
    );

    return {
      id: cognitoUserId,
      name,
      email: email.toLowerCase(),
      role,
      is_active: true,
      created_at: now,
      updated_at: now,
    };
  }

  //Verificar si un email ya existe
  async emailExists(email) {
    const user = await this.findByEmail(email);
    return user !== null;
  }

  async updateProfile(userId, updateData) {
    const { name, email } = updateData;

    // Construir expresión de actualización dinámica
    let updateExpression = "SET updated_at = :updated_at";
    const expressionAttributeValues = {
      ":updated_at": getTimestamp(),
    };
    const expressionAttributeNames = {};

    if (name) {
      updateExpression += ", #name = :name";
      expressionAttributeNames["#name"] = "name";
      expressionAttributeValues[":name"] = name;
    }

    if (email) {
      updateExpression += ", email = :email, GSI1PK = :gsi1pk";
      expressionAttributeValues[":email"] = email.toLowerCase();
      expressionAttributeValues[":gsi1pk"] =
        `USER#EMAIL#${email.toLowerCase()}`;
    }

    const result = await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: "METADATA",
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ...(Object.keys(expressionAttributeNames).length > 0 && {
          ExpressionAttributeNames: expressionAttributeNames,
        }),
        ReturnValues: "ALL_NEW",
      }),
    );

    return {
      id: userId,
      name: result.Attributes.name,
      email: result.Attributes.email,
      role: result.Attributes.role,
      is_active: result.Attributes.is_active,
      created_at: result.Attributes.created_at,
      updated_at: result.Attributes.updated_at,
    };
  }
}

export const userRepository = new UserRepository();
