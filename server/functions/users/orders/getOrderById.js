import { requireAuth } from "../../../utils/auth.js";
import { success, notFound, serverError } from "../../../utils/responses.js";
import { orderService } from "../../../services/order.service.js";

const getOrderByIdHandler = async (event) => {
  try {
    const userId = event.user.id;
    const userEmail = event.user.email;
    const { id } = event.pathParameters;

    // Delegar al servicio
    const order = await orderService.getOrderById(userId, id, userEmail);

    return success({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Error en getOrderById:", error);

    if (error.name === "OrderNotFoundError") {
      return notFound(error.message);
    }

    return serverError("Error al obtener la orden");
  }
};

export const getOrderById = requireAuth(getOrderByIdHandler);
