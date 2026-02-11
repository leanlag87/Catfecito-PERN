import { orderRepository } from "../../repositories/order.repository.js";

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
}

export const adminOrderService = new AdminOrderService();
