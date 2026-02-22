'use server';

import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createAdminClient } from '@/lib/supabase/admin';
import { store } from '@/lib/store';
import { verifyAdmin } from './admin';
import { revalidatePath } from 'next/cache';
import { checkBingoWin } from '@/lib/bingo-utils';
import type { BingoItem, BingoProgress, BingoLeaderboardEntry } from '@/types';

export async function getBingoItems(sessionId: string) {
  if (!isSupabaseConfigured()) {
    return store.getBingoItems(sessionId);
  }
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('bingo_items')
    .select('*')
    .eq('session_id', sessionId)
    .order('sort_order', { ascending: true });
  if (error) return [];
  return data as BingoItem[];
}

export async function saveBingoItems(
  sessionId: string,
  items: { text: string; sort_order: number }[]
) {
  if (!isSupabaseConfigured()) {
    store.saveBingoItems(sessionId, items);
    revalidatePath(`/session/${sessionId}/bingo`);
    return { success: true };
  }

  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { error: 'Unauthorized' };

  const supabase = createAdminClient();
  await supabase.from('bingo_items').delete().eq('session_id', sessionId);

  if (items.length > 0) {
    const { error } = await supabase.from('bingo_items').insert(
      items.map((item) => ({
        session_id: sessionId,
        text: item.text,
        sort_order: item.sort_order,
      }))
    );
    if (error) return { error: error.message };
  }

  revalidatePath(`/session/${sessionId}/bingo`);
  return { success: true };
}

// --- Bingo Progress (multiplayer) ---

export async function saveBingoMark(
  sessionId: string,
  userId: string,
  userName: string,
  marked: boolean[]
): Promise<{ success: boolean; completedAt?: string | null; winLines?: number[][] }> {
  const winLines = checkBingoWin(marked);
  const hasWon = winLines.length > 0;

  if (!isSupabaseConfigured()) {
    const existing = store.getBingoProgress(sessionId, userId);
    // completed_at = time of FIRST bingo, never overwritten
    const completedAt = hasWon && !existing?.completed_at
      ? new Date().toISOString()
      : existing?.completed_at || null;

    store.upsertBingoProgress(
      sessionId, userId, userName, marked,
      completedAt, winLines
    );
    return { success: true, completedAt, winLines };
  }

  const supabase = createAdminClient();

  // Check if already exists
  const { data: existing, error: fetchError } = await supabase
    .from('bingo_progress')
    .select('id, completed_at')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .single();

  // PGRST116 = no rows found, which is fine for new users
  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('[saveBingoMark] fetch error:', fetchError);
    return { success: false };
  }

  const completedAt = hasWon && !existing?.completed_at
    ? new Date().toISOString()
    : existing?.completed_at || null;

  if (existing) {
    const { error } = await supabase
      .from('bingo_progress')
      .update({
        marked,
        completed_at: completedAt,
        win_lines: winLines,
        user_name: userName,
      })
      .eq('id', existing.id);
    if (error) {
      console.error('[saveBingoMark] update error:', error);
      return { success: false };
    }
  } else {
    const { error } = await supabase
      .from('bingo_progress')
      .insert({
        session_id: sessionId,
        user_id: userId,
        user_name: userName,
        marked,
        completed_at: completedAt,
        win_lines: winLines,
      });
    if (error) {
      console.error('[saveBingoMark] insert error:', error);
      return { success: false };
    }
  }

  return { success: true, completedAt, winLines };
}

export async function getBingoProgress(
  sessionId: string,
  userId: string
): Promise<BingoProgress | null> {
  if (!isSupabaseConfigured()) {
    return store.getBingoProgress(sessionId, userId);
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('bingo_progress')
    .select('*')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return data as BingoProgress;
}

export async function getBingoLeaderboard(
  sessionId: string
): Promise<BingoLeaderboardEntry[]> {
  if (!isSupabaseConfigured()) {
    const all = store.getBingoLeaderboard(sessionId);
    return all.map((e) => ({
      user_id: e.user_id,
      user_name: e.user_name,
      completed_at: e.completed_at,
      win_lines: e.win_lines || [],
    }));
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('bingo_progress')
    .select('user_id, user_name, completed_at, win_lines')
    .eq('session_id', sessionId)
    .not('win_lines', 'eq', '[]');

  if (error) {
    console.error('[getBingoLeaderboard] error:', error);
    return [];
  }
  return (data || []) as BingoLeaderboardEntry[];
}

export async function resetBingoProgress(
  sessionId: string,
  userId: string
): Promise<{ success: boolean }> {
  if (!isSupabaseConfigured()) {
    store.resetBingoProgress(sessionId, userId);
    return { success: true };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('bingo_progress')
    .delete()
    .eq('session_id', sessionId)
    .eq('user_id', userId);

  if (error) return { success: false };
  return { success: true };
}
