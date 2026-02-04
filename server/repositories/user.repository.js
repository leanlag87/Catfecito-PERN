import { docClient, TABLE_NAME, getTimestamp } from "../dynamodb.js";
import { QueryCommand, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

class UserRepository {
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
}

export const userRepository = new UserRepository();
