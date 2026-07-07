import { NextRequest, NextResponse } from "next/server";
import { canAccessEvent } from "@/lib/auth";
import {
  initDb,
  getTicketByToken,
  getOrder,
  markTicketCheckedIn,
} from "@/lib/db";

export const runtime = "nodejs";

// Valida um ingresso pelo token e registra a entrada.
// Super-admin ou o organizador do próprio evento.
export async function POST(req: NextRequest) {
  await initDb();

  const body = await req.json().catch(() => ({}));
  const eventId = String(body.eventId ?? "").trim();
  let token = String(body.token ?? "").trim();

  // Aceita token puro ou uma URL que contenha o token em hex.
  const m = token.match(/([a-f0-9]{32})/i);
  if (m) token = m[1];

  if (!eventId || !(await canAccessEvent(eventId))) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  if (!token) {
    return NextResponse.json({ error: "Token vazio." }, { status: 400 });
  }

  const ticket = await getTicketByToken(token);
  if (!ticket) {
    return NextResponse.json(
      { valid: false, reason: "Ingresso não encontrado." },
      { status: 404 }
    );
  }

  const order = await getOrder(ticket.order_id);
  if (!order) {
    return NextResponse.json({ valid: false, reason: "Pedido inválido." }, { status: 404 });
  }

  // Confere ANTES de registrar, para não consumir ingresso de outro evento.
  if (order.event_id !== eventId) {
    return NextResponse.json({
      valid: false,
      reason: "Este ingresso é de outro evento.",
      name: order.name,
    });
  }

  if (ticket.checked_in) {
    return NextResponse.json({
      valid: true,
      alreadyChecked: true,
      name: order.name,
      checkedInAt: ticket.checked_in_at,
    });
  }

  await markTicketCheckedIn(ticket.id);
  return NextResponse.json({ valid: true, alreadyChecked: false, name: order.name });
}
