import { docClient, TABLE_NAME, getTimestamp } from "../../../dynamodb.js";
import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { requireAdmin } from "../../../utils/auth.js";
import { parseMultipartFormData } from "../../../utils/multipart.js";
import {
  uploadToS3,
  deleteFromS3,
  getS3KeyFromUrl,
} from "../../../utils/s3.js";
import {
  success,
  badRequest,
  notFound,
  serverError,
} from "../../../utils/responses.js";

const updateProductHandler = async (event) => {
  try {
    const { id } = event.pathParameters;

    // Parsear multipart form data
    const { fields, files } = await parseMultipartFormData(event);
    const { name, description, price, stock, category_id } = fields;

    // Validaciones
    if (price && parseFloat(price) < 0) {
      return badRequest("El precio debe ser positivo");
    }

    if (stock && parseInt(stock) < 0) {
      return badRequest("El stock debe ser positivo");
    }

    // Obtener producto actual
    const currentProductResult = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `PRODUCT#${id}`,
          SK: "METADATA",
        },
      }),
    );

    if (!currentProductResult.Item) {
      return notFound("Producto no encontrado");
    }

    const currentProduct = currentProductResult.Item;
    let image_url = currentProduct.image_url;
    let category_name = currentProduct.category_name;

    // Verificar categoría si se está actualizando
    if (category_id && category_id !== currentProduct.category_id) {
      const categoryResult = await docClient.send(
        new GetCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: `CATEGORY#${category_id}`,
            SK: "METADATA",
          },
        }),
      );

      if (!categoryResult.Item) {
        return notFound("Categoría no encontrada");
      }

      category_name = categoryResult.Item.name;
    }

    // Procesar nueva imagen si está presente
    if (files.length > 0) {
      const imageFile = files[0];

      try {
        // Eliminar imagen anterior de S3 si existe
        if (currentProduct.image_url) {
          const oldImageKey = getS3KeyFromUrl(currentProduct.image_url);
          if (oldImageKey) {
            await deleteFromS3(oldImageKey);
          }
        }

        // Subir nueva imagen
        const imageKey = `products/${id}/${imageFile.filename}`;
        image_url = await uploadToS3(
          imageFile.buffer,
          imageKey,
          imageFile.mimeType,
        );
      } catch (uploadError) {
        console.error("Error processing image:", uploadError);
        return serverError("Error al procesar la imagen");
      }
    }

    // Preparar expresiones de actualización
    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    if (name) {
      updateExpressions.push("#name = :name");
      expressionAttributeNames["#name"] = "name";
      expressionAttributeValues[":name"] = name;
    }

    if (description) {
      updateExpressions.push("description = :description");
      expressionAttributeValues[":description"] = description;
    }

    if (price) {
      updateExpressions.push("price = :price");
      expressionAttributeValues[":price"] = parseFloat(price);
    }

    if (stock !== undefined) {
      updateExpressions.push("stock = :stock");
      expressionAttributeValues[":stock"] = parseInt(stock);
    }

    if (category_id) {
      updateExpressions.push("category_id = :category_id");
      updateExpressions.push("category_name = :category_name");
      updateExpressions.push("GSI1PK = :gsi1pk");
      expressionAttributeValues[":category_id"] = category_id;
      expressionAttributeValues[":category_name"] = category_name;
      expressionAttributeValues[":gsi1pk"] = `CATEGORY#${category_id}`;
    }

    if (files.length > 0) {
      updateExpressions.push("image_url = :image_url");
      expressionAttributeValues[":image_url"] = image_url;
    }

    // Siempre actualizar updated_at
    updateExpressions.push("updated_at = :updated_at");
    expressionAttributeValues[":updated_at"] = getTimestamp();

    // Actualizar producto en DynamoDB
    const result = await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `PRODUCT#${id}`,
          SK: "METADATA",
        },
        UpdateExpression: `SET ${updateExpressions.join(", ")}`,
        ExpressionAttributeNames:
          Object.keys(expressionAttributeNames).length > 0
            ? expressionAttributeNames
            : undefined,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW",
      }),
    );

    return success({
      success: true,
      message: "Producto actualizado exitosamente",
      product: {
        id: result.Attributes.id,
        name: result.Attributes.name,
        description: result.Attributes.description,
        price: result.Attributes.price,
        stock: result.Attributes.stock,
        category_id: result.Attributes.category_id,
        category_name: result.Attributes.category_name,
        image_url: result.Attributes.image_url,
        is_active: result.Attributes.is_active,
        created_at: result.Attributes.created_at,
        updated_at: result.Attributes.updated_at,
      },
    });
  } catch (error) {
    console.error("Error en updateProduct:", error);
    return serverError("Error al actualizar producto");
  }
};

export const updateProduct = requireAdmin(updateProductHandler);
