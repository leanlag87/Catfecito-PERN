import { pool } from "../db.js";

/**
 * Job para cancelar órdenes pendientes después de 10 minutos
 * Se puede ejecutar con un cron job o con node-cron
 */
export async function cancelUnpaidOrders() {
  try {
    // Buscar órdenes pendientes de más de 10 minutos
    const result = await pool.query(
      `UPDATE orders 
       SET status = 'cancelled', 
           payment_status = 'cancelled',
           updated_at = NOW()
       WHERE payment_status = 'pending' 
       AND status = 'pending'
       AND created_at < NOW() - INTERVAL '10 minutes'
       RETURNING id, user_id, created_at`,
    );

    if (result.rowCount > 0) {
      console.log(`🚫 ${result.rowCount} órdenes canceladas automáticamente:`);
      result.rows.forEach(order => {
        console.log(`   - Orden #${order.id} (Usuario: ${order.user_id}) - Creada: ${order.created_at}`);
      });
    }

    return result.rowCount;
  } catch (error) {
    console.error("❌ Error en cancelUnpaidOrders:", error);
    return 0;
  }
}

// Si se ejecuta directamente desde la terminal
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔄 Ejecutando cancelación de órdenes no pagadas...");
  cancelUnpaidOrders()
    .then(count => {
      console.log(`✅ Proceso completado. ${count} órdenes canceladas.`);
      process.exit(0);
    })
    .catch(error => {
      console.error("❌ Error:", error);
      process.exit(1);
    });
}
