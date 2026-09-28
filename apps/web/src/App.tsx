import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/AppShell';
import ActivityPage from './pages/ActivityPage';
import HistoryPage from './pages/HistoryPage';
import LoginPage from './pages/LoginPage';

export default function App() {
  return (
    <Routes>
      <Route path="/entrar" element={<LoginPage />} />
      <Route element={<AppShell />}>
        <Route path="/atividade" element={<ActivityPage />} />
        <Route path="/historico" element={<HistoryPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/atividade" replace />} />
    </Routes>
  );
}
