# WYSIWYG-редактор для админки киноклуба

**Дата:** 2026-04-05
**Тип:** quick task (расширенный scope из-за upload-пайплайна)
**Статус:** draft → awaiting user review

## Проблема

В `/admin` не-технари заполняют карточки киносессий. Все текстовые поля — обычный `<Textarea>`, в который они должны вводить markdown-синтаксис (`**жирный**`, `## заголовок`, `[текст](url)`, `![](url)`). Это болезненно: markdown знать не обязательно, визуальной обратной связи нет, картинки вставляются через отдельный блок URL-инпутов, а не туда, где они должны стоять в тексте.

**Цель:** заменить текстовые поля с markdown на WYSIWYG-редактор, в котором ментальная модель такая же, как в Word/Google Docs. Пользователь видит форматированный текст сразу, пользуется тулбаром или горячими клавишами, вставляет картинки drag&drop'ом прямо в нужное место.

## Решения (зафиксированы в обсуждении)

| # | Вопрос | Решение |
|---|---|---|
| 1 | Направление UX | **WYSIWYG** (как Word), не toolbar-over-markdown и не slash-команды |
| 2 | Scope полей | **Все 4 markdown-поля**: основной текст раздела, био режиссёра, описание факта, текст цитаты |
| 3 | Набор форматирования | **Контекстный тулбар** через `features` prop — каждое поле включает свой набор |
| 4 | Структурные картинки `content.images[]` | **Удаляем**, мигрируем в inline-картинки текста. Позиционные (`director.photo`, `film.posterUrl`, `card.imageUrl`, `quote.imageUrl`) остаются структурными. |
| 5 | Источник картинок | **Drag&drop + paste из буфера + URL** через Supabase Storage. Лимит **10 MB**. Публичный bucket. |
| 6 | Движок | **TipTap** + `tiptap-markdown` для сериализации |

## Архитектура

### Новый компонент: `<RichEditor>`

Путь: `src/components/ui/rich-editor.tsx`

```tsx
<RichEditor
  value={content.text}                    // markdown string
  onChange={updateText}                   // (markdown: string) => void
  features={['bold', 'italic', 'link', 'list', 'heading', 'blockquote', 'image']}
  placeholder="Основной текст раздела…"
  className="min-h-36"
/>
```

**Контракт:** работает со строкой markdown. Снаружи компонента никто не знает про TipTap — это позволяет заменить `<Textarea>` → `<RichEditor>` без изменений в state management, server actions или рендере публичной страницы.

**Типы `features`:**

```ts
type RichEditorFeature =
  | 'bold' | 'italic' | 'link' | 'list' | 'heading' | 'blockquote' | 'image';

interface RichEditorProps {
  value: string;
  onChange: (markdown: string) => void;
  features: RichEditorFeature[];
  placeholder?: string;
  className?: string;
  sessionId?: string;  // для namespacing загруженных картинок в storage
}
```

### Соседние файлы

- `src/components/ui/rich-editor.tsx` — основной компонент (~200 строк): создание editor'а, маппинг `features` → TipTap extensions, JSX
- `src/components/ui/rich-editor-toolbar.tsx` — тулбар с кнопками (отдельный файл, чтобы `rich-editor.tsx` не раздувался)
- `src/components/ui/rich-editor-image-handler.ts` — всё про drag&drop/paste/upload картинок (плагины ProseMirror и хэндлеры)
- `src/lib/actions/uploads.ts` — server action `uploadSessionImage`
- `supabase/migrations/<timestamp>_session_images_bucket.sql` — создание bucket и RLS-политик
- `scripts/migrate-inline-images.ts` — одноразовый миграционный скрипт для `content.images[]`

### Изоляция от TipTap

Правило: **никакой файл вне `rich-editor*.{ts,tsx}` не импортирует из `@tiptap/*`.** Это гарантирует, что замена движка (или откат на `<Textarea>`) затронет только эти файлы.

### Проброс `sessionId`

`SessionForm` уже принимает `session?: Session` (для редактирования существующей) и знает `session?.id`. Пробрасываем его вниз: `SessionForm → SectionEditor → RichEditor` новым prop `sessionId`. У новых сессий `id` ещё нет — передаём `undefined`, картинки идут в `drafts/` namespace. После сохранения сессии файлы уже лежат в bucket и корректно ссылаются URL'ами в тексте — переносить их не нужно.

