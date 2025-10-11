import { pool } from "../db.js";
import { preference, payment } from "../libs/mercadopago.js";

// FUNCIONES DE PAGO (Usuario autenticado)

// Crear preferencia de pago para una orden
export async function createPreference(req, res) {
  const userId = req.user.id;
  const { order_id } = req.body;

  // Validación
  if (!order_id) {
    return res.status(400).json({
      message: "El order_id es requerido",
    });
  }

  try {
    // Verificar que la orden existe y pertenece al usuario
    const orderResult = await pool.query(
      `SELECT o.id, o.user_id, o.total, o.status, o.payment_status, o.shipping_address,
              u.name as user_name, u.email as user_email
       FROM orders o
       INNER JOIN users u ON o.user_id = u.id
       WHERE o.id = $1 AND o.user_id = $2`,
      [order_id, userId]
    );

    if (orderResult.rowCount === 0) {
      return res.status(404).json({
        message: "Orden no encontrada",
      });
    }

    const order = orderResult.rows[0];

    // Verificar que la orden no esté ya pagada
    if (order.payment_status === "approved" || order.status === "paid") {
      return res.status(400).json({
        message: "Esta orden ya ha sido pagada",
      });
    }

    // Obtener items de la orden
    const itemsResult = await pool.query(
      `SELECT oi.id, oi.quantity, oi.price, oi.subtotal,
              p.name as product_name, p.description as product_description
       FROM order_items oi
       INNER JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [order_id]
    );

    // Preparar items para MercadoPago
    const items = itemsResult.rows.map((item) => ({
      id: item.id.toString(),
      title: item.product_name,
      description: item.product_description || "Producto de Catfecito",
      quantity: item.quantity,
      unit_price: parseFloat(item.price),
      currency_id: "ARS",
    }));

    // Obtener URL base del backend (puede ser localhost o ngrok)
    const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";
    //const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    // Configurar preferencia de pago
    const preferenceData = {
      items: items,
      payer: {
        name: order.user_name,
        email: order.user_email,
      },
      //   back_urls: {
      //     success: `${frontendUrl}/payment/success?order_id=${order_id}`,
      //     failure: `${frontendUrl}/payment/failure?order_id=${order_id}`,
      //     pending: `${frontendUrl}/payment/pending?order_id=${order_id}`,
      //   },
      //auto_return: "approved",
      external_reference: order_id.toString(), // Importante para identificar la orden
      notification_url: `${backendUrl}/api/payments/webhook`,
      statement_descriptor: "CATFECITO",
      metadata: {
        order_id: order_id,
        user_id: userId,
      },
    };

    // Crear preferencia en MercadoPago
    const result = await preference.create({ body: preferenceData });

    // Guardar payment_id en la orden
    await pool.query(
      `UPDATE orders 
       SET payment_id = $1, updated_at = NOW() 
       WHERE id = $2`,
      [result.id, order_id]
    );

    // Devolver link de pago
    return res.status(200).json({
      success: true,
      message: "Preferencia de pago creada exitosamente",
      preference_id: result.id,
      init_point: result.init_point, //Link para pagar
      sandbox_init_point: result.sandbox_init_point, // Link de prueba
      order_id: order_id,
      total: order.total,
    });
  } catch (error) {
    console.error("Error en createPreference:", error);
    return res.status(500).json({
      message: "Error al crear preferencia de pago",
      error: error.message,
    });
  }
}

// Webhook - Recibir notificaciones de MercadoPago
export async function webhook(req, res) {
  try {
    const { type, data } = req.body;

    console.log("📩 Webhook recibido:", { type, data });

    // MercadoPago envía diferentes tipos de notificaciones
    if (type === "payment") {
      const paymentId = data.id;

      // Obtener información del pago
      const paymentInfo = await payment.get({ id: paymentId });

      console.log("💳 Información del pago:", paymentInfo);

      const externalReference = paymentInfo.external_reference; // order_id
      const status = paymentInfo.status; // approved, rejected, pending

      if (externalReference) {
        // Actualizar orden según el estado del pago
        if (status === "approved") {
          await pool.query(
            `UPDATE orders 
             SET status = 'paid', 
                 payment_status = 'approved',
                 updated_at = NOW() 
             WHERE id = $1`,
            [externalReference]
          );

          console.log(`✅ Orden ${externalReference} marcada como pagada`);
        } else if (status === "rejected") {
          await pool.query(
            `UPDATE orders 
             SET payment_status = 'rejected',
                 updated_at = NOW() 
             WHERE id = $1`,
            [externalReference]
          );

          console.log(`❌ Pago rechazado para orden ${externalReference}`);
        } else if (status === "pending") {
          await pool.query(
            `UPDATE orders 
             SET payment_status = 'pending',
                 updated_at = NOW() 
             WHERE id = $1`,
            [externalReference]
          );

          console.log(`⏳ Pago pendiente para orden ${externalReference}`);
        }
      }
    }

    // Siempre responder 200 para que MercadoPago no reintente
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error en webhook:", error);
    return res.status(500).json({ error: error.message });
  }
}

// Obtener estado del pago de una orden
export async function getPaymentStatus(req, res) {
  const userId = req.user.id;
  const { order_id } = req.params;

  try {
    const result = await pool.query(
      `SELECT id, user_id, total, status, payment_status, payment_id, created_at, updated_at
       FROM orders 
       WHERE id = $1 AND user_id = $2`,
      [order_id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Orden no encontrada" });
    }

    return res.status(200).json({
      success: true,
      order: result.rows[0],
    });
  } catch (error) {
    console.error("Error en getPaymentStatus:", error);
    return res.status(500).json({ message: "Error al obtener estado" });
  }
}
