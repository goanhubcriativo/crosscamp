import crypto from "node:crypto";
import { db, getOrder, type Order } from "./db";

export function newId(): string {
  return crypto.randomUUID();
}

function newTicketToken(): string {
  return crypto.randomBytes(16).toString("hex");
}

// Marca um pedido como pago e gera o token do ingresso, de forma idempotente.
// Retorna o pedido atualizado (ou null se não existir).
export async function markOrderPaid(orderId: string): Promise<Order | null> {
  const order = await getOrder(orderId);
  if (!order) return null;
  if (order.status === "PAID" && order.ticket_token) return order;

  const token = order.ticket_token ?? newTicketToken();
  const now = new Date().toISOString();

  await db().execute({
    sql: `UPDATE orders
          SET status = 'PAID',
              ticket_token = ?,
              paid_at = COALESCE(paid_at, ?)
          WHERE id = ?`,
    args: [token, now, orderId],
  });

  return getOrder(orderId);
}

// Marca a entrada de um pedido já pago. Idempotente.
export async function registerEntry(orderId: string): Promise<void> {
  const now = new Date().toISOString();
  await db().execute({
    sql: "UPDATE orders SET checked_in = 1, checked_in_at = ? WHERE id = ? AND checked_in = 0",
    args: [now, orderId],
  });
}
