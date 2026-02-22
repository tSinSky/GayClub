import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Session } from '@/types';

interface Props {
  session: Session;
}

export default function SessionHero({ session }: Props) {
  return (
    <div className="relative h-[60vh] md:h-[70vh]">
      {/* Backdrop */}
      <div className="absolute inset-0">
        {session.backdrop_url ? (
          <Image
            src={session.backdrop_url}
            alt=""
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full bg-zinc-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/40 via-zinc-950/70 to-zinc-950" />
      </div>

      {/* Back Button */}
      <div className="absolute top-6 left-6 z-10">
        <Link href="/">
          <Button
            variant="ghost"
            className="bg-zinc-950/50 backdrop-blur-sm hover:bg-zinc-900/70 border border-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            На главную
          </Button>
        </Link>
      </div>

      {/* Content */}
      <div className="relative h-full max-w-7xl mx-auto px-6 flex items-end pb-12">
        <div className="flex flex-col md:flex-row gap-8 items-end w-full">
          {/* Poster */}
          <div className="flex-shrink-0">
            <Image
              src={session.poster_url}
              alt={session.title}
              width={256}
              height={384}
              className="w-56 md:w-64 rounded-lg shadow-2xl shadow-black/60 ring-1 ring-white/10"
              priority
            />
          </div>

          {/* Meta */}
          <div className="flex-1 pb-4">
            <h1 className="text-4xl md:text-5xl mb-3 tracking-tight font-bold">
              {session.title}
            </h1>
            <div className="flex flex-wrap gap-3 text-zinc-300 mb-4">
              <span className="text-amber-400">{session.year}</span>
              <span className="text-zinc-600">•</span>
              <span>{session.genre}</span>
              {session.runtime && (
                <>
                  <span className="text-zinc-600">•</span>
                  <span>{session.runtime}</span>
                </>
              )}
            </div>
            {session.director && (
              <p className="text-zinc-400">
                Режиссёр: <span className="text-zinc-200">{session.director}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
