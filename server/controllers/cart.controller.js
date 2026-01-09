import { pool } from "../db.js";

// FUNCIONES DE CARRITO (Usuario autenticado)

// Obtener carrito del usuario autenticado
export async function getCart(req, res) {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT 
        ci.id,
        ci.quantity,
        ci.created_at,
        ci.updated_at,
        p.id as product_id,
        p.name as product_name,
        p.description as product_description,
        p.price as product_price,
  p.stock as product_stock,
        p.image_url as product_image,
        p.is_active as product_is_active,
        (p.price * ci.quantity) as subtotal
       FROM cart_items ci
       INNER JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = $1
       ORDER BY ci.created_at DESC`,
      [userId]
    );

    // Calcular total del carrito
    const total = result.rows.reduce(
      (sum, item) => sum + parseFloat(item.subtotal),
      0
    );

    return res.status(200).json({
      success: true,
      count: result.rowCount,
      total: total.toFixed(2),
      items: result.rows,
    });
  } catch (error) {
    console.error("Error en getCart:", error);
    return res.status(500).json({ message: "Error al obtener el carrito" });
  }
}

// Agregar producto al carrito
export async function addToCart(req, res) {
  const userId = req.user.id;
  const { product_id, quantity } = req.body;

  // Validaciones
  if (!product_id) {
    return res.status(400).json({ message: "El product_id es requerido" });
  }

  const qty = parseInt(quantity) || 1;

  if (qty <= 0) {
    return res.status(400).json({ message: "La cantidad debe ser mayor a 0" });
  }

  try {
    // Verificar que el producto existe y está activo
    const product = await pool.query(
      "SELECT id, name, price, stock, is_active FROM products WHERE id = $1",
      [product_id]
    );

    if (product.rowCount === 0) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    if (!product.rows[0].is_active) {
      return res
        .status(400)
        .json({ message: "El producto no está disponible" });
    }

    if (product.rows[0].stock < qty) {
      return res.status(400).json({
        message: `Stock insuficiente. Disponible: ${product.rows[0].stock}`,
      });
    }

    // Verificar si el producto ya está en el carrito
    const existingItem = await pool.query(
      "SELECT id, quantity FROM cart_items WHERE user_id = $1 AND product_id = $2",
      [userId, product_id]
    );

    let result;

    if (existingItem.rowCount > 0) {
      // Si ya existe, actualizar cantidad
      const newQuantity = existingItem.rows[0].quantity + qty;

      // Verificar stock para la nueva cantidad
      if (product.rows[0].stock < newQuantity) {
        return res.status(400).json({
          message: `Stock insuficiente. Disponible: ${product.rows[0].stock}, en carrito: ${existingItem.rows[0].quantity}`,
        });
      }

      result = await pool.query(
        `UPDATE cart_items 
         SET quantity = $1, updated_at = NOW() 
         WHERE id = $2 
         RETURNING id, user_id, product_id, quantity, created_at, updated_at`,
        [newQuantity, existingItem.rows[0].id]
      );
    } else {
      // Si no existe, crear nuevo item
      result = await pool.query(
        `INSERT INTO cart_items (user_id, product_id, quantity) 
         VALUES ($1, $2, $3) 
         RETURNING id, user_id, product_id, quantity, created_at, updated_at`,
        [userId, product_id, qty]
      );
    }

    // Obtener información completa del item
    const cartItem = await pool.query(
      `SELECT 
        ci.id,
        ci.quantity,
        ci.created_at,
        ci.updated_at,
        p.id as product_id,
        p.name as product_name,
        p.price as product_price,
  p.stock as product_stock,
        p.image_url as product_image,
        (p.price * ci.quantity) as subtotal
       FROM cart_items ci
       INNER JOIN products p ON ci.product_id = p.id
       WHERE ci.id = $1`,
      [result.rows[0].id]
    );

    return res.status(201).json({
      success: true,
      message:
        existingItem.rowCount > 0
          ? "Cantidad actualizada en el carrito"
          : "Producto agregado al carrito",
      item: cartItem.rows[0],
    });
  } catch (error) {
    console.error("Error en addToCart:", error);
    return res
      .status(500)
      .json({ message: "Error al agregar producto al carrito" });
  }
}

// Actualizar cantidad de un item del carrito
export async function updateCartItem(req, res) {
  const userId = req.user.id;
  const { id } = req.params;
  const { quantity } = req.body;

  // Validaciones
  if (!quantity || parseInt(quantity) <= 0) {
    return res.status(400).json({ message: "La cantidad debe ser mayor a 0" });
  }

  const qty = parseInt(quantity); // Cantidad nueva a establecer

  try {
    // Verificar que el item pertenece al usuario
    const cartItem = await pool.query(
      `SELECT ci.id, ci.product_id, p.stock, p.is_active, p.name
       FROM cart_items ci
       INNER JOIN products p ON ci.product_id = p.id
       WHERE ci.id = $1 AND ci.user_id = $2`,
      [id, userId]
    );

    if (cartItem.rowCount === 0) {
      return res
        .status(404)
        .json({ message: "Item no encontrado en tu carrito" });
    }

    // Verificar que el producto sigue activo
    if (!cartItem.rows[0].is_active) {
      return res.status(400).json({
        message: "El producto ya no está disponible",
      });
    }

    // Verificar stock
    if (cartItem.rows[0].stock < qty) {
      return res.status(400).json({
        message: `Stock insuficiente. Disponible: ${cartItem.rows[0].stock}`,
      });
    }

    // Actualizar cantidad
    const result = await pool.query(
      `UPDATE cart_items 
       SET quantity = $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING id, user_id, product_id, quantity, created_at, updated_at`,
      [qty, id]
    );

    // Obtener info completa
    const updatedItem = await pool.query(
      `SELECT 
        ci.id,
        ci.quantity,
        ci.updated_at,
        p.id as product_id,
        p.name as product_name,
        p.price as product_price,
  p.stock as product_stock,
        p.image_url as product_image,
        (p.price * ci.quantity) as subtotal
       FROM cart_items ci
       INNER JOIN products p ON ci.product_id = p.id
       WHERE ci.id = $1`,
      [id]
    );

    return res.status(200).json({
      success: true,
      message: "Cantidad actualizada",
      item: updatedItem.rows[0],
    });
  } catch (error) {
    console.error("Error en updateCartItem:", error);
    return res.status(500).json({ message: "Error al actualizar item" });
  }
}

// Eliminar un item del carrito
export async function removeFromCart(req, res) {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM cart_items 
       WHERE id = $1 AND user_id = $2 
       RETURNING id, product_id`,
      [id, userId]
    );

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ message: "Item no encontrado en tu carrito" });
    }

    return res.status(200).json({
      success: true,
      message: "Producto eliminado del carrito",
      item: result.rows[0],
    });
  } catch (error) {
    console.error("Error en removeFromCart:", error);
    return res.status(500).json({ message: "Error al eliminar item" });
  }
}

// Vaciar carrito completo
export async function clearCart(req, res) {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      "DELETE FROM cart_items WHERE user_id = $1 RETURNING id",
      [userId]
    );

    return res.status(200).json({
      success: true,
      message: "Carrito vaciado exitosamente",
      deletedCount: result.rowCount,
    });
  } catch (error) {
    console.error("Error en clearCart:", error);
    return res.status(500).json({ message: "Error al vaciar el carrito" });
  }
}
