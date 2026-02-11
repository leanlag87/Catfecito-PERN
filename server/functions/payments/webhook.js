import { success } from "../../utils/responses.js";
import { paymentService } from "../../services/payment.service.js";

const webhookHandler = async (event) => {
  try {
    const body = JSON.parse(event.body);

    // Delegar al servicio
    const result = await paymentService.processWebhook(body);

    return success(result);
  } catch (error) {
    console.error("Error en webhook:", error);

    // MercadoPago espera 200 incluso si hay error
    return success({
      success: false,
      error: error?.message || String(error),
    });
  }
};

export const webhook = webhookHandler;
