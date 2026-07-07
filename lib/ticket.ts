import crypto from "node:crypto";
import { getOrder, markPaidById, registerEntryById, type Order } from "./db";

export function newId(): string {
  return crypto.randomUUID();
}

function newTicketToken(): string {
  return crypto.randomBytes(16).toString("hex");
}

// Marca um pedido como pago e gera o token do ingresso, de forma idempotente.
export async function markOrderPaid(orderId: string): Promise<Order | null> {
  const order = await getOrder(orderId);
  if (!order) return null;
  if (order.status === "PAID" && order.ticket_token) return order;

  const token = order.ticket_token ?? newTicketToken();
  await markPaidById(orderId, token);
  return getOrder(orderId);
}

// Marca a entrada de um pedido já pago. Idempotente.
export async function registerEntry(orderId: string): Promise<void> {
  await registerEntryById(orderId);
}
