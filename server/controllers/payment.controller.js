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

    // Moneda configurable (por defecto ARS para testing - cambiar según tu cuenta de MP)
  const CURRENCY_ID = process.env.CURRENCY_ID || "ARS";

    if (itemsResult.rowCount === 0) {
      return res.status(400).json({ message: "La orden no tiene ítems" });
    }

    // Preparar items para MercadoPago
    const items = itemsResult.rows.map((item) => ({
      id: item.id.toString(),
      title: item.product_name,
      description: item.product_description || "Producto de Catfecito",
      quantity: item.quantity,
      unit_price: parseFloat(item.price),
      currency_id: CURRENCY_ID,
    }));

    // Configurar preferencia de pago (SIN back_urls ni notification_url para desarrollo local)
    const backendUrl = process.env.BACKEND_URL || "http://localhost:3000"; 
    const preferenceData = {
      items: items,
      payer: {
        name: order.user_name,
        email: order.user_email,
      },
      external_reference: order_id.toString(),
      notification_url: `${backendUrl}/api/payments/webhook`,
      statement_descriptor: "CATFECITO",
      metadata: {
        order_id: order_id,
        user_id: userId,
      },
    };

    // Crear preferencia en MercadoPago
    console.log("🔵 Enviando preferencia a MercadoPago:", JSON.stringify(preferenceData, null, 2));
    const result = await preference.create({ body: preferenceData });
    console.log("✅ Respuesta de MercadoPago:", JSON.stringify(result, null, 2));
    // SDK puede devolver distintas formas según versión
    const prefId = result?.id || result?.body?.id;
    const initPoint = result?.init_point || result?.body?.sandbox_init_point;
    const sandboxInitPoint = result?.sandbox_init_point || result?.body?.sandbox_init_point;

    if (!prefId) {
      throw new Error("No se obtuvo 'id' de la preferencia de MercadoPago");
    }

    // Guardar payment_id en la orden
    await pool.query(
      `UPDATE orders 
       SET payment_id = $1, updated_at = NOW() 
       WHERE id = $2`,
      [prefId, order_id]
    );

    // Devolver link de pago
    return res.status(200).json({
      success: true,
      message: "Preferencia de pago creada exitosamente",
      preference_id: prefId,
      init_point: initPoint, //Link para pagar
      sandbox_init_point: sandboxInitPoint, // Link de prueba
      order_id: order_id,
      total: order.total,
    });
  } catch (error) {
    console.error("❌ Error en createPreference:");
    console.error("Message:", error?.message);
    console.error("Response data:", JSON.stringify(error?.response?.data, null, 2));
    console.error("Cause:", error?.cause);
    console.error("Stack:", error?.stack);
    return res.status(500).json({
      message: "Error al crear preferencia de pago",
      error: error?.response?.data || error?.message,
      details: error?.cause?.message || error?.cause,
    });
  }
}

// Webhook - Recibir notificaciones de MercadoPago
export async function webhook(req, res) {
  const client = await pool.connect();
  try {
    const { type, data } = req.body;

    console.log("📩 Webhook recibido:", { type, data });

    // Procesamos sólo notificaciones de payment
    if (type !== "payment") {
      return res.status(200).json({ success: true });
    }

    const paymentId = data?.id;
    if (!paymentId) {
      console.warn("Webhook de payment sin id");
      return res.status(200).json({ success: true });
    }

    // Obtener información del pago y normalizar la respuesta
    const paymentRaw = await payment.get({ id: paymentId });
    const paymentInfo = paymentRaw?.body || paymentRaw;
    console.log("💳 Información del pago (normalizada):", paymentInfo);

    const externalReference = paymentInfo?.external_reference?.toString(); // order_id
    const status = paymentInfo?.status; // approved, rejected, pending, etc.

    if (!externalReference) {
      console.warn("Pago sin external_reference:", paymentId);
      return res.status(200).json({ success: true });
    }

    // Iniciar transacción y bloquear la fila de la orden para evitar doble procesamiento
    await client.query("BEGIN");

    const orderRes = await client.query(
      `SELECT id, user_id, status, payment_status
       FROM orders
       WHERE id = $1
       FOR UPDATE`,
      [externalReference]
    );

    if (orderRes.rowCount === 0) {
      console.warn(`Orden ${externalReference} no encontrada (webhook)`);
      await client.query("COMMIT");
      return res.status(200).json({ success: true });
    }

    const order = orderRes.rows[0];

    // Idempotencia: si ya está aprobada/paid no hacemos nada
    if (order.payment_status === "approved" || order.status === "paid") {
      console.log(`Orden ${externalReference} ya procesada (status=${order.status}, payment_status=${order.payment_status})`);
      await client.query("COMMIT");
      return res.status(200).json({ success: true });
    }

    if (status === "approved") {
      // Obtener items de la orden para decrementar stock
      const itemsRes = await client.query(
        `SELECT oi.product_id, oi.quantity
         FROM order_items oi
         WHERE oi.order_id = $1`,
        [externalReference]
      );

      // Decrementar stock de cada producto
      for (const it of itemsRes.rows) {
        await client.query(
          `UPDATE products
           SET stock = GREATEST(stock - $1, 0), updated_at = NOW()
           WHERE id = $2`,
          [it.quantity, it.product_id]
        );
      }

      // Vaciar carrito del usuario
      await client.query(`DELETE FROM cart_items WHERE user_id = $1`, [order.user_id]);

      // Actualizar orden: marcar como pagada y guardar payment_id real
      await client.query(
        `UPDATE orders
         SET status = 'paid',
             payment_status = 'approved',
             payment_id = $1,
             updated_at = NOW()
         WHERE id = $2`,
        [paymentId, externalReference]
      );

      try {
            const N8N_URL = process.env.N8N_WEBHOOK_LOCAL || process.env.N8N_WEBHOOK_URL;
            if (N8N_URL) {
              
              // Enviar notificación a n8n (fire-and-forget)
              fetch(N8N_URL, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "X-Service-Secret": process.env.N8N_WEBHOOK_SECRET || ""
                },
                body: JSON.stringify({ order_id: externalReference })
              })
              // Agregamos un .catch() a la promesa del fetch
              .catch(notifyErr => {
                console.warn("Fallo en fetch (fire-and-forget) a n8n:", notifyErr?.message);
              });

            }
          } catch (notifyErr) {
            // Este try/catch ahora solo captura errores síncronos (si N8N_URL es inválido, etc.)
            console.warn("Error síncrono al preparar notificación n8n:", notifyErr?.message);
          }

          // La transacción continúa y hace COMMIT inmediatamente
          console.log(`✅ Orden ${externalReference} marcada como pagada, stock decrementado y carrito vaciado`);

        } else if (status === "rejected") {

      console.log(`✅ Orden ${externalReference} marcada como pagada, stock decrementado y carrito vaciado`);
    } else if (status === "rejected") {
      await client.query(
        `UPDATE orders
         SET payment_status = 'rejected',
             updated_at = NOW()
         WHERE id = $1`,
        [externalReference]
      );

      console.log(`❌ Pago rechazado para orden ${externalReference}`);
    } else {
      // Otros estados (pending, in_process, etc.)
      await client.query(
        `UPDATE orders
         SET payment_status = $1,
             updated_at = NOW()
         WHERE id = $2`,
        [status || 'pending', externalReference]
      );

      console.log(`ℹ️ Pago estado '${status}' para orden ${externalReference}`);
    }

    await client.query("COMMIT");
    return res.status(200).json({ success: true });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Error en webhook:", error);
    return res.status(500).json({ error: error?.message || String(error) });
  } finally {
    client.release();
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
