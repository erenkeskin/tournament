import type { Match, RedCard } from '../db/schema';

export function getNextMatchForPlayer(playerId: string, matches: Match[]): Match | null {
  const upcoming = matches
    .filter((m) => !m.is_played && (m.home_player_id === playerId || m.away_player_id === playerId))
    .sort((a, b) => (a.round_number || 0) - (b.round_number || 0));
  return upcoming[0] || null;
}

export function getSuspendedPlayers(
  redCards: RedCard[],
  matches: Match[],
  targetMatchId: string,
): Set<string> {
  const suspended = new Set<string>();

  for (const card of redCards) {
    if (card.served_in_match_id) continue;

    const nextMatch = getNextMatchForPlayer(card.player_id, matches);
    if (nextMatch && nextMatch.id === targetMatchId) {
      suspended.add(card.player_id);
    }
  }

  return suspended;
}

export function validateLineup(playerId: string, suspendedPlayers: Set<string>): boolean {
  return !suspendedPlayers.has(playerId);
}
