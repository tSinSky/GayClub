'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { submitRating } from '@/lib/actions/ratings';
import { toast } from 'sonner';
import type { RatingCategory } from '@/types';

interface Props {
  sessionId: string;
  sessionTitle: string;
  categories: RatingCategory[];
  open: boolean;
  onClose: () => void;
}

export default function RatingModal({ sessionId, sessionTitle, categories, open, onClose }: Props) {
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [hoveredRatings, setHoveredRatings] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);

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
    } else {
      toast.success('Спасибо за оценку!');
      onClose();
      setRatings({});
    }
    setSubmitting(false);
  };

  const allRated = categories.every(cat => ratings[cat.id] > 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-2xl">
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
                <h4 className="text-lg font-medium">{category.name}</h4>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(value => (
                    <button
                      key={value}
                      onClick={() => handleRate(category.id, value)}
                      onMouseEnter={() =>
                        setHoveredRatings(prev => ({ ...prev, [category.id]: value }))
                      }
                      onMouseLeave={() =>
                        setHoveredRatings(prev => ({ ...prev, [category.id]: 0 }))
                      }
                      className="group transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          value <= displayRating
                            ? 'fill-amber-500 text-amber-500'
                            : 'text-zinc-700 group-hover:text-zinc-600'
                        }`}
                      />
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
            onClick={onClose}
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
      </DialogContent>
    </Dialog>
  );
}
