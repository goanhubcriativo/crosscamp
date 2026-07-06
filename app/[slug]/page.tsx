import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { initDb, getEventBySlug } from "@/lib/db";
import { formatBRL } from "@/lib/config";
import EventTheme from "../components/EventTheme";
import BuyForm from "../components/BuyForm";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  try {
    await initDb();
    const { slug } = await params;
    const event = await getEventBySlug(slug);
    if (event) {
      return { title: event.name, description: event.description ?? undefined };
    }
  } catch {
    /* ignora */
  }
  return { title: "Evento" };
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await initDb();
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event || !event.published) notFound();

  return (
    <EventTheme event={event}>
      <div className="container">
        <div className="card">
          {event.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="event-logo" src={event.logo} alt={event.name} />
          )}
          <h1>{event.name}</h1>
          {event.description && <p className="muted">{event.description}</p>}
          <div style={{ margin: "16px 0" }}>
            {event.event_date && <div className="muted">📅 {event.event_date}</div>}
            {event.location && <div className="muted">📍 {event.location}</div>}
          </div>
          <div className="price">{formatBRL(event.price)}</div>
          <p className="muted" style={{ marginTop: 4 }}>
            Ingresso único · pagamento via PIX
          </p>

          <hr
            style={{
              border: "none",
              borderTop: "1px solid var(--border)",
              margin: "20px 0",
            }}
          />

          <h2>Seus dados</h2>
          <BuyForm eventSlug={event.slug} />
        </div>
      </div>
    </EventTheme>
  );
}
