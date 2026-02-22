'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function BingoRules() {
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full max-w-lg mx-auto mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 text-sm transition-colors w-full"
      >
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
        Как играть?
      </button>
      {open && (
        <div className="mt-3 space-y-2 text-zinc-400 text-sm bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
          <p>
            <span className="text-amber-500 font-bold mr-2">1.</span>
            У каждого игрока уникальная карточка 4×4 с событиями из фильма.
          </p>
          <p>
            <span className="text-amber-500 font-bold mr-2">2.</span>
            Во время просмотра отмечайте события, которые происходят на экране.
          </p>
          <p>
            <span className="text-amber-500 font-bold mr-2">3.</span>
            Соберите 4 в ряд (по горизонтали, вертикали или диагонали) — это бинго!
          </p>
          <p>
            <span className="text-amber-500 font-bold mr-2">4.</span>
            Побеждает тот, кто соберёт бинго первым. Время фиксируется автоматически.
          </p>
        </div>
      )}
    </div>
  );
}
