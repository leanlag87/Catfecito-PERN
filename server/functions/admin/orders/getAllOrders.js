import { requireAdmin } from "../../../utils/auth.js";
import { success, serverError } from "../../../utils/responses.js";
import { adminOrderService } from "../../../services/admin/order.service.js";

const getAllOrdersHandler = async (event) => {
  try {
    // Delegar al servicio
    const result = await adminOrderService.getAllOrders();

    return success({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error en getAllOrders:", error);
    return serverError("Error al obtener órdenes");
  }
};

export const getAllOrders = requireAdmin(getAllOrdersHandler);
