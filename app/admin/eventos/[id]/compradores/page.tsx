import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { initDb, getEventById, listOrdersByEvent, eventStats } from "@/lib/db";
import { formatBRL } from "@/lib/config";
import AdminHeader from "../../../AdminHeader";

export const dynamic = "force-dynamic";

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR");
}

export default async function CompradoresPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isAuthenticated())) redirect("/admin/login");
  await initDb();
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) notFound();
  const orders = await listOrdersByEvent(id);
  const stats = await eventStats(id);

  return (
    <div className="container container-wide">
      <AdminHeader />
      <Link href="/admin" className="muted">
        ← Voltar
      </Link>
      <h1 style={{ marginTop: 8 }}>Compradores</h1>
      <p className="muted">{event.name}</p>

      <div className="row-between" style={{ margin: "20px 0", flexWrap: "wrap" }}>
        <div className="stat">
          <div className="muted">Pedidos</div>
          <div className="n">{stats.total}</div>
        </div>
        <div className="stat">
          <div className="muted">Pagos</div>
          <div className="n">{stats.paid}</div>
        </div>
        <div className="stat">
          <div className="muted">Entradas</div>
          <div className="n">
            {stats.checkedIn}/{stats.paid}
          </div>
        </div>
        <div className="stat">
          <div className="muted">Arrecadado</div>
          <div className="n">{formatBRL(stats.revenue)}</div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Contato</th>
              <th>Status</th>
              <th>Entrada</th>
              <th>Criado em</th>
              <th>Pago em</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="muted center" style={{ padding: 24 }}>
                  Nenhum pedido ainda.
                </td>
              </tr>
            )}
            {orders.map((o) => (
              <tr key={o.id}>
                <td>
                  {o.name}
                  <div className="muted" style={{ fontSize: "0.78rem" }}>
                    CPF {o.cpf}
                  </div>
                </td>
                <td>
                  {o.email}
                  {o.phone && (
                    <div className="muted" style={{ fontSize: "0.78rem" }}>
                      {o.phone}
                    </div>
                  )}
                </td>
                <td>
                  {o.status === "PAID" ? (
                    <span className="badge badge-paid">Pago</span>
                  ) : (
                    <span className="badge badge-pending">Pendente</span>
                  )}
                </td>
                <td>
                  {o.checked_in ? (
                    <span className="badge badge-in">✓ Entrou</span>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
                <td className="muted">{fmtDate(o.created_at)}</td>
                <td className="muted">{fmtDate(o.paid_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
