import crypto from "node:crypto";
import {
  getOrder,
  markPaidById,
  listTicketsByOrder,
  insertTicket,
  type Order,
} from "./db";

export function newId(): string {
  return crypto.randomUUID();
}

export function newToken(): string {
  return crypto.randomBytes(16).toString("hex");
}

// Marca o pedido como pago, gera o token de acesso e cria os N ingressos
// individuais (um por unidade comprada). Idempotente.
export async function markOrderPaid(orderId: string): Promise<Order | null> {
  const order = await getOrder(orderId);
  if (!order) return null;

  const accessToken = order.ticket_token ?? newToken();
  if (order.status !== "PAID" || !order.ticket_token) {
    await markPaidById(orderId, accessToken);
  }

  // Cria os ingressos apenas uma vez.
  const existing = await listTicketsByOrder(orderId);
  if (existing.length === 0) {
    const qty = Math.max(1, order.quantity || 1);
    for (let i = 0; i < qty; i++) {
      await insertTicket(newId(), orderId, newToken());
    }
  }

  return getOrder(orderId);
}
