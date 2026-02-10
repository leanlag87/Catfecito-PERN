import { requireAuth } from "../../../utils/auth.js";
import { success, serverError } from "../../../utils/responses.js";
import { orderService } from "../../../services/order.service.js";

const getMyOrdersHandler = async (event) => {
  try {
    const userId = event.user.id;

    // Delegar al servicio
    const result = await orderService.getMyOrders(userId);

    return success({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error en getMyOrders:", error);
    return serverError("Error al obtener órdenes");
  }
};

export const getMyOrders = requireAuth(getMyOrdersHandler);
