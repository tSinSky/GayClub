'use server';

import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createAdminClient } from '@/lib/supabase/admin';
import { store } from '@/lib/store';
import { verifyAdmin } from './admin';
import { revalidatePath } from 'next/cache';
import type { Session } from '@/types';

export async function getSessions() {
  if (!isSupabaseConfigured()) {
    return store.getSessions();
  }
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Session[];
}

export async function getPublishedSessions() {
  if (!isSupabaseConfigured()) {
    return store.getPublishedSessions();
  }
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('published', true)
    .order('date', { ascending: true });
  if (error) throw error;
  return data as Session[];
}

export async function getSession(id: string) {
  if (!isSupabaseConfigured()) {
    return store.getSession(id);
  }
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return data as Session;
}

export async function createSession(
  session: Omit<Session, 'id' | 'created_at' | 'updated_at'>
) {
  if (!isSupabaseConfigured()) {
    const data = store.createSession(session);
    revalidatePath('/');
    revalidatePath('/admin');
    return { data };
  }

  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { error: 'Unauthorized' };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('sessions')
    .insert(session)
    .select()
    .single();
  if (error) return { error: error.message };

  revalidatePath('/');
  revalidatePath('/admin');
  return { data: data as Session };
}

export async function updateSession(id: string, updates: Partial<Session>) {
  if (!isSupabaseConfigured()) {
    const data = store.updateSession(id, updates);
    if (!data) return { error: 'Not found' };
    revalidatePath('/');
    revalidatePath(`/session/${id}`);
    revalidatePath('/admin');
    return { data };
  }

  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { error: 'Unauthorized' };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('sessions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) return { error: error.message };

  revalidatePath('/');
  revalidatePath(`/session/${id}`);
  revalidatePath('/admin');
  return { data: data as Session };
}

export async function deleteSession(id: string) {
  if (!isSupabaseConfigured()) {
    store.deleteSession(id);
    revalidatePath('/');
    revalidatePath('/admin');
    return { success: true };
  }

  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { error: 'Unauthorized' };

  const supabase = createAdminClient();
  const { error } = await supabase.from('sessions').delete().eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/');
  revalidatePath('/admin');
  return { success: true };
}
