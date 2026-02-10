import { requireAuth } from "../../../utils/auth.js";
import { success, notFound, serverError } from "../../../utils/responses.js";
import { cartService } from "../../../services/cart.service.js";

const removeCartItemHandler = async (event) => {
  try {
    const userId = event.user.id;
    const { product_id } = event.pathParameters;

    // Delegar al servicio
    const item = await cartService.removeCartItem(userId, product_id);

    return success({
      success: true,
      message: "Producto eliminado del carrito",
      item,
    });
  } catch (error) {
    console.error("Error en removeCartItem:", error);

    if (error.name === "CartItemNotFoundError") {
      return notFound(error.message);
    }

    return serverError("Error al eliminar item");
  }
};

export const removeCartItem = requireAuth(removeCartItemHandler);
