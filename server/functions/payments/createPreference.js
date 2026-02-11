import { requireAuth } from "../../utils/auth.js";
import { parseBody } from "../../utils/validators.js";
import {
  success,
  badRequest,
  notFound,
  serverError,
} from "../../utils/responses.js";
import { paymentService } from "../../services/payment.service.js";

const createPreferenceHandler = async (event) => {
  try {
    const userId = event.user.id;
    const userName = event.user.name;
    const userEmail = event.user.email;
    const body = parseBody(event);
    const { order_id } = body;

    // Construir URL del backend desde el evento de API Gateway
    const domain = event.requestContext?.domainName;
    const stage = event.requestContext?.stage || "";
    const backendUrl = `https://${domain}${stage ? "/" + stage : ""}`;

    // Delegar al servicio
    const result = await paymentService.createPreference(
      userId,
      userName,
      userEmail,
      order_id,
      backendUrl,
    );

    return success({
      success: true,
      message: "Preferencia de pago creada exitosamente",
      ...result,
    });
  } catch (error) {
    console.error("Error en createPreference:", error);

    if (error.message === "Body inválido") {
      return badRequest(error.message);
    }

    if (error.name === "ValidationError") {
      return badRequest(error.message);
    }

    if (error.name === "OrderNotFoundError") {
      return notFound(error.message);
    }

    if (error.name === "OrderAlreadyPaidError") {
      return badRequest(error.message);
    }

    if (error.name === "EmptyOrderError") {
      return badRequest(error.message);
    }

    if (error.name === "MercadoPagoError") {
      return serverError("Error al crear preferencia de pago");
    }

    return serverError("Error al crear preferencia de pago", {
      error: error?.response?.data || error?.message,
      details: error?.cause?.message || error?.cause,
    });
  }
};

export const createPreference = requireAuth(createPreferenceHandler);
