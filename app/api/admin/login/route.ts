import { NextRequest, NextResponse } from "next/server";
import { checkCredentials, createSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const user = String(body.user ?? "");
  const password = String(body.password ?? "");

  if (!checkCredentials(user, password)) {
    return NextResponse.json(
      { error: "Usuário ou senha inválidos." },
      { status: 401 }
    );
  }

  await createSession();
  return NextResponse.json({ ok: true });
}
