import { requireAuth } from "../../../utils/auth.js";
import { parseBody } from "../../../utils/validators.js";
import { success, badRequest, serverError } from "../../../utils/responses.js";
import { orderService } from "../../../services/order.service.js";

const createOrderHandler = async (event) => {
  try {
    const userId = event.user.id;
    const body = parseBody(event);

    // Delegar al servicio
    const order = await orderService.createOrder(userId, body);

    return success(
      {
        success: true,
        message: "Orden creada exitosamente",
        order,
      },
      201,
    );
  } catch (error) {
    console.error("Error en createOrder:", error);

    if (error.message === "Body inválido") {
      return badRequest(error.message);
    }

    if (error.name === "ValidationError") {
      return badRequest(error.message);
    }

    if (error.name === "EmptyCartError") {
      return badRequest(error.message);
    }

    if (error.name === "ProductNotFoundError") {
      return badRequest(error.message);
    }

    if (error.name === "ProductNotAvailableError") {
      return badRequest(error.message);
    }

    if (error.name === "InsufficientStockError") {
      return badRequest(error.message);
    }

    return serverError("Error al crear la orden");
  }
};

export const createOrder = requireAuth(createOrderHandler);
