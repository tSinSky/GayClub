'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import RatingModal from '@/components/rating-modal';
import type { RatingCategory } from '@/types';

interface Props {
  sessionId: string;
  sessionTitle: string;
  categories: RatingCategory[];
}

export default function FloatingRateButton({ sessionId, sessionTitle, categories }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-8 right-8 z-50">
        <Button
          size="lg"
          onClick={() => setOpen(true)}
          className="bg-amber-500 hover:bg-amber-600 text-zinc-950 shadow-xl shadow-amber-500/30 rounded-full px-6 py-6"
        >
          <Star className="w-5 h-5 mr-2" />
          Оценить
        </Button>
      </div>

      <RatingModal
        sessionId={sessionId}
        sessionTitle={sessionTitle}
        categories={categories}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
