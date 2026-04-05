# WYSIWYG Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace markdown `<Textarea>` fields in `/admin` session editor with a TipTap-based WYSIWYG editor, including inline image upload via Supabase Storage.

**Architecture:** Single `<RichEditor>` component with a `features` prop for contextual toolbars. Markdown round-trips via `tiptap-markdown`, so the DB format stays identical and the public renderer (`MarkdownContent` with `react-markdown`) is untouched. Image upload runs through a server action using the existing `createAdminClient` (service role, bypasses Supabase RLS).

**Tech Stack:** Next.js 16, React 19, TipTap v2, `tiptap-markdown`, shadcn/ui, Tailwind v4, Supabase (Storage + Postgres), `sonner` (toasts).

**Spec:** `docs/superpowers/specs/2026-04-05-wysiwyg-editor-design.md`

**Note on testing:** the repo has no test runner. Per the spec, we don't add one just for this feature. Each task ends with a **manual verification** step and a commit.

---

## File Structure

| File | New? | Responsibility |
|---|---|---|
| `package.json` | modify | Add TipTap deps |
| `supabase/migrations/004_session_images_bucket.sql` | new | Create public `session-images` bucket with SELECT policy |
| `src/lib/actions/uploads.ts` | new | Server action `uploadSessionImage` (auth + validate + upload) |
| `src/types/index.ts` | modify | Deprecate `SectionContent.images` |
| `src/components/ui/rich-editor.tsx` | new | Main `<RichEditor>` component (TipTap setup, toolbar, feature gating, markdown I/O) |
| `src/components/ui/rich-editor-image-handler.ts` | new | Image upload helpers, drop/paste extraction |
| `src/components/admin/section-editor.tsx` | modify | Replace 4 `<Textarea>` call sites with `<RichEditor>`, delete `images[]` block |
| `src/components/admin/session-form.tsx` | modify | Thread `sessionId` prop down to `<SectionEditor>` |
| `scripts/migrate-inline-images.ts` | new | One-time migration of `content.images[]` → inline markdown |

---

## Phase 1: Foundation

### Task 1: Install TipTap dependencies

**Files:**
- Modify: `package.json`, `package-lock.json` (via npm)

- [ ] **Step 1: Install deps**

```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-image @tiptap/extension-placeholder tiptap-markdown
```

- [ ] **Step 2: Verify React 19 compat**

```bash
npm list @tiptap/react react
```

Expected: `@tiptap/react` resolves to `^2.11.0` or later (these versions support React 19). `react@19.2.3`. If npm warns about peer dep mismatch, install a newer TipTap explicitly: `npm install @tiptap/react@latest @tiptap/starter-kit@latest @tiptap/extension-link@latest @tiptap/extension-image@latest @tiptap/extension-placeholder@latest`.

- [ ] **Step 3: Build check**

```bash
npm run lint
```

Expected: passes. No new code yet, just deps.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add TipTap dependencies for WYSIWYG editor"
```

---

### Task 2: Create Supabase Storage bucket migration

**Files:**
- Create: `supabase/migrations/004_session_images_bucket.sql`

- [ ] **Step 1: Write migration**

Create `supabase/migrations/004_session_images_bucket.sql`:

```sql
-- 004_session_images_bucket.sql
-- Public bucket for inline images uploaded via the WYSIWYG editor in /admin.
-- Server actions use SUPABASE_SERVICE_ROLE_KEY (via createAdminClient), which
-- bypasses RLS, so we only need a public SELECT policy for readers.

insert into storage.buckets (id, name, public)
values ('session-images', 'session-images', true)
on conflict (id) do nothing;

create policy "public can read session images"
  on storage.objects for select
  using (bucket_id = 'session-images');
```

- [ ] **Step 2: Apply migration to dev Supabase**

If the project uses Supabase CLI locally: `supabase db push`.
Otherwise, copy the SQL into the Supabase dashboard → SQL Editor → Run.

- [ ] **Step 3: Verify**

In the Supabase dashboard → Storage, confirm:
- A bucket named `session-images` exists
- It is marked **Public**
- Trying to fetch `https://<project>.supabase.co/storage/v1/object/public/session-images/nonexistent.jpg` returns 404 (not 403 — meaning the policy allows reads, the object just isn't there)

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/004_session_images_bucket.sql
git commit -m "feat(db): add session-images storage bucket"
```

---

### Task 3: Add `uploadSessionImage` server action

**Files:**
- Create: `src/lib/actions/uploads.ts`

- [ ] **Step 1: Create the action**

Create `src/lib/actions/uploads.ts`:

```ts
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
```

- [ ] **Step 2: Lint**

```bash
npm run lint
```

Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add src/lib/actions/uploads.ts
git commit -m "feat(actions): add uploadSessionImage server action"
```

