"use client";

// Mensagem amigável para qualquer erro não tratado (ex.: banco ainda não conectado).
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="soon">
      <div className="soon-inner" style={{ maxWidth: 460 }}>
        <span className="soon-tag">Ops</span>
        <p className="soon-text">
          Não conseguimos carregar esta página agora. Se você é o organizador, o
          banco de dados pode ainda não estar conectado.
        </p>
        <button onClick={reset}>Tentar de novo</button>
      </div>
    </div>
  );
}
