import { requireAdmin } from "../../../utils/auth.js";
import { parseBody } from "../../../utils/validators.js";
import {
  success,
  badRequest,
  notFound,
  serverError,
} from "../../../utils/responses.js";
import { adminOrderService } from "../../../services/admin/order.service.js";

const updateOrderStatusHandler = async (event) => {
  try {
    const orderId = event.pathParameters?.id;
    const body = parseBody(event);
    const { status } = body;

    // Delegar al servicio
    const order = await adminOrderService.updateOrderStatus(orderId, status);

    return success({
      success: true,
      message: "Estado de orden actualizado",
      order,
    });
  } catch (error) {
    console.error("Error en updateOrderStatus:", error);

    if (error.message === "Body inválido") {
      return badRequest(error.message);
    }

    if (error.name === "ValidationError") {
      return badRequest(error.message);
    }

    if (error.name === "OrderNotFoundError") {
      return notFound(error.message);
    }

    return serverError("Error al actualizar estado");
  }
};

export const updateOrderStatus = requireAdmin(updateOrderStatusHandler);
