import { RhythmMini } from './Rhythm';
import { useEffect, useLayoutEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { signOut } from '../lib/auth';
import Companion from './Companion';
import { useWorkspace } from '../lib/workspace';
import {
  getPreferences,
  prefersNight,
  preferencesEvent,
  savePreferences,
  type Preferences,
} from '../lib/preferences';

const groups = [
  {
    title: 'Planejar',
    icon: '▦',
    links: [
      ['/tarefas', 'Minhas tarefas'],
      ['/calendario', 'Calendário'],
      ['/intencoes', 'Ideias para depois'],
    ],
  },
  {
    title: 'Meu caminho',
    icon: '⌁',
    links: [
      ['/pequenos-comecos', 'Minha presença'],
      ['/historico', 'Passos registrados'],
      ['/mapa', 'Pequenos passos'],
      ['/retomada', 'Retomar'],
      ['/desafios', 'Convites para começar'],
    ],
  },
  {
    title: 'Meu espaço',
    icon: '◇',
    links: [
      ['/estatisticas', 'Como me sinto'],
      ['/zen', 'Um respiro'],
      ['/configuracoes', 'Configurações'],
    ],
  },
];

export default function AppShell() {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('doitbad:sidebar-collapsed') === '1',
  );
  const [error, setError] = useState('');
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [preferences, setPreferences] = useState(getPreferences);
  const [night, setNight] = useState(() => prefersNight(getPreferences().theme));
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
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => {
      window.history.scrollRestoration = previous;
    };
  }, []);
  useLayoutEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
    document.getElementById('conteudo')?.focus({ preventScroll: true });
    const frame = window.requestAnimationFrame(() => window.scrollTo(0, 0));
    return () => window.cancelAnimationFrame(frame);
  }, [location.key]);
  useEffect(() => {
    const update = (event?: Event) => {
      const next = event instanceof CustomEvent ? (event.detail as Preferences) : getPreferences();
      setPreferences(next);
      setNight(prefersNight(next.theme));
    };
    const media = matchMedia('(prefers-color-scheme: dark)');
    const systemUpdate = () => preferences.theme === 'system' && setNight(media.matches);
    window.addEventListener(preferencesEvent, update);
    media.addEventListener('change', systemUpdate);
    return () => {
      window.removeEventListener(preferencesEvent, update);
      media.removeEventListener('change', systemUpdate);
    };
  }, [preferences.theme]);
  useEffect(() => {
    localStorage.setItem('doitbad:sidebar-collapsed', collapsed ? '1' : '0');
  }, [collapsed]);
  return (
    <div
      className={`app-frame human-web ${night ? 'night-theme' : ''} ${collapsed ? 'sidebar-collapsed' : ''}`}
    >
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
        <div className="sidebar-heading">
          <Link className="brand" to="/atividade" aria-label="DoItBad — Meu dia">
            <span className="brand-full">
              DoIt<span className="brand-b">B</span>ad
            </span>
            <i aria-hidden="true">✦</i>
            <span className="brand-short" aria-hidden="true">
              <svg viewBox="0 0 32 32" width="32" height="32" fill="none" aria-hidden="true">
                <path
                  d="M8 7h5a9 9 0 0 1 0 18H8V7Z"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
                <path
                  d="m24 3 1.4 4.6L30 9l-4.6 1.4L24 15l-1.4-4.6L18 9l4.6-1.4L24 3Z"
                  fill="var(--terracotta)"
                />
              </svg>
            </span>
          </Link>
          <button
            className="sidebar-collapse"
            type="button"
            aria-label={collapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
            aria-pressed={collapsed}
            onClick={() => setCollapsed((value) => !value)}
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="16" rx="3" />
              <path d="M9 4v16" />
              <path d={collapsed ? 'm13 9 3 3-3 3' : 'm16 9-3 3 3 3'} />
            </svg>
          </button>
        </div>
        <p className="sidebar-caption">Um passo de cada vez.</p>
        <nav aria-label="Navegação principal">
          <NavLink to="/atividade" title="Meu dia">
            <span aria-hidden="true">◔</span>
            <span className="nav-label">Meu dia</span>
          </NavLink>
          {groups.map((group) => (
            <details
              className="nav-group"
              key={`${group.title}-${location.pathname}`}
              open={group.links.some(([path]) => path === location.pathname)}
            >
              <summary
                title={group.title}
                onClick={() => {
                  if (collapsed) {
                    setCollapsed(false);
                  }
                }}
              >
                <span aria-hidden="true">{group.icon}</span>
                <span className="nav-label">{group.title}</span>
                <span className="nav-chevron" aria-hidden="true">
                  ⌄
                </span>
              </summary>
              <div>
                {group.links.map(([path, title]) => (
                  <NavLink key={path} to={path}>
                    {title}
                  </NavLink>
                ))}
              </div>
            </details>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <Companion state="pause" />
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
          <span className="header-label">um passo de cada vez</span>
          <div className="header-actions">
            <button
              className="icon-button theme-toggle"
              aria-label={night ? 'Ativar modo claro' : 'Ativar modo noturno'}
              aria-pressed={night}
              onClick={() => savePreferences({ ...preferences, theme: night ? 'light' : 'dark' })}
            >
              <span aria-hidden="true">{night ? '☀' : '☾'}</span>
            </button>
            <Link
              className="icon-button settings-shortcut"
              aria-label="Abrir configurações"
              title="Configurações"
              to="/configuracoes"
            >
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m9 3-.6 2.4-2 .9-2.2-.7-2 3.4L4 10.7v2.6l-1.8 1.7 2 3.4 2.2-.7 2 .9L9 21h4l.6-2.4 2-.9 2.2.7 2-3.4-1.8-1.7v-2.6L19.8 9l-2-3.4-2.2.7-2-.9L13 3Z" />
                <circle cx="11" cy="12" r="3" />
              </svg>
            </Link>
            <span className="sync-label" role="status">
              {busy ? 'Salvando…' : loading ? 'Carregando…' : ''}
            </span>
            <Link className="header-capture" to="/tarefas?new=1">
              + Colocar no papel
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
          {ready && !location.pathname.startsWith('/foco/') && <RhythmMini />}
          {ready ? <Outlet /> : !dataError && <p role="status">Preparando seu espaço…</p>}
        </main>
        <footer className="app-footer">
          <span>DoItBad · o possível também conta.</span>
          <nav aria-label="Links do rodapé">
            <Link to="/configuracoes">Configurações</Link>
            <Link to="/configuracoes?section=privacidade">Privacidade</Link>
          </nav>
        </footer>
        <nav
          className={`mobile-nav ${keyboardOpen ? 'keyboard-open' : ''}`}
          aria-label="Acesso rápido"
        >
          <NavLink to="/atividade">Meu dia</NavLink>
          <NavLink to="/tarefas">Planejar</NavLink>
          <NavLink to="/pequenos-comecos">Caminho</NavLink>
          <button onClick={() => setOpen((value) => !value)} aria-expanded={open}>
            Meu espaço
          </button>
        </nav>
      </div>
    </div>
  );
}
