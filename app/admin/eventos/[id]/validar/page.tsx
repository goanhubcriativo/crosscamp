import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { canAccessEvent, getSession } from "@/lib/auth";
import { initDb, getEventById, eventStats } from "@/lib/db";
import AdminHeader from "../../../AdminHeader";
import Validator from "../../../../components/Validator";

export const dynamic = "force-dynamic";

export default async function ValidarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!(await canAccessEvent(id))) redirect("/admin/login");
  await initDb();
  const event = await getEventById(id);
  if (!event) notFound();
  const role = (await getSession())?.role === "org" ? "org" : "admin";
  const stats = await eventStats(id);

  return (
    <div className="container">
      <AdminHeader role={role} eventId={id} eventName={event.name} />
      {role === "admin" && (
        <Link href={`/admin/eventos/${id}/compradores`} className="muted">
          ← Vendas
        </Link>
      )}
      <h1 style={{ marginTop: 8 }}>Validar entrada</h1>
      <p className="muted">
        {event.name} — escaneie o QR do ingresso ou cole o código.
      </p>
      <Validator
        eventId={event.id}
        initialEntered={stats.entered}
        totalTickets={stats.tickets}
      />
    </div>
  );
}
