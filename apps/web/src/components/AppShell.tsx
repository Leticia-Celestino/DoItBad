import { NavLink, Outlet } from 'react-router-dom';

export default function AppShell() {
  return (
    <div className="app-frame">
      <header className="app-header">
        <a className="brand" href="/atividade" aria-label="DoItBad — atividade">
          DoIt<span>B</span>ad<i>✦</i>
        </a>
        <span className="beta-label">Beta local</span>
      </header>
      <main id="conteudo" className="app-content">
        <Outlet />
      </main>
      <nav className="app-nav" aria-label="Navegação do beta">
        <NavLink to="/atividade">Agora</NavLink>
        <NavLink to="/historico">Histórico</NavLink>
      </nav>
    </div>
  );
}
