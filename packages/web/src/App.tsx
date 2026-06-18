import { Component, type ReactNode, useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthDialog } from './components/auth/AuthDialog';
import { Layout } from './components/layout/Layout';
import { Admin } from './pages/Admin';
import { Betting } from './pages/Betting';
import { Dashboard } from './pages/Dashboard';
import { Fixtures } from './pages/Fixtures';
import { LiveDraw } from './pages/LiveDraw';
import { useAuthStore } from './stores/auth';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="flex h-screen items-center justify-center bg-neutral-950 p-10">
          <div className="max-w-lg rounded-xl border border-red-800 bg-red-900/20 p-6">
            <h1 className="text-lg font-bold text-red-400">Bir hata oluştu</h1>
            <pre className="mt-2 whitespace-pre-wrap text-sm text-red-300">
              {this.state.error.message}
            </pre>
            <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-xs text-red-400/70">
              {this.state.error.stack}
            </pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  const { user, loading, initialize } = useAuthStore();
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    initialize().catch((err: Error) => {
      console.error('Auth init failed:', err);
    });
  }, [initialize]);

  useEffect(() => {
    if (!loading && !user) setAuthOpen(true);
    else setAuthOpen(false);
  }, [loading, user]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-950">
        <p className="text-neutral-400">Yükleniyor...</p>
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

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
