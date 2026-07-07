import { NextRequest, NextResponse } from "next/server";
import { getOrder, getEventById, initDb } from "@/lib/db";
import { getPayment, isPaidStatus } from "@/lib/asaas";
import { markOrderPaid } from "@/lib/ticket";

export const runtime = "nodejs";
export const maxDuration = 60;

// Polling da página do pedido: lê o status local e reconcilia com o Asaas
// (usando a chave do evento) caso o webhook ainda não tenha chegado.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await initDb();
  const { id } = await params;
  let order = await getOrder(id);
  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }

  if (order.status === "PENDING" && order.asaas_payment_id) {
    try {
      const event = await getEventById(order.event_id);
      if (event?.asaas_api_key) {
        const payment = await getPayment(
          { apiKey: event.asaas_api_key, env: event.asaas_env },
          order.asaas_payment_id
        );
        if (isPaidStatus(payment.status)) {
          order = (await markOrderPaid(order.id)) ?? order;
        }
      }
    } catch (err) {
      console.error("[status] reconcile", err);
    }
  }

  return NextResponse.json({
    status: order.status,
    ticketToken: order.status === "PAID" ? order.ticket_token : null,
  });
}
