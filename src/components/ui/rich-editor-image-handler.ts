import type { Editor } from '@tiptap/react';
import { toast } from 'sonner';
import { uploadSessionImage } from '@/lib/actions/uploads';

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * Upload a file via the server action and insert it at the given position
 * (or at the current cursor position if `pos` is undefined).
 */
export async function uploadAndInsertImage(
  editor: Editor,
  file: File,
  sessionId: string | undefined,
  pos?: number
): Promise<void> {
  if (!ALLOWED.includes(file.type)) {
    toast.error('Можно вставлять только картинки');
    return;
  }
  if (file.size > MAX_SIZE) {
    toast.error('Файл слишком большой, максимум 10 MB');
    return;
  }

  const loadingId = toast.loading('Загружаю картинку…');

  try {
    const fd = new FormData();
    fd.append('file', file);
    if (sessionId) fd.append('sessionId', sessionId);

    const result = await uploadSessionImage(fd);

    toast.dismiss(loadingId);

    if ('error' in result) {
      toast.error(result.error);
      return;
    }

    if (typeof pos === 'number') {
      editor
        .chain()
        .focus()
        .insertContentAt(pos, { type: 'image', attrs: { src: result.url } })
        .run();
    } else {
      editor.chain().focus().setImage({ src: result.url }).run();
    }

    toast.success('Картинка загружена');
  } catch (e) {
    toast.dismiss(loadingId);
    const msg = e instanceof Error ? e.message : 'неизвестная ошибка';
    toast.error(`Не удалось загрузить: ${msg}`);
  }
}

/** Pull image files out of a drop event's DataTransfer. */
export function extractImageFilesFromDataTransfer(dt: DataTransfer | null): File[] {
  if (!dt) return [];
  const out: File[] = [];
  for (const f of Array.from(dt.files ?? [])) {
    if (f.type.startsWith('image/')) out.push(f);
  }
  return out;
}

/** Pull image files out of a paste event's clipboardData items. */
export function extractImageFilesFromClipboard(
  items: DataTransferItemList | null | undefined
): File[] {
  if (!items) return [];
  const out: File[] = [];
  for (const item of Array.from(items)) {
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      const f = item.getAsFile();
      if (f) out.push(f);
    }
  }
  return out;
}
