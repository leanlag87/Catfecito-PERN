import { docClient, TABLE_NAME } from "../../dynamodb.js";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { success, notFound, serverError } from "../../utils/responses.js";

export const getProductById = async (event) => {
  try {
    const { id } = event.pathParameters;

    console.log(`📦 Fetching product with id: ${id}`);

    // Obtener producto de DynamoDB
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `PRODUCT#${id}`,
          SK: "METADATA",
        },
      }),
    );

    if (!result.Item) {
      console.log(`❌ Product not found: ${id}`);
      return notFound("Producto no encontrado");
    }

    const product = result.Item;

    console.log(`✅ Product found: ${product.name}`);

    // Formatear respuesta
    return success({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        image_url: product.image_url,
        is_active: product.is_active,
        created_at: product.created_at,
        updated_at: product.updated_at,
        category_id: product.category_id,
        category_name: product.category_name,
      },
    });
  } catch (error) {
    console.error("❌ Error en getProductById:", error);
    return serverError("Error al obtener producto");
  }
};
