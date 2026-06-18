import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthDialog } from './components/auth/AuthDialog';
import { Layout } from './components/layout/Layout';
import { Admin } from './pages/Admin';
import { Betting } from './pages/Betting';
import { Dashboard } from './pages/Dashboard';
import { Fixtures } from './pages/Fixtures';
import { LiveDraw } from './pages/LiveDraw';
import { useAuthStore } from './stores/auth';

export default function App() {
  const { user, loading, initialize } = useAuthStore();
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!loading && !user) setAuthOpen(true);
    else setAuthOpen(false);
  }, [loading, user]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-950">
        <p className="text-neutral-400">Loading...</p>
      </div>
    );
  }

  return (
    <>
      <AuthDialog open={authOpen} onClose={() => setAuthOpen(false)} />
      {user && (
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="fixtures" element={<Fixtures />} />
            <Route path="betting" element={<Betting />} />
            <Route path="draw" element={<LiveDraw />} />
            <Route path="admin" element={<Admin />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </>
  );
}
