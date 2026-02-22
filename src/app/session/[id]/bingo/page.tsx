import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BingoPageClient from '@/components/bingo-page-client';
import { getSession } from '@/lib/actions/sessions';
import { getBingoItems } from '@/lib/actions/bingo';

export default async function BingoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [session, bingoItems] = await Promise.all([
    getSession(id),
    getBingoItems(id),
  ]);

  if (!session) {
    notFound();
  }

  if (bingoItems.length < 16) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl mb-4 text-zinc-400 font-bold">Бинго недоступно</h1>
          <p className="text-zinc-500 mb-6">
            Для этой встречи ещё не добавлено достаточно элементов бинго.
          </p>
          <Link href={`/session/${id}`}>
            <Button variant="outline" className="border-amber-500/30 text-amber-400">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад к фильму
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      {/* Back button */}
      <div className="max-w-lg mx-auto mb-6">
        <Link href={`/session/${id}`}>
          <Button
            variant="ghost"
            className="text-zinc-400 hover:text-zinc-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад к фильму
          </Button>
        </Link>
      </div>

      <BingoPageClient
        items={bingoItems.map(item => item.text)}
        sessionId={id}
        sessionTitle={`${session.title} · ${session.year}`}
      />
    </div>
  );
}
