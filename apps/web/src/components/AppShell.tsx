import { NavLink, Outlet } from 'react-router-dom';
import { signOut } from '../lib/auth';

export default function AppShell() {
  return (
    <div className="app-frame">
      <header className="app-header">
        <a className="brand" href="/atividade" aria-label="DoItBad — atividade">
          DoIt<span>B</span>ad<i>✦</i>
        </a>
        <button className="text-button" type="button" onClick={() => void signOut()}>Sair</button>
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
