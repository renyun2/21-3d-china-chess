/// <reference lib="webworker" />
import type { EngineRequest, EngineResponse } from './pikafishClient';

declare const self: DedicatedWorkerGlobalScope;

/** 占位：将官方 Pikafish.wasm 放入 public/engine/ 后替换为真实 UCI 桥接 */

const mockLegal = ['b0c2', 'b0a2', 'h0g2', 'h0i2', 'g0i2', 'g0e2'];

function pickMockMove(): string {
  return mockLegal[Math.floor(Math.random() * mockLegal.length)];
}

self.onmessage = async (ev: MessageEvent<EngineRequest>) => {
  const msg = ev.data;
  try {
    switch (msg.type) {
      case 'init': {
        // 真实集成：fetch('/engine/pikafish.wasm') + instantiate + UCI loop
        self.postMessage({ type: 'ready' } satisfies EngineResponse);
        break;
      }
      case 'position':
        break;
      case 'go': {
        await new Promise((r) => setTimeout(r, 120 + msg.depth * 8));
        self.postMessage({
          type: 'bestmove',
          move: pickMockMove(),
          depth: msg.depth,
          fallback: true,
        } satisfies EngineResponse);
        break;
      }
      default:
        break;
    }
  } catch (e) {
    self.postMessage({
      type: 'error',
      message: e instanceof Error ? e.message : 'engine error',
    } satisfies EngineResponse);
  }
};

export {};
