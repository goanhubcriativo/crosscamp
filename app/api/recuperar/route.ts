import { NextRequest, NextResponse } from "next/server";
import { initDb, findPaidOrderByCpfEmail } from "@/lib/db";

export const runtime = "nodejs";

const onlyDigits = (s: string) => s.replace(/\D/g, "");

// Recupera o ingresso do comprador por CPF + e-mail (sem login).
export async function POST(req: NextRequest) {
  await initDb();
  const body = await req.json().catch(() => ({}));
  const cpf = onlyDigits(String(body.cpf ?? ""));
  const email = String(body.email ?? "").trim();

  if (!cpf || !email) {
    return NextResponse.json({ error: "Informe CPF e e-mail." }, { status: 400 });
  }

  const order = await findPaidOrderByCpfEmail(cpf, email);
  if (!order || !order.ticket_token) {
    return NextResponse.json(
      { error: "Nenhum ingresso pago encontrado com esse CPF e e-mail." },
      { status: 404 }
    );
  }

  return NextResponse.json({ token: order.ticket_token });
}
