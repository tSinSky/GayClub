'use client';

import { useState, useEffect, useMemo } from 'react';
import { Users } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/client';
import { getSessionRatings } from '@/lib/actions/ratings';
import type { Rating, RatingCategory } from '@/types';

interface Props {
  sessionId: string;
  categories: RatingCategory[];
  initialRatings: Rating[];
}

interface CategoryStats {
  categoryId: string;
  name: string;
  average: number;
}

function computeStats(ratings: Rating[], categories: RatingCategory[]) {
  if (ratings.length === 0) return null;

  const categoryStats: CategoryStats[] = categories.map((cat) => {
    const values = ratings
      .map((r) => r.scores[cat.id])
      .filter((v) => typeof v === 'number' && v > 0);
    const average = values.length > 0
      ? values.reduce((sum, v) => sum + v, 0) / values.length
      : 0;
    return { categoryId: cat.id, name: cat.name, average };
  });

  // Overall rating = average of "overall" category (Общее впечатление)
  const overallCat = categories.find(
    (c) => c.id === 'overall' || c.name.toLowerCase().includes('общее')
  );
  const overallValues = overallCat
    ? ratings.map((r) => r.scores[overallCat.id]).filter((v) => typeof v === 'number' && v > 0)
    : [];
  const overallAverage = overallValues.length > 0
    ? overallValues.reduce((sum, v) => sum + v, 0) / overallValues.length
    : 0;

  return { categoryStats, overallAverage, voterCount: ratings.length };
}

function RatingScale({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
        <div
          key={value}
          className={`w-3 h-3 rounded-sm ${
            value <= Math.round(rating)
              ? 'bg-amber-500'
              : 'bg-zinc-800'
          }`}
        />
      ))}
    </div>
  );
}

function RatingBar({ value, max = 10 }: { value: number; max?: number }) {
  const percentage = (value / max) * 100;
  return (
    <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
      <div
        className="h-full bg-amber-500 rounded-full transition-all duration-500"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

export default function SessionRatings({ sessionId, categories, initialRatings }: Props) {
  const [ratings, setRatings] = useState<Rating[]>(initialRatings);

  // Realtime subscription
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`ratings_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ratings',
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          getSessionRatings(sessionId).then(setRatings);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const stats = useMemo(() => computeStats(ratings, categories), [ratings, categories]);

  if (!stats || stats.voterCount === 0) return null;

  return (
    <div className="bg-zinc-900 border border-amber-500/20 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="text-amber-500 text-lg">★</span>
          <h3 className="text-lg font-bold">Оценки зрителей</h3>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-zinc-500">
          <Users className="w-4 h-4" />
          {stats.voterCount}
        </div>
      </div>

      {/* Overall rating - prominent */}
      <div className="flex items-center gap-4 mb-6 pb-6 border-b border-zinc-800">
        <div className="text-4xl font-bold text-amber-500">
          {stats.overallAverage.toFixed(1)}
        </div>
        <div>
          <RatingScale rating={stats.overallAverage} />
          <p className="text-xs text-zinc-500 mt-1">из 10</p>
        </div>
      </div>

      {/* Per-category breakdown */}
      <div className="space-y-3">
        {stats.categoryStats.map((cat) => (
          <div key={cat.categoryId} className="flex items-center gap-3">
            <span className="text-sm text-zinc-400 w-44 shrink-0 truncate">
              {cat.name}
            </span>
            <RatingBar value={cat.average} />
            <span className="text-sm font-medium text-zinc-300 w-8 text-right">
              {cat.average > 0 ? cat.average.toFixed(1) : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