## Набор форматирования по полям

| Поле | bold | italic | link | list | heading | blockquote | image |
|---|---|---|---|---|---|---|---|
| Основной текст раздела | ✅ | ✅ | ✅ | ✅ | H2/H3 | ✅ | ✅ |
| Био режиссёра | ✅ | ✅ | ✅ | ✅ | — | — | ✅ |
| Описание карточки факта | ✅ | ✅ | ✅ | ✅ | — | — | ✅ |
| Текст цитаты | ✅ | ✅ | — | — | — | — | — |

**Почему заголовки только в основном тексте:** они генерируют id через `slugify()` в `markdown-content.tsx:122` и питают TOC. В био/фактах/цитатах заголовки не имеют смысла.

**Тулбар:** горизонтальный ряд иконок-кнопок сверху редактора, в стиле существующей админки (zinc/amber палитра, shadcn Button). Кнопки показываются по наличию соответствующей фичи в `features`.

**Горячие клавиши (из коробки TipTap):** Cmd+B (bold), Cmd+I (italic), Cmd+K (link — покажет popover), Cmd+Shift+8 (bullet list), Cmd+Shift+7 (ordered list).

## Поток данных

```
DB (markdown string)
     │
     ▼ при монтировании формы
tiptap-markdown.parse() → ProseMirror doc → редактор
     │
     ▼ при каждом изменении (debounce ~150ms)
editor.storage.markdown.getMarkdown() → string → onChange(string)
     │
     ▼ при submit формы
markdown string → server action (без изменений) → Supabase (та же колонка)
     │
     ▼ при рендере публичной страницы
react-markdown (без изменений) → HTML
```

**Storage format не меняется.** В БД тот же markdown, что и сейчас. Публичный рендерер (`MarkdownContent` в `src/components/ui/markdown-content.tsx`) работает без изменений — inline-картинки он уже поддерживает через `components.img` с лайтбоксом.

**Round-trip:** при открытии сессии, которую не редактировали, markdown в БД после сохранения должен быть идентичен с точностью до незначимого whitespace (`tiptap-markdown` это гарантирует для поддерживаемых фич).

## Upload-пайплайн картинок

### Supabase Storage

Создаётся bucket **`session-images`**, публичный (SELECT без auth).

**Важно про auth:** проект использует кастомную админ-авторизацию (`verifyAdmin` в `src/lib/actions/admin.ts`, jose+bcryptjs), а не Supabase Auth. Server actions общаются с Supabase через `createAdminClient()` (`src/lib/supabase/admin.ts`), который использует `SUPABASE_SERVICE_ROLE_KEY` и **обходит RLS целиком**. Поэтому INSERT-политики не нужны — upload всегда идёт со service role.

SQL-миграция:

```sql
insert into storage.buckets (id, name, public)
values ('session-images', 'session-images', true)
on conflict (id) do nothing;

-- SELECT открыт для всех (публичная страница должна показывать картинки)
create policy "public can read session images"
  on storage.objects for select
  using (bucket_id = 'session-images');

-- INSERT/UPDATE/DELETE политики не создаём:
-- server actions используют service role key, который обходит RLS
```

Путь файла: `${sessionId ?? 'drafts'}/${crypto.randomUUID()}.${ext}`

**Fallback при отсутствии Supabase:** `src/lib/supabase/config.ts` содержит `isSupabaseConfigured()` — когда Supabase не настроен (локальная разработка без env-переменных), все server actions используют in-memory `store`. Для upload картинок это бессмысленно: если `!isSupabaseConfigured()`, `uploadSessionImage` возвращает `{ error: 'Upload unavailable in local mode' }`. Редактор показывает toast и не вставляет картинку.

### Server action `uploadSessionImage`

`src/lib/actions/uploads.ts`

```ts
'use server';

export async function uploadSessionImage(
  formData: FormData
): Promise<{ url: string } | { error: string }> {
  // 1. Проверяем admin-сессию (как в sessions.ts)
  // 2. Валидация:
  //    - file.type ∈ ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  //    - file.size ≤ 10 * 1024 * 1024
  // 3. sessionId берём из formData (опционально, для namespace)
  // 4. Загружаем в session-images bucket
  // 5. Возвращаем { url: publicUrl }
}
```

