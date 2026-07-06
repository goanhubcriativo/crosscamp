import type { EventRow } from "@/lib/db";

// Aplica as cores do evento como CSS variables num wrapper, sobrescrevendo o
// tema global. Todas as páginas do evento ficam dentro deste wrapper.
export default function EventTheme({
  event,
  children,
}: {
  event: Pick<
    EventRow,
    "color_bg" | "color_primary" | "color_accent" | "color_text"
  >;
  children: React.ReactNode;
}) {
  const style = {
    "--bg": event.color_bg,
    "--brand": event.color_primary,
    "--brand-2": event.color_accent,
    "--text": event.color_text,
    "--price-color": event.color_accent,
    background: event.color_bg,
    color: event.color_text,
    minHeight: "100vh",
  } as React.CSSProperties;

  return (
    <div className="event-theme" style={style}>
      {children}
    </div>
  );
}
