import { requireAuth } from "../../utils/auth.js";
import { success, notFound, serverError } from "../../utils/responses.js";
import { paymentService } from "../../services/payment.service.js";

const getPaymentStatusHandler = async (event) => {
  try {
    const userId = event.user.id;
    const orderId = event.pathParameters?.order_id;

    // Delegar al servicio
    const order = await paymentService.getPaymentStatus(userId, orderId);

    return success({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Error en getPaymentStatus:", error);

    if (error.name === "OrderNotFoundError") {
      return notFound(error.message);
    }

    return serverError("Error al obtener estado del pago");
  }
};

export const getPaymentStatus = requireAuth(getPaymentStatusHandler);