Server-side валидация дублирует клиентскую (defense in depth).

### Три входных точки в RichEditor

1. **Drag & drop файла** — ProseMirror `handleDrop` ловит `DataTransfer.files`, фильтрует image MIME, вызывает upload.
2. **Paste из буфера** — ProseMirror `handlePaste` ловит `ClipboardEvent.clipboardData.items` типа `image/*`, вызывает upload.
3. **Кнопка 🖼 в тулбаре** — `<Popover>` с двумя опциями:
   - «Загрузить файл» (`<input type="file" accept="image/*">`)
   - «Вставить по URL» (текстовое поле + кнопка «Вставить»)

Все три пути ведут в один хэндлер `insertImage(file: File | null, url?: string)`:

1. Если `file`: создаёт placeholder-node в позиции курсора (NodeView со спиннером), стартует upload, при успехе заменяет placeholder на `image` node с финальным URL, при ошибке — удаляет placeholder и показывает toast.
2. Если `url`: сразу вставляет `image` node.

### Лимиты и ошибки upload

| Сценарий | Поведение |
|---|---|
| Файл >10 MB | Клиентская проверка до запроса → toast «Файл слишком большой, максимум 10 MB» |
| Не image MIME | Клиентская проверка → toast «Можно вставлять только картинки» |
| Server action вернул error | Toast с текстом, placeholder удаляется, курсор остаётся на месте |
| Потеря сети во время upload | Таймаут 30s → toast «Не удалось загрузить, попробуйте ещё раз» |
| Пользователь закрыл форму во время upload | Fire-and-forget: файл попал в bucket, но не в markdown. Осиротевший файл — приемлемо, очистка не в scope. |
| Drop нескольких картинок сразу | Обрабатываются последовательно, каждая со своим placeholder'ом |
| Не-admin сессия | Server action возвращает 401 → toast «Сессия истекла, обновите страницу» |

### Paste из Word / Google Docs

TipTap из коробки обрабатывает вставку HTML из Word/Google Docs:

- Bold/italic/underline → сохраняется (underline игнорируется, его у нас нет)
- Списки → сохраняются
- Заголовки → сохраняются (в полях без `heading` в `features` превращаются в обычный текст)
- Шрифты, цвета, размеры → **отбрасываются** (нет соответствующих extensions)
- Картинки в буфере (не ссылки) → проходят через тот же `handlePaste` → upload в наш bucket

## Изменения в существующем коде

### Удаляется

- `src/components/admin/section-editor.tsx` строки ~418–462: блок «Изображения кадров» (`content.images[]` UI)
- Все helper-функции `addImage`, `updateImage`, `removeImage` в том же файле
- Подсказки синтаксиса markdown (`['**жирный**', '*курсив*', ...]`) в тулбаре Textarea'ы — они больше не нужны

### Заменяется на `<RichEditor>`

| Место | Props |
|---|---|
| `section-editor.tsx:289` (основной текст раздела) | `features={['bold','italic','link','list','heading','blockquote','image']}` |
| `section-editor.tsx:339` (био режиссёра) | `features={['bold','italic','link','list','image']}` |
| `section-editor.tsx:614` (описание факта) | `features={['bold','italic','link','list','image']}` |
| `section-editor.tsx:530` (текст цитаты) | `features={['bold','italic']}` |

### Типы

В `src/types/*` поле `images?: string[]` в `SectionContent` **помечается deprecated** на одну версию (чтобы миграционный скрипт мог его читать), потом удаляется в следующей quick-задаче.

## Миграция данных

Одноразовый скрипт `scripts/migrate-inline-images.ts`:

```ts
// 1. Читаем все session_sections
// 2. Для каждого, где content.images?.length > 0:
//    - oldText = content.text ?? ''
//    - imagesMarkdown = content.images.map(url => `![](${url})`).join('\n\n')
//    - newText = oldText ? `${oldText}\n\n${imagesMarkdown}` : imagesMarkdown
//    - content.text = newText
//    - delete content.images
//    - update в Supabase
// 3. Лог: "X sections migrated, Y images moved"
```

