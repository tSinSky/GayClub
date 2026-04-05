# Customizable Movie Sections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Per-session overrides for section titles and icons + support for custom Markdown sections with reordering.

**Architecture:** Overlay approach — add nullable `title`/`icon` columns to `session_sections`, extend `section_type` enum with `'custom'`, replace the `(session_id, type)` unique constraint with a partial unique index so built-ins stay unique but multiple customs are allowed. Rendering reads overrides through a single helper that falls back to defaults in `SECTION_CONFIG`. Admin form state changes from `Record<SectionType, …>` to `SectionSlot[]` to support dynamic reorder and custom additions.

**Tech Stack:** Next.js 16 (app router) · React 19 · Supabase (Postgres) · `lucide-react` icons · `radix-ui` primitives · `react-markdown` · TypeScript 5 · Tailwind 4.

**Testing:** This project has no test infrastructure (no jest/vitest in `package.json`) and the spec explicitly excludes introducing one for this feature. Verification uses `npm run build` (type-check + compile), `npm run lint`, and a manual QA checklist at the end (Task 14).

**Pre-flight reminder:** The working tree currently has uncommitted UI-polish changes in `src/components/admin/session-form.tsx`, `src/components/admin/section-editor.tsx`, and several admin pages that are **not** part of this plan. The plan targets the **committed** (HEAD) state of those files. If you stash or commit that WIP before starting, verify that `SECTION_CONFIG[type].icon` and the section state shape in `session-form.tsx` still match what Task 2 / Task 11 expect; adapt if needed.

---

## File Structure

**New files:**
- `supabase/migrations/004_custom_sections.sql` — DB migration (Task 7)
- `src/lib/section-display.ts` — single source of truth helpers for title/icon resolution (Task 3)
- `src/components/sections/custom-section.tsx` — renderer for custom Markdown sections (Task 4)
- `src/components/admin/icon-picker.tsx` — icon selector popover for admin form (Task 10)

**Modified files:**
- `src/types/index.ts` — extend `SectionType` union, add `title`/`icon` to `SessionSection`, add `IconName` type (Task 1)
- `src/lib/store.ts` — update seed sections to include `title: null`/`icon: null`; change `upsertSection` signature; add `deleteCustomSection`, `reorderSections`; ensure `toggleSection` still works (Tasks 1, 8)
- `src/lib/constants.ts` — refactor `SECTION_CONFIG` from `icon: typeof Film` to `iconName: IconName`, add `ICON_LIBRARY`, `DEFAULT_CUSTOM_ICON`, `MAX_CUSTOM_SECTIONS_PER_SESSION`, `BUILTIN_SECTION_TYPES` (Task 2)
- `src/app/session/[id]/page.tsx` — add `custom` to `SECTION_COMPONENTS`, switch anchors to `section-${id}`, use display helpers (Task 5)
- `src/components/table-of-contents.tsx` — accept full `SessionSection[]`, use display helpers, emit `section-${id}` anchors (Task 6)
- `src/lib/actions/sections.ts` — new `upsertSection` signature with `title`/`icon`/`id`; add `deleteCustomSection`, `reorderSections`; enforce validation and admin auth (Task 9)
- `src/components/admin/session-form.tsx` — refactor state to `SectionSlot[]`, add per-section controls (title input, icon picker, reorder arrows, delete for custom), add "Добавить раздел" button, update save pipeline (Tasks 11, 12, 13)

**Unchanged (by design):**
- All 6 specialized section components (`DirectorSection`, `CinematographySection`, `MotivationSection`, `InfluenceSection`, `ThemesSection`, `FactsSection`) — they already accept only `content` and care nothing about titles or icons
- `src/components/ui/markdown-content.tsx` — reused by `CustomSection` as-is
- `SessionHero`, `FloatingRateButton`, `SessionRatings`, bingo components, rating components, session CRUD actions

---

## Task 1: Extend types + fix seed data

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/lib/store.ts`

- [ ] **Step 1.1: Extend `SectionType` union and `SessionSection` interface; add `IconName`**

Open `src/types/index.ts` and replace the top of the file (lines 1–20):

```ts
export type SectionType = 'director' | 'cinematography' | 'motivation' | 'influence' | 'themes' | 'facts' | 'custom';

