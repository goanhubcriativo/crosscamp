import { NextRequest, NextResponse } from "next/server";
import {
  checkAdminCredentials,
  verifyPassword,
  createAdminSession,
  createOrgSession,
} from "@/lib/auth";
import { initDb, getEventByOwnerUser } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const user = String(body.user ?? "").trim();
  const password = String(body.password ?? "");

  // 1) Super-admin da plataforma
  if (checkAdminCredentials(user, password)) {
    await createAdminSession();
    return NextResponse.json({ ok: true, redirect: "/admin" });
  }

  // 2) Organizador (dono de um evento)
  try {
    await initDb();
    const event = await getEventByOwnerUser(user);
    if (event && verifyPassword(password, event.owner_pass_hash)) {
      await createOrgSession(event.id);
      return NextResponse.json({
        ok: true,
        redirect: `/admin/eventos/${event.id}/compradores`,
      });
    }
  } catch (err) {
    console.error("[login]", err);
  }

  return NextResponse.json(
    { error: "Usuário ou senha inválidos." },
    { status: 401 }
  );
}
