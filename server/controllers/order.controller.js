import { pool } from "../db.js";

// FUNCIONES (Usuario autenticado)

// Crear orden desde el carrito
export async function createOrder(req, res) {
  const userId = req.user.id;
  const { 
    shipping_first_name,
    shipping_last_name,
    shipping_country,
    shipping_address,
    shipping_address2,
    shipping_city,
    shipping_state,
    shipping_zip,
    shipping_phone
  } = req.body;

  // Validación de campos requeridos
  if (!shipping_first_name || !shipping_last_name || !shipping_country || 
      !shipping_address || !shipping_city || !shipping_state || !shipping_zip) {
    return res.status(400).json({
      message: "Todos los campos de dirección son requeridos (excepto address2 y phone)",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Obtener items del carrito
    const cartItems = await client.query(
      `SELECT 
        ci.id as cart_item_id,
        ci.product_id,
        ci.quantity,
        p.name as product_name,
        p.price,
        p.stock,
        p.is_active,
        (p.price * ci.quantity) as subtotal
       FROM cart_items ci
       INNER JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = $1`,
      [userId]
    );

    if (cartItems.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "El carrito está vacío",
      });
    }

    // 2. Validar stock y productos activos
    for (const item of cartItems.rows) {
      if (!item.is_active) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          message: `El producto "${item.product_name}" ya no está disponible`,
        });
      }

      if (item.stock < item.quantity) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          message: `Stock insuficiente para "${item.product_name}". Disponible: ${item.stock}`,
        });
      }
    }

    // 3. Calcular total
    const total = cartItems.rows.reduce(
      (sum, item) => sum + parseFloat(item.subtotal),
      0
    );

    // 4. Crear orden
    const orderResult = await client.query(
      `INSERT INTO orders (
        user_id, total, status, payment_status,
        shipping_first_name, shipping_last_name, shipping_country,
        shipping_address, shipping_address2, shipping_city,
        shipping_state, shipping_zip, shipping_phone
      ) 
       VALUES ($1, $2, 'pending', 'pending', $3, $4, $5, $6, $7, $8, $9, $10, $11) 
       RETURNING id, user_id, total, status, payment_status,
                 shipping_first_name, shipping_last_name, shipping_country,
                 shipping_address, shipping_address2, shipping_city,
                 shipping_state, shipping_zip, shipping_phone,
                 created_at, updated_at`,
      [
        userId, 
        total.toFixed(2),
        shipping_first_name,
        shipping_last_name,
        shipping_country,
        shipping_address,
        shipping_address2 || null,
        shipping_city,
        shipping_state,
        shipping_zip,
        shipping_phone || null
      ]
    );

    const orderId = orderResult.rows[0].id;

    // 5. Crear items de la orden (SIN decrementar stock todavía)
    // El stock se decrementará cuando el pago sea confirmado en el webhook
    for (const item of cartItems.rows) {
      // Insertar item en order_items
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price, subtotal) 
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, item.product_id, item.quantity, item.price, item.subtotal]
      );

      // NO decrementar stock aquí - se hará cuando el pago sea aprobado
      // await client.query(
      //   `UPDATE products 
      //    SET stock = stock - $1, updated_at = NOW() 
      //    WHERE id = $2`,
      //   [item.quantity, item.product_id]
      // );
    }

    // 6. NO vaciar carrito aquí - se vaciará cuando el pago sea confirmado
    // await client.query("DELETE FROM cart_items WHERE user_id = $1", [userId]);
    // NOTA: El carrito se vaciará en el webhook cuando payment_status === 'approved'

    // 7. Obtener orden completa con items
    const orderWithItems = await client.query(
      `SELECT 
        o.id,
        o.user_id,
        o.total,
        o.status,
        o.payment_status,
        o.shipping_first_name,
        o.shipping_last_name,
        o.shipping_country,
        o.shipping_address,
        o.shipping_address2,
        o.shipping_city,
        o.shipping_state,
        o.shipping_zip,
        o.shipping_phone,
        o.created_at,
        o.updated_at,
        json_agg(
          json_build_object(
            'id', oi.id,
            'product_id', oi.product_id,
            'product_name', p.name,
            'quantity', oi.quantity,
            'price', oi.price,
            'subtotal', oi.subtotal,
            'image_url', p.image_url
          )
        ) as items
       FROM orders o
       INNER JOIN order_items oi ON o.id = oi.order_id
       INNER JOIN products p ON oi.product_id = p.id
       WHERE o.id = $1
       GROUP BY o.id`,
      [orderId]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      message: "Orden creada exitosamente",
      order: orderWithItems.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error en createOrder:", error);
    return res.status(500).json({ message: "Error al crear la orden" });
  } finally {
    client.release();
  }
}

// Obtener mis órdenes
export async function getMyOrders(req, res) {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT 
        o.id,
        o.total,
        o.status,
        o.payment_status,
        o.shipping_first_name,
        o.shipping_last_name,
        o.shipping_country,
        o.shipping_address,
        o.shipping_address2,
        o.shipping_city,
        o.shipping_state,
        o.shipping_zip,
        o.shipping_phone,
        o.created_at,
        o.updated_at,
        COUNT(oi.id) as items_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      count: result.rowCount,
      orders: result.rows,
    });
  } catch (error) {
    console.error("Error en getMyOrders:", error);
    return res.status(500).json({ message: "Error al obtener órdenes" });
  }
}

