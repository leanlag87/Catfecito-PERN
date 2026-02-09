import { cartRepository } from "../repositories/cart.repository.js";
import { productRepository } from "../repositories/product.repository.js";

class CartService {
  async addToCart(userId, productId, quantity = 1) {
    const qty = parseInt(quantity);

    if (isNaN(qty) || qty <= 0) {
      const error = new Error("La cantidad debe ser mayor a 0");
      error.name = "ValidationError";
      throw error;
    }

    // Verificar que el producto existe y está activo
    const product = await productRepository.findById(productId);

    if (!product) {
      const error = new Error("Producto no encontrado");
      error.name = "ProductNotFoundError";
      throw error;
    }

    if (!product.is_active) {
      const error = new Error("El producto no está disponible");
      error.name = "ProductNotAvailableError";
      throw error;
    }

    // Verificar si el producto ya está en el carrito
    const existingItem = await cartRepository.findItem(userId, productId);

    let cartItem;
    let isUpdate = false;

    if (existingItem) {
      // Actualizar cantidad existente
      const newQuantity = existingItem.quantity + qty;

      // Verificar stock para la nueva cantidad
      if (product.stock < newQuantity) {
        const error = new Error(
          `Stock insuficiente. Disponible: ${product.stock}, en carrito: ${existingItem.quantity}`,
        );
        error.name = "InsufficientStockError";
        throw error;
      }

      cartItem = await cartRepository.updateItemQuantity(
        userId,
        productId,
        newQuantity,
      );
      isUpdate = true;
    } else {
      // Verificar stock inicial
      if (product.stock < qty) {
        const error = new Error(
          `Stock insuficiente. Disponible: ${product.stock}`,
        );
        error.name = "InsufficientStockError";
        throw error;
      }

      // Crear nuevo item
      cartItem = await cartRepository.createItem(
        userId,
        productId,
        product,
        qty,
      );
    }

    // Calcular subtotal
    const subtotal = cartItem.product_price * cartItem.quantity;

    return {
      isUpdate,
      item: {
        id: `${userId}#${productId}`,
        product_id: cartItem.product_id,
        product_name: cartItem.product_name,
        product_price: cartItem.product_price,
        product_image: cartItem.product_image,
        product_stock: product.stock,
        quantity: cartItem.quantity,
        subtotal,
        created_at: cartItem.created_at,
        updated_at: cartItem.updated_at,
      },
    };
  }

  async getCart(userId) {
    // Obtener items del carrito
    const cartItems = await cartRepository.findAllByUser(userId);

    if (cartItems.length === 0) {
      return {
        count: 0,
        total: "0.00",
        items: [],
      };
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

    // Combinar información y calcular subtotales
    const items = cartItems
      .map((cartItem) => {
        const product = productsMap[cartItem.product_id];

        // Si el producto no existe, omitir item
        if (!product) {
          return null;
        }

        const subtotal =
          parseFloat(product.price) * parseInt(cartItem.quantity);

        return {
          id: cartItem.SK.replace("CART#", ""),
          quantity: cartItem.quantity,
          created_at: cartItem.created_at,
          updated_at: cartItem.updated_at,
          product_id: cartItem.product_id,
          product_name: product.name,
          product_description: product.description,
          product_price: product.price,
          product_stock: product.stock,
          product_image: product.image_url,
          product_is_active: product.is_active,
          subtotal: subtotal.toFixed(2),
        };
      })
      .filter(Boolean); // Eliminar nulls

    // Calcular total del carrito
    const total = items.reduce(
      (sum, item) => sum + parseFloat(item.subtotal),
      0,
    );

    return {
      count: items.length,
      total: total.toFixed(2),
      items,
    };
  }
}

export const cartService = new CartService();
