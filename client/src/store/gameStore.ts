import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CameraPreset, GameSnapshot, PieceStyle, PublicUser, Side, TimeControlPreset } from '@xq/shared';

interface AuthState {
  token: string | null;
  user: PublicUser | null;
  setAuth: (token: string, user: PublicUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    { name: 'xq-auth' },
  ),
);

interface GameUiState {
  snapshot: GameSnapshot | null;
  mySide: Side | null;
  selectedSquare: string | null;
  legalTargets: string[];
  pieceStyle: PieceStyle;
  cameraPreset: CameraPreset;
  aiDepth: number;
  timeControl: TimeControlPreset;
  setSnapshot: (s: GameSnapshot | null) => void;
  setMySide: (s: Side | null) => void;
  setSelection: (square: string | null, targets?: string[]) => void;
  setPieceStyle: (s: PieceStyle) => void;
  setCameraPreset: (c: CameraPreset) => void;
  setAiDepth: (d: number) => void;
  setTimeControl: (t: TimeControlPreset) => void;
}

export const useGameStore = create<GameUiState>((set) => ({
  snapshot: null,
  mySide: null,
  selectedSquare: null,
  legalTargets: [],
  pieceStyle: 'classic',
  cameraPreset: 'side',
  aiDepth: 8,
  timeControl: 'blitz',
  setSnapshot: (snapshot) => set({ snapshot }),
  setMySide: (mySide) => set({ mySide }),
  setSelection: (selectedSquare, legalTargets = []) => set({ selectedSquare, legalTargets }),
  setPieceStyle: (pieceStyle) => set({ pieceStyle }),
  setCameraPreset: (cameraPreset) => set({ cameraPreset }),
  setAiDepth: (aiDepth) => set({ aiDepth }),
  setTimeControl: (timeControl) => set({ timeControl }),
}));
