'use server';

import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createAdminClient } from '@/lib/supabase/admin';
import { store } from '@/lib/store';
import { revalidatePath } from 'next/cache';
import type { Rating } from '@/types';

export async function submitRating(
  sessionId: string,
  userId: string,
  scores: Record<string, number>,
  userName?: string
) {
  if (!isSupabaseConfigured()) {
    const data = store.upsertRating(sessionId, userId, scores, userName || null);
    revalidatePath(`/session/${sessionId}`);
    revalidatePath('/ratings');
    return { data };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('ratings')
    .upsert(
      { session_id: sessionId, user_id: userId, scores, user_name: userName || null },
      { onConflict: 'session_id,user_id' }
    )
    .select()
    .single();
  if (error) return { error: error.message };

  revalidatePath(`/session/${sessionId}`);
  revalidatePath('/ratings');
  return { data: data as Rating };
}

export async function getSessionRatings(sessionId: string) {
  if (!isSupabaseConfigured()) {
    return store.getSessionRatings(sessionId);
  }
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('ratings')
    .select('*')
    .eq('session_id', sessionId);
  if (error) return [];
  return data as Rating[];
}

export async function getAllRatings() {
  if (!isSupabaseConfigured()) {
    return store.getAllRatings();
  }
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('ratings')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return [];
  return data as Rating[];
}
