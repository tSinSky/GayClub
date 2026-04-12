'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [userName, setUserName] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('cinema_club_user_name') || '';
    }
    return '';
  });

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
    const trimmedName = userName.trim();
    if (trimmedName) {
      localStorage.setItem('cinema_club_user_name', trimmedName);
    }
    const result = await submitRating(sessionId, userId, ratings, trimmedName || undefined);

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
    setTimeout(() => {
      setView('voting');
      setRatings({});
      setResults([]);
      setExpandedCategory(null);
    }, 200);
  };

  const allRated = categories.every(cat => ratings[cat.id] > 0) && userName.trim().length > 0;
  const ratedCount = categories.filter(cat => ratings[cat.id] > 0).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-lg max-h-[90vh] overflow-y-auto p-0">
        {view === 'voting' ? (
          <>
            <DialogHeader className="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-800 px-5 py-4">
              <DialogTitle className="text-xl">Оценить фильм</DialogTitle>
              <p className="text-sm text-zinc-500 mt-1">
                <span className="text-amber-400">{sessionTitle}</span>
                {' · '}
                <span className={ratedCount === categories.length ? 'text-green-400' : ''}>
                  {ratedCount}/{categories.length}
                </span>
              </p>
            </DialogHeader>

            <div className="px-5 py-4 space-y-4">
              {/* Name input */}
              <div>
                <label className="text-sm text-zinc-400 mb-1.5 block">Ваше имя</label>
                <Input
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Как вас зовут?"
                  maxLength={30}
                  className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 h-9"
                />
              </div>

              {/* Categories */}
              {categories.map(category => {
                const rating = ratings[category.id] || 0;
                const hovered = hoveredRatings[category.id] || 0;
                const displayRating = hovered || rating;
                const isExpanded = expandedCategory === category.id;

                return (
                  <div key={category.id} className="space-y-1.5">
                    {/* Category header */}
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                        className="flex items-center gap-1 text-left min-w-0"
                      >
                        <h4 className="text-sm font-semibold truncate">{category.name}</h4>
                        {category.description && (
                          isExpanded
                            ? <ChevronUp className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                            : <ChevronDown className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        )}
                      </button>
                      {rating > 0 && (
                        <span className="text-amber-400 font-bold text-sm shrink-0">{rating}/10</span>
                      )}
                    </div>

                    {/* Description (collapsible) */}
                    {isExpanded && category.description && (
                      <p className="text-xs text-zinc-500 leading-relaxed pb-1">
                        {category.description}
                      </p>
                    )}

                    {/* Score buttons — two rows of 5 on mobile */}
                    <div className="grid grid-cols-10 gap-1 sm:flex sm:gap-1">
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
                          className={`aspect-square sm:w-8 sm:h-8 rounded-md text-xs font-semibold transition-all ${
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

            {/* Submit footer */}
            <div className="sticky bottom-0 bg-zinc-900 border-t border-zinc-800 px-5 py-3 flex gap-3 justify-end">
              <Button
                variant="ghost"
                onClick={handleClose}
                className="text-zinc-400 hover:text-zinc-100 h-9"
              >
                Отмена
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!allRated || submitting}
                className="bg-amber-500 hover:bg-amber-600 text-zinc-950 disabled:opacity-50 h-9"
              >
                {submitting ? 'Отправка...' : 'Отправить'}
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader className="px-5 pt-5">
              <DialogTitle className="text-xl flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                Спасибо за оценку!
              </DialogTitle>
            </DialogHeader>

            <div className="px-5 py-4">
              <p className="text-zinc-400 text-sm mb-4">
                Результаты для <span className="text-amber-400">{sessionTitle}</span>
                <span className="text-zinc-600 ml-2">({voterCount} {voterCount === 1 ? 'голос' : voterCount < 5 ? 'голоса' : 'голосов'})</span>
              </p>

              <div className="space-y-3">
                {results.map((cat) => (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-300 text-xs">{cat.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-500 text-xs">
                          вы: {cat.userScore}/10
                        </span>
                        <span className="text-amber-400 font-medium text-sm">
                          {cat.average.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${(cat.average / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-5 pb-5 flex justify-end">
              <Button
                onClick={handleClose}
                className="bg-amber-500 hover:bg-amber-600 text-zinc-950 h-9"
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
