import { AuthPanel } from '@/components/AuthPanel';
import { GameShell } from '@/components/GameShell';
import { useAuthStore } from '@/store/gameStore';

export function App() {
  const token = useAuthStore((s) => s.token);
  return token ? <GameShell /> : <AuthPanel />;
}
