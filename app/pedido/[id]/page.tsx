import { notFound } from "next/navigation";
import { getOrder, getEventById, initDb } from "@/lib/db";
import { formatBRL } from "@/lib/config";
import EventTheme from "../../components/EventTheme";
import PixPoller from "./PixPoller";

export const dynamic = "force-dynamic";

export default async function PedidoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await initDb();
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();
  const event = await getEventById(order.event_id);
  if (!event) notFound();

  return (
    <EventTheme event={event}>
      <div className="container">
        <div className="card center">
          {event.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="event-logo" src={event.logo} alt={event.name} />
          )}
          <h1>Pagamento PIX</h1>
          <p className="muted">{event.name}</p>
          <div className="price" style={{ margin: "8px 0 4px" }}>
            {formatBRL(order.amount)}
          </div>

          <PixPoller
            orderId={order.id}
            qrImage={order.pix_qr_image}
            payload={order.pix_payload}
            initialStatus={order.status}
            initialToken={order.ticket_token}
          />
        </div>
      </div>
    </EventTheme>
  );
}
