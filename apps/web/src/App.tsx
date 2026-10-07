import { Navigate, Route, Routes } from 'react-router-dom';
import { useEffect, useState } from 'react';
import AppShell from './components/AppShell';
import ActivityPage from './pages/ActivityPage';
import HistoryPage from './pages/HistoryPage';
import LoginPage from './pages/LoginPage';
import { getSession, subscribeToAuth } from './lib/auth';
import { isSupabaseConfigured } from './lib/supabase';

export default function App() {
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
  const [signedIn, setSignedIn] = useState(!isSupabaseConfigured);
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    void getSession().then((session) => setSignedIn(Boolean(session))).finally(() => setAuthReady(true));
    return subscribeToAuth((session) => setSignedIn(Boolean(session)));
  }, []);
  if (!authReady) return <main className="entry-page"><p>Carregando seu espaço…</p></main>;
  return (
    <Routes>
      <Route path="/entrar" element={isSupabaseConfigured && signedIn ? <Navigate to="/atividade" replace /> : <LoginPage />} />
      <Route element={signedIn ? <AppShell /> : <Navigate to="/entrar" replace />}>
        <Route path="/atividade" element={<ActivityPage />} />
        <Route path="/historico" element={<HistoryPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/atividade" replace />} />
    </Routes>
  );
}
