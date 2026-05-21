import { describe, expect, it } from 'vitest';
import { legalTargetsFromFen, piecesFromFen } from './fen';
import { START_FEN } from '@xq/shared';

describe('fen helpers', () => {
  it('parses starting position pieces', () => {
    const pieces = piecesFromFen(START_FEN);
    expect(pieces.length).toBe(32);
  });

  it('finds pawn moves from starting position', () => {
    const targets = legalTargetsFromFen(START_FEN, 'b0');
    expect(targets.length).toBeGreaterThan(0);
  });
});
