'use server';

import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createAdminClient } from '@/lib/supabase/admin';
import { store } from '@/lib/store';

const JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || 'fallback-secret-change-me-please-32ch'
);

// Default password for dev mode
const DEV_PASSWORD = 'cinema123';

export async function loginAdmin(password: string) {
  if (!isSupabaseConfigured()) {
    // Dev mode: check against stored hash or default
    const storedHash = store.getSetting('admin_password_hash');
    if (storedHash) {
      const valid = await bcrypt.compare(password, storedHash);
      if (!valid) return { error: 'Неверный пароль' };
    } else {
      if (password !== DEV_PASSWORD) return { error: 'Неверный пароль' };
      // Store hash for future
      const hash = await bcrypt.hash(DEV_PASSWORD, 10);
      store.setSetting('admin_password_hash', hash);
    }
  } else {
    const supabase = createAdminClient();
    const { data: setting } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'admin_password_hash')
      .single();

    if (!setting) {
      const hash = await bcrypt.hash(DEV_PASSWORD, 10);
      await supabase
        .from('admin_settings')
        .upsert({ key: 'admin_password_hash', value: hash });
      if (password !== DEV_PASSWORD) return { error: 'Неверный пароль' };
    } else {
      const valid = await bcrypt.compare(password, setting.value);
      if (!valid) return { error: 'Неверный пароль' };
    }
  }

  const token = await new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(JWT_SECRET);

  const cookieStore = await cookies();
  cookieStore.set('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });

  return { success: true };
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_token');
  return { success: true };
}

export async function verifyAdmin(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;
    if (!token) return false;

    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.role === 'admin';
  } catch {
    return false;
  }
}

export async function changeAdminPassword(
  currentPassword: string,
  newPassword: string
) {
  if (!isSupabaseConfigured()) {
    const storedHash = store.getSetting('admin_password_hash');
    if (storedHash) {
      const valid = await bcrypt.compare(currentPassword, storedHash);
      if (!valid) return { error: 'Текущий пароль неверен' };
    }
    const hash = await bcrypt.hash(newPassword, 10);
    store.setSetting('admin_password_hash', hash);
    return { success: true };
  }

  const supabase = createAdminClient();
  const { data: setting } = await supabase
    .from('admin_settings')
    .select('value')
    .eq('key', 'admin_password_hash')
    .single();

  if (setting) {
    const valid = await bcrypt.compare(currentPassword, setting.value);
    if (!valid) return { error: 'Текущий пароль неверен' };
  }

  const hash = await bcrypt.hash(newPassword, 10);
  await supabase
    .from('admin_settings')
    .upsert({ key: 'admin_password_hash', value: hash });

  return { success: true };
}
