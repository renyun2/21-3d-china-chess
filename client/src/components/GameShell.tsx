import { useMemo, useRef } from 'react';
import gsap from 'gsap';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { GameScene } from '@/scenes/GameScene';
import {
  createRoom,
  emitMove,
  joinRoom,
  startAiGame,
  startMatchmaking,
  useSocket,
} from '@/hooks/useSocket';
import { legalTargetsFromFen, piecesFromFen } from '@/lib/fen';
import { useAuthStore, useGameStore } from '@/store/gameStore';

export function GameShell() {
  const socketRef = useSocket();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const {
    snapshot,
    mySide,
    selectedSquare,
    legalTargets,
    pieceStyle,
    cameraPreset,
    aiDepth,
    timeControl,
    setSelection,
    setPieceStyle,
    setCameraPreset,
    setAiDepth,
    setTimeControl,
  } = useGameStore();

  const roomCodeRef = useRef('');
  const bannerRef = useRef<HTMLDivElement>(null);

  const pieces = useMemo(() => (snapshot ? piecesFromFen(snapshot.fen) : []), [snapshot]);
  const highlights = legalTargets;

  function flashBanner(text: string) {
    if (!bannerRef.current) return;
    bannerRef.current.textContent = text;
    gsap.fromTo(bannerRef.current, { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.25 });
    gsap.to(bannerRef.current, { opacity: 0, delay: 2, duration: 0.4 });
  }

  function onSelectSquare(square: string) {
    if (!snapshot) return;
    const isMyTurn = snapshot.turn === mySide;
    if (!isMyTurn) return;

    if (selectedSquare === square) {
      setSelection(null, []);
      return;
    }

    if (selectedSquare && legalTargets.includes(square)) {
      const move = `${selectedSquare}${square}`;
      emitMove(socketRef.current, snapshot.id, move, () => {
        flashBanner(`走子 ${move}`);
        gsap.to(`[data-square="${square}"]`, { y: 0.2, duration: 0.15, yoyo: true, repeat: 1 });
      });
      setSelection(null, []);
      return;
    }

    const targets = legalTargetsFromFen(snapshot.fen, square);
    if (targets.length === 0) return;
    setSelection(square, targets);
  }

  return (
    <div className="grid min-h-screen grid-cols-1 gap-4 p-4 lg:grid-cols-[320px_1fr]">
      <aside className="space-y-4">
        <Card>
          <CardTitle>欢迎，{user?.username}</CardTitle>
          <p className="text-sm text-stone-400">Elo {user?.elo ?? 1500}</p>
          <Button variant="outline" className="mt-3 w-full" onClick={logout}>
            退出
          </Button>
        </Card>

        <Card>
          <CardTitle>对战</CardTitle>
          <label className="mt-3 block text-xs text-stone-400">计时</label>
          <select
            className="mt-1 w-full rounded border border-stone-600 bg-stone-950 px-2 py-1"
            value={timeControl}
            onChange={(e) => setTimeControl(e.target.value as typeof timeControl)}
          >
            <option value="bullet">闪电 3+0</option>
            <option value="blitz">快棋 5+5</option>
            <option value="rapid">慢棋 15+10</option>
          </select>
          <Button className="mt-3 w-full" onClick={() => startMatchmaking(socketRef.current, timeControl)}>
            在线匹配
          </Button>
          <Button
            className="mt-2 w-full"
            variant="outline"
            onClick={() =>
              createRoom(socketRef.current, timeControl, ({ code }) => {
                roomCodeRef.current = code;
                flashBanner(`房间码 ${code}`);
              })
            }
          >
            创建房间
          </Button>
          <div className="mt-2 flex gap-2">
            <input
              className="flex-1 rounded border border-stone-600 bg-stone-950 px-2 py-1 text-sm"
              placeholder="输入房间码"
              onChange={(e) => {
                roomCodeRef.current = e.target.value;
              }}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => joinRoom(socketRef.current, roomCodeRef.current, (ok) => flashBanner(ok ? '已加入' : '加入失败'))}
            >
              加入
            </Button>
          </div>
          <label className="mt-3 block text-xs text-stone-400">AI 难度 (1-20)</label>
          <input
            type="range"
            min={1}
            max={20}
            value={aiDepth}
            onChange={(e) => setAiDepth(Number(e.target.value))}
            className="w-full"
          />
          <Button
            className="mt-2 w-full"
            variant="outline"
            onClick={() => startAiGame(socketRef.current, aiDepth, timeControl, 'red')}
          >
            AI 对战（执红）
          </Button>
        </Card>

        <Card>
          <CardTitle>视图</CardTitle>
          <div className="mt-3 flex flex-wrap gap-2">
            {(['classic', 'minimal', 'cartoon'] as const).map((s) => (
              <Button
                key={s}
                size="sm"
                variant={pieceStyle === s ? 'default' : 'outline'}
                onClick={() => setPieceStyle(s)}
              >
                {s}
              </Button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {(['top', 'side', 'fpv'] as const).map((c) => (
              <Button
                key={c}
                size="sm"
                variant={cameraPreset === c ? 'default' : 'outline'}
                onClick={() => setCameraPreset(c)}
              >
                {c === 'top' ? '俯视' : c === 'side' ? '侧视' : '第一视角'}
              </Button>
            ))}
          </div>
        </Card>

        {snapshot && (
          <Card>
            <CardTitle>局面</CardTitle>
            <p className="mt-2 text-sm">回合：{snapshot.turn === 'red' ? '红方' : '黑方'}</p>
            <p className="text-sm">状态：{snapshot.status}</p>
            {snapshot.inCheck && <p className="text-sm text-red-400">将军！</p>}
            <p className="mt-2 text-xs text-stone-500 break-all">{snapshot.fen}</p>
          </Card>
        )}
      </aside>

      <main className="relative min-h-[70vh]">
        <div ref={bannerRef} className="pointer-events-none absolute left-4 top-4 z-10 rounded bg-black/60 px-3 py-1 text-sm" />
        <GameScene
          pieces={pieces}
          highlights={highlights}
          selectedSquare={selectedSquare}
          pieceStyle={pieceStyle}
          cameraPreset={cameraPreset}
          onSelectSquare={onSelectSquare}
        />
      </main>
    </div>
  );
}
