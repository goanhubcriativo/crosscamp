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
  const { slug } = await params;
  let event = null;
  try {
    await initDb();
    event = await getEventBySlug(slug);
  } catch {
    notFound();
  }
  if (!event || !event.published) notFound();

  // Conteúdo da faixa (marquee), repetido para loop contínuo.
  const ribbon = [event.name, event.event_date, event.location, "Ingresso via PIX"]
    .filter(Boolean)
    .join("  •  ");

  return (
    <EventTheme event={event}>
      <div className="container">
        <span className="kicker">
          <span className="slashes">///</span> Ingresso
        </span>

        {event.logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="event-logo" src={event.logo} alt={event.name} style={{ margin: "18px 0" }} />
        )}

        <h1 style={{ marginTop: 16 }}>{event.name}</h1>
        {event.description && (
          <p className="muted" style={{ fontSize: "1.05rem", maxWidth: 480 }}>
            {event.description}
          </p>
        )}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "18px 0 4px" }}>
          {event.event_date && (
            <span className="kicker kicker--muted">📅 {event.event_date}</span>
          )}
          {event.location && (
            <span className="kicker kicker--muted">📍 {event.location}</span>
          )}
        </div>

        <div className="marquee marquee--lime">
          <div className="marquee-track">
            {Array.from({ length: 6 }).map((_, i) => (
              <span key={i}>{ribbon}</span>
            ))}
          </div>
        </div>

        <div className="card">
          <span className="kicker kicker--muted">Valor do ingresso</span>
          <div className="price" style={{ margin: "6px 0 2px" }}>
            {formatBRL(event.price)}
          </div>
          <p className="muted" style={{ marginBottom: 8 }}>
            Ingresso único · pagamento via PIX
          </p>

          <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "18px 0" }} />

          <h2>Seus dados</h2>
          <BuyForm eventSlug={event.slug} />
        </div>
      </div>
    </EventTheme>
  );
}
