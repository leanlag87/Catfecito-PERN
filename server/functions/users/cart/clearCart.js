import { requireAuth } from "../../../utils/auth.js";
import { success, serverError } from "../../../utils/responses.js";
import { cartService } from "../../../services/cart.service.js";

const clearCartHandler = async (event) => {
  try {
    const userId = event.user.id;

    // Delegar al servicio
    const result = await cartService.clearCart(userId);

    return success({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error en clearCart:", error);
    return serverError("Error al vaciar el carrito");
  }
};

export const clearCart = requireAuth(clearCartHandler);
