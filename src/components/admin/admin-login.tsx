'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Film, Lock } from 'lucide-react';
import { loginAdmin } from '@/lib/actions/admin';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await loginAdmin(password);

    if (result.error) {
      toast.error(result.error);
      setLoading(false);
    } else {
      toast.success('Добро пожаловать!');
      router.push('/admin');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Film className="w-12 h-12 mx-auto mb-4 text-amber-500" />
          <h1 className="text-2xl font-bold">Админ-панель</h1>
          <p className="text-zinc-500 text-sm mt-2">Киноклуб</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="password">Пароль</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль"
                className="bg-zinc-800 border-zinc-700 pl-10"
                autoFocus
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={!password || loading}
            className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-950"
          >
            {loading ? 'Вход...' : 'Войти'}
          </Button>
        </form>
      </div>
    </div>
  );
}
