import Link from 'next/link';
import { Film } from 'lucide-react';
import { Button } from '@/components/ui/button';
import HomeHero from '@/components/home-hero';
import SessionList from '@/components/session-list';
import { getPublishedSessions } from '@/lib/actions/sessions';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const sessions = await getPublishedSessions();

  // Get current/upcoming session
  const today = new Date();
  const upcomingSessions = sessions
    .filter(s => new Date(s.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const currentSession = upcomingSessions[0] || sessions[sessions.length - 1];

  if (!currentSession) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <Film className="w-20 h-20 mx-auto mb-6 text-amber-500/30" />
          <h1 className="text-3xl mb-4 text-zinc-400 font-bold">
            Следующая встреча скоро
          </h1>
          <p className="text-zinc-500 mb-8">
            Ведущий объявит новый фильм в ближайшее время. Следите за обновлениями!
          </p>
          <Link href="/admin">
            <Button
              variant="outline"
              className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
            >
              Перейти в админ-панель
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const otherSessions = sessions.filter(s => s.id !== currentSession.id);

  return (
    <>
      <HomeHero session={currentSession} />
      {otherSessions.length > 0 && (
        <SessionList sessions={otherSessions} />
      )}
    </>
  );
}
