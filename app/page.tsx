import CrossCampLogo from "./components/CrossCampLogo";

// Raiz da plataforma: "em breve" com o logo e estilo editorial.
export default function HomePage() {
  return (
    <main className="soon">
      <div className="soon-inner">
        <span className="kicker">
          <span className="slashes">///</span> CROSSCAMP
        </span>
        <CrossCampLogo className="soon-logo" />
        <h1 className="soon-big">
          EM <em>BREVE</em>
        </h1>
        <span className="soon-tag">Plataforma de Ingressos</span>
      </div>
    </main>
  );
}
