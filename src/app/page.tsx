import Link from 'next/link';
import { Film } from 'lucide-react';
import { Button } from '@/components/ui/button';
import HomeHero from '@/components/home-hero';
import SessionList from '@/components/session-list';
import { getPublishedSessions } from '@/lib/actions/sessions';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const sessions = await getPublishedSessions();

  // Hero = nearest upcoming session, or most recent past session
  const todayStr = new Date().toISOString().slice(0, 10);
  const upcoming = sessions
    .filter(s => s.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date));
  const past = sessions
    .filter(s => s.date < todayStr)
    .sort((a, b) => b.date.localeCompare(a.date));

  const currentSession = upcoming[0] || past[0];

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
