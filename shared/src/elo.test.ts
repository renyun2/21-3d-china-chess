import { describe, expect, it } from 'vitest';
import { expectedScore, kFactor, matchmakingCompatible, nextRating } from './elo.js';

describe('elo', () => {
  it('computes expected score symmetrically', () => {
    const a = expectedScore(1500, 1500);
    expect(a).toBeCloseTo(0.5, 5);
    expect(expectedScore(1600, 1400) + expectedScore(1400, 1600)).toBeCloseTo(1, 5);
  });

  it('updates rating after win', () => {
    const after = nextRating(1500, 1500, 1);
    expect(after).toBe(1516);
    expect(kFactor(1500)).toBe(32);
  });

  it('expands matchmaking window over time', () => {
    expect(matchmakingCompatible(1500, 1600, 0)).toBe(true);
    expect(matchmakingCompatible(1500, 1900, 0)).toBe(false);
    expect(matchmakingCompatible(1500, 1900, 60000)).toBe(true);
  });
});
