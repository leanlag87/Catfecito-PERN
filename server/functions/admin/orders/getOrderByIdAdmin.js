import { requireAdmin } from "../../../utils/auth.js";
import { success, notFound, serverError } from "../../../utils/responses.js";
import { adminOrderService } from "../../../services/admin/order.service.js";

const getOrderByIdAdminHandler = async (event) => {
  try {
    const orderId = event.pathParameters?.id;

    // Delegar al servicio
    const order = await adminOrderService.getOrderById(orderId);

    return success({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Error en getOrderByIdAdmin:", error);

    if (error.name === "OrderNotFoundError") {
      return notFound(error.message);
    }

    return serverError("Error al obtener la orden");
  }
};

export const getOrderByIdAdmin = requireAdmin(getOrderByIdAdminHandler);
