import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { registerEntry } from "@/lib/ticket";
import { initDb, getOrderByToken } from "@/lib/db";

export const runtime = "nodejs";

// Valida um ingresso pelo token e registra a entrada. Apenas gestor autenticado.
export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  await initDb();

  const body = await req.json().catch(() => ({}));
  const eventId = String(body.eventId ?? "").trim();
  let token = String(body.token ?? "").trim();

  // Aceita tanto o token puro quanto uma URL /ingresso/<token>.
  const m = token.match(/ingresso\/([a-f0-9]+)/i);
  if (m) token = m[1];

  if (!token) {
    return NextResponse.json({ error: "Token vazio." }, { status: 400 });
  }

  const order = await getOrderByToken(token);
  if (!order) {
    return NextResponse.json(
      { valid: false, reason: "Ingresso não encontrado." },
      { status: 404 }
    );
  }

  // Confere ANTES de registrar, para não consumir ingresso de outro evento.
  if (eventId && order.event_id !== eventId) {
    return NextResponse.json({
      valid: false,
      reason: "Este ingresso é de outro evento.",
      name: order.name,
    });
  }
  if (order.status !== "PAID") {
    return NextResponse.json({
      valid: false,
      reason: "Pagamento não confirmado.",
      name: order.name,
    });
  }

  if (order.checked_in) {
    return NextResponse.json({
      valid: true,
      alreadyChecked: true,
      name: order.name,
      checkedInAt: order.checked_in_at,
    });
  }

  await registerEntry(order.id);
  return NextResponse.json({
    valid: true,
    alreadyChecked: false,
    name: order.name,
  });
}
