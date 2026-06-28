import { Download, Flag, Trophy } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import html2canvas from 'html2canvas';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';
import { type Match, useMatchStore } from '@/stores/matches';

interface Player {
  id: string;
  username: string;
  selected_team: string | null;
  avatar_url: string | null;
}

const AVATARS: Record<string, string> = {
  lion: '🦁', eagle: '🦅', wolf: '🐺', dragon: '🐉', shark: '🦈', tiger: '🐯',
  bull: '🐂', falcon: '🦅', panther: '🐆', gorilla: '🦍', cobra: '🐍', rhino: '🦏',
};

function MatchCard({ match, players, compact }: { match: Match; players: Map<string, Player>; compact?: boolean }) {
  const home = players.get(match.home_player_id);
  const away = players.get(match.away_player_id);
  const homeScore = match.home_score ?? 0;
  const awayScore = match.away_score ?? 0;
  const homeWin = match.is_played && homeScore > awayScore;
  const awayWin = match.is_played && awayScore > homeScore;
  const homeAvatar = home?.avatar_url ? AVATARS[home.avatar_url] || '👤' : '👤';
  const awayAvatar = away?.avatar_url ? AVATARS[away.avatar_url] || '👤' : '👤';

  return (
    <div
      className={cn(
        'rounded-xl border transition-all',
        compact ? 'px-3 py-2' : 'p-4',
        match.is_played
          ? 'bg-surface/30 border-border/50'
          : 'bg-surface border-border',
      )}
    >
      <div className={cn('flex items-center', compact ? 'gap-2' : 'gap-4')}>
        {/* Home */}
        <div className="flex flex-1 items-center justify-end gap-2 min-w-0">
          <div className="text-right min-w-0">
            <p
              className={cn(
                'truncate font-semibold',
                compact ? 'text-xs' : 'text-sm',
                homeWin ? 'text-gold' : 'text-chalk',
              )}
            >
              {home?.username || match.home_player_id.slice(0, 8)}
              {home?.selected_team && (
                <span className="text-chalk-muted ml-1">({home.selected_team})</span>
              )}
            </p>
          </div>
          <span className={cn('flex-shrink-0', compact ? 'text-base' : 'text-xl')}>{homeAvatar}</span>
        </div>

        {/* Score */}
        <div className="flex flex-col items-center flex-shrink-0" style={{ minWidth: compact ? 50 : 80 }}>
          {match.is_played ? (
            <span className={cn('font-mono font-bold tabular-nums', compact ? 'text-base' : 'text-2xl')}>
              <span className={homeWin ? 'text-gold' : 'text-chalk'}>{homeScore}</span>
              <span className="text-chalk-muted/40 mx-1">–</span>
              <span className={awayWin ? 'text-gold' : 'text-chalk'}>{awayScore}</span>
            </span>
          ) : (
            <span className={cn('font-display tracking-widest text-chalk-muted/50', compact ? 'text-[10px]' : 'text-sm')}>VS</span>
          )}
          {match.is_played && (
            <span className={cn('text-[10px] font-medium', match.is_forfeit ? 'text-red-card' : 'text-grass')}>
              {match.is_forfeit ? 'H' : compact ? '' : '✓'}
            </span>
          )}
        </div>

        {/* Away */}
        <div className="flex flex-1 items-center gap-2 min-w-0">
          <span className={cn('flex-shrink-0', compact ? 'text-base' : 'text-xl')}>{awayAvatar}</span>
          <div className="min-w-0">
            <p
              className={cn(
                'truncate font-semibold',
                compact ? 'text-xs' : 'text-sm',
                awayWin ? 'text-gold' : 'text-chalk',
              )}
            >
              {away?.username || match.away_player_id.slice(0, 8)}
              {away?.selected_team && (
                <span className="text-chalk-muted ml-1">({away.selected_team})</span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Fixtures() {
  const { matches, fetchMatches } = useMatchStore();
  const [players, setPlayers] = useState<Map<string, Player>>(new Map());
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  useEffect(() => {
    apiFetch<Player[]>('/api/players')
      .then((data) => {
        const map = new Map<string, Player>();
        for (const p of data) map.set(p.id, p);
        setPlayers(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const rounds = useMemo(() => {
    const map = new Map<number, Match[]>();
    for (const m of matches) {
      const round = m.round_number || 0;
      if (!map.has(round)) map.set(round, []);
      map.get(round)?.push(m);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a - b);
  }, [matches]);

  const leagueRounds = rounds.filter(([, ms]) => ms.some((m) => m.stage === 'LEAGUE'));
  const playoffMatches = matches.filter((m) => m.stage === 'PLAYOFF');

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // Build a clean full-width export div
      const exportDiv = document.createElement('div');
      exportDiv.style.cssText =
        'position:fixed;left:-9999px;top:0;width:1600px;padding:48px;background:#0a0a0b;color:#e5e5e5;font-family:Inter,sans-serif;z-index:99999;';

      const total = matches.length;
      const played = matches.filter((m) => m.is_played).length;

      let html = `
        <div style="text-align:center;margin-bottom:32px">
          <h1 style="font-size:28px;font-weight:800;letter-spacing:2px;color:#f5c44b;margin:0">VIG FIFA — Fikstür</h1>
          <p style="font-size:14px;color:#888;margin:8px 0 0">${total} maç · ${leagueRounds.length} round · ${played} oynandı</p>
        </div>
      `;

      for (const [round, roundMatches] of leagueRounds) {
        const p = roundMatches.filter((m) => m.is_played).length;
        html += `
          <div style="margin-bottom:24px;border:1px solid #222;border-radius:12px;padding:20px;background:#111">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
              <span style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:8px;background:#f5c44b15;font-size:16px;font-weight:700;color:#f5c44b">${round}</span>
              <h2 style="font-size:18px;font-weight:700;letter-spacing:1px;color:#e5e5e5;margin:0">Round ${round}</h2>
              <span style="font-size:12px;color:#666">${p}/${roundMatches.length} oynandı</span>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      `;

        for (const m of roundMatches) {
          const home = players.get(m.home_player_id);
          const away = players.get(m.away_player_id);
          const hName = home?.username || m.home_player_id.slice(0, 8);
          const aName = away?.username || m.away_player_id.slice(0, 8);
          const hTeam = home?.selected_team ? ` (${home.selected_team})` : '';
          const aTeam = away?.selected_team ? ` (${away.selected_team})` : '';
          const hEmoji = home?.avatar_url ? AVATARS[home.avatar_url] || '👤' : '👤';
          const aEmoji = away?.avatar_url ? AVATARS[away.avatar_url] || '👤' : '👤';

          const scoreHtml = m.is_played
            ? `<span style="font-size:18px;font-weight:700;color:${m.home_score! > m.away_score! ? '#f5c44b' : '#e5e5e5'}">${m.home_score}</span>
               <span style="color:#555;margin:0 4px">–</span>
               <span style="font-size:18px;font-weight:700;color:${m.away_score! > m.home_score! ? '#f5c44b' : '#e5e5e5'}">${m.away_score}</span>`
            : '<span style="font-size:11px;color:#555;letter-spacing:3px">VS</span>';

          const statusBadge = m.is_played
            ? m.is_forfeit
              ? '<span style="font-size:9px;color:#f87171;background:#f8717115;padding:1px 6px;border-radius:4px">Hükmen</span>'
              : '<span style="font-size:9px;color:#4ade80;background:#4ade8015;padding:1px 6px;border-radius:4px">✓</span>'
            : '';

          html += `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border:1px solid #1a1a1a;border-radius:8px;background:#0d0d0d">
              <div style="display:flex;align-items:center;gap:10px;flex:1.5;justify-content:flex-end;min-width:0">
                <span style="font-size:14px;font-weight:600;white-space:nowrap;max-width:250px;overflow:hidden;text-overflow:ellipsis">${hName}<span style="color:#888;font-weight:400">${hTeam}</span></span>
                <span style="font-size:20px;flex-shrink:0">${hEmoji}</span>
              </div>
              <div style="display:flex;align-items:center;justify-content:center;min-width:100px;padding:0 16px">${scoreHtml}${statusBadge}</div>
              <div style="display:flex;align-items:center;gap:10px;flex:1.5;min-width:0">
                <span style="font-size:20px;flex-shrink:0">${aEmoji}</span>
                <span style="font-size:14px;font-weight:600;white-space:nowrap;max-width:250px;overflow:hidden;text-overflow:ellipsis">${aName}<span style="color:#888;font-weight:400">${aTeam}</span></span>
              </div>
            </div>
          `;
        }
        html += '</div></div>';
      }

      if (playoffMatches.length > 0) {
        html +=
          '<div style="margin-bottom:24px;border:1px solid #f5c44b20;border-radius:12px;padding:20px;background:#111">';
        html +=
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:16px"><span style="font-size:20px">🏆</span><h2 style="font-size:18px;font-weight:700;color:#f5c44b;margin:0">Playoff</h2></div>';
        html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
        for (const m of playoffMatches) {
          const home = players.get(m.home_player_id);
          const away = players.get(m.away_player_id);
          html += `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border:1px solid #1a1a1a;border-radius:8px;background:#0d0d0d">
              <span style="font-size:13px;font-weight:600">${home?.username || m.home_player_id.slice(0, 8)}</span>
              <span style="font-weight:700;color:${m.is_played ? '#f5c44b' : '#555'}">${m.is_played ? `${m.home_score}–${m.away_score}` : 'VS'}</span>
              <span style="font-size:13px;font-weight:600">${away?.username || m.away_player_id.slice(0, 8)}</span>
            </div>
          `;
        }
        html += '</div></div>';
      }

      exportDiv.innerHTML = html;
      document.body.appendChild(exportDiv);

      const canvas = await html2canvas(exportDiv, {
        backgroundColor: '#0a0a0b',
        scale: 2,
      });
      document.body.removeChild(exportDiv);

      const link = document.createElement('a');
      link.download = 'VIG-Fikstur.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('Download failed:', e);
    }
    setDownloading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-chalk-muted/20 border-t-gold" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-6 py-12 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <Flag className="mx-auto mb-3 h-8 w-8 text-gold" />
        <h1 className="section-title">Fikstür & Sonuçlar</h1>
        <p className="mt-2 text-sm text-chalk-muted">
          {matches.length} maç · {leagueRounds.length} round · {playoffMatches.length} playoff
        </p>
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-gold/40 bg-surface px-4 py-2 text-sm font-medium text-gold hover:bg-gold/10 disabled:opacity-50 transition-all"
        >
          <Download className="h-4 w-4" />
          {downloading ? 'Hazırlanıyor...' : 'Fikstürü PNG İndir'}
        </button>
      </div>

      {/* League rounds — always open */}
      {leagueRounds.map(([round, roundMatches]) => (
        <div key={round} className="card">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10 font-mono text-sm font-bold text-gold">
              {round}
            </span>
            <h2 className="font-display text-xl tracking-wide text-chalk">Round {round}</h2>
            <span className="text-xs text-chalk-muted">
              {roundMatches.filter((m) => m.is_played).length}/{roundMatches.length} oynandı
            </span>
          </div>
          <div className="space-y-2.5">
            {roundMatches.map((m) => (
              <MatchCard key={m.id} match={m} players={players} />
            ))}
          </div>
        </div>
      ))}

      {/* Playoff */}
      {playoffMatches.length > 0 && (
        <div className="card border-gold/30">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="h-5 w-5 text-gold" />
            <h2 className="font-display text-xl tracking-wide text-chalk">Playoff</h2>
          </div>
          <div className="space-y-2.5">
            {playoffMatches.map((m) => (
              <MatchCard key={m.id} match={m} players={players} />
            ))}
          </div>
        </div>
      )}

      {/* Empty */}
      {matches.length === 0 && (
        <div className="card py-16 text-center">
          <Flag className="mx-auto mb-4 h-12 w-12 text-chalk-muted/30" />
          <p className="text-lg text-chalk-muted">Henüz fikstür oluşturulmadı.</p>
          <p className="mt-1 text-sm text-chalk-muted/60">
            Admin turnuvayı başlattığında maçlar burada görünecek.
          </p>
        </div>
      )}
    </div>
  );
}
