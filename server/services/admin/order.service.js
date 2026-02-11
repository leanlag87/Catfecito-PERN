import { orderRepository } from "../../repositories/order.repository.js";
import { cartRepository } from "../../repositories/cart.repository.js";

class AdminOrderService {
  async getAllOrders() {
    // Obtener todas las órdenes
    const orders = await orderRepository.findAll();

    if (orders.length === 0) {
      return {
        count: 0,
        orders: [],
      };
    }

    // Obtener usuarios únicos
    const userIds = [...new Set(orders.map((order) => order.user_id))];
    const users = await orderRepository.findUsersBatch(userIds);

    // Crear mapa de usuarios
    const usersMap = {};
    users.forEach((user) => {
      const userId = user.PK.replace("USER#", "");
      usersMap[userId] = user;
    });

    // Contar items de cada orden y combinar con info de usuario
    const ordersWithDetails = await Promise.all(
      orders.map(async (order) => {
        const orderId = order.PK.replace("ORDER#", "");
        const user = usersMap[order.user_id] || {};

        // Contar items de la orden
        const itemsCount = await orderRepository.countOrderItems(orderId);

        return {
          id: orderId,
          user_id: order.user_id,
          user_name: user.name || "N/A",
          user_email: user.email || "N/A",
          total: order.total,
          status: order.status,
          payment_status: order.payment_status,
          shipping_first_name: order.shipping_first_name,
          shipping_last_name: order.shipping_last_name,
          shipping_country: order.shipping_country,
          shipping_address: order.shipping_address,
          shipping_address2: order.shipping_address2,
          shipping_city: order.shipping_city,
          shipping_state: order.shipping_state,
          shipping_zip: order.shipping_zip,
          shipping_phone: order.shipping_phone,
          created_at: order.created_at,
          updated_at: order.updated_at,
          items_count: itemsCount,
        };
      }),
    );

    // Ordenar por fecha (más reciente primero)
    ordersWithDetails.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at),
    );

    return {
      count: ordersWithDetails.length,
      orders: ordersWithDetails,
    };
  }

  async getOrderById(orderId) {
    // Obtener metadata de la orden
    const order = await orderRepository.findById(orderId);

    if (!order) {
      const error = new Error("Orden no encontrada");
      error.name = "OrderNotFoundError";
      throw error;
    }

    // Obtener información del usuario
    const users = await orderRepository.findUsersBatch([order.user_id]);
    const user = users[0] || {};

    // Obtener items de la orden
    const orderItems = await orderRepository.findOrderItems(orderId);

    if (orderItems.length === 0) {
      return {
        id: orderId,
        user_id: order.user_id,
        user_name: user.name || "N/A",
        user_email: user.email || "N/A",
        total: order.total,
        status: order.status,
        payment_status: order.payment_status,
        shipping_first_name: order.shipping_first_name,
        shipping_last_name: order.shipping_last_name,
        shipping_country: order.shipping_country,
        shipping_address: order.shipping_address,
        shipping_address2: order.shipping_address2,
        shipping_city: order.shipping_city,
        shipping_state: order.shipping_state,
        shipping_zip: order.shipping_zip,
        shipping_phone: order.shipping_phone,
        created_at: order.created_at,
        updated_at: order.updated_at,
        items: [],
      };
    }

    // Obtener información de productos en batch
    const productIds = orderItems.map((item) => item.product_id);
    const products = await cartRepository.findProductsBatch(productIds);

    // Crear mapa de productos
    const productsMap = {};
    products.forEach((product) => {
      const productId = product.PK.replace("PRODUCT#", "");
      productsMap[productId] = product;
    });

    // Combinar items con información de productos
    const items = orderItems.map((item) => {
      const product = productsMap[item.product_id];

      return {
        id: item.SK.replace("ITEM#", ""),
        product_id: item.product_id,
        product_name: product?.name || "Producto no disponible",
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
        image_url: product?.image_url || null,
      };
    });

    return {
      id: orderId,
      user_id: order.user_id,
      user_name: user.name || "N/A",
      user_email: user.email || "N/A",
      total: order.total,
      status: order.status,
      payment_status: order.payment_status,
      shipping_first_name: order.shipping_first_name,
      shipping_last_name: order.shipping_last_name,
      shipping_country: order.shipping_country,
      shipping_address: order.shipping_address,
      shipping_address2: order.shipping_address2,
      shipping_city: order.shipping_city,
      shipping_state: order.shipping_state,
      shipping_zip: order.shipping_zip,
      shipping_phone: order.shipping_phone,
      created_at: order.created_at,
      updated_at: order.updated_at,
      items,
    };
  }

  async updateOrderStatus(orderId, newStatus) {
    const validStatuses = [
      "pending",
      "paid",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];

    // Validar estado
    if (!newStatus || !validStatuses.includes(newStatus)) {
      const error = new Error(
        `Estado inválido. Válidos: ${validStatuses.join(", ")}`,
      );
      error.name = "ValidationError";
      throw error;
    }

    // Verificar que la orden existe
    const order = await orderRepository.findById(orderId);

    if (!order) {
      const error = new Error("Orden no encontrada");
      error.name = "OrderNotFoundError";
      throw error;
    }

    // Determinar payment_status según el status
    let paymentStatus = order.payment_status;

    if (newStatus === "paid") {
      paymentStatus = "approved";
    } else if (newStatus === "cancelled") {
      paymentStatus = "cancelled";
    } else if (newStatus === "pending") {
      paymentStatus = "pending";
    }

    // Actualizar estado
    const timestamp = await orderRepository.updateStatus(
      orderId,
      order.user_id,
      newStatus,
      paymentStatus,
    );

    return {
      id: orderId,
      user_id: order.user_id,
      total: order.total,
      status: newStatus,
      payment_status: paymentStatus,
      shipping_first_name: order.shipping_first_name,
      shipping_last_name: order.shipping_last_name,
      shipping_country: order.shipping_country,
      shipping_address: order.shipping_address,
      shipping_address2: order.shipping_address2,
      shipping_city: order.shipping_city,
      shipping_state: order.shipping_state,
      shipping_zip: order.shipping_zip,
      shipping_phone: order.shipping_phone,
      created_at: order.created_at,
      updated_at: timestamp,
    };
  }
}

export const adminOrderService = new AdminOrderService();
