import { docClient, TABLE_NAME, getTimestamp } from "../../../dynamodb.js";
import { GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { requireAuth } from "../../../utils/auth.js";
import {
  success,
  badRequest,
  notFound,
  serverError,
} from "../../../utils/responses.js";

const addToCartHandler = async (event) => {
  try {
    const userId = event.user.id;
    const body = JSON.parse(event.body);
    const { product_id, quantity } = body;

    if (!product_id) {
      return badRequest("El product_id es requerido");
    }

    const qty = parseInt(quantity) || 1;

    if (qty <= 0) {
      return badRequest("La cantidad debe ser mayor a 0");
    }

    // Verificar que el producto existe y está activo
    const productResult = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `PRODUCT#${product_id}`,
          SK: "METADATA",
        },
      }),
    );

    if (!productResult.Item) {
      return notFound("Producto no encontrado");
    }

    const product = productResult.Item;

    if (!product.is_active) {
      return badRequest("El producto no está disponible");
    }

    if (product.stock < qty) {
      return badRequest(`Stock insuficiente. Disponible: ${product.stock}`);
    }

    // Verificar si el producto ya está en el carrito
    const existingItemResult = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: `CART#${product_id}`,
        },
      }),
    );

    let cartItem;
    let isUpdate = false;

    if (existingItemResult.Item) {
      // Si ya existe, actualizar cantidad
      const existingItem = existingItemResult.Item;
      const newQuantity = existingItem.quantity + qty;

      // Verificar stock para la nueva cantidad
      if (product.stock < newQuantity) {
        return badRequest(
          `Stock insuficiente. Disponible: ${product.stock}, en carrito: ${existingItem.quantity}`,
        );
      }

      const result = await docClient.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: `USER#${userId}`,
            SK: `CART#${product_id}`,
          },
          UpdateExpression: "SET quantity = :quantity, updated_at = :updatedAt",
          ExpressionAttributeValues: {
            ":quantity": newQuantity,
            ":updatedAt": getTimestamp(),
          },
          ReturnValues: "ALL_NEW",
        }),
      );

      cartItem = result.Attributes;
      isUpdate = true;
    } else {
      // Si no existe, crear nuevo item
      const newItem = {
        PK: `USER#${userId}`,
        SK: `CART#${product_id}`,
        GSI1PK: `PRODUCT#${product_id}`,
        GSI1SK: `USER#${userId}`,
        entityType: "CART_ITEM",
        user_id: userId,
        product_id: product_id,
        product_name: product.name,
        product_price: product.price,
        product_image: product.image_url || null,
        quantity: qty,
        created_at: getTimestamp(),
        updated_at: getTimestamp(),
      };

      await docClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: newItem,
        }),
      );

      cartItem = newItem;
    }

    // Calcular subtotal
    const subtotal = cartItem.product_price * cartItem.quantity;

    return success(
      {
        success: true,
        message: isUpdate
          ? "Cantidad actualizada en el carrito"
          : "Producto agregado al carrito",
        item: {
          id: `${userId}#${product_id}`, // ID compuesto para el frontend
          product_id: cartItem.product_id,
          product_name: cartItem.product_name,
          product_price: cartItem.product_price,
          product_image: cartItem.product_image,
          product_stock: product.stock,
          quantity: cartItem.quantity,
          subtotal: subtotal,
          created_at: cartItem.created_at,
          updated_at: cartItem.updated_at,
        },
      },
      201,
    );
  } catch (error) {
    console.error("Error en addToCart:", error);
    return serverError("Error al agregar producto al carrito");
  }
};

export const addToCart = requireAuth(addToCartHandler);

/**
 * Cosas para hacer mañana:
 * Ver si se puede "unificar" el archivo auth.js con authorizer.js
 * Ver si es necesario usar la libreria JWT ya que estoy usando cognito.
 * ver para que se esta usando JWT, a lo mejor no es necesario usarlo.
 *
 * Ver si puedo comenzar con la separacion de "responsabilidades"
 * es decir, separar la logica de negocio de la logica de infraestructura (dynamodb, api gateway, etc)
 *
 */
