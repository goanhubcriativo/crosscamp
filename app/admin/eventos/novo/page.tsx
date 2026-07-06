import { redirect } from "next/navigation";
import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import AdminHeader from "../../AdminHeader";
import EventForm from "../../../components/EventForm";

export const dynamic = "force-dynamic";

export default async function NovoEventoPage() {
  if (!(await isAuthenticated())) redirect("/admin/login");
  return (
    <div className="container">
      <AdminHeader />
      <Link href="/admin" className="muted">
        ← Voltar
      </Link>
      <h1 style={{ marginTop: 8 }}>Novo evento</h1>
      <EventForm />
    </div>
  );
}
