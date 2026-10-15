import { Navigate, Route, Routes } from 'react-router-dom';
import { useEffect, useState } from 'react';
import AppShell from './components/AppShell';
import ActivityPage from './pages/ActivityPage';
import {
  Dashboard,
  TasksPage,
  StartPage,
  TimerPage,
  DonePage,
  HistoryPage,
  CalendarPage,
  MapPage,
  ChallengesPage,
  RecoveryPage,
  StatsPage,
  ZenPage,
  WelcomePage,
  SplashPage,
} from './pages/ProductPages';
import { WorkspaceProvider } from './lib/workspace';
import LoginPage, { PasswordPage } from './pages/LoginPage';
import { getSession, subscribeToAuth } from './lib/auth';
import { isSupabaseConfigured } from './lib/supabase';

export default function App() {
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
  const [signedIn, setSignedIn] = useState(!isSupabaseConfigured);
  const [userId, setUserId] = useState('local');
  const [authError, setAuthError] = useState(false);
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    void getSession()
      .then((session) => {
        setSignedIn(Boolean(session));
        setUserId(session?.user.id ?? 'anonymous');
      })
      .catch(() => setAuthError(true))
      .finally(() => setAuthReady(true));
    return subscribeToAuth((session) => {
      setSignedIn(Boolean(session));
      setUserId(session?.user.id ?? 'anonymous');
    });
  }, []);
  if (import.meta.env.PROD && !isSupabaseConfigured)
    return (
      <main className="entry-page">
        <section className="entry-card">
          <h1>Seu espaço está sendo preparado.</h1>
          <p>O acesso está temporariamente indisponível. Tente novamente mais tarde.</p>
        </section>
      </main>
    );
  if (!authReady)
    return (
      <main className="entry-page">
        <p>Carregando seu espaço…</p>
      </main>
    );
  if (authError)
    return (
      <main className="entry-page">
        <p role="alert">Não foi possível recuperar seu acesso.</p>
        <button className="button" onClick={() => window.location.reload()}>
          Tentar novamente
        </button>
      </main>
    );
  return (
    <Routes>
      <Route path="/" element={<SplashPage signedIn={signedIn} />} />
      <Route path="/abertura" element={<SplashPage signedIn={signedIn} />} />
      <Route path="/redefinir-senha" element={<PasswordPage />} />
      <Route
        path="/entrar"
        element={
          isSupabaseConfigured && signedIn ? <Navigate to="/atividade" replace /> : <LoginPage />
        }
      />
      <Route path="/boas-vindas" element={<WelcomePage />} />
      <Route
        element={
          signedIn ? (
            <WorkspaceProvider key={userId}>
              <AppShell />
            </WorkspaceProvider>
          ) : (
            <Navigate to="/entrar" replace />
          )
        }
      >
        <Route path="/atividade" element={<Dashboard />} />
        <Route path="/intencoes" element={<ActivityPage />} />
        <Route path="/tarefas" element={<TasksPage />} />
        <Route path="/tarefa" element={<StartPage />} />
        <Route path="/foco/:id" element={<TimerPage />} />
        <Route path="/conclusao/:id" element={<DonePage />} />
        <Route path="/calendario" element={<CalendarPage />} />
        <Route path="/mapa" element={<MapPage />} />
        <Route path="/desafios" element={<ChallengesPage />} />
        <Route path="/retomada" element={<RecoveryPage />} />
        <Route path="/estatisticas" element={<StatsPage />} />
        <Route path="/zen" element={<ZenPage />} />
        <Route path="/historico" element={<HistoryPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
