import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/gameStore';

export function AuthPanel() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const path = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? '请求失败');
      return;
    }
    setAuth(data.token, data.user);
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardTitle>3D 中国象棋</CardTitle>
        <p className="mt-2 text-sm text-stone-400">登录后可匹配、建房、AI 对战与观战</p>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <input
            className="w-full rounded-md border border-stone-600 bg-stone-950 px-3 py-2"
            placeholder="用户名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            className="w-full rounded-md border border-stone-600 bg-stone-950 px-3 py-2"
            placeholder="密码（至少 6 位）"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" className="w-full">
            {mode === 'login' ? '登录' : '注册'}
          </Button>
        </form>
        <button
          type="button"
          className="mt-4 text-sm text-amber-300 hover:underline"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
        >
          {mode === 'login' ? '没有账号？注册' : '已有账号？登录'}
        </button>
      </Card>
    </div>
  );
}
