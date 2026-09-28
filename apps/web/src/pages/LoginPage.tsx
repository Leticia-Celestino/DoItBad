import { Link } from 'react-router-dom';

export default function LoginPage() {
  return (
    <main className="entry-page">
      <section className="entry-card" aria-labelledby="entry-title">
        <a className="brand" href="/entrar">
          DoIt<span>B</span>ad<i>✦</i>
        </a>
        <p className="eyebrow">Beta web</p>
        <h1 id="entry-title">Entre quando o acesso estiver liberado.</h1>
        <p>
          A autenticação será conectada ao ambiente Supabase do piloto. Esta base local não cria
          contas demonstrativas nem aceita senhas sem destino.
        </p>
        <Link className="button" to="/atividade">
          Abrir ambiente local
        </Link>
        <small>Somente para desenvolvimento. Os dados ficam neste navegador.</small>
      </section>
    </main>
  );
}
