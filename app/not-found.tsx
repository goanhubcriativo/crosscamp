import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container">
      <div className="card center">
        <h1>Não encontrado</h1>
        <p className="muted">
          Este pedido ou ingresso não existe, ou ainda não foi pago.
        </p>
        <Link href="/">
          <button style={{ marginTop: 16 }}>Voltar ao início</button>
        </Link>
      </div>
    </div>
  );
}
