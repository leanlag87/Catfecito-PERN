import { requireAuth } from "../../../utils/auth.js";
import { success, serverError } from "../../../utils/responses.js";
import { cartService } from "../../../services/cart.service.js";

const getCartHandler = async (event) => {
  try {
    const userId = event.user.id;

    // Delegar al servicio
    const cart = await cartService.getCart(userId);

    return success({
      success: true,
      ...cart,
    });
  } catch (error) {
    console.error("Error en getCart:", error);
    return serverError("Error al obtener el carrito");
  }
};

export const getCart = requireAuth(getCartHandler);
