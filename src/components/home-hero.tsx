import Link from 'next/link';
import Image from 'next/image';
import { Film, Calendar, User, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Session } from '@/types';

interface Props {
  session: Session;
}

export default function HomeHero({ session }: Props) {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative">
        {/* Backdrop */}
        <div className="absolute inset-0 h-[70vh]">
          {session.backdrop_url && (
            <Image
              src={session.backdrop_url}
              alt=""
              fill
              className="object-cover"
              priority
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/60 via-zinc-950/80 to-zinc-950" />
        </div>

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-6 py-20">
          <div className="flex flex-col md:flex-row gap-12 items-start">
            {/* Poster */}
            <div className="flex-shrink-0">
              <div className="relative group">
                <Image
                  src={session.poster_url}
                  alt={session.title}
                  width={320}
                  height={480}
                  className="rounded-lg shadow-2xl shadow-black/50 ring-1 ring-white/10"
                  priority
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

              <h1 className="text-5xl md:text-6xl mb-4 tracking-tight font-bold">
                {session.title}
              </h1>

              <div className="flex flex-wrap gap-4 mb-8 text-zinc-400">
                <span className="text-amber-400">{session.year}</span>
                <span>•</span>
                <span>{session.genre}</span>
                {session.runtime && (
                  <>
                    <span>•</span>
                    <span>{session.runtime}</span>
                  </>
                )}
              </div>

              <div className="flex flex-col gap-3 mb-10 text-zinc-300">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-amber-500" />
                  <span>
                    {new Date(session.date).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                {session.host && (
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-amber-500" />
                    <span>Ведущий: {session.host}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href={`/session/${session.id}`}>
                  <Button
                    size="lg"
                    className="bg-amber-500 hover:bg-amber-600 text-zinc-950 px-8 py-6 text-lg shadow-lg shadow-amber-500/20"
                  >
                    <Film className="w-5 h-5 mr-2" />
                    Погрузиться в фильм
                  </Button>
                </Link>
                <Link href="/ratings">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 px-8 py-6 text-lg"
                  >
                    <Star className="w-5 h-5 mr-2" />
                    Все оценки
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer hint */}
      <div className="max-w-7xl mx-auto px-6 py-12 text-center text-zinc-600">
        <p className="text-sm">
          Администраторы могут добавлять новые встречи в{' '}
          <Link
            href="/admin"
            className="text-amber-500 hover:text-amber-400 underline"
          >
            админ-панели
          </Link>
        </p>
      </div>
    </div>
  );
}
