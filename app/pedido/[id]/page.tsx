import { notFound } from "next/navigation";
import { getOrder, initDb } from "@/lib/db";
import { config, formatBRL } from "@/lib/config";
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

  // Se já estiver pago, o poller redireciona direto para o ingresso.
  return (
    <div className="container">
      <div className="card center">
        <h1>Pagamento PIX</h1>
        <p className="muted">{config.event.name}</p>
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
  );
}
