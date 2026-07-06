import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import {
  initDb,
  updateEvent,
  deleteEvent,
  getEventById,
  getEventBySlug,
} from "@/lib/db";
import { parseEventInput } from "@/lib/events";

export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  await initDb();
  const { id } = await params;

  const current = await getEventById(id);
  if (!current) {
    return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = parseEventInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  // Se mudou o slug, garante que não colide com outro evento.
  if (parsed.value.slug !== current.slug) {
    const other = await getEventBySlug(parsed.value.slug);
    if (other && other.id !== id) {
      return NextResponse.json(
        { error: `Já existe um evento com o link "${parsed.value.slug}".` },
        { status: 409 }
      );
    }
  }

  await updateEvent(id, parsed.value);
  return NextResponse.json({ id, slug: parsed.value.slug });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  await initDb();
  const { id } = await params;
  await deleteEvent(id);
  return NextResponse.json({ ok: true });
}
