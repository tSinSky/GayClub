'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { submitRating, getSessionRatings } from '@/lib/actions/ratings';
import { toast } from 'sonner';
import type { RatingCategory, Rating } from '@/types';

interface Props {
  sessionId: string;
  sessionTitle: string;
  categories: RatingCategory[];
  open: boolean;
  onClose: () => void;
}

type View = 'voting' | 'results';

interface CategoryResult {
  name: string;
  userScore: number;
  average: number;
}

export default function RatingModal({ sessionId, sessionTitle, categories, open, onClose }: Props) {
  const [view, setView] = useState<View>('voting');
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [hoveredRatings, setHoveredRatings] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<CategoryResult[]>([]);
  const [voterCount, setVoterCount] = useState(0);

  const handleRate = (categoryId: string, value: number) => {
    setRatings(prev => ({ ...prev, [categoryId]: value }));
  };

  const getUserId = () => {
    let userId = localStorage.getItem('cinema_club_user_id');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      localStorage.setItem('cinema_club_user_id', userId);
    }
    return userId;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const userId = getUserId();
    const result = await submitRating(sessionId, userId, ratings);

    if (result.error) {
      toast.error('Ошибка при отправке оценки');
      setSubmitting(false);
      return;
    }

    // Fetch aggregated ratings to show results
    const allRatings = await getSessionRatings(sessionId);
    const categoryResults = categories.map((cat) => {
      const values = allRatings
        .map((r: Rating) => r.scores[cat.id])
        .filter((v: number) => typeof v === 'number' && v > 0);
      const average = values.length > 0
        ? values.reduce((sum: number, v: number) => sum + v, 0) / values.length
        : 0;
      return { name: cat.name, userScore: ratings[cat.id] || 0, average };
    });

    setResults(categoryResults);
    setVoterCount(allRatings.length);
    setView('results');
    setSubmitting(false);
  };

  const handleClose = () => {
    onClose();
    // Reset state after close animation
    setTimeout(() => {
      setView('voting');
      setRatings({});
      setResults([]);
    }, 200);
  };

  const allRated = categories.every(cat => ratings[cat.id] > 0);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-2xl">
        {view === 'voting' ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">Оценить фильм</DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <p className="text-zinc-400 mb-6">
                Оцените <span className="text-amber-400">{sessionTitle}</span> по категориям
              </p>

              {categories.map(category => {
                const rating = ratings[category.id] || 0;
                const hovered = hoveredRatings[category.id] || 0;
                const displayRating = hovered || rating;

                return (
                  <div key={category.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-medium">{category.name}</h4>
                      {rating > 0 && (
                        <span className="text-amber-400 font-bold text-lg">{rating}/10</span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(value => (
                        <button
                          key={value}
                          onClick={() => handleRate(category.id, value)}
                          onMouseEnter={() =>
                            setHoveredRatings(prev => ({ ...prev, [category.id]: value }))
                          }
                          onMouseLeave={() =>
                            setHoveredRatings(prev => ({ ...prev, [category.id]: 0 }))
                          }
                          className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all ${
                            value <= displayRating
                              ? 'bg-amber-500 text-zinc-950'
                              : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300'
                          }`}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-zinc-800">
              <Button
                variant="ghost"
                onClick={handleClose}
                className="text-zinc-400 hover:text-zinc-100"
              >
                Отмена
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!allRated || submitting}
                className="bg-amber-500 hover:bg-amber-600 text-zinc-950 disabled:opacity-50"
              >
                {submitting ? 'Отправка...' : 'Отправить оценки'}
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Check className="w-6 h-6 text-green-500" />
                Спасибо за оценку!
              </DialogTitle>
            </DialogHeader>

            <div className="py-4">
              <p className="text-zinc-400 mb-6">
                Результаты для <span className="text-amber-400">{sessionTitle}</span>
                <span className="text-zinc-600 ml-2">({voterCount} {voterCount === 1 ? 'голос' : voterCount < 5 ? 'голоса' : 'голосов'})</span>
              </p>

              <div className="space-y-4">
                {results.map((cat) => (
                  <div key={cat.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-300">{cat.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-zinc-500 text-xs">
                          вы: {cat.userScore}/10
                        </span>
                        <span className="text-amber-400 font-medium">
                          {cat.average.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all duration-500"
                          style={{ width: `${(cat.average / 10) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-zinc-800">
              <Button
                onClick={handleClose}
                className="bg-amber-500 hover:bg-amber-600 text-zinc-950"
              >
                Закрыть
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
