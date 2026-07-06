import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { getOrderByToken, initDb } from "@/lib/db";
import { config } from "@/lib/config";

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

  // O QR do ingresso codifica a URL de validação; o gestor escaneia na entrada.
  const validateUrl = `${config.appUrl}/ingresso/${token}`;
  const qrDataUrl = await QRCode.toDataURL(validateUrl, {
    width: 480,
    margin: 1,
  });

  return (
    <div className="container">
      <div className="card center">
        <div className="badge badge-paid" style={{ marginBottom: 12 }}>
          ✓ Pagamento confirmado
        </div>
        <h1>Seu ingresso</h1>
        <p className="muted">{config.event.name}</p>
        {config.event.date && <p className="muted">📅 {config.event.date}</p>}
        {config.event.location && (
          <p className="muted">📍 {config.event.location}</p>
        )}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="qr" src={qrDataUrl} alt="QR Code do ingresso" />

        <p style={{ fontWeight: 600 }}>{order.name}</p>
        <p className="muted" style={{ fontSize: "0.8rem" }}>
          Código: {token.slice(0, 8).toUpperCase()}
        </p>

        {order.checked_in ? (
          <div className="badge badge-in" style={{ marginTop: 16 }}>
            Entrada já registrada
          </div>
        ) : (
          <p className="muted" style={{ marginTop: 16, fontSize: "0.85rem" }}>
            Apresente este QR Code na entrada do evento.
          </p>
        )}
      </div>
    </div>
  );
}
