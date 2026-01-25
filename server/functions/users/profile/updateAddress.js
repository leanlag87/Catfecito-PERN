import { docClient, TABLE_NAME, getTimestamp } from "../../../dynamodb.js";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { requireAuth } from "../../../utils/auth.js";
import { parseBody } from "../../../utils/validators.js";
import { success, serverError } from "../../../utils/responses.js";

const updateAddressHandler = async (event) => {
  try {
    const user = event.user;
    const body = parseBody(event);
    const {
      default_country,
      default_address,
      default_address2,
      default_city,
      default_state,
      default_zip,
      default_phone,
    } = body;

    // Construir expression para actualización dinámica
    let updateExpression = "SET updated_at = :updated_at";
    const expressionAttributeValues = {
      ":updated_at": getTimestamp(),
    };

    // Agregar campos de dirección (permitir null para limpiar campos)
    if (default_country !== undefined) {
      updateExpression += ", default_country = :country";
      expressionAttributeValues[":country"] = default_country;
    }

    if (default_address !== undefined) {
      updateExpression += ", default_address = :address";
      expressionAttributeValues[":address"] = default_address;
    }

    if (default_address2 !== undefined) {
      updateExpression += ", default_address2 = :address2";
      expressionAttributeValues[":address2"] = default_address2;
    }

    if (default_city !== undefined) {
      updateExpression += ", default_city = :city";
      expressionAttributeValues[":city"] = default_city;
    }

    if (default_state !== undefined) {
      updateExpression += ", default_state = :state";
      expressionAttributeValues[":state"] = default_state;
    }

    if (default_zip !== undefined) {
      updateExpression += ", default_zip = :zip";
      expressionAttributeValues[":zip"] = default_zip;
    }

    if (default_phone !== undefined) {
      updateExpression += ", default_phone = :phone";
      expressionAttributeValues[":phone"] = default_phone;
    }

    // Actualizar dirección en DynamoDB
    const result = await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${user.id}`,
          SK: "METADATA",
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW",
      }),
    );

    // Preparar datos del usuario actualizado
    const updatedUser = {
      id: user.id,
      name: result.Attributes.name,
      email: result.Attributes.email,
      default_country: result.Attributes.default_country,
      default_address: result.Attributes.default_address,
      default_address2: result.Attributes.default_address2,
      default_city: result.Attributes.default_city,
      default_state: result.Attributes.default_state,
      default_zip: result.Attributes.default_zip,
      default_phone: result.Attributes.default_phone,
    };

    return success({
      success: true,
      message: "Dirección actualizada exitosamente",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error en updateAddress:", error);
    return serverError("Error al actualizar dirección");
  }
};

// Exportar con middleware de autenticación
export const updateAddress = requireAuth(updateAddressHandler);
