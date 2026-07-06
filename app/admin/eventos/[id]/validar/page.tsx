import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { initDb, getEventById } from "@/lib/db";
import AdminHeader from "../../../AdminHeader";
import Validator from "../../../../components/Validator";

export const dynamic = "force-dynamic";

export default async function ValidarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isAuthenticated())) redirect("/admin/login");
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
      <h1 style={{ marginTop: 8 }}>Validar entrada</h1>
      <p className="muted">
        {event.name} — escaneie o QR do ingresso ou cole o código.
      </p>
      <Validator eventId={event.id} />
    </div>
  );
}
