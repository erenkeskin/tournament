import { ArrowRight, ChevronDown, Coins, Swords, Trophy, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';

function StatCounter({
  end,
  label,
  icon: Icon,
  suffix = '',
}: {
  end: number;
  label: string;
  icon: React.FC<{ className?: string }>;
  suffix?: string;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const step = Math.ceil(end / (duration / 30));
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else setCount(start);
    }, 30);
    return () => clearInterval(timer);
  }, [end]);

  return (
    <div className="flex flex-col items-center gap-2 p-6 animate-fade-in">
      <Icon className="h-6 w-6 text-gold" />
      <span className="font-mono text-4xl font-bold text-chalk tabular-nums">
        {count}
        {suffix}
      </span>
      <span className="text-sm text-chalk-muted">{label}</span>
    </div>
  );
}

export function Landing() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stats, setStats] = useState({ players: 0, matches: 0 });

  useEffect(() => {
    apiFetch<{ length: number }>('/api/players')
      .then((d) => setStats((s) => ({ ...s, players: d.length })))
      .catch(() => {});
    apiFetch<{ length: number }>('/api/matches')
      .then((d) => setStats((s) => ({ ...s, matches: d.length })))
      .catch(() => {});
  }, []);

  const handleCTA = () => {
    if (user) navigate('/dashboard');
    else navigate('/apply');
  };

  return (
    <div className="min-h-screen bg-pitch">
      {/* Hero */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-20">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,168,67,0.08)_0%,transparent_70%)]" />

        {/* Trophy icon with pulse */}
        <div className="relative mb-8 animate-fade-in">
          <div className="absolute inset-0 animate-pulse-gold rounded-full" />
          <div className="relative flex h-28 w-28 items-center justify-center rounded-full border-2 border-gold/30 bg-gold/5">
            <Trophy className="h-14 w-14 text-gold" />
          </div>
        </div>

        {/* Title */}
        <h1 className="animate-slide-up font-display text-7xl tracking-wider text-chalk sm:text-8xl">
          VIG FIFA
        </h1>
        <p
          className="mt-4 animate-slide-up text-lg text-chalk-muted"
          style={{ animationDelay: '0.1s' }}
        >
          Kurumsal Turnuva & Bahis Platformu
        </p>

        {/* CTA */}
        <button
          type="button"
          onClick={handleCTA}
          className="btn-primary group mt-10 animate-slide-up text-lg"
          style={{ animationDelay: '0.2s' }}
        >
          {user ? 'Turnuvaya Git' : 'Turnuvaya Başvur'}
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </button>

        {/* Scroll hint */}
        <div
          className="mt-16 animate-fade-in text-chalk-muted/50"
          style={{ animationDelay: '0.6s' }}
        >
          <ChevronDown className="h-6 w-6 animate-bounce" />
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-3xl px-6 pb-32">
        <div className="card grid grid-cols-3 divide-x divide-border">
          <StatCounter end={stats.players} label="Oyuncu" icon={Users} />
          <StatCounter end={stats.matches} label="Maç" icon={Swords} />
          <StatCounter end={1000} label="Başlangıç VP" icon={Coins} suffix=" VP" />
        </div>
      </section>

      {/* How It Works */}
      <section className="mx-auto max-w-4xl px-6 pb-32">
        <h2 className="section-title mb-12 text-center">Nasıl Çalışır?</h2>
        <div className="grid gap-6 sm:grid-cols-4">
          {[
            { step: '01', title: 'Başvur', desc: 'Avatarını seç, turnuvaya katıl.' },
            { step: '02', title: 'Onay', desc: 'Admin başvurunu onaylar.' },
            { step: '03', title: 'Takım Al', desc: 'Çarktan 48 ülkeden biri senin.' },
            { step: '04', title: 'Yarış', desc: 'Maçları oyna, bahis yap, kazan.' },
          ].map((item, i) => (
            <div
              key={item.step}
              className="card-hover text-center animate-slide-up"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <span className="font-mono text-4xl font-bold text-gold/30">{item.step}</span>
              <h3 className="mt-3 font-body text-lg font-semibold text-chalk">{item.title}</h3>
              <p className="mt-2 text-sm text-chalk-muted">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* "Eyyam" warning */}
      <footer className="border-t border-border py-8 text-center">
        <p className="font-mono text-sm text-amber-400/60">⚠ Eyyam tamamiyle yasaktır!</p>
      </footer>
    </div>
  );
}
