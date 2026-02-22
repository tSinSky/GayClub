import Link from 'next/link';
import Image from 'next/image';
import { Calendar, User } from 'lucide-react';
import type { Session } from '@/types';

interface Props {
  sessions: Session[];
}

export default function SessionList({ sessions }: Props) {
  return (
    <div className="max-w-7xl mx-auto px-6 pb-20">
      <h2 className="text-2xl font-bold mb-8 text-zinc-200">
        Все встречи
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {sessions.map((session) => (
          <Link
            key={session.id}
            href={`/session/${session.id}`}
            className="group block rounded-xl bg-zinc-900/50 border border-zinc-800 overflow-hidden hover:border-amber-500/30 transition-colors"
          >
            <div className="relative aspect-[2/3] w-full">
              <Image
                src={session.poster_url}
                alt={session.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-lg font-bold text-white mb-1">
                  {session.title}
                </h3>
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <span className="text-amber-400">{session.year}</span>
                  <span>•</span>
                  <span>{session.genre}</span>
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(session.date).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </div>
                  {session.host && (
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {session.host}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