// Obtener orden por ID (con items)
export async function getOrderById(req, res) {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT 
        o.id,
        o.user_id,
        u.email as user_email,                  -- <-- agregado
        o.total,
        o.status,
        o.payment_status,
        o.shipping_first_name,
        o.shipping_last_name,
        o.shipping_country,
        o.shipping_address,
        o.shipping_address2,
        o.shipping_city,
        o.shipping_state,
        o.shipping_zip,
        o.shipping_phone,
        o.created_at,
        o.updated_at,
        json_agg(
          json_build_object(
            'id', oi.id,
            'product_id', oi.product_id,
            'product_name', p.name,
            'quantity', oi.quantity,
            'price', oi.price,
            'subtotal', oi.subtotal,
            'image_url', p.image_url
          )
        ) as items
       FROM orders o
       INNER JOIN users u ON o.user_id = u.id         -- <-- agregado join
       INNER JOIN order_items oi ON o.id = oi.order_id
       INNER JOIN products p ON oi.product_id = p.id
       WHERE o.id = $1 AND o.user_id = $2
       GROUP BY o.id, u.email` ,                      
      [id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Orden no encontrada" });
    }

    return res.status(200).json({
      success: true,
      order: result.rows[0],
    });
  } catch (error) {
    console.error("Error en getOrderById:", error);
    return res.status(500).json({ message: "Error al obtener orden" });
  }
}

// FUNCIONES SOLO ADMIN

// Obtener todas las órdenes (admin)
export async function getAllOrders(req, res) {
  try {
    const result = await pool.query(
      `SELECT 
        o.id,
        o.user_id,
        u.name as user_name,
        u.email as user_email,
        o.total,
        o.status,
        o.payment_status,
        o.shipping_first_name,
        o.shipping_last_name,
        o.shipping_country,
        o.shipping_address,
        o.shipping_address2,
        o.shipping_city,
        o.shipping_state,
        o.shipping_zip,
        o.shipping_phone,
        o.created_at,
        o.updated_at,
        COUNT(oi.id) as items_count
       FROM orders o
       INNER JOIN users u ON o.user_id = u.id
       LEFT JOIN order_items oi ON o.id = oi.order_id
       GROUP BY o.id, u.name, u.email
       ORDER BY o.created_at DESC`
    );

    return res.status(200).json({
      success: true,
      count: result.rowCount,
      orders: result.rows,
    });
  } catch (error) {
    console.error("Error en getAllOrders:", error);
    return res.status(500).json({ message: "Error al obtener órdenes" });
  }
}

// Obtener orden por ID (admin - sin restricción de usuario)
export async function getOrderByIdAdmin(req, res) {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT 
        o.id,
        o.user_id,
        u.name as user_name,
        u.email as user_email,
        o.total,
        o.status,
        o.payment_status,
        o.shipping_first_name,
        o.shipping_last_name,
        o.shipping_country,
        o.shipping_address,
        o.shipping_address2,
        o.shipping_city,
        o.shipping_state,
        o.shipping_zip,
        o.shipping_phone,
        o.created_at,
        o.updated_at,
        json_agg(
          json_build_object(
            'id', oi.id,
            'product_id', oi.product_id,
            'product_name', p.name,
            'quantity', oi.quantity,
            'price', oi.price,
            'subtotal', oi.subtotal,
            'image_url', p.image_url
          )
        ) as items
       FROM orders o
       INNER JOIN users u ON o.user_id = u.id
       INNER JOIN order_items oi ON o.id = oi.order_id
       INNER JOIN products p ON oi.product_id = p.id
       WHERE o.id = $1
       GROUP BY o.id, u.name, u.email`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Orden no encontrada" });
    }

    return res.status(200).json({
      success: true,
      order: result.rows[0],
    });
  } catch (error) {
    console.error("Error en getOrderByIdAdmin:", error);
    return res.status(500).json({ message: "Error al obtener orden" });
  }
}

// Actualizar estado de orden (admin)
export async function updateOrderStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = [
    "pending",
    "paid",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      message: `Estado inválido. Válidos: ${validStatuses.join(", ")}`,
    });
  }

  try {
    const result = await pool.query(
      `UPDATE orders 
       SET status = $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING id, user_id, total, status, payment_status, created_at, updated_at`,
      [status, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Orden no encontrada" });
    }

    return res.status(200).json({
      success: true,
      message: "Estado de orden actualizado",
      order: result.rows[0],
    });
  } catch (error) {
    console.error("Error en updateOrderStatus:", error);
    return res.status(500).json({ message: "Error al actualizar estado" });
  }
}

// Cancelar orden (usuario o admin)
export async function cancelOrder(req, res) {
  const userId = req.user.id;
  const isAdmin = req.user.role === "admin";
  const { id } = req.params;

  try {
    const q = await pool.query("SELECT id, user_id, status, payment_status FROM orders WHERE id = $1", [id]);
    if (q.rowCount === 0) return res.status(404).json({ success: false, message: "Orden no encontrada" });

    const order = q.rows[0];

    // permiso: dueño o admin
    if (!isAdmin && order.user_id !== userId) {
      return res.status(403).json({ success: false, message: "No autorizado para cancelar esta orden" });
    }

    // no permitir cancelar si ya está pagada/aprobada
    if (order.status === "paid" || order.payment_status === "approved") {
      return res.status(400).json({ success: false, message: "No se puede cancelar una orden ya pagada" });
    }

    const upd = await pool.query(
      `UPDATE orders
       SET status = 'cancelled',
           payment_status = 'cancelled',
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    return res.status(200).json({ success: true, order: upd.rows[0] });
  } catch (error) {
    console.error("Error en cancelOrder:", error);
    return res.status(500).json({ success: false, message: "Error al cancelar la orden" });
  }
}
