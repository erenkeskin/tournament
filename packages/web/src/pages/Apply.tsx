import { ArrowRight, Check, Clock, Trophy, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';

interface Avatar {
  id: string;
  label: string;
  emoji: string;
  color: string;
}

const STATUS_CONFIG: Record<
  string,
  { icon: React.FC<{ className?: string }>; label: string; className: string }
> = {
  APPROVED: { icon: Check, label: 'Onaylandı — Turnuvadasın!', className: 'badge-green' },
  REJECTED: { icon: XCircle, label: 'Reddedildi', className: 'badge-red' },
  PENDING: { icon: Clock, label: 'Admin onayı bekleniyor...', className: 'badge-gold' },
};

export function Apply() {
  const navigate = useNavigate();
  const { user, profile, initialize } = useAuthStore();
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(profile?.tournament_status || 'PENDING');

  useEffect(() => {
    supabase
      .from('avatars')
      .select('*')
      .then(({ data }) => {
        if (data) setAvatars(data as Avatar[]);
      });
    // Refresh profile
    initialize();
  }, [
    // Refresh profile
    initialize,
  ]);

  useEffect(() => {
    if (profile?.tournament_status) setStatus(profile.tournament_status);
  }, [profile]);

  const handleApply = async () => {
    if (!selectedAvatar || !user) return;
    setSubmitting(true);
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: selectedAvatar, tournament_status: 'PENDING' })
      .eq('id', user.id);

    if (!error) {
      setStatus('PENDING');
      await initialize();
    }
    setSubmitting(false);
  };

  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  const StatusIcon = statusCfg.icon;
  const isApplied = status !== 'PENDING' || profile?.avatar_url;

  return (
    <div className="mx-auto max-w-2xl px-6 py-20">
      {/* Header */}
      <div className="mb-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gold/10">
          <Trophy className="h-8 w-8 text-gold" />
        </div>
        <h1 className="section-title">Turnuvaya Başvur</h1>
        <p className="mt-2 text-chalk-muted">
          {isApplied ? 'Başvuru durumun' : 'Avatarını seç ve turnuvaya katıl'}
        </p>
      </div>

      {/* Status */}
      {isApplied && (
        <div className="card mb-8 flex items-center gap-4">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full ${
              status === 'APPROVED'
                ? 'bg-grass/15'
                : status === 'REJECTED'
                  ? 'bg-red-card/15'
                  : 'bg-gold/15'
            }`}
          >
            <StatusIcon
              className={`h-6 w-6 ${
                status === 'APPROVED'
                  ? 'text-grass'
                  : status === 'REJECTED'
                    ? 'text-red-card'
                    : 'text-gold'
              }`}
            />
          </div>
          <div className="flex-1">
            <p className="font-body text-lg font-semibold text-chalk">{statusCfg.label}</p>
            {profile?.selected_team && (
              <p className="text-sm text-chalk-muted">
                Takımın: <span className="text-gold">{profile.selected_team}</span>
              </p>
            )}
          </div>
          {status === 'APPROVED' && (
            <button type="button" onClick={() => navigate('/dashboard')} className="btn-primary">
              Dashboard <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Avatar grid */}
      {!isApplied && (
        <>
          <h2 className="mb-4 font-body text-sm font-medium uppercase tracking-wider text-chalk-muted">
            Avatar Seç
          </h2>
          <div className="mb-8 grid grid-cols-4 gap-3 sm:grid-cols-6">
            {avatars.map((a) => (
              <button
                type="button"
                key={a.id}
                onClick={() => setSelectedAvatar(a.id)}
                className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all duration-200 ${
                  selectedAvatar === a.id
                    ? 'border-gold bg-gold/10 scale-105'
                    : 'border-border bg-surface hover:border-border-light hover:bg-surface-hover'
                }`}
              >
                <span className="text-3xl">{a.emoji}</span>
                <span className="text-xs font-medium text-chalk-muted">{a.label}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleApply}
            disabled={!selectedAvatar || submitting}
            className="btn-primary w-full text-lg"
          >
            {submitting ? 'Başvuruluyor...' : 'Turnuvaya Başvur'}
            <ArrowRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Already applied but not this session */}
      {isApplied && status === 'PENDING' && (
        <div className="card text-center">
          <p className="text-chalk-muted">
            Admin başvurunu onayladığında otomatik olarak turnuvaya katılacaksın.
          </p>
        </div>
      )}
    </div>
  );
}
