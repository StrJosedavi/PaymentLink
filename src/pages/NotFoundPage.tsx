import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main className="error-page">
      <div className="error-card">
        <h1>Página não encontrada</h1>
        <p>Este endereço não existe neste projeto.</p>
        <Link className="primary-button link-button" to="/">
          Ir para o gerador
        </Link>
      </div>
    </main>
  );
}