Запускается вручную **один раз** перед деплоем через `npx tsx scripts/migrate-inline-images.ts`.

**Безопасность:** идемпотентен (после первого прогона `content.images` пусто → ничего не делает при повторе). На всякий случай — сделать `supabase db dump` перед запуском.

## Зависимости

Добавляется в `package.json`:

```json
{
  "@tiptap/react": "^2.x",
  "@tiptap/starter-kit": "^2.x",
  "@tiptap/extension-link": "^2.x",
  "@tiptap/extension-image": "^2.x",
  "@tiptap/extension-placeholder": "^2.x",
  "tiptap-markdown": "^0.8.x"
}
```

Точные версии фиксируются при установке — брать последние стабильные, совместимые с React 19.

**Размер бандла:** ~60 KB gzip. Компонент используется **только в `/admin`**, в публичный бандл не попадает (Next.js это сам поймёт по статическому импорту).

## Тестирование (manual)

Автотестов в проекте нет, добавлять ради этой фичи = scope creep. Чек-лист ручного прогона:

1. Открыть существующую сессию в `/admin` → все 4 типа полей показываются форматированно, без `**звёздочек**`
2. Добавить жирный/курсив/ссылку/список/заголовок/цитату → сохранить → публичная страница рендерит всё корректно
3. Drop картинки (jpg) в основной текст → inline placeholder → upload → финальный URL → сохранить → публичная страница показывает, лайтбокс работает
4. Cmd+V картинки из буфера → то же самое
5. Вставить URL картинки через попап → то же
6. Вставить текст из Google Docs с жирным/курсивом/списком → форматирование сохраняется, лишние стили чистятся
7. Загрузить файл 15 MB → toast, placeholder удаляется, форма не ломается
8. Загрузить txt-файл → toast, placeholder не создаётся
9. Запустить миграционный скрипт на dev БД с реальными данными → проверить, что картинки из `content.images[]` оказались в тексте
10. Открыть мигрированную сессию в админке → картинки видны в редакторе → сохранить без изменений → публичная страница идентична той, что была до миграции
11. Round-trip: открыть сессию со сложным markdown → не трогать ничего → сохранить → сравнить markdown в БД до и после (должны быть идентичны с точностью до незначимого whitespace)
12. Цитаты: убедиться, что в редакторе цитаты доступны только Ж/К, нет лишних кнопок

## Anti-scope (явно НЕ делаем в этой итерации)

- ❌ Таблицы, код-блоки, подсветка синтаксиса
- ❌ Авто-превью `<image>` при paste URL (просто вставляем ссылку)
- ❌ WYSIWYG для позиционных картинок (`director.photo`, `card.imageUrl`, `quote.imageUrl`, `film.posterUrl`) — остаются URL-инпутами
- ❌ Очистка осиротевших файлов в Supabase Storage
- ❌ Mobile-специфичная раскладка тулбара — используем wrap как везде в админке
- ❌ Collaborative editing, undo-history за пределами дефолта TipTap
- ❌ Автотесты (в проекте их нет)

## Риски

| Риск | Вероятность | Митигация |
|---|---|---|
| `tiptap-markdown` теряет форматирование на round-trip для экзотических кейсов | Средняя | Ручной round-trip тест на реальных данных перед деплоем. В существующих данных используется только базовый markdown (видно по подсказкам в старом UI), так что риск низкий. |
| React 19 + TipTap v2 несовместимость в нестабильных местах | Низкая | TipTap v2 официально поддерживает React 19. При установке сверяюсь с их CHANGELOG. |
| Bundle size в `/admin` заметно растёт | Низкая | Компонент только в admin route, публика не затронута. Для админов +60 KB не проблема. |
| Upload проваливается из-за CORS / RLS настроек Supabase | Средняя | Тестирую upload в dev окружении до того, как трогать формы. Server action → Supabase admin client (service key), без RLS на client-side. |
| Миграционный скрипт ошибается и теряет картинки | Низкая | `supabase db dump` перед запуском. Скрипт идемпотентен. |

## Готовность к writing-plans

После апрува этой спеки переходим в skill `writing-plans` для разбивки на конкретные шаги реализации с ревью-чекпоинтами.
