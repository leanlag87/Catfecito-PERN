import { orderRepository } from "../repositories/order.repository.js";
import { cartRepository } from "../repositories/cart.repository.js";
import { preference } from "../libs/mercadopago.js";

class PaymentService {
  //Crear preferencia de pago en MercadoPago
  async createPreference(userId, userName, userEmail, orderId, backendUrl) {
    // Validar order_id
    if (!orderId) {
      const error = new Error("El order_id es requerido");
      error.name = "ValidationError";
      throw error;
    }

    // Verificar que la orden existe y pertenece al usuario
    const isOwner = await orderRepository.verifyOwnership(userId, orderId);

    if (!isOwner) {
      const error = new Error("Orden no encontrada");
      error.name = "OrderNotFoundError";
      throw error;
    }

    // Obtener metadata completa de la orden
    const order = await orderRepository.findById(orderId);

    if (!order) {
      const error = new Error("Orden no encontrada");
      error.name = "OrderNotFoundError";
      throw error;
    }

    // Verificar que la orden no esté ya pagada
    if (order.payment_status === "approved" || order.status === "paid") {
      const error = new Error("Esta orden ya ha sido pagada");
      error.name = "OrderAlreadyPaidError";
      throw error;
    }

    // Obtener items de la orden
    const orderItems = await orderRepository.findOrderItems(orderId);

    if (orderItems.length === 0) {
      const error = new Error("La orden no tiene ítems");
      error.name = "EmptyOrderError";
      throw error;
    }

    // Obtener información completa de productos en batch
    const productIds = orderItems.map((item) => item.product_id);
    const products = await cartRepository.findProductsBatch(productIds);

    // Crear mapa de productos
    const productsMap = {};
    products.forEach((product) => {
      const productId = product.PK.replace("PRODUCT#", "");
      productsMap[productId] = product;
    });

    // Preparar items para MercadoPago
    const CURRENCY_ID = process.env.CURRENCY_ID || "ARS";

    const items = orderItems.map((item) => {
      const product = productsMap[item.product_id];
      return {
        id: item.product_id,
        title: product?.name || "Producto",
        description: product?.description || "Producto de Catfecito",
        quantity: item.quantity,
        unit_price: parseFloat(item.price),
        currency_id: CURRENCY_ID,
      };
    });

    // Configurar preferencia de MercadoPago
    const preferenceData = {
      items: items,
      payer: {
        name: userName,
        email: userEmail,
      },
      external_reference: orderId.toString(),
      notification_url: `${backendUrl}/api/payments/webhook`,
      statement_descriptor: "CATFECITO",
      metadata: {
        order_id: orderId,
        user_id: userId,
      },
    };

    // Crear preferencia en MercadoPago
    const result = await preference.create({ body: preferenceData });

    // SDK puede devolver distintas formas según versión
    const prefId = result?.id || result?.body?.id;
    const initPoint = result?.init_point || result?.body?.init_point;
    const sandboxInitPoint =
      result?.sandbox_init_point || result?.body?.sandbox_init_point;

    if (!prefId) {
      const error = new Error(
        "No se obtuvo 'id' de la preferencia de MercadoPago",
      );
      error.name = "MercadoPagoError";
      throw error;
    }

    // Guardar payment_id (preference_id) en la orden
    await orderRepository.savePaymentId(orderId, prefId);

    return {
      preference_id: prefId,
      init_point: initPoint,
      sandbox_init_point: sandboxInitPoint,
      order_id: orderId,
      total: order.total,
    };
  }

  //Obtener estado de pago de una orden
  async getPaymentStatus(userId, orderId) {
    // Verificar que la orden pertenece al usuario
    const isOwner = await orderRepository.verifyOwnership(userId, orderId);

    if (!isOwner) {
      const error = new Error("Orden no encontrada");
      error.name = "OrderNotFoundError";
      throw error;
    }

    // Obtener metadata completa de la orden
    const order = await orderRepository.findById(orderId);

    if (!order) {
      const error = new Error("Orden no encontrada");
      error.name = "OrderNotFoundError";
      throw error;
    }

    return {
      id: orderId,
      user_id: order.user_id,
      total: order.total,
      status: order.status,
      payment_status: order.payment_status,
      payment_id: order.payment_id || null,
      created_at: order.created_at,
      updated_at: order.updated_at,
    };
  }
}

export const paymentService = new PaymentService();
