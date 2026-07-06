import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import { initDb, getOrderByPaymentId } from "@/lib/db";
import { isPaidStatus } from "@/lib/asaas";
import { markOrderPaid } from "@/lib/ticket";

export const runtime = "nodejs";

// Webhook do Asaas (mesma URL para todos os eventos).
// Configure em cada conta Asaas: {APP_URL}/api/webhook, com o token de
// autenticação igual ao ASAAS_WEBHOOK_TOKEN. O pedido é localizado pelo
// id do pagamento, então descobrimos o evento a partir dele.
export async function POST(req: NextRequest) {
  if (config.asaasWebhookToken) {
    const received = req.headers.get("asaas-access-token");
    if (received !== config.asaasWebhookToken) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  try {
    await initDb();
    const body = await req.json();
    const event: string = body?.event ?? "";
    const payment = body?.payment;
    if (!payment?.id) return NextResponse.json({ received: true });

    const paidByEvent =
      event === "PAYMENT_RECEIVED" || event === "PAYMENT_CONFIRMED";

    if (paidByEvent || isPaidStatus(payment.status ?? "")) {
      const order = await getOrderByPaymentId(payment.id);
      if (order) await markOrderPaid(order.id);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[webhook]", err);
    return NextResponse.json({ received: true });
  }
}
