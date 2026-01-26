import { docClient, TABLE_NAME } from "../../dynamodb.js";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { success, serverError } from "../../utils/responses.js";

export const getAllProducts = async (event) => {
  try {
    // Scan con filtro para productos activos
    const result = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "entityType = :entityType AND is_active = :isActive",
        ExpressionAttributeValues: {
          ":entityType": "PRODUCT",
          ":isActive": true,
        },
      }),
    );

    // Ordenar por created_at (más recientes primero)
    const products = result.Items.sort((a, b) => {
      return new Date(b.created_at) - new Date(a.created_at);
    });

    // Formatear respuesta (similar al formato SQL)
    const formattedProducts = products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      stock: p.stock,
      image_url: p.image_url,
      is_active: p.is_active,
      created_at: p.created_at,
      updated_at: p.updated_at,
      category_id: p.category_id,
      category_name: p.category_name,
    }));

    return success({
      success: true,
      count: formattedProducts.length,
      products: formattedProducts,
    });
  } catch (error) {
    console.error("Error en getAllProducts:", error);
    return serverError("Error al obtener productos");
  }
};
