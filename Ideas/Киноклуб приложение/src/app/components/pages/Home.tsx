import { useNavigate } from 'react-router';
import { getSessions } from '../../lib/storage';
import { Session } from '../../types';
import { Film, Calendar, User } from 'lucide-react';
import { Button } from '../ui/button';

export default function Home() {
  const navigate = useNavigate();
  const sessions = getSessions();
  const publishedSessions = sessions.filter(s => s.published);
  
  // Get current/upcoming session (published and closest to today)
  const today = new Date();
  const upcomingSessions = publishedSessions
    .filter(s => new Date(s.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const currentSession = upcomingSessions[0];

  if (!currentSession) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <Film className="w-20 h-20 mx-auto mb-6 text-amber-500/30" />
          <h1 className="text-3xl mb-4 text-zinc-400">
            Следующая встреча скоро
          </h1>
          <p className="text-zinc-500 mb-8">
            Ведущий объявит новый фильм в ближайшее время. Следите за обновлениями!
          </p>
          <Button
            onClick={() => navigate('/admin')}
            variant="outline"
            className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
          >
            Перейти в админ-панель
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative">
        {/* Backdrop */}
        <div className="absolute inset-0 h-[70vh]">
          <img
            src={currentSession.backdropUrl}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/60 via-zinc-950/80 to-zinc-950" />
        </div>

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-6 py-20">
          <div className="flex flex-col md:flex-row gap-12 items-start">
            {/* Poster */}
            <div className="flex-shrink-0">
              <div className="relative group">
                <img
                  src={currentSession.posterUrl}
                  alt={currentSession.title}
                  className="w-80 rounded-lg shadow-2xl shadow-black/50 ring-1 ring-white/10"
                />
                <div className="absolute inset-0 rounded-lg ring-1 ring-amber-500/0 group-hover:ring-amber-500/50 transition-all duration-300" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 pt-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm mb-6">
                <Film className="w-4 h-4" />
                Текущая встреча
              </div>

              <h1 className="text-5xl md:text-6xl mb-4 tracking-tight">
                {currentSession.title}
              </h1>

              <div className="flex flex-wrap gap-4 mb-8 text-zinc-400">
                <span className="text-amber-400">{currentSession.year}</span>
                <span>•</span>
                <span>{currentSession.genre}</span>
                {currentSession.runtime && (
                  <>
                    <span>•</span>
                    <span>{currentSession.runtime}</span>
                  </>
                )}
              </div>

              <div className="flex flex-col gap-3 mb-10 text-zinc-300">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-amber-500" />
                  <span>
                    {new Date(currentSession.date).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-amber-500" />
                  <span>Ведущий: {currentSession.host}</span>
                </div>
              </div>

              <Button
                size="lg"
                onClick={() => navigate(`/session/${currentSession.id}`)}
                className="bg-amber-500 hover:bg-amber-600 text-zinc-950 px-8 py-6 text-lg shadow-lg shadow-amber-500/20"
              >
                <Film className="w-5 h-5 mr-2" />
                Погрузиться в фильм
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer hint */}
      <div className="max-w-7xl mx-auto px-6 py-12 text-center text-zinc-600">
        <p className="text-sm">
          Администраторы могут добавлять новые встречи в{' '}
          <button
            onClick={() => navigate('/admin')}
            className="text-amber-500 hover:text-amber-400 underline"
          >
            админ-панели
          </button>
        </p>
      </div>
    </div>
  );
}
