# Кастомизация разделов фильма (переименование, иконки, реордер, custom-разделы)

**Дата:** 2026-04-05
**Статус:** design approved, ready for implementation plan

## Контекст и мотивация

Сейчас каждая сессия отображает 6 жёстко заданных разделов (`director`, `motivation`, `cinematography`, `influence`, `themes`, `facts`) с заголовками и иконками из `src/lib/constants.ts` — например, `motivation → "Почему этот фильм"`. Админ не может ни переименовать раздел для конкретной сессии, ни добавить свой.

Цель: дать админу **per-session** возможность:
1. Переименовать любой из 6 существующих разделов
2. Сменить иконку раздела (из курируемого набора ~24 иконок)
3. Менять порядок разделов
4. Добавлять свои кастомные Markdown-разделы (заголовок + иконка + текст)
5. Включать/выключать разделы (уже существует — сохраняется)

**Не-цели:**
- Глобальные дефолты в БД (overrides только per-session)
- Редактирование content-shape кастомных разделов (галереи, видео, карточки)
- Drag-and-drop реордер (только стрелки ↑/↓ в v1)
- Иконки вне курируемого списка
- Автоматические тесты (в проекте нет тест-инфры; вместо этого — manual QA чеклист)

## Архитектурный подход: Overlay

Принцип: **override ИЛИ дефолт из кода**. Существующая модель `session_sections` расширяется двумя nullable колонками (`title`, `icon`); `null` означает "взять дефолт из `SECTION_CONFIG`". Добавляется новое значение `'custom'` в enum `section_type` для пользовательских разделов, уникальный констрейнт заменяется на partial unique index.

**Почему overlay:**
- Нулевая миграция существующих данных
- Ни один существующий компонент не ломается до использования новых фич
- Единственный уровень fallback (override → default в коде) — проще, чем многоуровневая схема
- Все новые колонки nullable → решение обратимо на уровне данных

**Единственный необратимый коммитмент:** `ALTER TYPE section_type ADD VALUE 'custom'` — Postgres не позволяет удалить значение из enum без пересоздания колонки. Это приемлемо, поскольку кастомные разделы — центральная фича, откат не планируется.

## Модель данных

### Миграция `supabase/migrations/004_custom_sections.sql`

```sql
-- Step 1: Ensure 'motivation' is in enum (sanity check — may already exist)
ALTER TYPE section_type ADD VALUE IF NOT EXISTS 'motivation';

-- Step 2: Add 'custom' to section_type enum (irreversible commitment)
ALTER TYPE section_type ADD VALUE IF NOT EXISTS 'custom';

-- Step 3: Add override columns (nullable; NULL = use default from SECTION_CONFIG)
ALTER TABLE session_sections
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS icon TEXT;

-- Step 4: Replace unique constraint with partial unique index.
-- Built-ins stay unique per session; multiple customs are allowed.
ALTER TABLE session_sections
  DROP CONSTRAINT IF EXISTS session_sections_session_id_type_key;

CREATE UNIQUE INDEX IF NOT EXISTS session_sections_builtin_unique
  ON session_sections (session_id, type)
  WHERE type <> 'custom';

-- Step 5: Index for efficient ordering
CREATE INDEX IF NOT EXISTS session_sections_order_idx
  ON session_sections (session_id, sort_order);
```

**Перед применением:** выполнить `SELECT enum_range(NULL::section_type);` и убедиться, что все 6 built-in значений + `custom` присутствуют после миграции.

### TypeScript типы (`src/types/index.ts`)

```ts
export type SectionType = 'director' | 'cinematography' | 'motivation'
  | 'influence' | 'themes' | 'facts' | 'custom';

export interface SessionSection {
  id: string;
  session_id: string;
  type: SectionType;
  title: string | null;   // NEW: override; null = use default
  icon: string | null;    // NEW: lucide icon name; null = use default
  enabled: boolean;
  sort_order: number;
  content: SectionContent;
}

export type IconName =
  | 'Film' | 'Clapperboard' | 'Camera' | 'Video' | 'Projector'
  | 'BookOpen' | 'Lightbulb' | 'Sparkles' | 'Star' | 'Heart'
  | 'Award' | 'Crown' | 'Feather' | 'Eye' | 'Compass'
  | 'Target' | 'Zap' | 'Flame' | 'Moon' | 'Sun'
  | 'Music' | 'Palette' | 'Quote' | 'Bookmark';
```

