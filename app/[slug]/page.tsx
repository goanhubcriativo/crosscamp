import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
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

  const ribbon = [event.name, event.event_date, event.location, "Ingresso via PIX"]
    .filter(Boolean)
    .join("  •  ");

  return (
    <EventTheme event={event}>
      <div className="container container-wide">
        <span className="kicker">
          <span className="slashes">///</span> Ingresso
        </span>

        <div className="marquee marquee--lime" style={{ marginTop: 14 }}>
          <div className="marquee-track">
            {Array.from({ length: 6 }).map((_, i) => (
              <span key={i}>{ribbon}</span>
            ))}
          </div>
        </div>

        <div className="event-grid">
          {/* Coluna de informações */}
          <div>
            {event.logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="event-logo"
                src={event.logo}
                alt={event.name}
                style={{ margin: "0 0 16px", maxWidth: "100%" }}
              />
            )}
            <h1>{event.name}</h1>
            {event.description && (
              <p className="muted" style={{ fontSize: "1.05rem" }}>
                {event.description}
              </p>
            )}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "16px 0" }}>
              {event.event_date && (
                <span className="kicker kicker--muted">📅 {event.event_date}</span>
              )}
              {event.location && (
                <span className="kicker kicker--muted">📍 {event.location}</span>
              )}
            </div>
            <span className="kicker kicker--muted">A partir de</span>
            <div className="price">{formatBRL(event.price)}</div>
            <p className="muted">por ingresso · pagamento via PIX</p>
          </div>

          {/* Coluna do formulário */}
          <div className="card">
            <h2>Comprar ingresso</h2>
            <BuyForm eventSlug={event.slug} price={event.price} />
          </div>
        </div>

        <div className="event-foot">
          <Link href="/ingresso" className="muted">
            Já comprou? Recuperar meu ingresso
          </Link>
          <Link href="/admin/login" className="muted">
            Área do organizador
          </Link>
        </div>
      </div>
    </EventTheme>
  );
}
