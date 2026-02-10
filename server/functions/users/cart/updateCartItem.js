import { requireAuth } from "../../../utils/auth.js";
import { parseBody, validateRequired } from "../../../utils/validators.js";
import {
  success,
  badRequest,
  notFound,
  serverError,
} from "../../../utils/responses.js";
import { cartService } from "../../../services/cart.service.js";

const updateCartItemHandler = async (event) => {
  try {
    const userId = event.user.id;
    const { product_id } = event.pathParameters;
    const body = parseBody(event);
    const { quantity } = body;

    // Validar campos requeridos
    validateRequired(body, ["quantity"]);

    // Delegar al servicio
    const item = await cartService.updateCartItem(userId, product_id, quantity);

    return success({
      success: true,
      message: "Cantidad actualizada",
      item,
    });
  } catch (error) {
    console.error("Error en updateCartItem:", error);

    if (error.message === "Body inválido") {
      return badRequest(error.message);
    }

    if (error.message.startsWith("Campos requeridos")) {
      return badRequest(error.message);
    }

    if (error.name === "ValidationError") {
      return badRequest(error.message);
    }

    if (error.name === "CartItemNotFoundError") {
      return notFound(error.message);
    }

    if (error.name === "ProductNotFoundError") {
      return notFound(error.message);
    }

    if (error.name === "ProductNotAvailableError") {
      return badRequest(error.message);
    }

    if (error.name === "InsufficientStockError") {
      return badRequest(error.message);
    }

    return serverError("Error al actualizar item");
  }
};

export const updateCartItem = requireAuth(updateCartItemHandler);
