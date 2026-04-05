'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { verifyAdmin } from './admin';

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const BUCKET = 'session-images';

export async function uploadSessionImage(
  formData: FormData
): Promise<{ url: string } | { error: string }> {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { error: 'Сессия истекла, обновите страницу' };

  if (!isSupabaseConfigured()) {
    return { error: 'Загрузка недоступна в локальном режиме без Supabase' };
  }

  const file = formData.get('file');
  const sessionIdRaw = formData.get('sessionId');

  if (!(file instanceof File)) {
    return { error: 'Файл не передан' };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: 'Можно загружать только картинки (jpeg, png, webp, gif)' };
  }
  if (file.size > MAX_SIZE) {
    return { error: 'Файл слишком большой, максимум 10 MB' };
  }

  const extFromName = file.name.includes('.') ? file.name.split('.').pop() : undefined;
  const extFromMime = file.type.split('/')[1];
  const ext = (extFromName || extFromMime || 'bin').toLowerCase();
  const namespace =
    typeof sessionIdRaw === 'string' && sessionIdRaw.length > 0 ? sessionIdRaw : 'drafts';
  const path = `${namespace}/${crypto.randomUUID()}.${ext}`;

  const supabase = createAdminClient();
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  });

  if (uploadError) {
    return { error: `Ошибка загрузки: ${uploadError.message}` };
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
}
