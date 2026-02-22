import Link from 'next/link';
import { Film } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <Film className="w-20 h-20 mx-auto mb-6 text-amber-500/30" />
        <h1 className="text-4xl mb-4 text-zinc-300 font-bold">404</h1>
        <p className="text-zinc-500 mb-8">
          Страница не найдена
        </p>
        <Link href="/">
          <Button
            variant="outline"
            className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
          >
            Вернуться на главную
          </Button>
        </Link>
      </div>
    </div>
  );
}
