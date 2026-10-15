import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { signOut } from '../lib/auth';
import { isSupabaseConfigured } from '../lib/supabase';
import { useWorkspace } from '../lib/workspace';

const links = [
  ['/atividade', '⌂', 'Meu espaço'],
  ['/tarefas', '☷', 'Tarefas'],
  ['/calendario', '▦', 'Calendário'],
  ['/mapa', '⌁', 'Meu caminho'],
  ['/intencoes', '◇', 'Intenções'],
  ['/historico', '◷', 'Histórico'],
  ['/desafios', '✧', 'Desafios gentis'],
  ['/estatisticas', '↗', 'Como me sinto'],
  ['/retomada', '☾', 'Retomar'],
  ['/zen', '❋', 'Modo zen'],
];

export default function AppShell() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [night, setNight] = useState(() => localStorage.getItem('doitbad:night') === '1');
  const { loading, ready, error: dataError, reload, busy } = useWorkspace();
  const location = useLocation();
  useEffect(() => {
    const viewport = window.visualViewport;
    const update = () =>
      setKeyboardOpen(
        Boolean(
          viewport &&
          window.innerHeight - viewport.height > 150 &&
          document.activeElement?.matches('input, textarea, select'),
        ),
      );
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    viewport?.addEventListener('resize', update);
    document.addEventListener('focusout', update);
    document.addEventListener('keydown', escape);
    return () => {
      viewport?.removeEventListener('resize', update);
      document.removeEventListener('focusout', update);
      document.removeEventListener('keydown', escape);
    };
  }, []);
  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
    document.getElementById('conteudo')?.focus();
  }, [location.pathname]);
  useEffect(() => {
    localStorage.setItem('doitbad:night', night ? '1' : '0');
  }, [night]);
  return (
    <div className={`app-frame ${night ? 'night-theme' : ''}`}>
      <a className="skip-link" href="#conteudo">
        Pular para o conteúdo
      </a>
      {open && (
        <button
          className="navigation-scrim"
          aria-label="Fechar navegação"
          onClick={() => setOpen(false)}
        />
      )}
      <aside aria-label="Menu do aplicativo" className={`sidebar ${open ? 'is-open' : ''}`}>
        <Link className="brand" to="/atividade">
          DoIt<span>B</span>ad<i>✦</i>
        </Link>
        <p className="sidebar-caption">Um passo de cada vez.</p>
        <nav aria-label="Navegação principal">
          {links.map(([path, icon, title]) => (
            <NavLink key={path} to={path}>
              <span aria-hidden="true">{icon}</span>
              {title}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <p>
            O seu ritmo também
            <br />é um bom ritmo.
          </p>
          <button
            className="text-button"
            onClick={async () => {
              try {
                await signOut();
              } catch {
                setError('Não foi possível sair. Tente novamente.');
              }
            }}
          >
            Sair da conta
          </button>
        </div>
      </aside>
      <div className="workspace">
        <header className="app-header">
          <button
            className="icon-button menu-toggle"
            aria-label={open ? 'Fechar navegação' : 'Abrir navegação'}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            ☰
          </button>
          <span className="header-label">SEU ESPAÇO PARA COMEÇAR</span>
          <div className="header-actions">
            <button
              className="icon-button theme-toggle"
              aria-label={night ? 'Ativar modo claro' : 'Ativar modo noturno'}
              aria-pressed={night}
              onClick={() => setNight((value) => !value)}
            >
              <span aria-hidden="true">{night ? '☀' : '☾'}</span>
            </button>
            <span className="sync-label">
              {busy
                ? 'Salvando…'
                : loading
                  ? 'Carregando…'
                  : isSupabaseConfigured
                    ? 'Conta conectada'
                    : 'Desenvolvimento · dados neste navegador'}
            </span>
            <Link className="button small" to="/tarefa">
              + Novo passo
            </Link>
          </div>
        </header>
        <main id="conteudo" tabIndex={-1} className="app-content">
          {(dataError || error) && (
            <div className="error-banner" role="alert">
              {dataError || error}{' '}
              <button className="text-button" onClick={() => void reload()}>
                Atualizar dados
              </button>
            </div>
          )}
          {ready ? <Outlet /> : !dataError && <p role="status">Preparando seu espaço…</p>}
        </main>
        <nav
          className={`mobile-nav ${keyboardOpen ? 'keyboard-open' : ''}`}
          aria-label="Acesso rápido"
        >
          <NavLink to="/atividade">Início</NavLink>
          <NavLink to="/tarefas">Tarefas</NavLink>
          <NavLink to="/tarefa">+ Foco</NavLink>
          <NavLink to="/calendario">Agenda</NavLink>
          <NavLink to="/estatisticas">Você</NavLink>
        </nav>
      </div>
    </div>
  );
}
