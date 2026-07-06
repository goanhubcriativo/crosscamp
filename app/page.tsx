import { config, formatBRL } from "@/lib/config";
import BuyForm from "./BuyForm";

export default function HomePage() {
  const { event } = config;
  return (
    <div className="container">
      <div className="card">
        <h1>{event.name}</h1>
        {event.description && <p className="muted">{event.description}</p>}
        <div style={{ margin: "16px 0" }}>
          {event.date && (
            <div className="muted">📅 {event.date}</div>
          )}
          {event.location && (
            <div className="muted">📍 {event.location}</div>
          )}
        </div>
        <div className="price">{formatBRL(event.price)}</div>
        <p className="muted" style={{ marginTop: 4 }}>
          Ingresso único · pagamento via PIX
        </p>

        <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "20px 0" }} />

        <h2>Seus dados</h2>
        <BuyForm />
      </div>
      <p className="center muted" style={{ marginTop: 20, fontSize: "0.82rem" }}>
        Área do organizador: <a href="/admin/login">entrar</a>
      </p>
    </div>
  );
}