### Константы (`src/lib/constants.ts`)

`SECTION_CONFIG` рефакторится: хранит `iconName: IconName` вместо прямой ссылки на компонент. Это нужно для единообразного сравнения override с default — оба живут в одной системе координат (строковые имена иконок).

```ts
import {
  Film, Clapperboard, Camera, Video, Projector,
  BookOpen, Lightbulb, Sparkles, Star, Heart,
  Award, Crown, Feather, Eye, Compass,
  Target, Zap, Flame, Moon, Sun,
  Music, Palette, Quote, Bookmark,
  type LucideIcon,
} from 'lucide-react';
import type { SectionType, IconName, RatingCategory } from '@/types';

export const ICON_LIBRARY: Record<IconName, LucideIcon> = {
  Film, Clapperboard, Camera, Video, Projector,
  BookOpen, Lightbulb, Sparkles, Star, Heart,
  Award, Crown, Feather, Eye, Compass,
  Target, Zap, Flame, Moon, Sun,
  Music, Palette, Quote, Bookmark,
};

export const DEFAULT_CUSTOM_ICON: IconName = 'Bookmark';

export const SECTION_CONFIG: Record<
  Exclude<SectionType, 'custom'>,
  { title: string; iconName: IconName }
> = {
  director:       { title: 'О режиссёре',       iconName: 'Film' },
  motivation:     { title: 'Почему этот фильм', iconName: 'Clapperboard' },
  cinematography: { title: 'О сюжете',          iconName: 'BookOpen' },
  influence:      { title: 'Влияние и контекст', iconName: 'Sparkles' },
  themes:         { title: 'Темы и символизм',   iconName: 'BookOpen' },
  facts:          { title: 'Интересные факты',   iconName: 'Lightbulb' },
};

export const BUILTIN_SECTION_TYPES: Array<Exclude<SectionType, 'custom'>> = [
  'director', 'motivation', 'cinematography', 'influence', 'themes', 'facts',
];

export const MAX_CUSTOM_SECTIONS_PER_SESSION = 10;
```

`SECTION_CONFIG` намеренно **не** содержит `custom` — кастомы либо имеют свой title override, либо получают fallback `'Раздел'`.

### Backward compat

- Существующие строки `session_sections` имеют `title=null`, `icon=null` → рендер использует дефолты. Ноль миграции данных.
- `session.id`-based anchors работают для всех существующих и новых строк (`id` — PK с migration 001).

## Рендер

### Helpers (`src/lib/section-display.ts` — новый файл)

Единственный источник правды для title/icon при рендере:

```ts
import { SECTION_CONFIG, ICON_LIBRARY, DEFAULT_CUSTOM_ICON } from './constants';
import type { SessionSection, IconName } from '@/types';
import type { LucideIcon } from 'lucide-react';

export function getSectionTitle(section: SessionSection): string {
  if (section.title && section.title.trim()) return section.title;
  if (section.type === 'custom') return 'Раздел';
  return SECTION_CONFIG[section.type]?.title ?? '';
}

export function getSectionIconName(section: SessionSection): IconName {
  if (section.icon && section.icon in ICON_LIBRARY) {
    return section.icon as IconName;
  }
  if (section.type === 'custom') return DEFAULT_CUSTOM_ICON;
  return SECTION_CONFIG[section.type]?.iconName ?? DEFAULT_CUSTOM_ICON;
}

export function getSectionIcon(section: SessionSection): LucideIcon {
  return ICON_LIBRARY[getSectionIconName(section)];
}
```

### Компонент `CustomSection` (`src/components/sections/custom-section.tsx`)

```tsx
import MarkdownContent from '@/components/ui/markdown-content';
import type { SectionContent } from '@/types';

export default function CustomSection({ content }: { content: SectionContent }) {
  if (!content.text?.trim()) return null;
  return <MarkdownContent text={content.text} />;
}
```

### `SessionPage` (`src/app/session/[id]/page.tsx`)

Изменения:

1. Добавить `custom: CustomSection` в `SECTION_COMPONENTS`
2. В цикле рендера:
   - `id={\`section-${section.id}\`}` — было `section-${section.type}`
   - `Icon = getSectionIcon(section)` — было `config.icon`
   - `title = getSectionTitle(section)` — было `config.title`
3. `<TableOfContents sections={enabledSections} />` — передаётся полный массив `SessionSection`

