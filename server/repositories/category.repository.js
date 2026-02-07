import { docClient, TABLE_NAME } from "../dynamodb.js";
import { GetCommand } from "@aws-sdk/lib-dynamodb";

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
}

export const categoryRepository = new CategoryRepository();
