'use server';

import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createAdminClient } from '@/lib/supabase/admin';
import { store } from '@/lib/store';
import { verifyAdmin } from './admin';
import { revalidatePath } from 'next/cache';
import { ICON_LIBRARY } from '@/lib/constants';
import type { SessionSection, SectionContent, SectionType } from '@/types';

const TITLE_MAX_LENGTH = 100;

function normalizeTitle(raw: string | null | undefined): string | null {
  if (raw == null || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, TITLE_MAX_LENGTH);
}

function normalizeIcon(raw: string | null | undefined): string | null {
  if (raw == null || typeof raw !== 'string') return null;
  if (raw in ICON_LIBRARY) return raw;
  return null;
}

export async function getSessionSections(sessionId: string): Promise<SessionSection[]> {
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

export interface UpsertSectionParams {
  id?: string;
  sessionId: string;
  type: SectionType;
  title: string | null;
  icon: string | null;
  content: SectionContent;
  enabled: boolean;
  sortOrder: number;
}

export async function upsertSection(
  params: UpsertSectionParams,
): Promise<{ data?: SessionSection; error?: string }> {
  const title = normalizeTitle(params.title);
  const icon = normalizeIcon(params.icon);

  // Custom sections require both a title and non-empty text.
  if (params.type === 'custom') {
    if (!title) return { error: 'Custom section requires a title' };
    if (!params.content.text?.trim()) {
      return { error: 'Custom section requires text' };
    }
  }

  if (!isSupabaseConfigured()) {
    const data = store.upsertSection({
      id: params.id,
      sessionId: params.sessionId,
      type: params.type,
      title,
      icon,
      content: params.content,
      enabled: params.enabled,
      sortOrder: params.sortOrder,
    });
    revalidatePath(`/session/${params.sessionId}`);
    return { data };
  }

  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { error: 'Unauthorized' };

  const supabase = createAdminClient();

  // Path A: update existing row by id (customs with known id, or built-ins being re-upserted)
  if (params.id) {
    const { data, error } = await supabase
      .from('session_sections')
      .update({
        type: params.type,
        title,
        icon,
        content: params.content,
        enabled: params.enabled,
        sort_order: params.sortOrder,
      })
      .eq('id', params.id)
      .eq('session_id', params.sessionId)
      .select()
      .single();
    if (error) return { error: error.message };
    revalidatePath(`/session/${params.sessionId}`);
    return { data: data as SessionSection };
  }

  // Path B: built-in upsert via select-then-update/insert
  // (The partial unique index `session_sections_builtin_unique` cannot be
  //  referenced by Supabase's `.upsert({ onConflict })` — Postgres requires
  //  the WHERE clause to match a partial index, which the JS client omits.)
  if (params.type !== 'custom') {
    const { data: existing } = await supabase
      .from('session_sections')
      .select('id')
      .eq('session_id', params.sessionId)
      .eq('type', params.type)
      .maybeSingle();

    if (existing) {
      const { data, error } = await supabase
        .from('session_sections')
        .update({
          title,
          icon,
          content: params.content,
          enabled: params.enabled,
          sort_order: params.sortOrder,
        })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) return { error: error.message };
      revalidatePath(`/session/${params.sessionId}`);
      return { data: data as SessionSection };
    }

    const { data, error } = await supabase
      .from('session_sections')
      .insert({
        session_id: params.sessionId,
        type: params.type,
        title,
        icon,
        content: params.content,
        enabled: params.enabled,
        sort_order: params.sortOrder,
      })
      .select()
      .single();
    if (error) return { error: error.message };
    revalidatePath(`/session/${params.sessionId}`);
    return { data: data as SessionSection };
  }

  // Path C: insert a new custom section
  const { data, error } = await supabase
    .from('session_sections')
    .insert({
      session_id: params.sessionId,
      type: 'custom',
      title,
      icon,
      content: params.content,
      enabled: params.enabled,
      sort_order: params.sortOrder,
    })
    .select()
    .single();
  if (error) return { error: error.message };
  revalidatePath(`/session/${params.sessionId}`);
  return { data: data as SessionSection };
}

export async function toggleSection(
  sessionId: string,
  type: SectionType,
  enabled: boolean,
): Promise<{ success?: true; error?: string }> {
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

export async function deleteCustomSection(
  sessionId: string,
  sectionId: string,
): Promise<{ success?: true; error?: string }> {
  if (!isSupabaseConfigured()) {
    const r = store.deleteCustomSection(sessionId, sectionId);
    if (!r.success) return { error: r.error };
    revalidatePath(`/session/${sessionId}`);
    return { success: true };
  }

  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { error: 'Unauthorized' };

  const supabase = createAdminClient();

  // Guard: verify row is custom before deleting
  const { data: row, error: readErr } = await supabase
    .from('session_sections')
    .select('id, type, session_id')
    .eq('id', sectionId)
    .eq('session_id', sessionId)
    .single();
  if (readErr || !row) return { error: 'Section not found' };
  if (row.type !== 'custom') return { error: 'Only custom sections can be deleted' };

  const { error: delErr } = await supabase
    .from('session_sections')
    .delete()
    .eq('id', sectionId)
    .eq('session_id', sessionId);
  if (delErr) return { error: delErr.message };

  revalidatePath(`/session/${sessionId}`);
  return { success: true };
}

export async function reorderSections(
  sessionId: string,
  orderedIds: string[],
): Promise<{ success?: true; error?: string }> {
  if (!isSupabaseConfigured()) {
    const r = store.reorderSections(sessionId, orderedIds);
    if (!r.success) return { error: r.error };
    revalidatePath(`/session/${sessionId}`);
    return { success: true };
  }

  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { error: 'Unauthorized' };

  const supabase = createAdminClient();

  // Validate: all ids belong to this session
  const { data: existing, error: readErr } = await supabase
    .from('session_sections')
    .select('id')
    .eq('session_id', sessionId);
  if (readErr) return { error: readErr.message };
  const validIds = new Set((existing ?? []).map((r) => r.id));
  for (const id of orderedIds) {
    if (!validIds.has(id)) return { error: `Section ${id} does not belong to session` };
  }

  // Batch update sort_order sequentially
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from('session_sections')
      .update({ sort_order: i })
      .eq('id', orderedIds[i])
      .eq('session_id', sessionId);
    if (error) return { error: error.message };
  }

  revalidatePath(`/session/${sessionId}`);
  return { success: true };
}
