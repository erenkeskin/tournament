import { Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface Player {
  id: string;
  username: string;
  avatar_url: string | null;
  selected_team: string | null;
}

interface Match {
  id: string;
  stage: string;
  home_player_id: string;
  away_player_id: string;
  home_score: number | null;
  away_score: number | null;
  is_played: boolean;
  playoff_metadata: { round?: string } | null;
}

const AVATARS: Record<string, string> = {
  lion: '🦁',
  eagle: '🦅',
  wolf: '🐺',
  dragon: '🐉',
  shark: '🦈',
  tiger: '🐯',
  bull: '🐂',
  falcon: '🦅',
  panther: '🐆',
  gorilla: '🦍',
  cobra: '🐍',
  rhino: '🦏',
};

function PlayerNode({
  player,
  winner,
}: {
  player: {
    id: string;
    username: string;
    avatar_url: string | null;
    selected_team: string | null;
  } | null;
  winner?: boolean;
}) {
  if (!player) {
    return (
      <div className="flex items-center gap-3 rounded-xl border-2 border-dashed border-border/50 bg-surface/30 px-4 py-3 opacity-40">
        <span className="text-chalk-muted text-sm">TBD</span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 transition-all ${
        winner ? 'border-gold bg-gold/5' : 'border-border bg-surface'
      }`}
    >
      <span className="text-2xl">{AVATARS[player.avatar_url || ''] || '👤'}</span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-chalk">{player.username}</p>
        {player.selected_team && <p className="text-xs text-chalk-muted">{player.selected_team}</p>}
      </div>
    </div>
  );
}

function MatchNode({ match, players }: { match: Match; players: Map<string, Player> }) {
  const home = players.get(match.home_player_id) || null;
  const away = players.get(match.away_player_id) || null;

  const homeWon = match.is_played && (match.home_score || 0) > (match.away_score || 0);
  const awayWon = match.is_played && (match.away_score || 0) > (match.home_score || 0);

  return (
    <div className="flex flex-col gap-2">
      <PlayerNode player={home} winner={homeWon} />
      <div className="flex items-center gap-3 pl-4">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-border text-xs font-bold text-chalk-muted">
          VS
        </div>
        {match.is_played ? (
          <span className="font-mono text-lg font-bold text-chalk tabular-nums">
            {match.home_score} — {match.away_score}
          </span>
        ) : (
          <span className="text-xs text-chalk-muted">Bekliyor</span>
        )}
      </div>
      <PlayerNode player={away} winner={awayWon} />
    </div>
  );
}

export function TournamentTree() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Map<string, Player>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([apiFetch<Player[]>('/api/players'), apiFetch<Match[]>('/api/matches')])
      .then(([p, m]) => {
        const map = new Map<string, Player>();
        for (const player of p) map.set(player.id, player);
        setPlayers(map);
        setMatches((m as Match[]).filter((match) => match.stage === 'PLAYOFF'));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-chalk-muted animate-pulse">Yükleniyor...</p>
      </div>
    );
  }

  const semi1 = matches.find((m) => m.playoff_metadata?.round === 'SEMI_1');
  const semi2 = matches.find((m) => m.playoff_metadata?.round === 'SEMI_2');

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-10 text-center">
        <Trophy className="mx-auto mb-3 h-10 w-10 text-gold" />
        <h1 className="section-title">Turnuva Ağacı</h1>
        <p className="mt-2 text-chalk-muted">Playoff Bracket</p>
      </div>

      {!semi1 && !semi2 ? (
        <div className="card text-center py-16">
          <p className="text-chalk-muted text-lg">Playoff henüz başlamadı.</p>
          <p className="text-chalk-muted/60 text-sm mt-2">
            Lig aşaması tamamlanınca admin playoff'u oluşturacak.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-center lg:gap-16">
          {/* Semi 1 */}
          <div className="flex-1 animate-slide-up">
            <span className="mb-3 block text-center font-mono text-xs font-bold uppercase tracking-widest text-chalk-muted">
              Yarı Final 1
            </span>
            {semi1 && <MatchNode match={semi1} players={players} />}
          </div>

          {/* Final */}
          <div
            className="flex flex-col items-center gap-4 lg:flex-shrink-0 animate-fade-in"
            style={{ animationDelay: '0.3s' }}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/10 border-2 border-gold">
              <Trophy className="h-7 w-7 text-gold" />
            </div>
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-gold">
              Final
            </span>
          </div>

          {/* Semi 2 */}
          <div className="flex-1 animate-slide-up" style={{ animationDelay: '0.15s' }}>
            <span className="mb-3 block text-center font-mono text-xs font-bold uppercase tracking-widest text-chalk-muted">
              Yarı Final 2
            </span>
            {semi2 && <MatchNode match={semi2} players={players} />}
          </div>
        </div>
      )}

      {/* League standings mini */}
      {matches.length === 0 && (
        <div className="card mt-8">
          <h3 className="mb-4 font-body text-sm font-semibold text-chalk-muted uppercase tracking-wider">
            Lig Sıralaması
          </h3>
          <p className="text-sm text-chalk-muted">
            Lig maçları devam ederken puan durumunu Dashboard sayfasından takip edebilirsin.
          </p>
        </div>
      )}
    </div>
  );
}