export interface Session {
  id: string;
  title: string;
  year: number;
  genre: string;
  date: string;
  host: string;
  poster_url: string;
  backdrop_url: string;
  director: string | null;
  runtime: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface SessionSection {
  id: string;
  session_id: string;
  type: SectionType;
  title: string | null;
  icon: string | null;
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

Everything below (`DirectorInfo`, `Film`, `VideoEmbed`, `Quote`, `FactCard`, `BingoItem`, etc.) stays unchanged.

- [ ] **Step 1.2: Update `store.ts` seed sections to include `title: null, icon: null`**

In `src/lib/store.ts`, add `title: null, icon: null` to every entry in the `seedSections` array (there are 5 entries: `director`, `cinematography`, `influence`, `themes`, `facts`). Each entry gains two new properties, placed right after `type`:

```ts
{
  id: uuid(),
  session_id: SEED_SESSION_ID,
  type: 'director',
  title: null,
  icon: null,
  enabled: true,
  sort_order: 0,
  content: { /* unchanged */ },
},
```

Repeat for all 5 sections in `seedSections`.

- [ ] **Step 1.3: Update `store.upsertSection` to write `title`/`icon` defaults on new rows**

In `src/lib/store.ts`, find `upsertSection` (around line 218). Update the new-section branch so newly created rows include `title: null, icon: null`:

```ts
const newSection: SessionSection = {
  id: uuid(),
  session_id: sessionId,
  type: type as SessionSection['type'],
  title: null,
  icon: null,
  content,
  enabled,
  sort_order: sortOrder,
};
```

The update branch is unchanged (spreads existing row, which already has `title`/`icon` from the seed update).

- [ ] **Step 1.4: Type-check**

Run: `npm run build`

Expected: build succeeds with no type errors. If TypeScript complains about `title`/`icon` missing from seed entries, finish Step 1.2 on any skipped entries.

- [ ] **Step 1.5: Commit**

```bash
git add src/types/index.ts src/lib/store.ts
git commit -m "Extend types for customizable sections

Add IconName type, 'custom' to SectionType, and nullable title/icon
to SessionSection. Update in-memory store seed to satisfy new shape."
```

---

## Task 2: Refactor `SECTION_CONFIG` + add icon library

**Files:**
- Modify: `src/lib/constants.ts`
- Modify: `src/components/admin/session-form.tsx` (line 251 — the only consumer in committed HEAD)
- Modify: `src/components/table-of-contents.tsx`
- Modify: `src/app/session/[id]/page.tsx`

- [ ] **Step 2.1: Rewrite `src/lib/constants.ts`**

Replace the entire file with:

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
  director:       { title: 'О режиссёре',        iconName: 'Film' },
  motivation:     { title: 'Почему этот фильм',  iconName: 'Clapperboard' },
  cinematography: { title: 'О сюжете',           iconName: 'BookOpen' },
  influence:      { title: 'Влияние и контекст', iconName: 'Sparkles' },
  themes:         { title: 'Темы и символизм',   iconName: 'BookOpen' },
  facts:          { title: 'Интересные факты',   iconName: 'Lightbulb' },
};

export const BUILTIN_SECTION_TYPES: Array<Exclude<SectionType, 'custom'>> = [
  'director', 'motivation', 'cinematography', 'influence', 'themes', 'facts',
];

// Kept for backward compat with any code that still imports SECTION_TYPES.
// Contains only built-ins — customs are per-session and dynamic.
export const SECTION_TYPES: Array<Exclude<SectionType, 'custom'>> = BUILTIN_SECTION_TYPES;

export const MAX_CUSTOM_SECTIONS_PER_SESSION = 10;

export const DEFAULT_CATEGORIES: Omit<RatingCategory, 'sort_order'>[] = [
  { id: 'story', name: 'Сюжет', icon: null },
  { id: 'cinematography', name: 'Операторская работа', icon: null },
  { id: 'acting', name: 'Актёрская игра', icon: null },
  { id: 'direction', name: 'Режиссура', icon: null },
  { id: 'overall', name: 'Общее впечатление', icon: null },
];
```

- [ ] **Step 2.2: Update `src/app/session/[id]/page.tsx` lines 73–86**

Find the `enabledSections.map((section, index) => { ... })` block and replace the config lookup. Current code (around lines 73–90):

```tsx
const config = SECTION_CONFIG[section.type];
const Icon = config.icon;
const Component = SECTION_COMPONENTS[section.type];
```

Replace with (keep the rest of the block intact for now — custom + id-based anchors come in Task 5):

```tsx
const config = SECTION_CONFIG[section.type as Exclude<SectionType, 'custom'>];
const Icon = ICON_LIBRARY[config.iconName];
const Component = SECTION_COMPONENTS[section.type];
```

Add the import at the top of the file:

```tsx
import { SECTION_CONFIG, ICON_LIBRARY } from '@/lib/constants';
```

(Replace any existing `SECTION_CONFIG` import line.)

- [ ] **Step 2.3: Update `src/components/table-of-contents.tsx`**

Find the import line for `SECTION_CONFIG` and add `ICON_LIBRARY`:

```tsx
import { SECTION_CONFIG, ICON_LIBRARY } from '@/lib/constants';
```

Inside `buildTOCItems` (around lines 26–30), the current code references `config.title` only — no change needed for title. No icon usage in TOC today. Leave it as-is for this task; Task 6 will replace the whole function with a helpers-based version.

- [ ] **Step 2.4: Update `src/components/admin/session-form.tsx` line 251**

The only committed usage is the tab trigger label (around line 251):

```tsx
{SECTION_CONFIG[type].title}
```

No change required — we kept `title` on the config. The icon property is not read in the committed version, so this file builds unchanged after Task 2.1.

- [ ] **Step 2.5: Grep for stray `.icon` usages to catch surprises**

Run:

```bash
grep -rn "SECTION_CONFIG\[.*\]\.icon" src/
```

Expected: no matches. If anything prints, it must be converted to `ICON_LIBRARY[SECTION_CONFIG[type].iconName]` before committing.

- [ ] **Step 2.6: Type-check**

Run: `npm run build`

Expected: build succeeds.

- [ ] **Step 2.7: Commit**

```bash
git add src/lib/constants.ts src/app/session/[id]/page.tsx src/components/table-of-contents.tsx
git commit -m "Refactor SECTION_CONFIG to iconName + add ICON_LIBRARY

Section icons move from direct component references to curated
IconName strings resolved through ICON_LIBRARY at render time.
Unlocks per-session icon overrides in upcoming tasks."
```

---

## Task 3: Add `section-display.ts` helpers

**Files:**
- Create: `src/lib/section-display.ts`

- [ ] **Step 3.1: Create the helpers file**

Create `src/lib/section-display.ts`:

```ts
import { SECTION_CONFIG, ICON_LIBRARY, DEFAULT_CUSTOM_ICON } from './constants';
import type { SessionSection, IconName, SectionType } from '@/types';
import type { LucideIcon } from 'lucide-react';

/**
 * Resolves the display title for a section:
 *   1. Per-session override (`section.title`), trimmed non-empty
 *   2. Default from SECTION_CONFIG for built-in types
 *   3. Generic fallback 'Раздел' for custom sections without title
 *   4. Empty string as last resort (shouldn't happen if data is valid)
 */
export function getSectionTitle(section: SessionSection): string {
  if (section.title && section.title.trim()) return section.title;
  if (section.type === 'custom') return 'Раздел';
  const builtin = section.type as Exclude<SectionType, 'custom'>;
  return SECTION_CONFIG[builtin]?.title ?? '';
}

/**
 * Resolves the icon name for a section, validating that it exists in
 * ICON_LIBRARY. Unknown names silently fall back to defaults — this
 * keeps rendering robust if the library is ever trimmed.
 */
export function getSectionIconName(section: SessionSection): IconName {
  if (section.icon && section.icon in ICON_LIBRARY) {
    return section.icon as IconName;
  }
  if (section.type === 'custom') return DEFAULT_CUSTOM_ICON;
  const builtin = section.type as Exclude<SectionType, 'custom'>;
  return SECTION_CONFIG[builtin]?.iconName ?? DEFAULT_CUSTOM_ICON;
}

/**
 * Resolves the actual Lucide component for a section.
 */
export function getSectionIcon(section: SessionSection): LucideIcon {
  return ICON_LIBRARY[getSectionIconName(section)];
}
```

- [ ] **Step 3.2: Type-check**

Run: `npm run build`

Expected: build succeeds. No consumers yet — file compiles in isolation.

- [ ] **Step 3.3: Commit**

```bash
git add src/lib/section-display.ts
git commit -m "Add section-display helpers for title/icon resolution

Single source of truth for override-or-default lookup, used by the
public session page and the table of contents in upcoming tasks."
```

---

## Task 4: Create `CustomSection` renderer

**Files:**
- Create: `src/components/sections/custom-section.tsx`

- [ ] **Step 4.1: Create the component**

Create `src/components/sections/custom-section.tsx`:

```tsx
import MarkdownContent from '@/components/ui/markdown-content';
import type { SectionContent } from '@/types';

export default function CustomSection({ content }: { content: SectionContent }) {
  if (!content.text?.trim()) return null;
  return <MarkdownContent text={content.text} />;
}
```

- [ ] **Step 4.2: Verify `MarkdownContent` export shape**

Run:

```bash
grep -n "export" src/components/ui/markdown-content.tsx
```

Expected: a default export or named export that accepts a `text` prop. If the existing API is different (e.g. it takes `content` or is a named export), adjust the import in `custom-section.tsx` to match the real shape and pass the prop accordingly. Do NOT change `MarkdownContent` itself.

- [ ] **Step 4.3: Type-check**

Run: `npm run build`

Expected: build succeeds.

- [ ] **Step 4.4: Commit**

```bash
git add src/components/sections/custom-section.tsx
git commit -m "Add CustomSection component for Markdown-only sections

Thin wrapper over MarkdownContent used by custom user sections."
```

---

## Task 5: Wire `SessionPage` to helpers + custom component + id anchors

**Files:**
- Modify: `src/app/session/[id]/page.tsx`

- [ ] **Step 5.1: Update imports**

At the top of `src/app/session/[id]/page.tsx`, replace the existing constants/type imports with:

```tsx
import CustomSection from '@/components/sections/custom-section';
import { getSectionTitle, getSectionIcon } from '@/lib/section-display';
import type { SectionType, SectionContent } from '@/types';
```

Remove the `SECTION_CONFIG` and `ICON_LIBRARY` imports added in Task 2 — they are no longer referenced directly in this file (helpers handle it).

- [ ] **Step 5.2: Extend `SECTION_COMPONENTS` map**

Find the `SECTION_COMPONENTS` constant (around lines 23–30) and add `custom`:

```tsx
const SECTION_COMPONENTS: Record<SectionType, React.ComponentType<{ content: SectionContent }>> = {
  director: DirectorSection,
  cinematography: CinematographySection,
  motivation: MotivationSection,
  influence: InfluenceSection,
  themes: ThemesSection,
  facts: FactsSection,
  custom: CustomSection,
};
```

- [ ] **Step 5.3: Replace the render loop's title/icon/anchor lookup**

Find the `enabledSections.map(...)` block (around lines 73–93) and replace the mapping body so it reads:

```tsx
{enabledSections.map((section, index) => {
  const Icon = getSectionIcon(section);
  const title = getSectionTitle(section);
  const Component = SECTION_COMPONENTS[section.type];

  return (
    <div key={section.id} id={`section-${section.id}`} className="scroll-mt-20">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-8 pb-4 border-b border-amber-500/20">
        <Icon className="w-6 h-6 text-amber-500" />
        <h2 className="text-3xl tracking-tight font-bold">{title}</h2>
        <div className="ml-auto text-sm text-zinc-600">
          {index + 1} / {enabledSections.length}
        </div>
      </div>

      {/* Section Content */}
      <Component content={section.content} />
    </div>
  );
})}
```

Two critical differences from the old code:
- `id={\`section-${section.id}\`}` (was `section-${section.type}`) — enables multiple customs without collisions
- `title` / `Icon` come from helpers, not `SECTION_CONFIG` directly

- [ ] **Step 5.4: Update the `TableOfContents` call**

Find the `<TableOfContents sections={enabledSections.map(s => ({ type: s.type, content: s.content }))} />` line (around line 106) and replace with:

```tsx
<TableOfContents sections={enabledSections} />
```

(The TOC signature change lands in Task 6; this line will temporarily pass a wider object than TOC currently expects, but the new signature accepts `SessionSection[]` which is already what `enabledSections` is. If TS complains until Task 6 lands, you can leave the old mapping temporarily and update both files together — but preferred is to land Task 6 before committing Task 5.)

- [ ] **Step 5.5: Type-check (after Task 6)**

Since Steps 5.4 and Task 6 are interdependent, defer `npm run build` until Task 6 step 6.4 below, then verify both at once.

- [ ] **Step 5.6: Defer commit until after Task 6**

Do not commit yet. Proceed directly to Task 6; commit both changes together.

---

## Task 6: Update `TableOfContents` to use helpers

**Files:**
- Modify: `src/components/table-of-contents.tsx`

- [ ] **Step 6.1: Replace the file contents**

Rewrite `src/components/table-of-contents.tsx`:

```tsx
'use client';

import { useRef, useCallback } from 'react';
import { Star } from 'lucide-react';
import { slugify } from '@/components/ui/markdown-content';
import { getSectionTitle } from '@/lib/section-display';
import type { SessionSection } from '@/types';

interface TOCProps {
  sections: SessionSection[];
}

interface TOCItem {
  id: string;
  label: string;
  level: number; // 0 = section, 1 = h2, 2 = h3
}

function buildTOCItems(sections: SessionSection[]): TOCItem[] {
  const items: TOCItem[] = [];

  for (const section of sections) {
    items.push({
      id: `section-${section.id}`,
      label: getSectionTitle(section),
      level: 0,
    });

    // Parse markdown headings from content.text (h1/h2 → level 1, h3 → level 2)
    if (section.content.text) {
      const headingRegex = /^(#{1,3})\s+(.+)$/gm;
      let match;
      while ((match = headingRegex.exec(section.content.text)) !== null) {
        const hashes = match[1].length;
        const text = match[2].trim();
        items.push({
          id: slugify(text),
          label: text,
          level: hashes <= 2 ? 1 : 2,
        });
      }
    }
  }

  // Add ratings section
  items.push({
    id: 'ratings',
    label: 'Оценки',
    level: 0,
  });

  return items;
}

export default function TableOfContents({ sections }: TOCProps) {
  const itemsRef = useRef<TOCItem[]>([]);
  itemsRef.current = buildTOCItems(sections);

  const handleClick = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const items = itemsRef.current;

  return (
    <nav className="hidden xl:block fixed top-1/2 -translate-y-1/2 right-6 2xl:right-10 z-40 w-56 2xl:w-64 opacity-40 hover:opacity-100 transition-opacity duration-300">
      <div className="bg-zinc-900/70 backdrop-blur-sm border border-zinc-800/50 rounded-xl p-4 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
          Содержание
        </p>
        <ul className="space-y-0.5">
          {items.map((item, index) => {
            const isSection = item.level === 0;

            return (
              <li key={`${item.id}-${index}`}>
                <button
                  onClick={() => handleClick(item.id)}
                  className={[
                    'block w-full text-left transition-colors duration-200 rounded-md',
                    'border-l-2 border-transparent hover:text-zinc-300 hover:bg-zinc-800/50',
                    isSection ? 'py-1.5 pr-2' : 'py-1 pr-2',
                    item.level === 0 && 'pl-2',
                    item.level === 1 && 'pl-5',
                    item.level === 2 && 'pl-8',
                    isSection && 'text-zinc-400 font-medium',
                    item.level === 1 && 'text-zinc-400',
                    item.level === 2 && 'text-zinc-500',
                    isSection ? 'text-sm' : item.level === 1 ? 'text-xs font-medium' : 'text-xs',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  title={item.label}
                >
                  {item.level === 0 && item.id === 'ratings' ? (
                    <span className="flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </span>
                  ) : item.level === 0 ? (
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0 opacity-60" />
                      <span className="truncate">{item.label}</span>
                    </span>
                  ) : (
                    <span className="truncate block">{item.label}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
```

Key differences vs. the old version:
- Prop type is `SessionSection[]` (was a stripped `{type, content}` tuple)
- `id: section-${section.id}` (was `section-${section.type}`)
- `label: getSectionTitle(section)` (was `SECTION_CONFIG[section.type].title`)
- `SECTION_CONFIG` import removed

- [ ] **Step 6.2: Type-check**

Run: `npm run build`

Expected: build succeeds. Both `SessionPage` (Task 5) and `TableOfContents` (Task 6) are now consistent.

- [ ] **Step 6.3: Manual smoke test**

Run the dev server:

```bash
npm run dev
```

Navigate to an existing session page (e.g., `http://localhost:3000/session/00000000-0000-0000-0000-000000000001`). Verify:
- All built-in sections render with their default titles and icons
- TOC on the right panel shows all section titles
- Clicking a TOC item scrolls to the corresponding section
- No console errors

Stop the dev server (`Ctrl+C`).

- [ ] **Step 6.4: Commit Tasks 5 + 6 together**

```bash
git add src/app/session/[id]/page.tsx src/components/table-of-contents.tsx
git commit -m "Use display helpers + id-based anchors on session page

Session page and TOC now resolve titles/icons through getSectionTitle
and getSectionIcon, and section anchors use section.id instead of
section.type. This unblocks per-section overrides and multiple custom
sections without anchor collisions."
```

---

## Task 7: DB migration for custom sections

**Files:**
- Create: `supabase/migrations/004_custom_sections.sql`

- [ ] **Step 7.1: Create the migration file**

Create `supabase/migrations/004_custom_sections.sql`:

```sql
-- Ensure 'motivation' is in the enum (may already exist from a prior migration applied directly to the DB).
ALTER TYPE section_type ADD VALUE IF NOT EXISTS 'motivation';

-- Add 'custom' to the section_type enum (irreversible — enums cannot drop values).
ALTER TYPE section_type ADD VALUE IF NOT EXISTS 'custom';

-- Per-session override columns. NULL means "use the default from SECTION_CONFIG".
ALTER TABLE session_sections
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS icon TEXT;

-- Replace the full unique constraint with a partial unique index.
-- Built-ins remain unique per session; multiple 'custom' rows are allowed.
ALTER TABLE session_sections
  DROP CONSTRAINT IF EXISTS session_sections_session_id_type_key;

CREATE UNIQUE INDEX IF NOT EXISTS session_sections_builtin_unique
  ON session_sections (session_id, type)
  WHERE type <> 'custom';

-- Ordering index (scans are already small, but this avoids full-table sorts).
CREATE INDEX IF NOT EXISTS session_sections_order_idx
  ON session_sections (session_id, sort_order);
```

- [ ] **Step 7.2: Apply the migration (Supabase-configured environments only)**

If the project is configured with a real Supabase instance, apply the migration. Otherwise skip this step — `store.ts` (in-memory fallback) does not execute SQL.

For local Supabase CLI:

```bash
supabase db push
```

For remote Supabase, apply via the SQL editor in the dashboard.

Verify the enum after applying:

```sql
SELECT enum_range(NULL::section_type);
```

Expected output should include all of `{director, cinematography, motivation, influence, themes, facts, custom}` (order may vary).

Verify the partial index exists:

```sql
SELECT indexname FROM pg_indexes
WHERE tablename = 'session_sections' AND indexname = 'session_sections_builtin_unique';
```

Expected: one row returned.

- [ ] **Step 7.3: Commit**

```bash
git add supabase/migrations/004_custom_sections.sql
git commit -m "Migration: add title/icon overrides + 'custom' section type

Adds nullable title/icon columns, extends section_type enum with
'custom', and replaces the full unique constraint with a partial
unique index so built-ins stay unique while multiple customs are
allowed per session."
```

---

## Task 8: Update in-memory store for custom sections

**Files:**
- Modify: `src/lib/store.ts`

- [ ] **Step 8.1: Replace `upsertSection` with the new signature**

In `src/lib/store.ts`, find `upsertSection` (around lines 218–243) and replace with a params-object version that supports `id`, `title`, `icon`:

```ts
upsertSection(params: {
  id?: string;
  sessionId: string;
  type: SessionSection['type'];
  title: string | null;
  icon: string | null;
  content: SessionSection['content'];
  enabled: boolean;
  sortOrder: number;
}): SessionSection {
  const s = getStore();

  // Update by id (customs: always; built-ins: when we know the row id)
  if (params.id) {
    const idx = s.sections.findIndex(
      (sec) => sec.id === params.id && sec.session_id === params.sessionId,
    );
    if (idx !== -1) {
      s.sections[idx] = {
        ...s.sections[idx],
        type: params.type,
        title: params.title,
        icon: params.icon,
        content: params.content,
        enabled: params.enabled,
        sort_order: params.sortOrder,
      };
      return s.sections[idx];
    }
  }

  // Built-in upsert by (sessionId, type). Customs without id always insert new.
  if (params.type !== 'custom') {
    const idx = s.sections.findIndex(
      (sec) => sec.session_id === params.sessionId && sec.type === params.type,
    );
    if (idx !== -1) {
      s.sections[idx] = {
        ...s.sections[idx],
        title: params.title,
        icon: params.icon,
        content: params.content,
        enabled: params.enabled,
        sort_order: params.sortOrder,
      };
      return s.sections[idx];
    }
  }

  const newSection: SessionSection = {
    id: uuid(),
    session_id: params.sessionId,
    type: params.type,
    title: params.title,
    icon: params.icon,
    content: params.content,
    enabled: params.enabled,
    sort_order: params.sortOrder,
  };
  s.sections.push(newSection);
  return newSection;
},
```

- [ ] **Step 8.2: Add `deleteCustomSection`**

In the same file, add after `upsertSection`:

```ts
deleteCustomSection(sessionId: string, sectionId: string): { success: boolean; error?: string } {
  const s = getStore();
  const idx = s.sections.findIndex(
    (sec) => sec.id === sectionId && sec.session_id === sessionId,
  );
  if (idx === -1) return { success: false, error: 'Section not found' };
  if (s.sections[idx].type !== 'custom') {
    return { success: false, error: 'Only custom sections can be deleted' };
  }
  s.sections.splice(idx, 1);
  return { success: true };
},
```

- [ ] **Step 8.3: Add `reorderSections`**

After `deleteCustomSection`:

```ts
reorderSections(sessionId: string, orderedIds: string[]): { success: boolean; error?: string } {
  const s = getStore();
  // Validate: all ids must belong to this session
  const sessionSections = s.sections.filter((sec) => sec.session_id === sessionId);
  for (const id of orderedIds) {
    if (!sessionSections.some((sec) => sec.id === id)) {
      return { success: false, error: `Section ${id} does not belong to session` };
    }
  }
  orderedIds.forEach((id, index) => {
    const sec = s.sections.find((x) => x.id === id && x.session_id === sessionId);
    if (sec) sec.sort_order = index;
  });
  return { success: true };
},
```

- [ ] **Step 8.4: Remove stale callers of the old `upsertSection` shape**

`toggleSection` stays as-is (different API). The only caller of `store.upsertSection` in the codebase is inside `src/lib/actions/sections.ts` — Task 9 updates it to use the new signature. Until then `npm run build` WILL fail at that call site because the signature doesn't match. Move directly to Task 9 and commit them together.

- [ ] **Step 8.5: Defer commit until Task 9**

Do not commit Task 8 alone. Proceed to Task 9.

---

## Task 9: Update server actions

**Files:**
- Modify: `src/lib/actions/sections.ts`

- [ ] **Step 9.1: Replace the file with the new action set**

Replace `src/lib/actions/sections.ts` entirely:

```ts
'use server';

import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createAdminClient } from '@/lib/supabase/admin';
import { store } from '@/lib/store';
import { verifyAdmin } from './admin';
import { revalidatePath } from 'next/cache';
import { ICON_LIBRARY } from '@/lib/constants';
import type { SessionSection, SectionContent, SectionType } from '@/types';

const TITLE_MAX_LENGTH = 100;

function normalizeTitle(raw: string | null): string | null {
  if (raw === null) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, TITLE_MAX_LENGTH);
}

function normalizeIcon(raw: string | null): string | null {
  if (raw === null) return null;
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

  // Path B: built-in upsert via (session_id, type) partial unique index
  if (params.type !== 'custom') {
    const { data, error } = await supabase
      .from('session_sections')
      .upsert(
        {
          session_id: params.sessionId,
          type: params.type,
          title,
          icon,
          content: params.content,
          enabled: params.enabled,
          sort_order: params.sortOrder,
        },
        { onConflict: 'session_id,type' },
      )
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

  // Batch update sort_order sequentially (Supabase JS client does not support
  // multi-row update in one call without upsert; this is ≤ 10-ish rows).
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
```

- [ ] **Step 9.2: Type-check**

Run: `npm run build`

Expected: build succeeds. Note: `session-form.tsx` still calls the old `upsertSection(sessionId, type, content, enabled, sortOrder)` signature — the build may fail at that call site. If it does, temporarily update the call in `session-form.tsx` to the new params-object shape with `title: null, icon: null, id: undefined` for each built-in, so the repo remains buildable. The full form refactor lands in Task 11.

Quick patch (temporary, will be replaced in Task 11):

```tsx
// src/components/admin/session-form.tsx, around lines 109–118
for (const type of SECTION_TYPES) {
  const s = sectionState[type];
  await upsertSection({
    sessionId: sessionId!,
    type,
    title: null,
    icon: null,
    content: s.content,
    enabled: s.enabled,
    sortOrder: SECTION_TYPES.indexOf(type),
  });
}
```

- [ ] **Step 9.3: Commit Tasks 8 + 9 + the temporary session-form patch together**

```bash
git add src/lib/store.ts src/lib/actions/sections.ts src/components/admin/session-form.tsx
git commit -m "Update sections server actions + store for overrides and customs

upsertSection takes a params object with title/icon/id; new
deleteCustomSection and reorderSections actions with admin guards and
validation. In-memory store mirrors the same API. session-form temporarily
calls the new signature with null overrides until Task 11 refactors it."
```

---

## Task 10: Create `IconPicker` component

**Files:**
- Create: `src/components/admin/icon-picker.tsx`

- [ ] **Step 10.1: Verify the `Popover` primitive is available**

Run:

```bash
node -e "console.log(Object.keys(require('radix-ui')).filter(k => k.toLowerCase().includes('popover')))"
```

Expected: prints `[ 'Popover' ]` (or similar). The `radix-ui` metapackage version in `package.json` is `^1.4.3` and exports `Popover`.

If the command prints `[]`, fall back to installing `@radix-ui/react-popover` directly:

```bash
npm install @radix-ui/react-popover
```

And import from `@radix-ui/react-popover` instead of `radix-ui` in Step 10.2.

- [ ] **Step 10.2: Create the IconPicker component**

Create `src/components/admin/icon-picker.tsx`:

```tsx
'use client';

import { Popover as PopoverPrimitive } from 'radix-ui';
import { ICON_LIBRARY } from '@/lib/constants';
import type { IconName } from '@/types';

interface Props {
  value: IconName;
  onChange: (name: IconName) => void;
}

export default function IconPicker({ value, onChange }: Props) {
  const Current = ICON_LIBRARY[value];

  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger
        type="button"
        className="w-10 h-10 grid place-items-center rounded-md bg-zinc-800 hover:bg-zinc-700 border border-zinc-700"
        aria-label={`Выбрать иконку (сейчас: ${value})`}
      >
        <Current className="w-5 h-5 text-amber-500" />
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          className="z-50 w-64 rounded-md border border-zinc-700 bg-zinc-900 p-2 shadow-lg"
          sideOffset={4}
          align="start"
        >
          <div className="grid grid-cols-6 gap-1">
            {(Object.keys(ICON_LIBRARY) as IconName[]).map((name) => {
              const I = ICON_LIBRARY[name];
              const active = name === value;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => onChange(name)}
                  title={name}
                  className={`w-9 h-9 grid place-items-center rounded hover:bg-zinc-800 ${
                    active ? 'bg-amber-500/20 ring-1 ring-amber-500' : ''
                  }`}
                  aria-label={name}
                  aria-pressed={active}
                >
                  <I className="w-4 h-4 text-zinc-200" />
                </button>
              );
            })}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
```

- [ ] **Step 10.3: Type-check**

Run: `npm run build`

Expected: build succeeds.

- [ ] **Step 10.4: Commit**

```bash
git add src/components/admin/icon-picker.tsx
git commit -m "Add IconPicker component for admin section customization

Popover over the curated ICON_LIBRARY set, used by the session form
to pick per-section icons."
```

---

## Task 11: Refactor session-form state to `SectionSlot[]`

**Files:**
- Modify: `src/components/admin/session-form.tsx`

- [ ] **Step 11.1: Replace the state and helpers section**

Open `src/components/admin/session-form.tsx`. Replace the imports block at the top (lines 1–17) with:

```tsx
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Eye, ArrowLeft, ArrowUp, ArrowDown, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import SectionEditor from './section-editor';
import BingoEditor from './bingo-editor';
import IconPicker from './icon-picker';
import { Textarea } from '@/components/ui/textarea';
import { createSession, updateSession } from '@/lib/actions/sessions';
import {
  upsertSection,
  deleteCustomSection,
  reorderSections,
} from '@/lib/actions/sections';
import {
  SECTION_CONFIG,
  BUILTIN_SECTION_TYPES,
  DEFAULT_CUSTOM_ICON,
  MAX_CUSTOM_SECTIONS_PER_SESSION,
} from '@/lib/constants';
import { getSectionIconName, getSectionTitle } from '@/lib/section-display';
import type {
  Session,
  SessionSection,
  SectionContent,
  SectionType,
  BingoItem,
  IconName,
} from '@/types';
```

- [ ] **Step 11.2: Replace the state initializer**

Find the state declaration block (around lines 29–54, starting with `const [form, setForm] = useState(...)` through the `const [saving, setSaving] = useState(false);` line). Replace the section-state block (the `sectionState` useState) with a `SectionSlot[]`-based version.

Keep the `form` useState unchanged. Replace only the `sectionState` declaration and add `slots` + `activeTab`:

```tsx
type SectionSlot = {
  id: string;
  type: SectionType;
  title: string | null;
  icon: string | null;
  content: SectionContent;
  enabled: boolean;
  sortOrder: number;
  _dirty?: boolean;
  _deleted?: boolean;
  _isNew?: boolean;
};

function tempId() {
  return `new-${Math.random().toString(36).slice(2, 10)}`;
}

function defaultContentFor(type: SectionType): SectionContent {
  return type === 'facts' ? { cards: [] } : { text: '' };
}

function initSlots(existing: SessionSection[]): SectionSlot[] {
  // Start from DB rows (already sort_order-ordered from server action)
  const fromDb: SectionSlot[] = existing.map((s) => ({
    id: s.id,
    type: s.type,
    title: s.title,
    icon: s.icon,
    content: s.content,
    enabled: s.enabled,
    sortOrder: s.sort_order,
  }));

  // Ensure all 6 built-ins are present (for new sessions or incomplete data).
  // Missing built-ins are appended after existing rows, enabled by default.
  const existingTypes = new Set(fromDb.filter((s) => s.type !== 'custom').map((s) => s.type));
  let nextOrder = fromDb.length;
  for (const type of BUILTIN_SECTION_TYPES) {
    if (!existingTypes.has(type)) {
      fromDb.push({
        id: tempId(),
        type,
        title: null,
        icon: null,
        content: defaultContentFor(type),
        enabled: true,
        sortOrder: nextOrder++,
        _isNew: true,
      });
    }
  }

  // Sort by sortOrder ascending — this is the canonical display order in the form
  fromDb.sort((a, b) => a.sortOrder - b.sortOrder);
  return fromDb;
}
```

Now inside the `SessionForm` component body, replace the `sectionState` state with:

```tsx
const [slots, setSlots] = useState<SectionSlot[]>(() => initSlots(sections));
const [activeTab, setActiveTab] = useState<string>(() => {
  const initial = initSlots(sections);
  return initial[0]?.id ?? '';
});
const [deletedCustomIds, setDeletedCustomIds] = useState<string[]>([]);
```

(Note: the `useState(() => initSlots(sections))` for `activeTab` runs `initSlots` twice on mount — accept this small duplication for simplicity. Alternatively, compute once outside both useStates.)

- [ ] **Step 11.3: Replace the section-state operations**

Delete the old `updateSectionContent` and `toggleSectionEnabled` functions. Replace with the new operations:

```tsx
const updateSlot = (id: string, patch: Partial<SectionSlot>) => {
  setSlots((prev) =>
    prev.map((s) => (s.id === id ? { ...s, ...patch, _dirty: true } : s)),
  );
};

const updateSlotContent = (id: string, content: SectionContent) => {
  updateSlot(id, { content });
};

const toggleSlotEnabled = (id: string, enabled: boolean) => {
  updateSlot(id, { enabled });
};

const moveSlot = (id: string, direction: -1 | 1) => {
  setSlots((prev) => {
    const visible = prev.filter((s) => !s._deleted);
    const idx = visible.findIndex((s) => s.id === id);
    if (idx === -1) return prev;
    const swapWith = idx + direction;
    if (swapWith < 0 || swapWith >= visible.length) return prev;

    // Swap in the visible array
    const reordered = [...visible];
    [reordered[idx], reordered[swapWith]] = [reordered[swapWith], reordered[idx]];

    // Merge back with deleted ones (deleted keep their original relative position)
    const deleted = prev.filter((s) => s._deleted);
    // Recompute sortOrder from visible array index
    const withOrder = reordered.map((s, i) => ({ ...s, sortOrder: i, _dirty: true }));
    return [...withOrder, ...deleted];
  });
};

const addCustomSection = () => {
  setSlots((prev) => {
    const visible = prev.filter((s) => !s._deleted);
    const customCount = visible.filter((s) => s.type === 'custom').length;
    if (customCount >= MAX_CUSTOM_SECTIONS_PER_SESSION) {
      toast.error(`Максимум ${MAX_CUSTOM_SECTIONS_PER_SESSION} кастомных разделов`);
      return prev;
    }
    const newSlot: SectionSlot = {
      id: tempId(),
      type: 'custom',
      title: '',
      icon: DEFAULT_CUSTOM_ICON,
      content: { text: '' },
      enabled: true,
      sortOrder: visible.length,
      _isNew: true,
      _dirty: true,
    };
    const next = [...visible, newSlot, ...prev.filter((s) => s._deleted)];
    // Switch the active tab to the new slot
    setActiveTab(newSlot.id);
    return next;
  });
};

const removeSlot = (id: string) => {
  setSlots((prev) => {
    const target = prev.find((s) => s.id === id);
    if (!target) return prev;
    if (target.type !== 'custom') {
      toast.error('Встроенные разделы нельзя удалить — только выключить');
      return prev;
    }
    // Unsaved custom: drop from array entirely
    if (target._isNew) {
      const next = prev.filter((s) => s.id !== id);
      // Move active tab if needed
      if (activeTab === id) {
        const firstVisible = next.find((s) => !s._deleted);
        setActiveTab(firstVisible?.id ?? '');
      }
      return next;
    }
    // Saved custom: mark for deletion
    setDeletedCustomIds((ids) => [...ids, id]);
    const next = prev.map((s) => (s.id === id ? { ...s, _deleted: true, _dirty: true } : s));
    if (activeTab === id) {
      const firstVisible = next.find((s) => !s._deleted);
      setActiveTab(firstVisible?.id ?? '');
    }
    return next;
  });
};
```

- [ ] **Step 11.4: Replace the `handleSave` function**

Find `handleSave` (starting around line 74 in the committed version) and replace the section-saving loop (the `for (const type of SECTION_TYPES)` block) with the new pipeline. Keep the surrounding session create/update logic unchanged.

The new section-save pipeline, placed after the session create/update and before the success toast:

```tsx
// Recompute sortOrder from visible array index (captures reorder moves)
const visible = slots.filter((s) => !s._deleted);
const withOrder = visible.map((s, i) => ({ ...s, sortOrder: i }));

// Per-slot validation
for (const s of withOrder) {
  if (s.type === 'custom') {
    if (!s.title?.trim()) {
      toast.error(`Кастомный раздел требует заголовок (таб ${withOrder.indexOf(s) + 1})`);
      setSaving(false);
      return;
    }
    if (!s.content.text?.trim()) {
      toast.error(`Кастомный раздел требует текст (таб ${withOrder.indexOf(s) + 1})`);
      setSaving(false);
      return;
    }
  }
}

// 1. Delete marked custom sections
for (const id of deletedCustomIds) {
  const r = await deleteCustomSection(sessionId!, id);
  if (r.error) {
    toast.error(`Ошибка удаления раздела: ${r.error}`);
    setSaving(false);
    return;
  }
}

// 2. Upsert all visible slots
for (const s of withOrder) {
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
  if (r.error) {
    toast.error(`Ошибка сохранения раздела: ${r.error}`);
    setSaving(false);
    return;
  }
}

// After successful save, clear deleted list
setDeletedCustomIds([]);
```

- [ ] **Step 11.5: Replace the render body — dynamic tabs + add button (no per-section controls yet)**

Find the `<Tabs defaultValue="director" ...>` block (around lines 243–280 in committed). Replace with:

```tsx
<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
  <TabsList className="bg-zinc-800 flex-wrap h-auto">
    {slots
      .filter((s) => !s._deleted)
      .map((s) => (
        <TabsTrigger
          key={s.id}
          value={s.id}
          className="data-[state=active]:bg-zinc-700"
        >
          {getSectionTitle(s) || '(без названия)'}
          {!s.enabled && ' (выкл)'}
        </TabsTrigger>
      ))}
    <button
      type="button"
      onClick={addCustomSection}
      className="ml-2 px-3 py-1.5 text-xs rounded hover:bg-zinc-700 text-amber-500"
    >
      <Plus className="inline w-3 h-3 mr-1" />
      Добавить раздел
    </button>
  </TabsList>

  {slots
    .filter((s) => !s._deleted)
    .map((s) => (
      <TabsContent key={s.id} value={s.id}>
        <div className="py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Switch
                checked={s.enabled}
                onCheckedChange={(enabled) => toggleSlotEnabled(s.id, enabled)}
              />
              <Label>Включить раздел</Label>
            </div>
          </div>

          {s.enabled && s.type !== 'custom' && (
            <SectionEditor
              type={s.type}
              content={s.content}
              onChange={(content) => updateSlotContent(s.id, content)}
            />
          )}

          {s.enabled && s.type === 'custom' && (
            <div>
              <Label>Текст (Markdown)</Label>
              <Textarea
                value={s.content.text || ''}
                onChange={(e) => updateSlotContent(s.id, { ...s.content, text: e.target.value })}
                placeholder="Основной текст раздела... Поддерживает **жирный**, *курсив*, [ссылки](url), списки и другой Markdown"
                className="bg-zinc-800 border-zinc-700 min-h-40"
              />
              <p className="text-xs text-zinc-500 mt-1">Поддерживает Markdown</p>
            </div>
          )}
        </div>
      </TabsContent>
    ))}
</Tabs>
```

Title input, icon picker, reorder arrows, and delete button are added in Task 12. This task keeps the form functional with the new state shape but minimal UI.

- [ ] **Step 11.6: Type-check**

Run: `npm run build`

Expected: build succeeds.

- [ ] **Step 11.7: Manual smoke test**

Run `npm run dev`. Open `/admin/session/[id]` (or `/admin/session/new` — depending on how your committed admin routing works). Verify:
- All 6 built-in sections appear as tabs
- Clicking tabs switches content
- Enabling/disabling a section persists on save
- "Добавить раздел" creates a new custom tab with empty Markdown textarea
- Saving a custom with empty text shows an error toast

Stop dev server.

- [ ] **Step 11.8: Commit**

```bash
git add src/components/admin/session-form.tsx
git commit -m "Refactor session form state to SectionSlot array

Replaces Record<SectionType, State> with a dynamic SectionSlot[] that
supports multiple custom sections, per-slot dirty tracking, and deletion
marks. Adds the 'Добавить раздел' button and a basic Markdown editor
for custom sections. Per-section title/icon/reorder controls land in
the next task."
```

---

## Task 12: Add per-section controls (title, icon, reorder, delete)

**Files:**
- Modify: `src/components/admin/session-form.tsx`

- [ ] **Step 12.1: Add a `SectionHeaderControls` subcomponent**

Add this component inside `session-form.tsx`, above the main `SessionForm` export:

```tsx
function SectionHeaderControls({
  slot,
  index,
  total,
  onTitleChange,
  onIconChange,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  slot: SectionSlot;
  index: number;
  total: number;
  onTitleChange: (title: string) => void;
  onIconChange: (icon: IconName) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  const iconName = getSectionIconName(slot);
  const placeholder =
    slot.type !== 'custom'
      ? SECTION_CONFIG[slot.type as Exclude<SectionType, 'custom'>]?.title ?? ''
      : 'Например: Почему стоит посмотреть';

  return (
    <div className="flex flex-wrap items-start gap-2 mb-4 p-3 rounded-md bg-zinc-900/50 border border-zinc-800">
      <IconPicker value={iconName} onChange={onIconChange} />
      <div className="flex-1 min-w-[200px]">
        <Label className="text-xs text-zinc-500">Заголовок раздела</Label>
        <Input
          value={slot.title ?? ''}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={placeholder}
          maxLength={100}
          className="bg-zinc-800 border-zinc-700"
        />
        {slot.type !== 'custom' && (
          <p className="text-[11px] text-zinc-600 mt-1">
            Оставьте пустым для дефолтного заголовка
          </p>
        )}
      </div>
      <div className="flex gap-1 pt-5">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onMoveUp}
          disabled={index === 0}
          aria-label="Переместить вверх"
          className="h-10 w-10 border-zinc-700"
        >
          <ArrowUp className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onMoveDown}
          disabled={index === total - 1}
          aria-label="Переместить вниз"
          className="h-10 w-10 border-zinc-700"
        >
          <ArrowDown className="w-4 h-4" />
        </Button>
        {slot.type === 'custom' && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onRemove}
            aria-label="Удалить раздел"
            className="h-10 w-10 border-red-900/50 text-red-400 hover:bg-red-950/30"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 12.2: Add title/icon update helpers in the form**

Inside `SessionForm`, next to the existing slot operations:

```tsx
const updateSlotTitle = (id: string, title: string) => {
  // Empty string → null (falls back to default)
  updateSlot(id, { title: title.trim() === '' ? null : title });
};

const updateSlotIcon = (id: string, icon: IconName) => {
  updateSlot(id, { icon });
};
```

- [ ] **Step 12.3: Insert `SectionHeaderControls` into each `TabsContent`**

Update the `TabsContent` block inside the main render (from Task 11.5) to render controls above the editor:

```tsx
{slots
  .filter((s) => !s._deleted)
  .map((s, idx, arr) => (
    <TabsContent key={s.id} value={s.id}>
      <div className="py-4">
        <SectionHeaderControls
          slot={s}
          index={idx}
          total={arr.length}
          onTitleChange={(title) => updateSlotTitle(s.id, title)}
          onIconChange={(icon) => updateSlotIcon(s.id, icon)}
          onMoveUp={() => moveSlot(s.id, -1)}
          onMoveDown={() => moveSlot(s.id, 1)}
          onRemove={() => removeSlot(s.id)}
        />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Switch
              checked={s.enabled}
              onCheckedChange={(enabled) => toggleSlotEnabled(s.id, enabled)}
            />
            <Label>Включить раздел</Label>
          </div>
        </div>

        {s.enabled && s.type !== 'custom' && (
          <SectionEditor
            type={s.type}
            content={s.content}
            onChange={(content) => updateSlotContent(s.id, content)}
          />
        )}

        {s.enabled && s.type === 'custom' && (
          <div>
            <Label>Текст (Markdown)</Label>
            <Textarea
              value={s.content.text || ''}
              onChange={(e) => updateSlotContent(s.id, { ...s.content, text: e.target.value })}
              placeholder="Основной текст раздела... Поддерживает **жирный**, *курсив*, [ссылки](url), списки и другой Markdown"
              className="bg-zinc-800 border-zinc-700 min-h-40"
            />
            <p className="text-xs text-zinc-500 mt-1">Поддерживает Markdown</p>
          </div>
        )}
      </div>
    </TabsContent>
  ))}
```

- [ ] **Step 12.4: Type-check**

Run: `npm run build`

Expected: build succeeds.

- [ ] **Step 12.5: Manual smoke test**

Run `npm run dev`. Open the session edit page. Verify:
- Each tab now shows an icon picker, title input, and arrow buttons at the top
- Clicking the icon picker opens the popover with the curated grid — selecting a new icon updates the trigger
- Typing in the title input shows the new name in the tab label live
- Clearing the title input restores the default (placeholder visible, tab label reverts)
- Arrow buttons swap the tab with its neighbor and disable at array edges
- Custom section tabs have a trash button; built-ins do not
- Save → reload the page → all changes persist

Stop dev server.

- [ ] **Step 12.6: Commit**

```bash
git add src/components/admin/session-form.tsx
git commit -m "Add per-section header controls in session form

Each tab gains an icon picker, title override input with placeholder
defaults, up/down reorder arrows, and delete button (custom only).
Built-ins can be renamed and reordered but not deleted."
```

---

## Task 13: Validate end-to-end with Supabase (if configured)

**Files:** none

This task is a verification pass when the project runs against a real Supabase instance. Skip if you're only running with the in-memory store — Task 11 manual testing already covers that path.

- [ ] **Step 13.1: Verify migration applied**

Connect to your Supabase DB and run:

```sql
SELECT enum_range(NULL::section_type);
SELECT indexname FROM pg_indexes
  WHERE tablename = 'session_sections' AND indexname LIKE '%unique%';
SELECT column_name FROM information_schema.columns
  WHERE table_name = 'session_sections'
    AND column_name IN ('title', 'icon');
```

Expected:
- Enum contains `custom` (and `motivation`)
- Index `session_sections_builtin_unique` exists
- Columns `title` and `icon` exist

If any check fails, re-apply `supabase/migrations/004_custom_sections.sql`.

- [ ] **Step 13.2: Verify partial unique index behavior**

```sql
-- Pick any real session id
SELECT id FROM sessions LIMIT 1;
```

Take that id and try to insert a duplicate built-in (should fail) and multiple customs (should succeed):

```sql
-- Should fail with unique constraint violation
INSERT INTO session_sections (session_id, type, enabled, sort_order, content)
VALUES ('<session-id>', 'director', true, 99, '{}');

-- Should succeed (multiple customs OK)
INSERT INTO session_sections (session_id, type, title, icon, enabled, sort_order, content)
VALUES
  ('<session-id>', 'custom', 'Test 1', 'Star', true, 100, '{"text":"test 1"}'),
  ('<session-id>', 'custom', 'Test 2', 'Heart', true, 101, '{"text":"test 2"}');

-- Clean up
DELETE FROM session_sections WHERE title IN ('Test 1', 'Test 2');
```

Expected: first insert fails with `duplicate key value violates unique constraint "session_sections_builtin_unique"`; second succeeds; cleanup deletes 2 rows.

- [ ] **Step 13.3: End-to-end UI test against Supabase**

Run `npm run dev`. Log in as admin. Edit an existing session and:
- Rename `motivation` to "Выбор ведущего" → save → open public page → verify new title
- Change `facts` icon to `Flame` → save → verify icon changes
- Reorder: move `facts` to first position → save → verify order on public page
- Add a custom section "Саундтрек" with Markdown text → save → verify it appears in tabs and on public page with correct icon/anchor
- Delete the custom section → save → verify it's gone from both admin and public

Stop dev server. No commit for this task (verification only).

---

## Task 14: Manual QA checklist

Run through the full QA checklist from the spec (Section "Manual QA чеклист"). Check items off as you verify them. This is the final gate before marking the feature complete.

- [ ] **Backward compat**
  - [ ] Existing session opens on public page with no visual changes
  - [ ] All 6 built-in sections render with default titles and icons
  - [ ] TOC shows correct anchors, clicks scroll to right sections

- [ ] **Renaming**
  - [ ] Set title override for motivation → save → new name on public + TOC
  - [ ] Clear title override → default returns

- [ ] **Icons**
  - [ ] Change icon to Flame → renders on public + TOC
  - [ ] Invalid icon name via DevTools → server nulls it, fallback

- [ ] **Custom sections**
  - [ ] Add 2 custom sections → both appear ordered correctly
  - [ ] Each has its own title/icon/markdown
  - [ ] TOC contains both + their markdown subheadings
  - [ ] Delete first custom → second remains, order correct
  - [ ] Disabled custom hidden on public
  - [ ] 11th custom → button disabled

- [ ] **Reorder**
  - [ ] ↑ arrow on facts → moves up in tabs
  - [ ] Save → new order on public
  - [ ] Built-in + custom mix freely

- [ ] **DB level**
  - [ ] Migration applies cleanly on fresh and existing DB
  - [ ] `session_sections_builtin_unique` blocks duplicate built-ins
  - [ ] Multiple `type='custom'` per session allowed
  - [ ] Migration idempotent (apply twice)

- [ ] **Negative scenarios**
  - [ ] Direct `deleteCustomSection` call on built-in → error
  - [ ] Save custom without title → toast error
  - [ ] Save custom with empty text → toast error
  - [ ] Title > 100 chars → trimmed on server
  - [ ] Non-admin server action call → `Unauthorized`

- [ ] **Final commit**

If any small fixes were made during QA, commit them:

```bash
git add -A
git commit -m "QA fixes for customizable sections"
```

---

## Self-review notes (ran before saving)

1. **Spec coverage:** every requirement from `docs/superpowers/specs/2026-04-05-customizable-sections-design.md` maps to a task:
   - Migration (spec §"Миграция") → Task 7
   - Types (spec §"TypeScript типы") → Task 1
   - Constants / ICON_LIBRARY (spec §"Константы") → Task 2
   - Helpers (spec §"Helpers") → Task 3
   - CustomSection (spec §"Компонент `CustomSection`") → Task 4
   - SessionPage changes (spec §"`SessionPage`") → Task 5
   - TableOfContents (spec §"`TableOfContents`") → Task 6
   - Server actions (spec §"Server actions") → Tasks 8, 9
   - IconPicker (spec §"IconPicker") → Task 10
   - Session form refactor (spec §"Форма") → Tasks 11, 12
   - Manual QA (spec §"Manual QA чеклист") → Task 14
   - Out-of-scope items (global defaults, D&D, auto tests) → honored, not in any task

2. **Placeholder scan:** no TBDs, TODOs, "similar to earlier" — every step contains concrete code or concrete commands with expected output.

3. **Type consistency:**
   - `SectionSlot` fields match between Task 11 definition and Task 12 usage
   - `upsertSection` params-object shape matches between Task 9 definition and Task 11 save pipeline usage
   - `IconName` usage consistent across Tasks 1, 2, 3, 10, 11, 12
   - `getSectionIconName` / `getSectionIcon` / `getSectionTitle` signatures match Task 3 definition and Task 11.5 / 12.1 consumers
   - `deleteCustomSection` / `reorderSections` names consistent across Tasks 8, 9, 11
