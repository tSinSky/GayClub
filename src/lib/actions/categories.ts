'use server';

import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createAdminClient } from '@/lib/supabase/admin';
import { store } from '@/lib/store';
import { verifyAdmin } from './admin';
import type { RatingCategory } from '@/types';

export async function getRatingCategories() {
  if (!isSupabaseConfigured()) {
    return store.getRatingCategories();
  }
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('rating_categories')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) return [];
  return data as RatingCategory[];
}

export async function saveRatingCategories(
  categories: { id: string; name: string; description?: string | null; icon: string | null; sort_order: number }[]
) {
  if (!isSupabaseConfigured()) {
    store.saveRatingCategories(
      categories.map(c => ({ ...c, description: c.description ?? null }))
    );
    return { success: true };
  }

  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { error: 'Unauthorized' };

  const supabase = createAdminClient();
  await supabase.from('rating_categories').delete().neq('id', '');

  if (categories.length > 0) {
    const { error } = await supabase
      .from('rating_categories')
      .insert(categories);
    if (error) return { error: error.message };
  }

  return { success: true };
}
