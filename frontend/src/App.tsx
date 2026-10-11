import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router';
import { AppShell } from './pages/AppShell';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';

// Ağır sayfalar ayrı paketlerde: ana sayfa hafif kalsın.
const SimulationPage = lazy(() => import('./pages/SimulationPage').then((m) => ({ default: m.SimulationPage })));
const PythonLabPage = lazy(() => import('./pages/PythonLabPage').then((m) => ({ default: m.PythonLabPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const ReviewPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.ReviewPage })));
const LoginPage = lazy(() => import('./pages/AuthPages').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/AuthPages').then((m) => ({ default: m.RegisterPage })));
const KvkkPage = lazy(() => import('./pages/AuthPages').then((m) => ({ default: m.KvkkPage })));

export function App() {
  return (
    <AppShell>
      <Suspense fallback={<div className="mx-auto mt-24 h-[420px] max-w-[1600px] animate-pulse rounded-xl px-4 md:px-8" />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/konu/:simId" element={<SimulationPage />} />
          <Route path="/python-lab" element={<PythonLabPage />} />
          <Route path="/panel" element={<DashboardPage />} />
          <Route path="/tekrar" element={<ReviewPage />} />
          <Route path="/giris" element={<LoginPage />} />
          <Route path="/kayit" element={<RegisterPage />} />
          <Route path="/kvkk" element={<KvkkPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </AppShell>
  );
}
