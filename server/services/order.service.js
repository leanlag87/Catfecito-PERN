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
}

export const orderService = new OrderService();
