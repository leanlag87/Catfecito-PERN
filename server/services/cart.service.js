import { cartRepository } from "../repositories/cart.repository.js";
import { productRepository } from "../repositories/product.repository.js";

class CartService {
  async addToCart(userId, productId, quantity = 1) {
    // Validaciones
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
}

export const cartService = new CartService();
