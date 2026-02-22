'use server';

import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createAdminClient } from '@/lib/supabase/admin';
import { store } from '@/lib/store';
import { verifyAdmin } from './admin';
import { revalidatePath } from 'next/cache';
import type { SessionSection, SectionContent, SectionType } from '@/types';

export async function getSessionSections(sessionId: string) {
  if (!isSupabaseConfigured()) {
    return store.getSessionSections(sessionId);
  }
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('session_sections')
    .select('*')
    .eq('session_id', sessionId)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data as SessionSection[];
}

export async function upsertSection(
  sessionId: string,
  type: SectionType,
  content: SectionContent,
  enabled: boolean = true,
  sortOrder: number = 0
) {
  if (!isSupabaseConfigured()) {
    const data = store.upsertSection(sessionId, type, content, enabled, sortOrder);
    revalidatePath(`/session/${sessionId}`);
    return { data };
  }

  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { error: 'Unauthorized' };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('session_sections')
    .upsert(
      { session_id: sessionId, type, content, enabled, sort_order: sortOrder },
      { onConflict: 'session_id,type' }
    )
    .select()
    .single();
  if (error) return { error: error.message };

  revalidatePath(`/session/${sessionId}`);
  return { data: data as SessionSection };
}

export async function toggleSection(
  sessionId: string,
  type: SectionType,
  enabled: boolean
) {
  if (!isSupabaseConfigured()) {
    store.toggleSection(sessionId, type, enabled);
    revalidatePath(`/session/${sessionId}`);
    return { success: true };
  }

  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { error: 'Unauthorized' };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('session_sections')
    .update({ enabled })
    .eq('session_id', sessionId)
    .eq('type', type);
  if (error) return { error: error.message };

  revalidatePath(`/session/${sessionId}`);
  return { success: true };
}
