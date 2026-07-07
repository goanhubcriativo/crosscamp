import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { isAdmin } from "@/lib/auth";
import { initDb, getEventById } from "@/lib/db";
import AdminHeader from "../../AdminHeader";
import EventForm from "../../../components/EventForm";

export const dynamic = "force-dynamic";

export default async function EditarEventoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isAdmin())) redirect("/admin/login");
  await initDb();
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) notFound();

  return (
    <div className="container">
      <AdminHeader />
      <Link href="/admin" className="muted">
        ← Voltar
      </Link>
      <div className="row-between" style={{ marginTop: 8 }}>
        <h1>Editar evento</h1>
      </div>
      <div style={{ display: "flex", gap: 10, margin: "8px 0 20px" }}>
        <Link href={`/admin/eventos/${event.id}/compradores`}>
          <button className="btn-ghost">Compradores</button>
        </Link>
        <Link href={`/admin/eventos/${event.id}/validar`}>
          <button className="btn-ghost">Validar entrada</button>
        </Link>
      </div>
      <EventForm event={event} />
    </div>
  );
}
