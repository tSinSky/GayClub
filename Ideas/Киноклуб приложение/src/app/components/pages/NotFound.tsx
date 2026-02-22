import { useNavigate } from 'react-router';
import { Film } from 'lucide-react';
import { Button } from '../ui/button';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center">
        <Film className="w-20 h-20 mx-auto mb-6 text-amber-500/30" />
        <h1 className="text-6xl mb-4 text-zinc-700">404</h1>
        <h2 className="text-2xl mb-2 text-zinc-400">Страница не найдена</h2>
        <p className="text-zinc-500 mb-8">
          Кажется, этот кадр не попал в финальный монтаж
        </p>
        <Button
          onClick={() => navigate('/')}
          className="bg-amber-500 hover:bg-amber-600 text-zinc-950"
        >
          Вернуться на главную
        </Button>
      </div>
    </div>
  );
}