Специализированные компоненты (`DirectorSection`, `FactsSection`, …) **не трогаем** — они принимают только `content`. Вся логика title/icon живёт в обёртке `SessionPage`/`TableOfContents`.

### `TableOfContents` (`src/components/table-of-contents.tsx`)

Контракт меняется на `sections: SessionSection[]`:

```tsx
function buildTOCItems(sections: SessionSection[]): TOCItem[] {
  const items: TOCItem[] = [];
  for (const section of sections) {
    items.push({
      id: `section-${section.id}`,            // was: section-${type}
      label: getSectionTitle(section),        // was: SECTION_CONFIG[type].title
      level: 0,
    });
    // Markdown heading parsing — unchanged
    if (section.content.text) {
      const headingRegex = /^(#{1,3})\s+(.+)$/gm;
      let match;
      while ((match = headingRegex.exec(section.content.text)) !== null) {
        const hashes = match[1].length;
        const text = match[2].trim();
        items.push({ id: slugify(text), label: text, level: hashes <= 2 ? 1 : 2 });
      }
    }
  }
  items.push({ id: 'ratings', label: 'Оценки', level: 0 });
  return items;
}
```

## Admin form

### Server actions (`src/lib/actions/sections.ts`)

```ts
export async function upsertSection(params: {
  id?: string;               // NEW — present for updates (custom sections)
  sessionId: string;
  type: SectionType;
  title: string | null;      // NEW
  icon: string | null;       // NEW
  content: SectionContent;
  enabled: boolean;
  sortOrder: number;
}): Promise<{ data?: SessionSection; error?: string }>

// NEW: delete a custom section. Guards type === 'custom'.
export async function deleteCustomSection(
  sessionId: string,
  sectionId: string,
): Promise<{ success?: true; error?: string }>

// NEW: batch reorder by ids
export async function reorderSections(
  sessionId: string,
  orderedIds: string[],
): Promise<{ success?: true; error?: string }>
```

**Server-side guards:**
- `deleteCustomSection`: читает row, верифицирует `type === 'custom'` И `session_id === sessionId`; иначе `{ error }`. Built-ins удалять нельзя.
- `upsertSection`:
  - Для `type !== 'custom'`: conflict target `(session_id, type)` (матчит partial unique index)
  - Для `type === 'custom'`: если `id` передан — update по `(id, session_id)`; иначе insert
  - `title`: `null` если пустая строка после `trim()`; иначе `trim().slice(0, 100)`
  - `icon`: валидируется против `Object.keys(ICON_LIBRARY)`; если невалидно → `null` (не ошибка, молчаливый fallback)
  - Для `type === 'custom'`: требует валидный `title` И непустой `content.text.trim()`; иначе `{ error: 'Custom section requires a title and text' }`
- `reorderSections`: проверяет, что все `orderedIds` принадлежат `sessionId`; batch update `sort_order` в индекс-порядке
- Все операции проверяют `verifyAdmin()`

### Форма (`src/components/admin/session-form.tsx`) — рефакторинг состояния

Текущая модель `Record<SectionType, { enabled, content }>` заменяется на массив:

```ts
type SectionSlot = {
  id: string;                    // existing row id, or "new-{nanoid}" for unsaved
  type: SectionType;
  title: string | null;
  icon: string | null;
  content: SectionContent;
  enabled: boolean;
  sortOrder: number;
  _dirty?: boolean;
  _deleted?: boolean;            // marked for deletion on save (customs only)
  _isNew?: boolean;              // unsaved new row
};

const [slots, setSlots] = useState<SectionSlot[]>(() => initSlots(sections));
const [activeTab, setActiveTab] = useState<string>(() => slots[0]?.id ?? '');
```

**`initSlots` логика:**
1. Берёт существующие sections из props (уже отсортированы по `sort_order` из server action)
2. Для каждого из 6 built-in типов, которого нет в props → создаёт placeholder slot с `_isNew: true`, `enabled: true`, и дефолтным `content` по типу: `{ cards: [] }` для `facts`, `{ text: '' }` для остальных (совпадает с текущим поведением формы). Это гарантирует, что админ всегда видит все 6 built-in табов, даже для новой сессии.
3. Custom sections уже в массиве из props; они размещаются по их `sort_order` относительно built-ins.

