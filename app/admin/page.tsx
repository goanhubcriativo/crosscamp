import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { initDb, listOrders } from "@/lib/db";
import { config, formatBRL } from "@/lib/config";
import AdminHeader from "./AdminHeader";

export const dynamic = "force-dynamic";

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR");
}

export default async function AdminPage() {
  if (!(await isAuthenticated())) redirect("/admin/login");
  await initDb();
  const orders = await listOrders();

  const paid = orders.filter((o) => o.status === "PAID");
  const checkedIn = paid.filter((o) => o.checked_in);
  const revenue = paid.reduce((s, o) => s + o.amount, 0);

  return (
    <div className="container container-wide">
      <AdminHeader />
      <h1>Compradores</h1>
      <p className="muted">{config.event.name}</p>

      <div className="row-between" style={{ margin: "20px 0", flexWrap: "wrap" }}>
        <div className="stat">
          <div className="muted">Pedidos</div>
          <div className="n">{orders.length}</div>
        </div>
        <div className="stat">
          <div className="muted">Pagos</div>
          <div className="n">{paid.length}</div>
        </div>
        <div className="stat">
          <div className="muted">Entradas</div>
          <div className="n">
            {checkedIn.length}/{paid.length}
          </div>
        </div>
        <div className="stat">
          <div className="muted">Arrecadado</div>
          <div className="n">{formatBRL(revenue)}</div>
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
