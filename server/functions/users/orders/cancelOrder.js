import { requireAuth } from "../../../utils/auth.js";
import {
  success,
  badRequest,
  notFound,
  forbidden,
  serverError,
} from "../../../utils/responses.js";
import { orderService } from "../../../services/order.service.js";

const cancelOrderHandler = async (event) => {
  try {
    const userId = event.user.id;
    const userRole = event.user.role;
    const isAdmin = userRole === "admin";
    const orderId = event.pathParameters?.id;

    // Delegar al servicio
    const order = await orderService.cancelOrder(userId, orderId, isAdmin);

    return success({
      success: true,
      message: "Orden cancelada exitosamente",
      order,
    });
  } catch (error) {
    console.error("Error en cancelOrder:", error);

    if (error.name === "OrderNotFoundError") {
      return notFound(error.message);
    }

    if (error.name === "ForbiddenError") {
      return forbidden(error.message);
    }

    if (error.name === "ValidationError") {
      return badRequest(error.message);
    }

    return serverError("Error al cancelar la orden");
  }
};

export const cancelOrder = requireAuth(cancelOrderHandler);
