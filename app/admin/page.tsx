import { redirect } from "next/navigation";
import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { initDb, listEvents, eventStats } from "@/lib/db";
import { config, formatBRL } from "@/lib/config";
import AdminHeader from "./AdminHeader";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAuthenticated())) redirect("/admin/login");
  await initDb();
  const events = await listEvents();
  const stats = await Promise.all(events.map((e) => eventStats(e.id)));

  return (
    <div className="container container-wide">
      <AdminHeader />
      <div className="row-between" style={{ marginBottom: 20 }}>
        <div>
          <h1>Eventos</h1>
          <p className="muted">Gerencie seus eventos e vendas.</p>
        </div>
        <Link href="/admin/eventos/novo">
          <button>+ Novo evento</button>
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="card center" style={{ padding: 40 }}>
          <p className="muted">Nenhum evento ainda.</p>
          <Link href="/admin/eventos/novo">
            <button style={{ marginTop: 12 }}>Criar o primeiro evento</button>
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {events.map((e, i) => (
            <div key={e.id} className="card">
              <div className="row-between" style={{ flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <h2 style={{ margin: 0 }}>{e.name}</h2>
                    {e.published ? (
                      <span className="badge badge-paid">Publicado</span>
                    ) : (
                      <span className="badge badge-pending">Rascunho</span>
                    )}
                  </div>
                  <div className="muted" style={{ fontSize: "0.85rem", marginTop: 4 }}>
                    <a href={`${config.appUrl}/${e.slug}`} target="_blank" rel="noreferrer">
                      /{e.slug}
                    </a>{" "}
                    · {formatBRL(e.price)}
                    {!e.asaas_api_key && " · ⚠️ sem chave Asaas"}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Link href={`/admin/eventos/${e.id}/compradores`}>
                    <button className="btn-ghost">Compradores</button>
                  </Link>
                  <Link href={`/admin/eventos/${e.id}/validar`}>
                    <button className="btn-ghost">Validar</button>
                  </Link>
                  <Link href={`/admin/eventos/${e.id}`}>
                    <button className="btn-ghost">Editar</button>
                  </Link>
                </div>
              </div>
              <div
                className="row-between"
                style={{ marginTop: 14, flexWrap: "wrap", gap: 10 }}
              >
                <div className="stat">
                  <div className="muted">Pagos</div>
                  <div className="n">{stats[i].paid}</div>
                </div>
                <div className="stat">
                  <div className="muted">Entradas</div>
                  <div className="n">
                    {stats[i].checkedIn}/{stats[i].paid}
                  </div>
                </div>
                <div className="stat">
                  <div className="muted">Arrecadado</div>
                  <div className="n">{formatBRL(stats[i].revenue)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