**Операции:**
- `updateSlot(id, patch)` — merge, mark `_dirty: true`
- `moveUp(id)` / `moveDown(id)` — swap с соседом; `sortOrder` пересчитывается из индекса массива
- `addCustomSection()` — создаёт slot с `id: 'new-{nanoid}'`, `type: 'custom'`, `title: ''`, `icon: DEFAULT_CUSTOM_ICON`, `content: { text: '' }`, `enabled: true`, `_isNew: true`; push в конец; мягкий лимит `MAX_CUSTOM_SECTIONS_PER_SESSION`
- `removeSlot(id)` — для built-in блокируется (no-op); для custom если `_isNew` — удаляется из массива; иначе `_deleted: true`
- `toggleEnabled(id, v)` — устанавливает `enabled`

**Save pipeline:**

```ts
const handleSave = async (publish: boolean) => {
  // ... existing session create/update ...

  const visible = slots.filter(s => !s._deleted);

  // Rebuild sort_order from array index (so reorder moves persist)
  visible.forEach((s, i) => { s.sortOrder = i; });

  // 1. Delete marked customs
  for (const s of slots.filter(s => s._deleted && s.type === 'custom' && !s._isNew)) {
    const r = await deleteCustomSection(sessionId!, s.id);
    if (r.error) { toast.error(r.error); setSaving(false); return; }
  }

  // 2. Upsert visible
  for (const s of visible) {
    // Validate custom: title + text required
    if (s.type === 'custom') {
      if (!s.title?.trim()) {
        toast.error('Кастомный раздел требует заголовок');
        setSaving(false);
        return;
      }
      if (!s.content.text?.trim()) {
        toast.error('Кастомный раздел требует текст');
        setSaving(false);
        return;
      }
    }
    const r = await upsertSection({
      id: s._isNew ? undefined : s.id,
      sessionId: sessionId!,
      type: s.type,
      title: s.title,
      icon: s.icon,
      content: s.content,
      enabled: s.enabled,
      sortOrder: s.sortOrder,
    });
    if (r.error) { toast.error(r.error); setSaving(false); return; }
  }

  toast.success(publish ? 'Встреча опубликована' : 'Встреча сохранена');
  router.push('/admin/session/new');
  router.refresh();
};
```

### UI: tab header для каждого раздела

Внутри каждого `TabsContent`, **над** существующим `SectionEditor`:

```
┌────────────────────────────────────────────────────────────┐
│  [🎬] [_Заголовок: "Почему этот фильм"________]  [↑] [↓]  │
│  [Switch] Включить раздел              [🗑 Удалить]*        │
└────────────────────────────────────────────────────────────┘
```

*Кнопка удаления отображается только для `type === 'custom'`.*

- **Icon picker** (см. 3.4 ниже) — слева
- **Input** заголовка с `placeholder` = дефолтный title из `SECTION_CONFIG` (админ видит, что будет, если оставить пустым). При сохранении пустая строка → `null` → fallback
- **Стрелки** ↑/↓ — disabled на границах массива
- **Switch** «Включить раздел» — уже существует
- **Delete** — только для кастомов

### `IconPicker` (`src/components/admin/icon-picker.tsx` — новый)

```tsx
'use client';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ICON_LIBRARY } from '@/lib/constants';
import type { IconName } from '@/types';

export function IconPicker({
  value,
  onChange,
}: {
  value: IconName;
  onChange: (name: IconName) => void;
}) {
  const Current = ICON_LIBRARY[value];
  return (
    <Popover>
      <PopoverTrigger className="w-10 h-10 grid place-items-center rounded-md bg-zinc-800 hover:bg-zinc-700 border border-zinc-700">
        <Current className="w-5 h-5 text-amber-500" />
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2">
        <div className="grid grid-cols-6 gap-1">
          {(Object.keys(ICON_LIBRARY) as IconName[]).map(name => {
            const I = ICON_LIBRARY[name];
            const active = name === value;
            return (
              <button
                key={name}
                type="button"
                onClick={() => onChange(name)}
                title={name}
                className={`w-9 h-9 grid place-items-center rounded hover:bg-zinc-800 ${active ? 'bg-amber-500/20 ring-1 ring-amber-500' : ''}`}
              >
                <I className="w-4 h-4" />
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

**Проверка при реализации:** если shadcn `Popover` ещё не добавлен в проект, доустановить (`radix-ui` уже в deps → установка shadcn-wrapper тривиальна).

### Tabs: динамический список + «Добавить раздел»

```tsx
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList className="bg-zinc-800 flex-wrap h-auto">
    {slots.filter(s => !s._deleted).map(s => (
      <TabsTrigger key={s.id} value={s.id} className="data-[state=active]:bg-zinc-700">
        {getSectionTitle(s) || '(без названия)'}
        {!s.enabled && ' (выкл)'}
      </TabsTrigger>
    ))}
    <button
      type="button"
      onClick={addCustomSection}
      disabled={customCount >= MAX_CUSTOM_SECTIONS_PER_SESSION}
      className="ml-2 px-3 py-1.5 text-xs rounded hover:bg-zinc-700 text-amber-500 disabled:opacity-50"
    >
      + Добавить раздел
    </button>
  </TabsList>
  {/* TabsContent for each visible slot */}
