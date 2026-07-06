import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { checkInByToken } from "@/lib/ticket";
import { initDb } from "@/lib/db";

export const runtime = "nodejs";

// Valida um ingresso pelo token e registra a entrada. Apenas gestor autenticado.
export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  await initDb();

  const body = await req.json().catch(() => ({}));
  let token = String(body.token ?? "").trim();

  // Aceita tanto o token puro quanto uma URL /ingresso/<token>.
  const m = token.match(/ingresso\/([a-f0-9]+)/i);
  if (m) token = m[1];

  if (!token) {
    return NextResponse.json({ error: "Token vazio." }, { status: 400 });
  }

  const result = await checkInByToken(token);
  if (!result) {
    return NextResponse.json(
      { valid: false, reason: "Ingresso não encontrado." },
      { status: 404 }
    );
  }

  const { order, alreadyChecked } = result;
  if (order.status !== "PAID") {
    return NextResponse.json({
      valid: false,
      reason: "Pagamento não confirmado.",
      name: order.name,
    });
  }

  return NextResponse.json({
    valid: true,
    alreadyChecked,
    name: order.name,
    checkedInAt: order.checked_in_at,
  });
}
