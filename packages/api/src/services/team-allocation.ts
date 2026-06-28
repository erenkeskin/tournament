export const WORLD_CUP_NATIONS: string[] = [
  'France',
  'England',
  'Spain',
  'Portugal',
  'Germany',
  'Brazil',
  'Argentina',
  'Netherlands',
  'Norway',
  'Belgium',
  'Ivory Coast',
  'Senegal',
  'Morocco',
  'Sweden',
  'Croatia',
  'United States',
  'Ecuador',
  'Switzerland',
  'Colombia',
  'Japan',
  'Algeria',
  'Austria',
  'Ghana',
  'Canada',
  'Mexico',
  'Paraguay',
  'Bosnia & Herzegovina',
  'DR Congo',
  'Egypt',
  'Australia',
  'Cape Verde',
  'South Africa',
  'Turkey',
  'Uruguay',
  'Czech Republic',
  'Scotland',
  'South Korea',
  'Uzbekistan',
  'Tunisia',
  'Haiti',
  'Saudi Arabia',
  'Panama',
  'New Zealand',
  'Iran',
  'Curaçao',
  'Iraq',
  'Jordan',
  'Qatar',
];

export interface AllocationResult {
  playerId: string;
  nation: string;
}

export function getAvailableNations(assigned: Map<string, string>): string[] {
  const assignedNations = new Set(assigned.values());
  return WORLD_CUP_NATIONS.filter((n) => !assignedNations.has(n));
}

export function allocateTeam(
  availableNations: string[],
  _assigned: Map<string, string>,
): AllocationResult | null {
  if (availableNations.length === 0) {
    return null;
  }
  const index = Math.floor(Math.random() * availableNations.length);
  const nation = availableNations[index] as string;
  const playerId = `player-${crypto.randomUUID()}`;
  return { playerId, nation };
}
