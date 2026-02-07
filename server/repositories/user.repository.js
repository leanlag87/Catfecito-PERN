import { docClient, TABLE_NAME, getTimestamp } from "../dynamodb.js";
import {
  QueryCommand,
  GetCommand,
  PutCommand,
  UpdateCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";

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

  async updateAddress(userId, addressData) {
    const {
      default_country,
      default_address,
      default_address2,
      default_city,
      default_state,
      default_zip,
      default_phone,
    } = addressData;

    // Construir expresión de actualización dinámica
    let updateExpression = "SET updated_at = :updated_at";
    const expressionAttributeValues = {
      ":updated_at": getTimestamp(),
    };

    // Agregar campos de dirección (permitir undefined para no actualizar, null para limpiar)
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

    const result = await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: "METADATA",
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW",
      }),
    );

    return {
      id: userId,
      name: result.Attributes.name,
      email: result.Attributes.email,
      default_country: result.Attributes.default_country || null,
      default_address: result.Attributes.default_address || null,
      default_address2: result.Attributes.default_address2 || null,
      default_city: result.Attributes.default_city || null,
      default_state: result.Attributes.default_state || null,
      default_zip: result.Attributes.default_zip || null,
      default_phone: result.Attributes.default_phone || null,
    };
  }

  //Obtener todos los usuarios (para admin)
  async findAll() {
    const result = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "SK = :metadata AND begins_with(PK, :userPrefix)",
        ExpressionAttributeValues: {
          ":metadata": "METADATA",
          ":userPrefix": "USER#",
        },
      }),
    );

    // Mapear y ordenar por fecha de creación (más reciente primero)
    return (result.Items || [])
      .map((item) => ({
        id: item.PK.replace("USER#", ""),
        name: item.name,
        email: item.email,
        role: item.role,
        is_active: item.is_active,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  async countAdmins() {
    const result = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "#role = :adminRole AND SK = :metadata",
        ExpressionAttributeNames: {
          "#role": "role",
        },
        ExpressionAttributeValues: {
          ":adminRole": "admin",
          ":metadata": "METADATA",
        },
        Select: "COUNT",
      }),
    );

    return result.Count || 0;
  }

  async updateRole(userId, newRole) {
    const result = await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: "METADATA",
        },
        UpdateExpression: "SET #role = :role, updated_at = :updated_at",
        ExpressionAttributeNames: {
          "#role": "role",
        },
        ExpressionAttributeValues: {
          ":role": newRole,
          ":updated_at": getTimestamp(),
        },
        ReturnValues: "ALL_NEW",
      }),
    );

    if (!result.Attributes) {
      return null;
    }

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

  async toggleStatus(userId) {
    // Obtener estado actual
    const user = await this.findById(userId);

    if (!user) {
      return null;
    }

    const newStatus = !user.is_active;

    // Actualizar estado
    const result = await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: "METADATA",
        },
        UpdateExpression: "SET is_active = :status, updated_at = :updated_at",
        ExpressionAttributeValues: {
          ":status": newStatus,
          ":updated_at": getTimestamp(),
        },
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