---

### Task 4: Deprecate `SectionContent.images` in types

**Files:**
- Modify: `src/types/index.ts:30`

- [ ] **Step 1: Add JSDoc deprecation**

In `src/types/index.ts`, change line 30 from:

```ts
  images?: string[];
```

to:

```ts
  /**
   * @deprecated Inline images now live inside `text` as markdown `![](url)`.
   * Kept only so `scripts/migrate-inline-images.ts` can read the old shape.
   * Remove after the migration has run on all environments.
   */
  images?: string[];
```

- [ ] **Step 2: Lint**

```bash
npm run lint
```

Expected: passes. The deprecated annotation is informational; existing call sites that still touch `content.images` (we'll remove them in Task 8) may show editor warnings but no hard errors.

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "refactor(types): deprecate SectionContent.images"
```

---

## Phase 2: Build RichEditor

### Task 5: Create image handler helpers

**Files:**
- Create: `src/components/ui/rich-editor-image-handler.ts`

Isolating the upload logic into a separate file keeps `rich-editor.tsx` focused on the editor setup.

- [ ] **Step 1: Create the file**

Create `src/components/ui/rich-editor-image-handler.ts`:

```ts
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
```

- [ ] **Step 2: Lint**

```bash
npm run lint
```

Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/rich-editor-image-handler.ts
git commit -m "feat(ui): add image upload helpers for RichEditor"
```

---

### Task 6: Create the `<RichEditor>` component

**Files:**
- Create: `src/components/ui/rich-editor.tsx`

This is the main component — TipTap setup, markdown round-trip, feature-gated toolbar, and drop/paste image wiring.

- [ ] **Step 1: Create the file**

Create `src/components/ui/rich-editor.tsx`:

```tsx
'use client';

import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { useEffect, useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Quote as QuoteIcon,
  ImagePlus,
} from 'lucide-react';
import {
  uploadAndInsertImage,
  extractImageFilesFromClipboard,
  extractImageFilesFromDataTransfer,
} from './rich-editor-image-handler';

export type RichEditorFeature =
  | 'bold'
  | 'italic'
  | 'link'
  | 'list'
  | 'heading'
  | 'blockquote'
  | 'image';

export interface RichEditorProps {
  value: string;
  onChange: (markdown: string) => void;
  features: RichEditorFeature[];
  placeholder?: string;
  className?: string;
  /** Used to namespace uploaded images in Supabase Storage. Undefined = drafts/. */
  sessionId?: string;
}

export function RichEditor({
  value,
  onChange,
  features,
  placeholder,
  className,
  sessionId,
}: RichEditorProps) {
  const has = useMemo(
    () => (f: RichEditorFeature) => features.includes(f),
    [features]
  );

  // Keep latest sessionId in a ref so the paste/drop handlers always see current value
  // without re-creating the editor.
  const sessionIdRef = useRef(sessionId);
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  const editor = useEditor({
    immediatelyRender: false, // required for Next.js SSR
    extensions: [
      StarterKit.configure({
        heading: has('heading') ? { levels: [2, 3] } : false,
        blockquote: has('blockquote') ? undefined : false,
        bulletList: has('list') ? undefined : false,
        orderedList: has('list') ? undefined : false,
        listItem: has('list') ? undefined : false,
        horizontalRule: false,
        codeBlock: false,
        code: false,
        strike: false,
      }),
      Markdown.configure({
        html: false,
        tightLists: true,
        bulletListMarker: '-',
        linkify: false,
        breaks: false,
      }),
      Placeholder.configure({ placeholder: placeholder ?? '' }),
      ...(has('link')
        ? [
            Link.configure({
              openOnClick: false,
              autolink: false,
              HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
            }),
          ]
        : []),
      ...(has('image') ? [Image.configure({ inline: false, allowBase64: false })] : []),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.storage.markdown.getMarkdown());
    },
  });

  // External value changes (e.g. form reset) → push into editor without emitting onUpdate
  useEffect(() => {
    if (!editor) return;
    const current = editor.storage.markdown.getMarkdown();
    if (current !== value) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  // Attach drop/paste listeners for image upload
  useEffect(() => {
    if (!editor || !has('image')) return;
    const dom = editor.view.dom;

    const onPaste = (event: ClipboardEvent) => {
      const files = extractImageFilesFromClipboard(event.clipboardData?.items ?? null);
      if (files.length === 0) return;
      event.preventDefault();
      for (const file of files) {
        void uploadAndInsertImage(editor, file, sessionIdRef.current);
      }
    };

    const onDrop = (event: DragEvent) => {
      const files = extractImageFilesFromDataTransfer(event.dataTransfer);
      if (files.length === 0) return;
      event.preventDefault();
      const coords = editor.view.posAtCoords({
        left: event.clientX,
        top: event.clientY,
      });
      for (const file of files) {
        void uploadAndInsertImage(editor, file, sessionIdRef.current, coords?.pos);
      }
    };

    dom.addEventListener('paste', onPaste);
    dom.addEventListener('drop', onDrop);
    return () => {
      dom.removeEventListener('paste', onPaste);
      dom.removeEventListener('drop', onDrop);
    };
  }, [editor, has]);

  if (!editor) return null;

  return (
    <div
      className={cn(
        'rounded-md border border-zinc-800 bg-zinc-950/60 focus-within:border-amber-500/40 focus-within:ring-2 focus-within:ring-amber-500/20',
        className
      )}
    >
      <Toolbar editor={editor} features={features} />
      <EditorContent
        editor={editor}
        className={cn(
          'prose prose-invert prose-sm max-w-none px-4 py-3 text-[13px] text-zinc-100',
          '[&_.ProseMirror]:min-h-[80px] [&_.ProseMirror]:outline-none',
          '[&_.ProseMirror_p.is-editor-empty:first-child]:before:pointer-events-none',
          '[&_.ProseMirror_p.is-editor-empty:first-child]:before:float-left',
          '[&_.ProseMirror_p.is-editor-empty:first-child]:before:h-0',
          '[&_.ProseMirror_p.is-editor-empty:first-child]:before:text-zinc-600',
          "[&_.ProseMirror_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]",
          '[&_.ProseMirror_img]:rounded-lg [&_.ProseMirror_img]:ring-1 [&_.ProseMirror_img]:ring-white/10 [&_.ProseMirror_img]:max-h-96'
        )}
      />
    </div>
  );
}

/* --------------------------- Toolbar --------------------------- */

function ToolbarButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active?: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Button
      size="icon-sm"
      type="button"
      variant="ghost"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'size-7 rounded text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100',
        active && 'bg-amber-500/15 text-amber-300'
      )}
    >
      <Icon className="size-3.5" />
    </Button>
  );
}

function Separator() {
  return <span className="mx-1 h-5 w-px bg-zinc-800" />;
}

function Toolbar({
  editor,
  features,
}: {
  editor: Editor;
  features: RichEditorFeature[];
}) {
  const has = (f: RichEditorFeature) => features.includes(f);

  const promptLink = () => {
    const previous = (editor.getAttributes('link').href as string) ?? '';
    const url = window.prompt('URL ссылки:', previous);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const promptImage = () => {
    const url = window.prompt('URL картинки:');
    if (!url) return;
    editor.chain().focus().setImage({ src: url }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-zinc-800/80 px-2 py-1.5">
      {has('bold') && (
        <ToolbarButton
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          icon={Bold}
          label="Жирный (Cmd+B)"
        />
      )}
      {has('italic') && (
        <ToolbarButton
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          icon={Italic}
          label="Курсив (Cmd+I)"
        />
      )}

      {has('link') && (
        <>
          <Separator />
          <ToolbarButton
            active={editor.isActive('link')}
            onClick={promptLink}
            icon={LinkIcon}
            label="Ссылка"
          />
        </>
      )}

      {has('list') && (
        <>
          <Separator />
          <ToolbarButton
            active={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            icon={List}
            label="Маркированный список"
          />
          <ToolbarButton
            active={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            icon={ListOrdered}
            label="Нумерованный список"
          />
        </>
      )}

      {has('heading') && (
        <>
          <Separator />
          <ToolbarButton
            active={editor.isActive('heading', { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            icon={Heading2}
            label="Заголовок 2"
          />
          <ToolbarButton
            active={editor.isActive('heading', { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            icon={Heading3}
            label="Заголовок 3"
          />
        </>
      )}

      {has('blockquote') && (
        <>
          <Separator />
          <ToolbarButton
            active={editor.isActive('blockquote')}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            icon={QuoteIcon}
            label="Цитата"
          />
        </>
      )}

      {has('image') && (
        <>
          <Separator />
          <ToolbarButton
            onClick={promptImage}
            icon={ImagePlus}
            label="Картинка (drag&drop, Cmd+V или URL)"
          />
        </>
      )}
    </div>
  );
}

export default RichEditor;
```

- [ ] **Step 2: Lint**

```bash
npm run lint
```

Expected: passes. If you see `react-hooks/exhaustive-deps` warnings, check that the `has` dependency in the drop/paste effect is stable (it is — wrapped in `useMemo`).

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/rich-editor.tsx
git commit -m "feat(ui): add RichEditor component with TipTap + markdown round-trip"
```

---

## Phase 3: Integrate into admin forms

### Task 7: Thread `sessionId` through form components

**Files:**
- Modify: `src/components/admin/session-form.tsx:496-500`
- Modify: `src/components/admin/section-editor.tsx:30-34`

- [ ] **Step 1: Add `sessionId` prop to `SectionEditor`**

In `src/components/admin/section-editor.tsx`, find the `Props` interface around line 30:

```tsx
interface Props {
  type: SectionType;
  content: SectionContent;
  onChange: (content: SectionContent) => void;
}
```

Change to:

```tsx
interface Props {
  type: SectionType;
  content: SectionContent;
  onChange: (content: SectionContent) => void;
  sessionId?: string;
}
```

Then in the same file, change the component signature (around line 166):

```tsx
export default function SectionEditor({ type, content, onChange }: Props) {
```

to:

```tsx
export default function SectionEditor({ type, content, onChange, sessionId }: Props) {
```

- [ ] **Step 2: Pass `sessionId` from `SessionForm`**

In `src/components/admin/session-form.tsx`, find the `<SectionEditor>` call around line 496:

```tsx
<SectionEditor
  type={type}
  content={sectionState[type].content}
  onChange={(content) => updateSectionContent(type, content)}
/>
```

Change to:

```tsx
<SectionEditor
  type={type}
  content={sectionState[type].content}
  onChange={(content) => updateSectionContent(type, content)}
  sessionId={session?.id}
/>
```

- [ ] **Step 3: Lint**

```bash
npm run lint
```

Expected: passes. `sessionId` is currently unused inside `SectionEditor` — that's fine, we'll consume it in Task 8.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/section-editor.tsx src/components/admin/session-form.tsx
git commit -m "refactor(admin): thread sessionId from SessionForm to SectionEditor"
```

---

### Task 8: Replace quote.text with `<RichEditor>` (smoke test)

Cheapest integration first — quote text only needs bold/italic. Verifies the full pipeline (markdown round-trip + form state + DB) on a low-risk field.

**Files:**
- Modify: `src/components/admin/section-editor.tsx`

- [ ] **Step 1: Add import**

At the top of `section-editor.tsx`, below existing component imports, add:

```ts
import { RichEditor } from '@/components/ui/rich-editor';
```

- [ ] **Step 2: Replace the quote `<Textarea>`**

Find the block around line 529-534:

```tsx
<Textarea
  value={quote.text}
  onChange={(e) => updateQuote(i, 'text', e.target.value)}
  placeholder="«Всё, что я видел, исчезнет во времени, как слёзы под дождём…»"
  className="min-h-20 resize-y border-zinc-800 bg-zinc-950/60 px-4 py-3 text-[13px] italic leading-relaxed text-zinc-100 placeholder:text-zinc-600 focus-visible:border-amber-500/40 focus-visible:ring-amber-500/20"
/>
```

Replace with:

```tsx
<RichEditor
  value={quote.text}
  onChange={(md) => updateQuote(i, 'text', md)}
  features={['bold', 'italic']}
  placeholder="«Всё, что я видел, исчезнет во времени, как слёзы под дождём…»"
  className="min-h-20"
  sessionId={sessionId}
/>
```

- [ ] **Step 3: Lint**

```bash
npm run lint
```

Expected: passes.

- [ ] **Step 4: Manual verification**

```bash
npm run dev
```

Open `http://localhost:3000/admin`, log in, open an existing session and navigate to the **Themes** section (or create a new one and add a quote).

Verify:
- Quote text field shows a small toolbar with only **Ж** (Bold) and **К** (Italic) buttons — no link/list/heading/image buttons
- Typing text and clicking **Ж** makes selected text bold. Visual feedback is immediate (text becomes bold).
- Keyboard shortcut Cmd+B (Ctrl+B on Linux/Windows) toggles bold.
- Click **Save** → reload the page → the quote text is still bold.
- Open Supabase dashboard → `session_sections` table → find the row → in the `content` JSON, the quote text should contain literal `**` around the bold portion (e.g. `"Во времени, как **слёзы** под дождём…"`).
- Open the public session page (`/sessions/<slug>` or wherever it lives) → the quote shows bold text correctly (the existing `react-markdown` renderer already handles this).

If any of the above fails, stop and diagnose before moving on.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/section-editor.tsx
git commit -m "feat(admin): use RichEditor for quote.text field"
```

---

### Task 9: Replace remaining `<Textarea>` call sites with `<RichEditor>`

Three fields: main section text, director bio, fact card description. Each with its own `features` set per the spec.

**Files:**
- Modify: `src/components/admin/section-editor.tsx`

- [ ] **Step 1: Replace the main section text field**

Find around line 289:

```tsx
<Textarea
  value={content.text || ''}
  onChange={(e) => updateText(e.target.value)}
  placeholder="Основной текст раздела… Поддерживает Markdown: **жирный**, *курсив*, [ссылки](url), списки."
  className="min-h-36 resize-y border-zinc-800 bg-zinc-950/60 px-4 py-3 text-[13px] leading-relaxed text-zinc-100 placeholder:text-zinc-600 focus-visible:border-amber-500/40 focus-visible:ring-amber-500/20"
/>
```

Replace with:

```tsx
<RichEditor
  value={content.text || ''}
  onChange={updateText}
  features={['bold', 'italic', 'link', 'list', 'heading', 'blockquote', 'image']}
  placeholder="Основной текст раздела…"
  className="min-h-36"
  sessionId={sessionId}
/>
```

Also delete the now-redundant surrounding block (lines ~272-298 in the original file) — specifically the markdown hint spans and the fallback help text. Replace the entire wrapper from:

```tsx
<div>
  <div className="mb-2 flex items-center justify-between">
    <Label className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-400">
      <Type className="size-3" />
      Основной текст
    </Label>
    <div className="hidden items-center gap-1.5 md:flex">
      {['**жирный**', '*курсив*', '## заголовок', '- список', '[текст](url)'].map((hint) => (
        <span
          key={hint}
          className="rounded border border-zinc-800 bg-zinc-900/60 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500"
        >
          {hint}
        </span>
      ))}
    </div>
  </div>
  <Textarea
    value={content.text || ''}
    onChange={(e) => updateText(e.target.value)}
    placeholder="Основной текст раздела… Поддерживает Markdown: **жирный**, *курсив*, [ссылки](url), списки."
    className="min-h-36 resize-y border-zinc-800 bg-zinc-950/60 px-4 py-3 text-[13px] leading-relaxed text-zinc-100 placeholder:text-zinc-600 focus-visible:border-amber-500/40 focus-visible:ring-amber-500/20"
  />
  <p className="mt-2 text-[11px] text-zinc-600 md:hidden">
    Поддерживает Markdown: **жирный**, *курсив*, ## заголовки, списки, [ссылки](url)
  </p>
</div>
```

to:

```tsx
<div>
  <Label className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-400">
    <Type className="size-3" />
    Основной текст
  </Label>
  <RichEditor
    value={content.text || ''}
    onChange={updateText}
    features={['bold', 'italic', 'link', 'list', 'heading', 'blockquote', 'image']}
    placeholder="Основной текст раздела…"
    className="min-h-36"
    sessionId={sessionId}
  />
</div>
```

- [ ] **Step 2: Replace the director bio field**

Find around line 338-345:

```tsx
<FieldWrap label="Биография" icon={FileText}>
  <Textarea
    value={content.director?.bio || ''}
    onChange={(e) => updateDirector({ bio: e.target.value })}
    placeholder="Биография режиссёра… (поддерживает Markdown)"
    className="min-h-28 resize-y border-zinc-800 bg-zinc-950/60 px-4 py-3 text-[13px] leading-relaxed text-zinc-100 placeholder:text-zinc-600 focus-visible:border-amber-500/40 focus-visible:ring-amber-500/20"
  />
</FieldWrap>
```

Replace with:

```tsx
<FieldWrap label="Биография" icon={FileText}>
  <RichEditor
    value={content.director?.bio || ''}
    onChange={(md) => updateDirector({ bio: md })}
    features={['bold', 'italic', 'link', 'list', 'image']}
    placeholder="Биография режиссёра…"
    className="min-h-28"
    sessionId={sessionId}
  />
</FieldWrap>
```

- [ ] **Step 3: Replace the fact card description field**

Find around line 613-620:

```tsx
<FieldWrap label="Описание" icon={FileText}>
  <Textarea
    value={card.description}
    onChange={(e) => updateCard(i, 'description', e.target.value)}
    placeholder="Опишите факт… (поддерживает Markdown)"
    className="min-h-24 resize-y border-zinc-800 bg-zinc-950/60 px-4 py-3 text-[13px] leading-relaxed text-zinc-100 placeholder:text-zinc-600 focus-visible:border-amber-500/40 focus-visible:ring-amber-500/20"
  />
</FieldWrap>
```

Replace with:

```tsx
<FieldWrap label="Описание" icon={FileText}>
  <RichEditor
    value={card.description}
    onChange={(md) => updateCard(i, 'description', md)}
    features={['bold', 'italic', 'link', 'list', 'image']}
    placeholder="Опишите факт…"
    className="min-h-24"
    sessionId={sessionId}
  />
</FieldWrap>
```

- [ ] **Step 4: Lint**

```bash
npm run lint
```

Expected: passes. The `Textarea` import may become unused in this file — if so, remove it. `Type` icon is still used for the "Основной текст" label, keep it.

- [ ] **Step 5: Manual verification**

```bash
npm run dev
```

In `/admin`, open a session that has:
- A Director section with a bio
- A Facts section with at least one card

Verify for each:

**Main section text (use e.g. Cinematography section):**
- Full toolbar visible: Ж, К, ссылка, маркированный, нумерованный, H2, H3, цитата, картинка
- Type "## Test heading", select "Test heading", click H2 — the text should render as a large heading visually. Actually, H2 button toggles the current line to heading; just click the button while cursor is on a line.
- Type a paragraph, select some words, click Ж — bold appears.
- Click 🖼 → prompt appears → paste any `https://...` image URL → image appears inline in the editor.
- Drag an image file from your desktop into the editor area → upload spinner toast → image appears inline at drop position. (**This requires Supabase env vars configured locally.**)
- Copy an image in your browser (right-click → Copy Image), click in the editor, Cmd+V → image uploads and inserts.
- Save session → reload → all formatting and images persist.
- Open the public session page → all formatting and images render correctly, lightbox works on the inline images.

**Director bio:**
- Toolbar shows Ж, К, ссылка, списки, картинка — no H2/H3/цитата buttons.
- Bold text and inline image work, save, reload, public page renders correctly.

**Fact card description:**
- Same toolbar as bio. Bold + image insertion work end-to-end.

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/section-editor.tsx
git commit -m "feat(admin): replace remaining markdown Textareas with RichEditor"
```

---

### Task 10: Delete `content.images[]` UI block and helpers

**Files:**
- Modify: `src/components/admin/section-editor.tsx`

- [ ] **Step 1: Delete `images` helper functions**

In `section-editor.tsx`, find and delete the `addImage`, `updateImage`, `removeImage` helpers (around lines 196-208):

```tsx
/* --- Image helpers --- */
const addImage = () => {
  onChange({ ...content, images: [...(content.images || []), ''] });
};

const updateImage = (index: number, url: string) => {
  const images = [...(content.images || [])];
  images[index] = url;
  onChange({ ...content, images });
};

const removeImage = (index: number) => {
  onChange({ ...content, images: (content.images || []).filter((_, i) => i !== index) });
};
```

Delete all three functions entirely.

- [ ] **Step 2: Delete the "Изображения кадров" UI block**

In the same file, inside the `cinematography` branch, find the block that starts around line 418:

```tsx
{/* Images */}
<div className="rounded-2xl border border-zinc-800/70 bg-zinc-950/30 p-5 md:p-6">
  <SubsectionHeader
    icon={ImageIcon}
    title="Изображения кадров"
    hint="Скриншоты или кадры из фильма"
    action={<AddButton onClick={addImage} />}
  />
  {(content.images || []).length === 0 ? (
    <EmptyList icon={ImageIcon} label="Изображения не добавлены" />
  ) : (
    <div className="space-y-2.5">
      {(content.images || []).map((img, i) => (
        // ... several lines ...
      ))}
    </div>
  )}
</div>
```

Delete this entire `<div>` block including its contents (ends around line 462). Keep the Videos block that follows it.

- [ ] **Step 3: Clean up unused imports**

Check the top of the file. If `ImageIcon` is no longer used anywhere in `section-editor.tsx` after the deletion, remove it from the `lucide-react` import. *(It may still be used by other blocks — only remove if grep shows zero references.)*

- [ ] **Step 4: Lint**

```bash
npm run lint
```

Expected: passes. If TypeScript complains that `content.images` is still referenced somewhere, grep for the remaining reference and remove it.

- [ ] **Step 5: Manual verification**

```bash
npm run dev
```

Open a session with a Cinematography section:
- The "Изображения кадров" block is gone
- The "Видео" block is still present and still works
- Users can add images via the main text RichEditor (drag&drop)
- Save → reload → old `content.images[]` data (if any) is still in the DB (not touched) but no longer shown in the editor. **It will be handled by the migration script in Phase 4.**

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/section-editor.tsx
git commit -m "refactor(admin): remove content.images[] UI block"
```

---

## Phase 4: Data migration

### Task 11: Write the migration script

**Files:**
- Create: `scripts/migrate-inline-images.ts`

- [ ] **Step 1: Create the script**

Create `scripts/migrate-inline-images.ts`:

```ts
/**
 * One-time migration: move SectionContent.images[] into inline markdown inside content.text.
 *
 * Run: npx tsx scripts/migrate-inline-images.ts
 *
 * Idempotent: after the first run, content.images is empty/absent, so re-running is a no-op.
 *
 * Before running on production:
 *   1. Take a database snapshot: `supabase db dump -f backup.sql`
 *   2. Verify the dev run first.
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

type SectionRow = {
  id: string;
  content: {
    text?: string;
    images?: string[];
    [k: string]: unknown;
  };
};

async function main() {
  console.log('Fetching all session_sections…');
  const { data, error } = await supabase.from('session_sections').select('id, content');

  if (error) {
    console.error('Fetch failed:', error);
    process.exit(1);
  }

  const rows = (data ?? []) as SectionRow[];
  console.log(`Found ${rows.length} sections total.`);

  let migratedSections = 0;
  let movedImages = 0;

  for (const row of rows) {
    const images = Array.isArray(row.content?.images) ? row.content.images : [];
    const realImages = images.filter((u) => typeof u === 'string' && u.trim().length > 0);

    if (realImages.length === 0) {
      // Nothing to migrate. If the field still exists (empty array or bad value), clean it.
      if ('images' in row.content) {
        const { images: _drop, ...rest } = row.content;
        void _drop;
        const { error: updateError } = await supabase
          .from('session_sections')
          .update({ content: rest })
          .eq('id', row.id);
        if (updateError) {
          console.error(`Failed to clean empty images on ${row.id}:`, updateError);
        }
      }
      continue;
    }

    const oldText = typeof row.content.text === 'string' ? row.content.text : '';
    const imagesMarkdown = realImages.map((url) => `![](${url})`).join('\n\n');
    const newText = oldText.trim().length > 0 ? `${oldText}\n\n${imagesMarkdown}` : imagesMarkdown;

    const { images: _drop, ...rest } = row.content;
    void _drop;
    const newContent = { ...rest, text: newText };

    const { error: updateError } = await supabase
      .from('session_sections')
      .update({ content: newContent })
      .eq('id', row.id);

    if (updateError) {
      console.error(`Failed to migrate section ${row.id}:`, updateError);
      continue;
    }

    migratedSections += 1;
    movedImages += realImages.length;
    console.log(`  migrated ${row.id}: ${realImages.length} images appended to text`);
  }

  console.log('---');
  console.log(`Done. ${migratedSections} sections migrated, ${movedImages} images moved.`);
}

main().catch((e) => {
  console.error('Unexpected error:', e);
  process.exit(1);
});
```

- [ ] **Step 2: Verify tsx is available**

```bash
npx tsx --version
```

If not installed, install it as a dev dep:

```bash
npm install --save-dev tsx
```

- [ ] **Step 3: Lint**

```bash
npm run lint
```

Expected: passes. If ESLint complains about `scripts/` not being in the source globs, that's fine — the script doesn't need lint coverage (it's a one-off tool). If the lint run fails hard on the file, add `scripts/**` to `.eslintignore` or to the `ignores` list in the flat eslint config.

- [ ] **Step 4: Commit**

```bash
git add scripts/migrate-inline-images.ts package.json package-lock.json
git commit -m "feat(scripts): add one-time migration for inline images"
```

---

### Task 12: Run migration on dev and full manual QA

**Files:** none (operational task)

- [ ] **Step 1: Snapshot the dev DB (safety)**

If using local Supabase via CLI:

```bash
supabase db dump -f pre-migration-backup.sql
```

If using hosted dev project: go to Supabase dashboard → Database → Backups → take a manual snapshot, or export via `pg_dump`.

- [ ] **Step 2: Run the migration**

```bash
npx tsx scripts/migrate-inline-images.ts
```

Expected output format:

```
Fetching all session_sections…
Found N sections total.
  migrated <uuid>: X images appended to text
  ...
---
Done. M sections migrated, K images moved.
```

If `M` or `K` is 0 and you expected non-zero, check the dev DB for any section with `content.images`. If the run produced errors, inspect them, fix, and re-run (the script is idempotent).

- [ ] **Step 3: Verify migration in the UI**

`npm run dev`, log in, open a session whose cinematography section had images before the migration. Verify:

- Main text field now contains the images at the end (they appear in the RichEditor as inline image blocks)
- Save (without changes) → reload → content still looks the same
- Open the public session page → images render correctly in the text

- [ ] **Step 4: Full manual QA checklist**

Run the complete checklist from the spec (`docs/superpowers/specs/2026-04-05-wysiwyg-editor-design.md`, "Тестирование (manual)" section):

1. Open an existing session → all 4 types of fields render formatted (no raw `**`)
2. Add bold/italic/link/list/heading/blockquote → save → public page renders correctly
3. Drop a jpg into the main text → placeholder → upload → final URL → save → public page shows image, lightbox works
4. Cmd+V of an image from the clipboard → same outcome
5. Insert URL via the 🖼 toolbar popover → same outcome
6. Paste text from Google Docs (with bold, italic, lists) → formatting preserved, stray styles stripped
7. Try to upload a 15 MB file → toast error, placeholder removed, form still functional
8. Try to upload a `.txt` file → toast error, nothing inserted
9. Migration result check (already done above)
10. Open a migrated session → save without changes → public page identical to pre-migration
11. Round-trip: open a session with mixed markdown → don't change anything → save → compare `content` JSON in DB before/after (should match modulo trivial whitespace)
12. Quote field shows only Ж/К, no link/list/heading/image buttons

- [ ] **Step 5: Fix any issues found**

If any step fails, stop and diagnose. Most likely suspects if something breaks:
- **Round-trip markdown changes** → `tiptap-markdown` configuration (`tightLists`, `bulletListMarker`, `breaks`). Adjust to match existing data style.
- **Image upload fails silently** → open devtools network tab, check the server action response. Most common: Supabase bucket doesn't exist yet (re-run Task 2) or env vars missing.
- **Editor doesn't render initially** → `immediatelyRender: false` is set, check; also ensure you're on a client component (`'use client'` at top of `rich-editor.tsx`).
- **Cmd+V paste of text from other apps breaks formatting** → TipTap handles HTML paste by default; if needed, tweak `StarterKit` extension options.

- [ ] **Step 6: Commit (if any fixes were made)**

```bash
git add -u
git commit -m "fix(admin): address issues found in manual QA"
```

If no fixes were needed, skip this step.

---

## Rollback plan

If the WYSIWYG approach needs to be reverted in production:

1. `git revert` the commits from Phase 2 and Phase 3 (tasks 5–10). The `<Textarea>` fields come back.
2. The migrated `content.text` fields still contain the appended `![](url)` markdown from migration — these are valid markdown and the old `<Textarea>` flow handles them (users can see and edit the raw markdown).
3. The deprecated `images` type field and the old UI block are gone, so users would no longer have the array-based image UI — acceptable since the images are still accessible as inline markdown in the text field.
4. The Supabase bucket and uploaded files remain — harmless.

Result: zero data loss on rollback.

---

## Self-Review checklist

Before handing this plan off for execution, verify:

- [x] Every spec requirement has a task
- [x] No TBDs, no "implement later", no "similar to Task N" without repeated code
- [x] File paths are exact
- [x] Code blocks are complete, not sketches
- [x] Commit per task, each task ≤ a few minutes of work
- [x] Manual verification replaces automated tests (no test runner in project)
- [x] Rollback plan exists
