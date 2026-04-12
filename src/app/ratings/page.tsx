import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Star, Users, TrendingUp } from 'lucide-react';
import { getPublishedSessions } from '@/lib/actions/sessions';
import { getAllRatings } from '@/lib/actions/ratings';
import { getRatingCategories } from '@/lib/actions/categories';
import type { Session, Rating, RatingCategory } from '@/types';

export const dynamic = 'force-dynamic';

function computeSessionStats(
  ratings: Rating[],
  categories: RatingCategory[]
) {
  if (ratings.length === 0) return null;

  const overallCat = categories.find(
    (c) => c.id === 'overall' || c.name.toLowerCase().includes('общее')
  );

  const categoryAverages = categories.map((cat) => {
    const values = ratings
      .map((r) => r.scores[cat.id])
      .filter((v) => typeof v === 'number' && v > 0);
    const average =
      values.length > 0
        ? values.reduce((sum, v) => sum + v, 0) / values.length
        : 0;
    return { id: cat.id, name: cat.name, average };
  });

  const overallValues = overallCat
    ? ratings
        .map((r) => r.scores[overallCat.id])
        .filter((v) => typeof v === 'number' && v > 0)
    : [];
  const overallAverage =
    overallValues.length > 0
      ? overallValues.reduce((sum, v) => sum + v, 0) / overallValues.length
      : 0;

  return { categoryAverages, overallAverage, voterCount: ratings.length };
}

function RatingBar({ value, max = 10 }: { value: number; max?: number }) {
  const percentage = (value / max) * 100;
  return (
    <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
      <div
        className="h-full bg-amber-500 rounded-full"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

function FilmCard({
  session,
  ratings,
  categories,
}: {
  session: Session;
  ratings: Rating[];
  categories: RatingCategory[];
}) {
  const stats = computeSessionStats(ratings, categories);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      {/* Film header */}
      <div className="flex gap-4 p-5">
        <Link href={`/session/${session.id}`} className="shrink-0">
          <div className="relative w-20 h-28 rounded-lg overflow-hidden">
            <Image
              src={session.poster_url}
              alt={session.title}
              fill
              className="object-cover"
            />
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <Link href={`/session/${session.id}`}>
            <h2 className="text-xl font-bold hover:text-amber-400 transition-colors truncate">
              {session.title}
            </h2>
          </Link>
          <div className="flex items-center gap-2 text-sm text-zinc-500 mt-1">
            <span className="text-amber-400">{session.year}</span>
            <span>·</span>
            <span>{session.genre}</span>
          </div>
          {stats && (
            <div className="flex items-center gap-3 mt-3">
              <div className="text-3xl font-bold text-amber-500">
                {stats.overallAverage.toFixed(1)}
              </div>
              <div className="text-xs text-zinc-500">
                <div>из 10</div>
                <div className="flex items-center gap-1 mt-0.5">
                  <Users className="w-3 h-3" />
                  {stats.voterCount}{' '}
                  {stats.voterCount === 1
                    ? 'голос'
                    : stats.voterCount < 5
                      ? 'голоса'
                      : 'голосов'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Category averages */}
      {stats && (
        <div className="px-5 pb-4 space-y-2">
          {stats.categoryAverages.map((cat) => (
            <div key={cat.id} className="flex items-center gap-3">
              <span className="text-xs text-zinc-500 w-32 shrink-0 truncate">
                {cat.name}
              </span>
              <RatingBar value={cat.average} />
              <span className="text-xs font-medium text-zinc-400 w-7 text-right">
                {cat.average > 0 ? cat.average.toFixed(1) : '—'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Individual votes */}
      {ratings.length > 0 && (
        <div className="border-t border-zinc-800">
          <div className="px-5 py-3">
            <h3 className="text-sm font-medium text-zinc-400 mb-3">
              Индивидуальные оценки
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left text-xs text-zinc-600 pb-2 pr-4 font-medium">
                      Зритель
                    </th>
                    {categories.map((cat) => (
                      <th
                        key={cat.id}
                        className="text-center text-xs text-zinc-600 pb-2 px-2 font-medium whitespace-nowrap"
                      >
                        {cat.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ratings.map((rating, idx) => {
                    const name =
                      rating.user_name || `Зритель ${idx + 1}`;
                    return (
                      <tr
                        key={rating.id}
                        className="border-b border-zinc-800/50 last:border-0"
                      >
                        <td className="py-2 pr-4 text-zinc-300 font-medium whitespace-nowrap">
                          {name}
                        </td>
                        {categories.map((cat) => {
                          const score = rating.scores[cat.id];
                          return (
                            <td key={cat.id} className="py-2 px-2 text-center">
                              {score && score > 0 ? (
                                <span
                                  className={`font-semibold ${
                                    score >= 8
                                      ? 'text-green-400'
                                      : score >= 5
                                        ? 'text-amber-400'
                                        : 'text-red-400'
                                  }`}
                                >
                                  {score}
                                </span>
                              ) : (
                                <span className="text-zinc-700">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* No ratings fallback */}
      {ratings.length === 0 && (
        <div className="px-5 pb-5 text-sm text-zinc-600">
          Пока никто не оценил этот фильм
        </div>
      )}
    </div>
  );
}

export default async function RatingsPage() {
  const [sessions, allRatings, categories] = await Promise.all([
    getPublishedSessions(),
    getAllRatings(),
    getRatingCategories(),
  ]);

  // Group ratings by session
  const ratingsBySession = new Map<string, Rating[]>();
  for (const rating of allRatings) {
    const arr = ratingsBySession.get(rating.session_id) || [];
    arr.push(rating);
    ratingsBySession.set(rating.session_id, arr);
  }

  // Sort sessions: those with ratings first (by overall average desc), then unrated
  const sessionsWithStats = sessions.map((s) => {
    const ratings = ratingsBySession.get(s.id) || [];
    const stats = computeSessionStats(ratings, categories);
    return { session: s, ratings, overallAverage: stats?.overallAverage || 0 };
  });
  sessionsWithStats.sort((a, b) => b.overallAverage - a.overallAverage);

  const totalVotes = allRatings.length;
  const ratedCount = sessionsWithStats.filter((s) => s.ratings.length > 0).length;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link
            href="/"
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            <h1 className="text-xl font-bold">Оценки фильмов</h1>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="flex gap-6 text-sm text-zinc-500">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-amber-500" />
            <span>
              {ratedCount} из {sessions.length}{' '}
              {ratedCount === 1
                ? 'фильм оценён'
                : ratedCount < 5
                  ? 'фильма оценено'
                  : 'фильмов оценено'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-amber-500" />
            <span>
              {totalVotes}{' '}
              {totalVotes === 1
                ? 'голос'
                : totalVotes < 5
                  ? 'голоса'
                  : 'голосов'}{' '}
              всего
            </span>
          </div>
        </div>
      </div>

      {/* Films list */}
      <div className="max-w-4xl mx-auto px-6 pb-16 space-y-6">
        {sessionsWithStats.map(({ session, ratings }) => (
          <FilmCard
            key={session.id}
            session={session}
            ratings={ratings}
            categories={categories}
          />
        ))}

        {sessions.length === 0 && (
          <div className="text-center py-20 text-zinc-600">
            <Star className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>Пока нет опубликованных фильмов</p>
          </div>
        )}
      </div>
    </div>
  );
}
