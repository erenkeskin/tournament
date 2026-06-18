export const WORLD_CUP_NATIONS: string[] = [
  'Argentina',
  'Australia',
  'Austria',
  'Belgium',
  'Brazil',
  'Cameroon',
  'Canada',
  'Chile',
  'China',
  'Colombia',
  'Costa Rica',
  'Croatia',
  'Denmark',
  'Ecuador',
  'Egypt',
  'England',
  'France',
  'Germany',
  'Ghana',
  'Iran',
  'Iraq',
  'Italy',
  'Japan',
  'Korea Republic',
  'Mali',
  'Mexico',
  'Morocco',
  'Netherlands',
  'New Zealand',
  'Nigeria',
  'Norway',
  'Paraguay',
  'Peru',
  'Poland',
  'Portugal',
  'Qatar',
  'Romania',
  'Saudi Arabia',
  'Senegal',
  'Serbia',
  'South Africa',
  'Spain',
  'Sweden',
  'Switzerland',
  'Turkey',
  'Ukraine',
  'United States',
  'Uruguay',
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
