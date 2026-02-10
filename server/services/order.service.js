import { orderRepository } from "../repositories/order.repository.js";
import { cartRepository } from "../repositories/cart.repository.js";

class OrderService {
  async createOrder(userId, shippingData) {
    const {
      shipping_first_name,
      shipping_last_name,
      shipping_country,
      shipping_address,
      shipping_address2,
      shipping_city,
      shipping_state,
      shipping_zip,
      shipping_phone,
    } = shippingData;

    // Validar campos requeridos
    if (
      !shipping_first_name ||
      !shipping_last_name ||
      !shipping_country ||
      !shipping_address ||
      !shipping_city ||
      !shipping_state ||
      !shipping_zip
    ) {
      const error = new Error(
        "Todos los campos de dirección son requeridos (excepto address2 y phone)",
      );
      error.name = "ValidationError";
      throw error;
    }

    // Obtener items del carrito
    const cartItems = await cartRepository.findAllByUser(userId);

    if (cartItems.length === 0) {
      const error = new Error("El carrito está vacío");
      error.name = "EmptyCartError";
      throw error;
    }

    // Obtener información de productos en batch
    const productIds = cartItems.map((item) => item.product_id);
    const products = await cartRepository.findProductsBatch(productIds);

    // Crear mapa de productos
    const productsMap = {};
    products.forEach((product) => {
      const productId = product.PK.replace("PRODUCT#", "");
      productsMap[productId] = product;
    });

    // Validar stock y productos activos
    for (const cartItem of cartItems) {
      const product = productsMap[cartItem.product_id];

      if (!product) {
        const error = new Error(
          `Producto no encontrado: ${cartItem.product_id}`,
        );
        error.name = "ProductNotFoundError";
        throw error;
      }

      if (!product.is_active) {
        const error = new Error(
          `El producto "${product.name}" ya no está disponible`,
        );
        error.name = "ProductNotAvailableError";
        throw error;
      }

      if (product.stock < cartItem.quantity) {
        const error = new Error(
          `Stock insuficiente para "${product.name}". Disponible: ${product.stock}`,
        );
        error.name = "InsufficientStockError";
        throw error;
      }
    }

    // Calcular total y preparar items
    let total = 0;
    const orderItems = cartItems.map((cartItem) => {
      const product = productsMap[cartItem.product_id];
      const subtotal = parseFloat(product.price) * parseInt(cartItem.quantity);
      total += subtotal;

      return {
        product_id: cartItem.product_id,
        product_name: product.name,
        quantity: cartItem.quantity,
        price: product.price,
        subtotal: subtotal.toFixed(2),
        image_url: product.image_url,
      };
    });

    // Crear orden con transacción
    const order = await orderRepository.createWithTransaction(
      userId,
      {
        total,
        orderItems,
        shipping_first_name,
        shipping_last_name,
        shipping_country,
        shipping_address,
        shipping_address2,
        shipping_city,
        shipping_state,
        shipping_zip,
        shipping_phone,
      },
      cartItems,
    );

    return order;
  }

  async getMyOrders(userId) {
    // Obtener índice de órdenes del usuario
    const orderIndex = await orderRepository.findOrderIndexByUser(userId);

    if (orderIndex.length === 0) {
      return {
        count: 0,
        orders: [],
      };
    }

    // Extraer order IDs
    const orderIds = orderIndex.map((item) => item.SK.replace("ORDER#", ""));

    // Obtener metadata completa de cada orden en batch
    const orders = await orderRepository.findOrdersBatch(orderIds);

    // Contar items de cada orden
    const ordersWithItemCount = await Promise.all(
      orders.map(async (order) => {
        const orderId = order.id;
        const itemsCount = await orderRepository.countOrderItems(orderId);

        return {
          id: orderId,
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
    ordersWithItemCount.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at),
    );

    return {
      count: ordersWithItemCount.length,
      orders: ordersWithItemCount,
    };
  }

  async getOrderById(userId, orderId, userEmail) {
    // Verificar que la orden pertenece al usuario
    const isOwner = await orderRepository.verifyOwnership(userId, orderId);

    if (!isOwner) {
      const error = new Error("Orden no encontrada");
      error.name = "OrderNotFoundError";
      throw error;
    }

    // Obtener metadata de la orden
    const order = await orderRepository.findById(orderId);

    if (!order) {
      const error = new Error("Orden no encontrada");
      error.name = "OrderNotFoundError";
      throw error;
    }

    // Obtener items de la orden
    const orderItems = await orderRepository.findOrderItems(orderId);

    if (orderItems.length === 0) {
      return {
        id: orderId,
        user_id: order.user_id,
        user_email: userEmail,
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
      user_email: userEmail,
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
}

export const orderService = new OrderService();
