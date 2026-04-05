'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Save,
  Eye,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  ChevronRight,
  Film,
  Calendar,
  Tag,
  Clock,
  User,
  Clapperboard,
  Timer,
  Image as ImageIcon,
  Layers,
  Dices,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import SectionEditor from './section-editor';
import BingoEditor from './bingo-editor';
import IconPicker from './icon-picker';
import { createSession, updateSession } from '@/lib/actions/sessions';
import { upsertSection, deleteCustomSection } from '@/lib/actions/sections';
import {
  SECTION_CONFIG,
  BUILTIN_SECTION_TYPES,
  DEFAULT_CUSTOM_ICON,
  MAX_CUSTOM_SECTIONS_PER_SESSION,
  type IconName,
} from '@/lib/constants';
import { getSectionIconName, getSectionTitle } from '@/lib/section-display';
import type {
  Session,
  SessionSection,
  SectionContent,
  SectionType,
  BingoItem,
} from '@/types';

/* ------------------------------------------------------------------ */
/* Field — label + icon-prefixed input + helper text                  */
/* ------------------------------------------------------------------ */
function Field({
  label,
  icon: Icon,
  required,
  hint,
  children,
  className = '',
}: {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-2 flex items-center justify-between text-zinc-200">
        <span className="flex items-center gap-2">
          {Icon && <Icon className="size-3.5 text-zinc-500" />}
          <span className="text-[13px] font-medium">{label}</span>
        </span>
        {required && (
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-amber-500/80">
            Обязательно
          </span>
        )}
      </Label>
      {children}
      {hint && <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-500">{hint}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SectionShell — numbered section container                          */
/* ------------------------------------------------------------------ */
function SectionShell({
  number,
  kicker,
  title,
  description,
  children,
  delay = 0,
}: {
  number: string;
  kicker: string;
  title: string;
  description: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <section
      className="group animate-in fade-in slide-in-from-bottom-4 relative overflow-hidden rounded-3xl border border-zinc-800/80 bg-gradient-to-b from-zinc-900/70 via-zinc-900/40 to-zinc-950/60 p-6 shadow-[0_1px_0_rgba(255,255,255,0.03)_inset,0_40px_80px_-40px_rgba(0,0,0,0.6)] duration-700 md:p-10"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'backwards' }}
    >
      {/* corner grain glow */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-amber-500/5 blur-3xl" />

      <header className="relative mb-8 flex items-start gap-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/5 font-mono text-sm font-semibold tracking-tight text-amber-400">
          {number}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-amber-500/70">
            {kicker}
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-zinc-50 md:text-2xl">
            {title}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-400">{description}</p>
        </div>
      </header>

      <div className="relative">{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Section slot state model                                            */
/* ------------------------------------------------------------------ */
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

// Deterministic id for a missing built-in placeholder. Each built-in type
// appears at most once per session, so `new-${type}` is unique within the
// form state. Used only for server-rendered placeholder slots, so it must
// be stable between SSR and client hydration — Math.random would mismatch.
function builtinPlaceholderId(type: SectionType) {
  return `new-${type}`;
}

// Client-only random id for newly added custom sections. Safe to use because
// addCustomSection runs in response to user interaction after hydration.
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
  const existingTypes = new Set(fromDb.filter((s) => s.type !== 'custom').map((s) => s.type));
  let nextOrder = fromDb.length;
  for (const type of BUILTIN_SECTION_TYPES) {
    if (!existingTypes.has(type)) {
      fromDb.push({
        id: builtinPlaceholderId(type),
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

  // Sort by sortOrder ascending — canonical display order
  fromDb.sort((a, b) => a.sortOrder - b.sortOrder);
  return fromDb;
}

/* ------------------------------------------------------------------ */
/* SectionHeaderControls — title input, icon picker, reorder, delete  */
/* ------------------------------------------------------------------ */
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
    <div className="mb-4 flex flex-wrap items-start gap-2 rounded-md border border-zinc-800 bg-zinc-900/50 p-3">
      <IconPicker value={iconName} onChange={onIconChange} />
      <div className="min-w-[200px] flex-1">
        <Label className="text-xs text-zinc-500">Заголовок раздела</Label>
        <Input
          value={slot.title ?? ''}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={placeholder}
          maxLength={100}
          className="border-zinc-700 bg-zinc-800"
        />
        {slot.type !== 'custom' && (
          <p className="mt-1 text-[11px] text-zinc-600">
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
          <ArrowUp className="h-4 w-4" />
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
          <ArrowDown className="h-4 w-4" />
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
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

interface Props {
  session?: Session;
  sections?: SessionSection[];
  bingoItems?: BingoItem[];
}

/* ------------------------------------------------------------------ */
/* Main form                                                           */
/* ------------------------------------------------------------------ */
export default function SessionForm({ session, sections = [], bingoItems = [] }: Props) {
  const router = useRouter();
  const isNew = !session;

  const [form, setForm] = useState({
    title: session?.title || '',
    year: session?.year || new Date().getFullYear(),
    genre: session?.genre || '',
    date: session?.date || new Date().toISOString().split('T')[0],
    host: session?.host || '',
    director: session?.director || '',
    runtime: session?.runtime || '',
    poster_url: session?.poster_url || '',
    backdrop_url: session?.backdrop_url || '',
  });

  const initialSlots = useMemo(() => initSlots(sections), [sections]);
  const [slots, setSlots] = useState<SectionSlot[]>(initialSlots);
  const [activeTab, setActiveTab] = useState<string>(() => initialSlots[0]?.id ?? '');
  const [deletedCustomIds, setDeletedCustomIds] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);

  const updateField = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateSlot = (id: string, patch: Partial<SectionSlot>) => {
    setSlots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch, _dirty: true } : s)),
    );
  };

  const updateSlotContent = (id: string, content: SectionContent) => {
    updateSlot(id, { content });
  };

  const updateSlotTitle = (id: string, title: string) => {
    // Empty string → null (falls back to default)
    updateSlot(id, { title: title.trim() === '' ? null : title });
  };

  const updateSlotIcon = (id: string, icon: IconName) => {
    updateSlot(id, { icon });
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

      const reordered = [...visible];
      [reordered[idx], reordered[swapWith]] = [reordered[swapWith], reordered[idx]];

      const deleted = prev.filter((s) => s._deleted);
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
      if (target._isNew) {
        const next = prev.filter((s) => s.id !== id);
        if (activeTab === id) {
          const firstVisible = next.find((s) => !s._deleted);
          setActiveTab(firstVisible?.id ?? '');
        }
        return next;
      }
      setDeletedCustomIds((ids) => [...ids, id]);
      const next = prev.map((s) => (s.id === id ? { ...s, _deleted: true, _dirty: true } : s));
      if (activeTab === id) {
        const firstVisible = next.find((s) => !s._deleted);
        setActiveTab(firstVisible?.id ?? '');
      }
      return next;
    });
  };

  const handleSave = async (publish: boolean) => {
    if (!form.title || !form.poster_url) {
      toast.error('Заполните название и URL постера');
      return;
    }

    setSaving(true);

    try {
      let sessionId = session?.id;

      if (isNew) {
        const result = await createSession({ ...form, published: publish });
        if (result.error) {
          toast.error(result.error);
          setSaving(false);
          return;
        }
        sessionId = result.data!.id;
      } else {
        const result = await updateSession(session!.id, { ...form, published: publish });
        if (result.error) {
          toast.error(result.error);
          setSaving(false);
          return;
        }
      }

      // Recompute sortOrder from visible array index (captures reorder moves)
      const visible = slots.filter((s) => !s._deleted);
      const withOrder = visible.map((s, i) => ({ ...s, sortOrder: i }));

      // Per-slot validation
      for (let i = 0; i < withOrder.length; i++) {
        const s = withOrder[i];
        if (s.type === 'custom') {
          if (!s.title?.trim()) {
            toast.error(`Кастомный раздел требует заголовок (таб ${i + 1})`);
            setSaving(false);
            return;
          }
          if (!s.content.text?.trim()) {
            toast.error(`Кастомный раздел требует текст (таб ${i + 1})`);
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

      toast.success(publish ? 'Встреча опубликована' : 'Встреча сохранена');
      router.push('/admin');
      router.refresh();
    } catch {
      toast.error('Ошибка при сохранении');
    }

    setSaving(false);
  };

  const goBack = () => {
    router.push('/admin');
    router.refresh();
  };

  const visibleSlots = slots.filter((s) => !s._deleted);

  return (
    <div className="relative pb-32">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-8 -z-10 h-[520px] bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(245,158,11,0.08),transparent_70%)]"
      />

      {/* ------------------------------------------------------------ */}
      {/* Header                                                       */}
      {/* ------------------------------------------------------------ */}
      <header className="animate-in fade-in slide-in-from-bottom-2 mb-10 space-y-5 duration-500">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">
          <button
            type="button"
            onClick={goBack}
            className="transition-colors hover:text-amber-400"
          >
            Админ
          </button>
          <ChevronRight className="size-3 text-zinc-700" />
          <button
            type="button"
            onClick={goBack}
            className="transition-colors hover:text-amber-400"
          >
            Встречи
          </button>
          <ChevronRight className="size-3 text-zinc-700" />
          <span className="text-zinc-300">{isNew ? 'Новая' : 'Редактирование'}</span>
        </nav>

        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0 space-y-3">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-amber-400">
                <span className="size-1.5 rounded-full bg-amber-400 shadow-[0_0_8px] shadow-amber-400/70" />
                {isNew ? 'Черновик · Новая встреча' : 'Редактирование'}
              </span>
            </div>
            <h1 className="line-clamp-2 text-3xl font-bold leading-[1.05] tracking-tight text-zinc-50 md:text-5xl">
              {form.title || (
                <span className="text-zinc-600 italic">Название встречи…</span>
              )}
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-zinc-400 md:text-base">
              Заполните информацию о фильме, настройте разделы контента и опубликуйте
              встречу, когда всё будет готово.
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            onClick={goBack}
            className="shrink-0 self-start text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 md:self-end"
          >
            <ArrowLeft className="mr-2 size-4" />
            К списку встреч
          </Button>
        </div>
      </header>

      {/* ------------------------------------------------------------ */}
      {/* Main form column                                             */}
      {/* ------------------------------------------------------------ */}
      <div className="space-y-10">
        {/* -------- Section 01 — Basic info -------- */}
        <SectionShell
          number="01"
          kicker="Информация"
          title="Основная информация"
          description="Название, год, жанр и метаданные встречи. Эти данные используются на карточке, в превью и в шапке страницы фильма."
          delay={60}
        >
          <div className="grid grid-cols-1 gap-x-6 gap-y-6 md:grid-cols-2">
            <Field
              className="md:col-span-2"
              label="Название фильма"
              icon={Film}
              required
              hint="Оригинальное или локализованное название"
            >
              <div className="relative">
                <Film className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  value={form.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="Blade Runner 2049"
                  className="h-11 border-zinc-800 bg-zinc-950/60 pl-10 text-base text-zinc-100 placeholder:text-zinc-600 focus-visible:border-amber-500/40 focus-visible:ring-amber-500/20"
                />
              </div>
            </Field>

            <Field label="Год" icon={Calendar} hint="Год выпуска фильма">
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  type="number"
                  value={form.year}
                  onChange={(e) => updateField('year', parseInt(e.target.value) || 0)}
                  className="h-11 border-zinc-800 bg-zinc-950/60 pl-10 text-zinc-100 focus-visible:border-amber-500/40 focus-visible:ring-amber-500/20"
                />
              </div>
            </Field>

            <Field label="Жанр" icon={Tag} hint="Можно указать несколько через запятую">
              <div className="relative">
                <Tag className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  value={form.genre}
                  onChange={(e) => updateField('genre', e.target.value)}
                  placeholder="Научная фантастика, Нео-нуар"
                  className="h-11 border-zinc-800 bg-zinc-950/60 pl-10 text-zinc-100 placeholder:text-zinc-600 focus-visible:border-amber-500/40 focus-visible:ring-amber-500/20"
                />
              </div>
            </Field>

            <Field label="Дата встречи" icon={Clock} hint="Когда клуб соберётся смотреть">
              <div className="relative">
                <Clock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => updateField('date', e.target.value)}
                  className="h-11 border-zinc-800 bg-zinc-950/60 pl-10 text-zinc-100 focus-visible:border-amber-500/40 focus-visible:ring-amber-500/20"
                />
              </div>
            </Field>

            <Field label="Длительность" icon={Timer} hint="Формат: «164 мин» или «2ч 44м»">
              <div className="relative">
                <Timer className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  value={form.runtime}
                  onChange={(e) => updateField('runtime', e.target.value)}
                  placeholder="164 мин"
                  className="h-11 border-zinc-800 bg-zinc-950/60 pl-10 text-zinc-100 placeholder:text-zinc-600 focus-visible:border-amber-500/40 focus-visible:ring-amber-500/20"
                />
              </div>
            </Field>

            <Field label="Ведущий встречи" icon={User} hint="Кто проводит сессию">
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  value={form.host}
                  onChange={(e) => updateField('host', e.target.value)}
                  placeholder="Александр"
                  className="h-11 border-zinc-800 bg-zinc-950/60 pl-10 text-zinc-100 placeholder:text-zinc-600 focus-visible:border-amber-500/40 focus-visible:ring-amber-500/20"
                />
              </div>
            </Field>

            <Field label="Режиссёр" icon={Clapperboard} hint="Автор фильма">
              <div className="relative">
                <Clapperboard className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  value={form.director}
                  onChange={(e) => updateField('director', e.target.value)}
                  placeholder="Дени Вильнёв"
                  className="h-11 border-zinc-800 bg-zinc-950/60 pl-10 text-zinc-100 placeholder:text-zinc-600 focus-visible:border-amber-500/40 focus-visible:ring-amber-500/20"
                />
              </div>
            </Field>
          </div>

          {/* Divider */}
          <div className="my-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-600">
              Медиа
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
          </div>

          <div className="grid grid-cols-1 gap-x-6 gap-y-6">
            <Field
              label="URL постера"
              icon={ImageIcon}
              required
              hint="Вертикальное изображение 2:3 — отображается на карточке и hero"
            >
              <div className="relative">
                <ImageIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  value={form.poster_url}
                  onChange={(e) => updateField('poster_url', e.target.value)}
                  placeholder="https://images.unsplash.com/…"
                  className="h-11 border-zinc-800 bg-zinc-950/60 pl-10 font-mono text-sm text-zinc-100 placeholder:text-zinc-600 focus-visible:border-amber-500/40 focus-visible:ring-amber-500/20"
                />
              </div>
            </Field>

            <Field
              label="URL фона (backdrop)"
              icon={Layers}
              hint="Горизонтальное изображение для шапки — опционально"
            >
              <div className="relative">
                <Layers className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  value={form.backdrop_url}
                  onChange={(e) => updateField('backdrop_url', e.target.value)}
                  placeholder="https://images.unsplash.com/…"
                  className="h-11 border-zinc-800 bg-zinc-950/60 pl-10 font-mono text-sm text-zinc-100 placeholder:text-zinc-600 focus-visible:border-amber-500/40 focus-visible:ring-amber-500/20"
                />
              </div>
            </Field>
          </div>
        </SectionShell>

        {/* -------- Section 02 — Content blocks -------- */}
        <SectionShell
          number="02"
          kicker="Контент"
          title="Разделы встречи"
          description="Тематические блоки о фильме. Можно отключить любой, переименовать, сменить иконку, переместить или добавить свой кастомный раздел. Поддерживается Markdown в текстах."
          delay={160}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="-mx-1 mb-6 overflow-x-auto pb-1">
              <TabsList className="inline-flex h-auto w-auto flex-wrap gap-1 rounded-xl border border-zinc-800 bg-zinc-950/60 p-2">
                {visibleSlots.map((s) => {
                  const displayTitle = getSectionTitle(s) || '(без названия)';
                  return (
                    <TabsTrigger
                      key={s.id}
                      value={s.id}
                      className="group/trigger relative flex h-9 items-center gap-2 rounded-lg px-3.5 text-[13px] font-medium text-zinc-400 transition-all hover:text-zinc-100 data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-300 data-[state=active]:shadow-[inset_0_0_0_1px_rgba(245,158,11,0.25)]"
                    >
                      <span>{displayTitle}</span>
                      {!s.enabled && (
                        <span className="size-1 rounded-full bg-zinc-600" title="Выключен" />
                      )}
                    </TabsTrigger>
                  );
                })}
                <button
                  type="button"
                  onClick={addCustomSection}
                  className="ml-1 inline-flex h-9 items-center gap-1.5 rounded-lg border border-dashed border-amber-500/30 px-3 text-[12px] font-medium text-amber-400 transition-colors hover:bg-amber-500/10"
                >
                  <Plus className="size-3.5" />
                  Добавить раздел
                </button>
              </TabsList>
            </div>

            {visibleSlots.map((s, idx, arr) => (
              <TabsContent key={s.id} value={s.id} className="mt-0">
                <div className="rounded-2xl border border-zinc-800/60 bg-zinc-950/40 p-6">
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

                  {/* Enable toggle */}
                  <div className="mb-6 flex items-center justify-between gap-4 border-b border-zinc-800/60 pb-5">
                    <div className="text-[11px] text-zinc-500">
                      {s.enabled ? 'Раздел отображается на странице' : 'Раздел скрыт'}
                    </div>
                    <label className="flex cursor-pointer items-center gap-3 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1.5">
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                        {s.enabled ? 'Вкл' : 'Выкл'}
                      </span>
                      <Switch
                        checked={s.enabled}
                        onCheckedChange={(enabled) => toggleSlotEnabled(s.id, enabled)}
                      />
                    </label>
                  </div>

                  {s.enabled ? (
                    s.type !== 'custom' ? (
                      <SectionEditor
                        type={s.type}
                        content={s.content}
                        onChange={(content) => updateSlotContent(s.id, content)}
                      />
                    ) : (
                      <div>
                        <Label className="text-zinc-300">Текст (Markdown)</Label>
                        <Textarea
                          value={s.content.text || ''}
                          onChange={(e) =>
                            updateSlotContent(s.id, { ...s.content, text: e.target.value })
                          }
                          placeholder="Основной текст раздела... Поддерживает **жирный**, *курсив*, [ссылки](url), списки и другой Markdown"
                          className="mt-2 min-h-40 border-zinc-800 bg-zinc-950/60 text-zinc-100"
                        />
                        <p className="mt-1 text-xs text-zinc-500">Поддерживает Markdown</p>
                      </div>
                    )
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                      <div className="flex size-12 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900/60">
                        <Layers className="size-5 text-zinc-600" />
                      </div>
                      <p className="text-sm text-zinc-500">Раздел выключен</p>
                      <p className="text-[11px] text-zinc-600">
                        Включите переключатель выше, чтобы добавить контент
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </SectionShell>

        {/* -------- Section 03 — Bingo (edit only) -------- */}
        {!isNew && (
          <SectionShell
            number="03"
            kicker="Игра"
            title="Кино-Бинго"
            description="Карточки для многопользовательской игры во время просмотра. Участники отмечают события, которые замечают в фильме."
            delay={240}
          >
            <div className="rounded-2xl border border-zinc-800/60 bg-zinc-950/40 p-6">
              <div className="mb-6 flex items-center gap-3 border-b border-zinc-800/60 pb-5">
                <div className="flex size-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/60">
                  <Dices className="size-4 text-amber-400/80" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-zinc-100">Карточки бинго</div>
                  <div className="text-[11px] text-zinc-500">
                    Добавляйте события, которые игроки будут ловить
                  </div>
                </div>
              </div>
              <BingoEditor sessionId={session!.id} initialItems={bingoItems} />
            </div>
          </SectionShell>
        )}
      </div>

      {/* ------------------------------------------------------------ */}
      {/* Sticky footer action bar                                     */}
      {/* ------------------------------------------------------------ */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-800/80 bg-zinc-950/75 backdrop-blur-xl">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-12 h-12 bg-gradient-to-t from-zinc-950/70 to-transparent"
        />
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3 text-[12px] text-zinc-500">
            <span className="relative flex size-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-amber-400/60" />
              <span className="relative size-2 rounded-full bg-amber-400" />
            </span>
            <span className="hidden sm:inline">
              {saving ? 'Сохранение…' : 'Несохранённые изменения'}
            </span>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={goBack}
              className="text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
            >
              Отмена
            </Button>
            <Button
              type="button"
              onClick={() => handleSave(false)}
              variant="outline"
              disabled={saving}
              className="border-zinc-700 bg-zinc-900/60 text-zinc-200 hover:border-zinc-600 hover:bg-zinc-800 hover:text-zinc-50"
            >
              <Save className="mr-2 size-4" />
              <span className="hidden sm:inline">Сохранить черновик</span>
              <span className="sm:hidden">Черновик</span>
            </Button>
            <Button
              type="button"
              onClick={() => handleSave(true)}
              disabled={saving}
              className="bg-amber-500 font-semibold text-zinc-950 shadow-[0_10px_30px_-10px_rgba(245,158,11,0.5)] hover:bg-amber-400"
            >
              <Eye className="mr-2 size-4" />
              Опубликовать
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
