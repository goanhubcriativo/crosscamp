import { NextRequest, NextResponse } from "next/server";
import { getOrder } from "@/lib/db";
import { getPayment, isPaidStatus } from "@/lib/asaas";
import { markOrderPaid } from "@/lib/ticket";

export const runtime = "nodejs";

// Consultado por polling na página do pedido.
// Além de ler o status local, reconcilia com o Asaas — assim funciona mesmo
// que o webhook ainda não tenha chegado (ou não esteja configurado em dev).
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let order = await getOrder(id);
  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }

  if (order.status === "PENDING" && order.asaas_payment_id) {
    try {
      const payment = await getPayment(order.asaas_payment_id);
      if (isPaidStatus(payment.status)) {
        order = (await markOrderPaid(order.id)) ?? order;
      }
    } catch (err) {
      // Se a consulta ao Asaas falhar, apenas seguimos com o status local.
      console.error("[status] reconcile", err);
    }
  }

  return NextResponse.json({
    status: order.status,
    ticketToken: order.status === "PAID" ? order.ticket_token : null,
  });
}
