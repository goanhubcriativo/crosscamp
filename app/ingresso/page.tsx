import RecuperarForm from "./RecuperarForm";

export const metadata = { title: "Recuperar ingresso · CrossCamp" };

export default function RecuperarPage() {
  return (
    <div className="container">
      <div className="card">
        <span className="kicker">
          <span className="slashes">///</span> Recuperar ingresso
        </span>
        <h1 style={{ marginTop: 12 }}>Achar meu ingresso</h1>
        <p className="muted">
          Perdeu o link? Informe o CPF e o e-mail usados na compra para abrir seu
          ingresso novamente.
        </p>
        <RecuperarForm />
      </div>
    </div>
  );
}
