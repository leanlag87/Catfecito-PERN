import { requireAuth } from "../../../utils/auth.js";
import { parseBody, validateRequired } from "../../../utils/validators.js";
import {
  success,
  badRequest,
  notFound,
  serverError,
} from "../../../utils/responses.js";
import { cartService } from "../../../services/cart.service.js";

const addToCartHandler = async (event) => {
  try {
    const userId = event.user.id;
    const body = parseBody(event);
    const { product_id, quantity } = body;

    // Validar campos requeridos
    validateRequired(body, ["product_id"]);

    // Delegar al servicio
    const result = await cartService.addToCart(userId, product_id, quantity);

    return success(
      {
        success: true,
        message: result.isUpdate
          ? "Cantidad actualizada en el carrito"
          : "Producto agregado al carrito",
        item: result.item,
      },
      201,
    );
  } catch (error) {
    console.error("Error en addToCart:", error);

    if (error.message === "Body inválido") {
      return badRequest(error.message);
    }

    if (error.message.startsWith("Campos requeridos")) {
      return badRequest(error.message);
    }

    if (error.name === "ValidationError") {
      return badRequest(error.message);
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

    return serverError("Error al agregar producto al carrito");
  }
};

export const addToCart = requireAuth(addToCartHandler);
