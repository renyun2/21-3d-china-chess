import { describe, expect, it } from 'vitest';
import { signToken, verifyToken } from './jwt.js';

describe('jwt', () => {
  it('signs and verifies payload', () => {
    const token = signToken({ sub: 'u1', username: 'alice' });
    const payload = verifyToken(token);
    expect(payload?.sub).toBe('u1');
    expect(payload?.username).toBe('alice');
  });

  it('rejects invalid token', () => {
    expect(verifyToken('bad.token.here')).toBeNull();
  });
});