</Tabs>
```

`activeTab` инициализируется id первого слота; при удалении активного слота — переключается на соседний.

## Non-functional guardrails

- **Валидация custom title:** trim + non-empty required перед save (toast error)
- **Лимит custom:** soft cap `MAX_CUSTOM_SECTIONS_PER_SESSION = 10` — защита от случайного разрастания
- **Dirty guard:** при навигации со страницы — `beforeunload` warning, если `slots.some(s => s._dirty || s._deleted)`
- **Icon graceful fallback:** неизвестное имя иконки (например, после будущего удаления из библиотеки) не ломает рендер — `getSectionIcon` возвращает дефолт
- **Admin-only:** все server actions используют `verifyAdmin()`, как и существующие

## Manual QA чеклист

Автоматических тестов нет (в проекте нет test infra — не вводим в рамках этой фичи). Вместо этого — чеклист ручной верификации, привязанный к спеку.

**Backward compat:**
- [ ] Существующая сессия (Blade Runner 2049) открывается на public-странице без визуальных изменений
- [ ] Все 6 built-in разделов рендерятся с дефолтными заголовками и иконками
- [ ] TOC показывает правильные anchors, клики скроллят в верные секции

**Переименование:**
- [ ] Задать title override для `motivation` → сохранить → на public-странице и в TOC видно новое имя
- [ ] Очистить title override → вернулся дефолт из кода

**Иконки:**
- [ ] Сменить иконку на `Flame` → рендерится новая в заголовке и в TOC
- [ ] Попытка сохранить невалидное имя иконки (через DevTools) → server action возвращает null, fallback срабатывает

**Кастомные разделы:**
- [ ] Добавить 2 custom раздела → оба появляются на public-странице в правильном порядке
- [ ] Каждый имеет свой title/icon/markdown
- [ ] TOC содержит оба custom раздела + их markdown-подзаголовки
- [ ] Удалить первый custom → второй остаётся, порядок корректный
- [ ] Disabled custom не отображается на public-странице
- [ ] Попытка создать 11-й custom → кнопка disabled

**Реордер:**
- [ ] Стрелка ↑ для `facts` → перемещается выше в табах
- [ ] Сохранить → на public-странице порядок изменился
- [ ] Built-in и custom можно произвольно смешивать

**БД-уровень:**
- [ ] Миграция применяется на чистой БД и на БД с существующими данными без ошибок
- [ ] `session_sections_builtin_unique` не даёт вставить дубликат built-in (SQL test)
- [ ] Можно вставить несколько `type='custom'` для одной сессии (SQL test)
- [ ] `ALTER TYPE ... ADD VALUE IF NOT EXISTS` идемпотентен (применить миграцию дважды)

**Негативные сценарии:**
- [ ] Попытка удалить built-in через server action напрямую → `{ error }`
- [ ] Попытка сохранить custom без title → toast error, save aborted
- [ ] Попытка сохранить custom с пустым текстом → toast error, save aborted
- [ ] Попытка сохранить title длиннее 100 символов → обрезается на сервере
- [ ] Неадмин-вызов любого server action → `{ error: 'Unauthorized' }`

## Out of scope (явно)

- Глобальные дефолты разделов в БД (Variant B из анализа)
- Drag-and-drop реордер
- Иконки вне курируемого списка
- Редактирование content-shape кастомных разделов (images/videos/cards/quotes/filmography)
- Rollout plan / feature flags — фича аддитивная, backward compat полный, деплой прямой
- Автоматические тесты
- Интернационализация icon labels в picker (сейчас tooltip = имя lucide)
