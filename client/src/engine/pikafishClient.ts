export type EngineRequest =
  | { type: 'init' }
  | { type: 'position'; fen: string; moves?: string[] }
  | { type: 'go'; depth: number }
  | { type: 'stop' }
  | { type: 'quit' };

export type EngineResponse =
  | { type: 'ready' }
  | { type: 'bestmove'; move: string; depth: number; fallback?: boolean }
  | { type: 'error'; message: string };

export interface PikafishClient {
  init(): Promise<void>;
  setPosition(fen: string, moves?: string[]): Promise<void>;
  bestMove(depth: number): Promise<string>;
  dispose(): void;
}

export function createPikafishClient(): PikafishClient {
  let worker: Worker | null = null;
  let pending: ((move: string) => void) | null = null;

  const ensureWorker = () => {
    if (!worker) {
      worker = new Worker(new URL('./pikafish.worker.ts', import.meta.url), { type: 'module' });
      worker.onmessage = (ev: MessageEvent<EngineResponse>) => {
        const msg = ev.data;
        if (msg.type === 'ready') {
          /* ready */
        }
        if (msg.type === 'bestmove' && pending) {
          pending(msg.move);
          pending = null;
        }
      };
    }
    return worker;
  };

  return {
    async init() {
      const w = ensureWorker();
      w.postMessage({ type: 'init' } satisfies EngineRequest);
      await new Promise<void>((resolve) => {
        const handler = (ev: MessageEvent<EngineResponse>) => {
          if (ev.data.type === 'ready') {
            w.removeEventListener('message', handler);
            resolve();
          }
        };
        w.addEventListener('message', handler);
      });
    },
    async setPosition(fen, moves = []) {
      ensureWorker().postMessage({ type: 'position', fen, moves } satisfies EngineRequest);
    },
    async bestMove(depth) {
      const w = ensureWorker();
      return new Promise((resolve) => {
        pending = resolve;
        w.postMessage({ type: 'go', depth } satisfies EngineRequest);
      });
    },
    dispose() {
      worker?.postMessage({ type: 'quit' } satisfies EngineRequest);
      worker?.terminate();
      worker = null;
    },
  };
}
