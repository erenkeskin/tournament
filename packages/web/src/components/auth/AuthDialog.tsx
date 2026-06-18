import { type FormEvent, useState } from 'react';
import { useAuthStore } from '@/stores/auth';

export function AuthDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const { signIn, signUp } = useAuthStore();

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (mode === 'signin') await signIn(email, password);
      else await signUp(email, password, username);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Auth failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-pitch/80 backdrop-blur-sm animate-fade-in">
      <div className="card w-96 border-border-light animate-slide-up">
        <h2 className="mb-6 font-display text-2xl tracking-wide text-chalk">
          {mode === 'signin' ? 'Giriş Yap' : 'Kayıt Ol'}
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === 'signup' && (
            <input
              type="text"
              placeholder="Kullanıcı adı"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input"
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            required
          />
          <input
            type="password"
            placeholder="Şifre"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            required
          />
          {error && (
            <p className="rounded-lg bg-red-card/10 px-3 py-2 text-sm text-red-card">{error}</p>
          )}
          <button type="submit" className="btn-primary">
            {mode === 'signin' ? 'Giriş' : 'Kayıt'}
          </button>
        </form>
        <button
          type="button"
          onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          className="btn-ghost mt-3 w-full"
        >
          {mode === 'signin' ? 'Hesabın yok mu? Kayıt ol' : 'Hesabın var mı? Giriş yap'}
        </button>
      </div>
    </div>
  );
}
