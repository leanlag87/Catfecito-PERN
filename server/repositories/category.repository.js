import { docClient, TABLE_NAME, getTimestamp } from "../dynamodb.js";
import { GetCommand, QueryCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

class CategoryRepository {
  //Buscar categoría por ID

  async findById(categoryId) {
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `CATEGORY#${categoryId}`,
          SK: "METADATA",
        },
      }),
    );

    if (!result.Item) {
      return null;
    }

    return {
      id: categoryId,
      name: result.Item.name,
      description: result.Item.description,
      is_active: result.Item.is_active,
      created_at: result.Item.created_at,
      updated_at: result.Item.updated_at,
    };
  }

  async findByName(name) {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI2",
        KeyConditionExpression: "GSI2PK = :categoryType AND GSI2SK = :name",
        ExpressionAttributeValues: {
          ":categoryType": "CATEGORY",
          ":name": `NAME#${name.toLowerCase()}`,
        },
        Limit: 1,
      }),
    );

    return result.Items && result.Items.length > 0 ? result.Items[0] : null;
  }

  //Verificar si existe categoría por ID
  async existsById(categoryId) {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: {
          ":pk": `CATEGORY#${categoryId}`,
        },
        Limit: 1,
      }),
    );

    return result.Items && result.Items.length > 0;
  }

  async create(categoryData) {
    const { id, name, description } = categoryData;

    const category = {
      PK: `CATEGORY#${id}`,
      SK: "METADATA",
      GSI2PK: "CATEGORY",
      GSI2SK: `NAME#${name.toLowerCase()}`,
      entityType: "CATEGORY",
      id,
      name,
      description: description || null,
      is_active: true,
      created_at: getTimestamp(),
      updated_at: getTimestamp(),
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: category,
      }),
    );

    return {
      id: category.id,
      name: category.name,
      description: category.description,
      is_active: category.is_active,
      created_at: category.created_at,
      updated_at: category.updated_at,
    };
  }
}

export const categoryRepository = new CategoryRepository();
