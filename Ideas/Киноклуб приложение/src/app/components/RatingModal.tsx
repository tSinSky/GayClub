import { useState } from 'react';
import { Session } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Star } from 'lucide-react';
import { saveRating, getRatingCategories } from '../lib/storage';
import { toast } from 'sonner';

interface Props {
  session: Session;
  open: boolean;
  onClose: () => void;
}

export default function RatingModal({ session, open, onClose }: Props) {
  const categories = getRatingCategories();
  const [ratings, setRatings] = useState<{ [key: string]: number }>({});
  const [hoveredRatings, setHoveredRatings] = useState<{ [key: string]: number }>({});

  const handleRate = (categoryId: string, value: number) => {
    setRatings(prev => ({ ...prev, [categoryId]: value }));
  };

  const handleSubmit = () => {
    // Generate a simple user ID (in real app, this would come from auth)
    const userId = localStorage.getItem('cinema_club_user_id') || generateUserId();
    
    saveRating({
      sessionId: session.id,
      userId,
      ratings,
      timestamp: new Date().toISOString(),
    });

    toast.success('Спасибо за оценку!');
    onClose();
    setRatings({});
  };

  const generateUserId = () => {
    const id = `user_${Date.now()}`;
    localStorage.setItem('cinema_club_user_id', id);
    return id;
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
            Оцените <span className="text-amber-400">{session.title}</span> по категориям
          </p>

          {categories.map(category => {
            const rating = ratings[category.id] || 0;
            const hovered = hoveredRatings[category.id] || 0;
            const displayRating = hovered || rating;

            return (
              <div key={category.id} className="space-y-2">
                <h4 className="text-lg">{category.name}</h4>
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
            disabled={!allRated}
            className="bg-amber-500 hover:bg-amber-600 text-zinc-950 disabled:opacity-50"
          >
            Отправить оценки
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
