import type { MatchmakingTicket, TimeControlPreset } from '@xq/shared';
import { matchmakingCompatible } from '@xq/shared';

const queue = new Map<string, MatchmakingTicket>();

export function enqueue(userId: string, elo: number, timeControl: TimeControlPreset): number {
  queue.set(userId, { userId, elo, timeControl, enqueuedAt: Date.now() });
  return queue.size;
}

export function dequeue(userId: string): void {
  queue.delete(userId);
}

export function tryMatch(userId: string): string | null {
  const self = queue.get(userId);
  if (!self) return null;

  const waitMs = Date.now() - self.enqueuedAt;
  for (const [otherId, other] of queue) {
    if (otherId === userId) continue;
    if (other.timeControl !== self.timeControl) continue;
    if (!matchmakingCompatible(self.elo, other.elo, waitMs)) continue;
    queue.delete(userId);
    queue.delete(otherId);
    return otherId;
  }
  return null;
}

export function queuePosition(userId: string): number {
  const entries = [...queue.keys()];
  return entries.indexOf(userId) + 1;
}

export function clearQueue(): void {
  queue.clear();
}
