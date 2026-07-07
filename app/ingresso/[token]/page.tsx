import { notFound } from "next/navigation";
import QRCode from "qrcode";
import {
  getOrderByToken,
  getEventById,
  listTicketsByOrder,
  initDb,
} from "@/lib/db";
import EventTheme from "../../components/EventTheme";

export const dynamic = "force-dynamic";

export default async function IngressoPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  await initDb();
  const { token } = await params;
  const order = await getOrderByToken(token);
  if (!order || order.status !== "PAID") notFound();
  const event = await getEventById(order.event_id);
  if (!event) notFound();

  const tickets = await listTicketsByOrder(order.id);
  const qrs = await Promise.all(
    tickets.map((t) => QRCode.toDataURL(t.token, { width: 420, margin: 1 }))
  );

  return (
    <EventTheme event={event}>
      <div className="container">
        <span className="kicker">
          <span className="slashes">///</span> Ingresso
        </span>
        {event.logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="event-logo" src={event.logo} alt={event.name} style={{ margin: "16px 0" }} />
        )}
        <div className="badge badge-paid" style={{ marginTop: 8 }}>
          ✓ Pagamento confirmado
        </div>
        <h1 style={{ marginTop: 10 }}>{event.name}</h1>
        <p className="muted">
          {order.name}
          {event.event_date && <> · 📅 {event.event_date}</>}
          {event.location && <> · 📍 {event.location}</>}
        </p>
        <p className="muted" style={{ fontSize: "0.85rem" }}>
          {tickets.length === 1
            ? "1 ingresso"
            : `${tickets.length} ingressos — cada QR é uma entrada`}
        </p>

        <div
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: tickets.length > 1 ? "repeat(auto-fit, minmax(230px, 1fr))" : "1fr",
            marginTop: 16,
          }}
        >
          {tickets.map((t, i) => (
            <div key={t.id} className="card center">
              <span className="kicker kicker--muted">
                Ingresso {i + 1} de {tickets.length}
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="qr" src={qrs[i]} alt={`Ingresso ${i + 1}`} />
              <p className="muted" style={{ fontSize: "0.78rem" }}>
                Código: {t.token.slice(0, 8).toUpperCase()}
              </p>
              {t.checked_in ? (
                <div className="badge badge-in">Entrada registrada</div>
              ) : (
                <div className="badge badge-paid">Válido</div>
              )}
            </div>
          ))}
        </div>

        <p className="muted" style={{ marginTop: 18, fontSize: "0.85rem" }}>
          💡 Salve o link desta página ou tire um print. Você também pode recuperar
          seu ingresso depois em <strong>/ingresso</strong> com seu CPF e e-mail.
        </p>
      </div>
    </EventTheme>
  );
}
