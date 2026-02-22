'use client';

import { useState, useEffect } from 'react';
import { Trophy, Flame } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/client';
import { getBingoLeaderboard } from '@/lib/actions/bingo';
import type { BingoLeaderboardEntry } from '@/types';

interface Props {
  sessionId: string;
  currentUserId: string;
  refreshKey?: number;
}

export default function BingoLeaderboard({ sessionId, currentUserId, refreshKey }: Props) {
  const [entries, setEntries] = useState<BingoLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Initial load + refresh when refreshKey changes
  useEffect(() => {
    getBingoLeaderboard(sessionId).then((data) => {
      setEntries(data);
      setLoading(false);
    });
  }, [sessionId, refreshKey]);

  // Realtime subscription
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`bingo_leaderboard_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bingo_progress',
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          getBingoLeaderboard(sessionId).then(setEntries);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  if (loading) return null;
  if (entries.length === 0) return null;

  // "First bingo" — sorted by completed_at (only players who completed)
  const firstBingo = entries
    .filter((e) => e.completed_at)
    .sort((a, b) => new Date(a.completed_at!).getTime() - new Date(b.completed_at!).getTime());

  // "Most lines" — sorted by win_lines count desc
  const mostLines = [...entries]
    .sort((a, b) => b.win_lines.length - a.win_lines.length);

  return (
    <div className="w-full max-w-lg mx-auto mt-8 space-y-6">
      {/* First bingo */}
      {firstBingo.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-bold text-amber-500">Первое бинго</h3>
          </div>
          <div className="bg-zinc-900 border border-amber-500/20 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500">
                  <th className="text-left py-2 px-3 w-10">#</th>
                  <th className="text-left py-2 px-3">Игрок</th>
                  <th className="text-right py-2 px-3">Время</th>
                </tr>
              </thead>
              <tbody>
                {firstBingo.map((entry, i) => {
                  const isMe = entry.user_id === currentUserId;
                  const time = new Date(entry.completed_at!);
                  const timeStr = time.toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });
                  return (
                    <tr
                      key={entry.user_id}
                      className={`border-b border-zinc-800/50 last:border-0 ${
                        isMe ? 'bg-amber-500/10' : ''
                      }`}
                    >
                      <td className="py-2 px-3 text-zinc-400 font-mono">
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                      </td>
                      <td className={`py-2 px-3 font-medium ${isMe ? 'text-amber-400' : 'text-zinc-200'}`}>
                        {entry.user_name}
                        {isMe && <span className="text-zinc-500 text-xs ml-1.5">(вы)</span>}
                      </td>
                      <td className="py-2 px-3 text-right text-zinc-500 font-mono text-xs">
                        {timeStr}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Most lines */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Flame className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-bold text-amber-500">Больше всех линий</h3>
        </div>
        <div className="bg-zinc-900 border border-amber-500/20 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500">
                <th className="text-left py-2 px-3 w-10">#</th>
                <th className="text-left py-2 px-3">Игрок</th>
                <th className="text-right py-2 px-3">Линий</th>
              </tr>
            </thead>
            <tbody>
              {mostLines.map((entry, i) => {
                const isMe = entry.user_id === currentUserId;
                return (
                  <tr
                    key={entry.user_id}
                    className={`border-b border-zinc-800/50 last:border-0 ${
                      isMe ? 'bg-amber-500/10' : ''
                    }`}
                  >
                    <td className="py-2 px-3 text-zinc-400 font-mono">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                    </td>
                    <td className={`py-2 px-3 font-medium ${isMe ? 'text-amber-400' : 'text-zinc-200'}`}>
                      {entry.user_name}
                      {isMe && <span className="text-zinc-500 text-xs ml-1.5">(вы)</span>}
                    </td>
                    <td className="py-2 px-3 text-right text-zinc-400 font-bold">
                      {entry.win_lines.length} / 10
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
