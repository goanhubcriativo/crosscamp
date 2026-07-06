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

// Registra a entrada (check-in) de um ingresso pelo token.
// Retorna { order, alreadyChecked } ou null se token inválido.
export async function checkInByToken(
  token: string
): Promise<{ order: Order; alreadyChecked: boolean } | null> {
  const r = await db().execute({
    sql: "SELECT * FROM orders WHERE ticket_token = ?",
    args: [token],
  });
  if (!r.rows.length) return null;
  const order = r.rows[0] as unknown as Order;

  if (order.status !== "PAID") {
    return { order, alreadyChecked: false };
  }
  if (order.checked_in) {
    return { order, alreadyChecked: true };
  }

  const now = new Date().toISOString();
  await db().execute({
    sql: "UPDATE orders SET checked_in = 1, checked_in_at = ? WHERE id = ?",
    args: [now, order.id],
  });
  return { order: { ...order, checked_in: 1, checked_in_at: now }, alreadyChecked: false };
}
