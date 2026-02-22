'use client';

import { useState, useEffect, useRef } from 'react';
import { generateBingoCard, checkBingoWin } from '@/lib/bingo-utils';
import { saveBingoMark, getBingoProgress, resetBingoProgress } from '@/lib/actions/bingo';
import { toast } from 'sonner';

interface Props {
  items: string[];
  sessionId: string;
  sessionTitle: string;
  userId: string;
  userName: string;
  onProgressChange?: () => void;
}

export default function BingoGrid({ items, sessionId, sessionTitle, userId, userName, onProgressChange }: Props) {
  const [card, setCard] = useState<string[]>([]);
  const [marked, setMarked] = useState<boolean[]>(new Array(16).fill(false));
  const [winLines, setWinLines] = useState<number[][]>([]);
  const [lineCount, setLineCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const savingRef = useRef(false);

  // Generate card & restore server state
  useEffect(() => {
    const generatedCard = generateBingoCard(items, sessionId, userId);
    setCard(generatedCard);

    getBingoProgress(sessionId, userId).then((progress) => {
      if (progress) {
        setMarked(progress.marked);
        const wins = progress.win_lines || [];
        setWinLines(wins);
        setLineCount(wins.length);
        if (wins.length > 0) {
          onProgressChange?.();
        }
      }
      setLoading(false);
    });
  }, [items, sessionId, userId]);

  const toggleCell = async (index: number) => {
    if (savingRef.current) return;

    const newMarked = [...marked];
    newMarked[index] = !newMarked[index];

    // Optimistic update
    setMarked(newMarked);
    const wins = checkBingoWin(newMarked);
    setWinLines(wins);

    const prevCount = lineCount;
    const newCount = wins.length;
    const gotNewLine = newCount > prevCount;

    if (gotNewLine) {
      setLineCount(newCount);
      if (prevCount === 0) {
        toast.success('БИНГО! Поздравляем!', { duration: 5000 });
      } else {
        toast.success(`+1 линия! Уже ${newCount}!`, { duration: 3000 });
      }
    }

    // Save to server, then notify leaderboard
    savingRef.current = true;
    try {
      await saveBingoMark(sessionId, userId, userName, newMarked);
      if (gotNewLine) {
        onProgressChange?.();
      }
    } catch {
      // Revert on error
      setMarked(marked);
      setWinLines(checkBingoWin(marked));
      if (gotNewLine) setLineCount(prevCount);
      toast.error('Ошибка сохранения');
    } finally {
      savingRef.current = false;
    }
  };

  const handleReset = async () => {
    setMarked(new Array(16).fill(false));
    setWinLines([]);
    setLineCount(0);
    await resetBingoProgress(sessionId, userId);
    onProgressChange?.();
  };

  const isInWinLine = (index: number) => {
    return winLines.some(line => line.includes(index));
  };

  if (card.length === 0 || loading) return null;

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-amber-500 tracking-widest uppercase mb-1">
          Кино-Бинго
        </h2>
        <p className="text-zinc-500 text-sm tracking-wider">
          {sessionTitle}
        </p>
      </div>

      {/* Grid */}
      <div className="bg-zinc-900 border border-amber-500/30 rounded-lg p-3 shadow-xl shadow-black/30">
        <div className="grid grid-cols-4 gap-0 border border-amber-500/40 rounded">
          {card.map((text, index) => (
            <button
              key={index}
              onClick={() => toggleCell(index)}
              className={`
                aspect-square flex items-center justify-center text-center p-2
                border border-amber-500/15 text-xs sm:text-sm leading-tight
                transition-all duration-200 select-none
                ${
                  marked[index]
                    ? isInWinLine(index)
                      ? 'bg-amber-500 text-zinc-950 font-bold scale-[0.98]'
                      : 'bg-amber-500/20 text-amber-300 font-medium'
                    : 'text-zinc-300 hover:bg-amber-500/5 active:scale-95'
                }
              `}
            >
              {text}
            </button>
          ))}
        </div>
      </div>

      {/* Hint */}
      <p className="text-center mt-4 text-zinc-600 text-xs italic">
        Заметил — отметил. Собери четыре в ряд!
      </p>

      {/* Win indicator */}
      {lineCount > 0 && (
        <div className="mt-4 text-center bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
          <p className="text-amber-400 font-bold text-lg">
            {lineCount === 10 ? 'ПОЛНЫЙ БИНГО!' : 'БИНГО!'}
          </p>
          <p className="text-zinc-400 text-sm mt-1">
            {lineCount} из 10 {lineCount === 1 ? 'линия' : lineCount < 5 ? 'линии' : 'линий'}
          </p>
        </div>
      )}

      {/* Reset */}
      <div className="text-center mt-4">
        <button
          onClick={handleReset}
          className="text-zinc-600 hover:text-zinc-400 text-xs underline"
        >
          Сбросить
        </button>
      </div>
    </div>
  );
}
