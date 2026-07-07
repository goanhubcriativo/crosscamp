import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const s = await getSession();
  if (s?.role === "admin") redirect("/admin");
  if (s?.role === "org") redirect(`/admin/eventos/${s.eventId}/compradores`);
  return (
    <div className="container">
      <div className="card">
        <span className="kicker">
          <span className="slashes">///</span> Acesso
        </span>
        <h1 style={{ marginTop: 12 }}>Entrar</h1>
        <p className="muted">Painel do organizador · monitore suas vendas.</p>
        <LoginForm />
      </div>
    </div>
  );
}
