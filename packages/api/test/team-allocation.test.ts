import { describe, expect, it } from 'vitest';
import {
  allocateTeam,
  getAvailableNations,
  WORLD_CUP_NATIONS,
} from '../src/services/team-allocation';

describe('team-allocation', () => {
  describe('WORLD_CUP_NATIONS', () => {
    it('should contain exactly 48 nations', () => {
      expect(WORLD_CUP_NATIONS).toHaveLength(48);
    });

    it('should have no duplicates', () => {
      const unique = new Set(WORLD_CUP_NATIONS);
      expect(unique.size).toBe(48);
    });
  });

  describe('allocateTeam', () => {
    it('should assign a nation to a player', () => {
      const result = allocateTeam(['Brazil', 'Argentina'], new Map());
      expect(result).not.toBeNull();
      // biome-ignore lint/style/noNonNullAssertion: safe after null check above
      expect(result!.nation).toBeTruthy();
      // biome-ignore lint/style/noNonNullAssertion: safe after null check above
      expect(['Brazil', 'Argentina']).toContain(result!.nation);
    });

    it('should remove assigned nation from available pool', () => {
      const available = ['Brazil'];
      const assigned = new Map<string, string>();
      const result = allocateTeam(available, assigned);
      // biome-ignore lint/style/noNonNullAssertion: safe since we pass a non-empty list
      expect(result!.nation).toBe('Brazil');
      // biome-ignore lint/style/noNonNullAssertion: safe since we pass a non-empty list
      expect(assigned.get(result!.playerId)).toBeUndefined(); // assigned map not mutated
    });

    it('should return null when no nations available', () => {
      const result = allocateTeam([], new Map());
      expect(result).toBeNull();
    });
  });

  describe('getAvailableNations', () => {
    it('should return unassigned nations', () => {
      const assigned = new Map<string, string>();
      assigned.set('player-1', 'Brazil');
      assigned.set('player-2', 'Argentina');
      const available = getAvailableNations(assigned);
      expect(available).not.toContain('Brazil');
      expect(available).not.toContain('Argentina');
      expect(available).toHaveLength(46);
    });
  });
});
