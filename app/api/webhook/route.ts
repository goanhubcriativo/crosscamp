import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import { initDb, getOrderByPaymentId } from "@/lib/db";
import { isPaidStatus } from "@/lib/asaas";
import { markOrderPaid } from "@/lib/ticket";

export const runtime = "nodejs";

// Webhook do Asaas. Configure no painel do Asaas apontando para:
//   {APP_URL}/api/webhook
// e defina o mesmo token secreto (ASAAS_WEBHOOK_TOKEN) no cabeçalho de autenticação.
export async function POST(req: NextRequest) {
  // Autenticação por token compartilhado (se configurado).
  if (config.asaas.webhookToken) {
    const received = req.headers.get("asaas-access-token");
    if (received !== config.asaas.webhookToken) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  try {
    await initDb();
    const body = await req.json();
    const event: string = body?.event ?? "";
    const payment = body?.payment;

    if (!payment?.id) {
      return NextResponse.json({ received: true });
    }

    const paidByEvent =
      event === "PAYMENT_RECEIVED" || event === "PAYMENT_CONFIRMED";

    if (paidByEvent || isPaidStatus(payment.status ?? "")) {
      const order = await getOrderByPaymentId(payment.id);
      if (order) {
        await markOrderPaid(order.id);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[webhook]", err);
    // Retorna 200 para o Asaas não ficar reenviando por erro de parse nosso.
    return NextResponse.json({ received: true });
  }
}
