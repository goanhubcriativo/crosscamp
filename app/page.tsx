import CrossCampLogo from "./components/CrossCampLogo";

// Raiz da plataforma: "em breve" com o logo do CrossCamp e fundo borrado.
export default function HomePage() {
  return (
    <main className="soon">
      <div className="soon-inner">
        <CrossCampLogo className="soon-logo" />
        <span className="soon-tag">Em breve</span>
      </div>
    </main>
  );
}
