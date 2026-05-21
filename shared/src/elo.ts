/**
 * Elo 评分：标准国际象棋 Elo，K=32（新手）/ K=16（高分段）
 * 适用于中国象棋在线积分；预期胜率 E = 1 / (1 + 10^((Rb-Ra)/400))
 */
export function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + 10 ** ((ratingB - ratingA) / 400));
}

export function kFactor(rating: number): number {
  return rating < 2100 ? 32 : 16;
}

export type Score = 1 | 0.5 | 0;

export function nextRating(
  current: number,
  opponent: number,
  score: Score,
): number {
  const expected = expectedScore(current, opponent);
  const k = kFactor(current);
  return Math.round(current + k * (score - expected));
}

export function eloRangeFor(rating: number, window = 200): [number, number] {
  return [Math.max(400, rating - window), rating + window];
}

export function matchmakingCompatible(
  a: number,
  b: number,
  waitMs: number,
  baseWindow = 200,
): boolean {
  const expanded = baseWindow + Math.floor(waitMs / 5000) * 50;
  const [minA, maxA] = eloRangeFor(a, expanded);
  return b >= minA && b <= maxA;
}
