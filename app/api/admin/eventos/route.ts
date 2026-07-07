import { NextRequest, NextResponse } from "next/server";
import { isAdmin, hashPassword } from "@/lib/auth";
import { initDb, createEvent, getEventBySlug } from "@/lib/db";
import { newId } from "@/lib/ticket";
import { parseEventInput } from "@/lib/events";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  await initDb();

  const body = await req.json().catch(() => ({}));
  const parsed = parseEventInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const existing = await getEventBySlug(parsed.value.slug);
  if (existing) {
    return NextResponse.json(
      { error: `Já existe um evento com o link "${parsed.value.slug}".` },
      { status: 409 }
    );
  }

  if (parsed.ownerPassword) {
    parsed.value.owner_pass_hash = hashPassword(parsed.ownerPassword);
  }

  const id = newId();
  await createEvent(id, parsed.value);
  return NextResponse.json({ id, slug: parsed.value.slug });
}
