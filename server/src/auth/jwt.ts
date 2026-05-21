import jwt from 'jsonwebtoken';
import type { AuthTokenPayload } from '@xq/shared';
import { config } from '../config.js';

export function signToken(payload: Omit<AuthTokenPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' });
}

export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, config.jwtSecret) as AuthTokenPayload;
  } catch {
    return null;
  }
}
