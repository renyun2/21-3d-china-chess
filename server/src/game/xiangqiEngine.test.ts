import { describe, expect, it } from 'vitest';
import { createEngine } from './xiangqiEngine.js';

describe('xiangqiEngine', () => {
  it('starts with red to move', () => {
    const engine = createEngine();
    expect(engine.turn()).toBe('red');
    expect(engine.legalMoves().length).toBeGreaterThan(0);
  });

  it('rejects illegal move', () => {
    const engine = createEngine();
    const result = engine.move('a0a9' as never);
    expect(result.ok).toBe(false);
  });
});
