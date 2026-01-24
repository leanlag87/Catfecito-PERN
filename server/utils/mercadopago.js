import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import { MP_ACCESS_TOKEN } from "../config.js";

// Configuración del cliente
const client = new MercadoPagoConfig({
  accessToken: MP_ACCESS_TOKEN,
  options: {
    timeout: 5000,
    idempotencyKey: `catfecito-${Date.now()}`,
  },
});

// Inicializar APIs
export const preference = new Preference(client);
export const payment = new Payment(client);
