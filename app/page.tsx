import Link from "next/link";
import CrossCampLogo from "./components/CrossCampLogo";
import { initDb, listPublishedEvents, type EventRow } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let events: EventRow[] = [];
  try {
    await initDb();
    events = await listPublishedEvents();
  } catch {
    events = [];
  }

  return (
    <main className="soon">
      <div className="soon-inner">
        <CrossCampLogo className="soon-logo" />
        <span className="soon-tag">Sistema de Gestão de Campeonatos</span>

        {events.length > 0 ? (
          <div className="launch-grid">
            {events.map((e) => (
              <Link
                key={e.id}
                href={`/${e.slug}`}
                className="launch"
                style={{ background: e.color_bg, borderColor: e.color_accent }}
              >
                {e.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={e.logo} alt={e.name} className="launch-logo" />
                ) : (
                  <span className="launch-name" style={{ color: e.color_text }}>
                    {e.name}
                  </span>
                )}
                <span className="launch-cta" style={{ color: e.color_accent }}>
                  Comprar ingresso →
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <span className="kicker">
            <span className="slashes">///</span> Em breve
          </span>
        )}
      </div>
    </main>
  );
}
