import { Component, type ReactNode, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { PublicLayout } from './components/layout/PublicLayout';
import { Admin } from './pages/Admin';
import { Apply } from './pages/Apply';
import { Betting } from './pages/Betting';
import { Dashboard } from './pages/Dashboard';
import { Fixtures } from './pages/Fixtures';
import { Landing } from './pages/Landing';
import { LiveDraw } from './pages/LiveDraw';
import { TournamentTree } from './pages/TournamentTree';
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
        <div className="flex min-h-screen items-center justify-center bg-pitch p-10">
          <div className="card max-w-lg border-red-card/30">
            <h1 className="mb-2 font-display text-2xl text-red-card">Hata</h1>
            <pre className="whitespace-pre-wrap text-sm text-chalk-muted">
              {this.state.error.message}
            </pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  const { loading, initialize } = useAuthStore();

  useEffect(() => {
    initialize().catch((err: Error) => console.error('Auth init failed:', err));
  }, [initialize]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-pitch">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-chalk-muted/20 border-t-gold" />
          <p className="font-body text-sm text-chalk-muted">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* PUBLIC — Landing aesthetic for everyone */}
      <Route element={<PublicLayout />}>
        <Route index element={<Landing />} />
        <Route path="fixtures" element={<Fixtures />} />
        <Route path="tree" element={<TournamentTree />} />
        <Route path="apply" element={<Apply />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="betting" element={<Betting />} />
      </Route>

      {/* ADMIN ONLY — Sidebar layout */}
      <Route element={<Layout />}>
        <Route path="draw" element={<LiveDraw />} />
        <Route path="admin" element={<Admin />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
