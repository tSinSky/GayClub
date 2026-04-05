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

  // Sort by sortOrder ascending — canonical display order
  fromDb.sort((a, b) => a.sortOrder - b.sortOrder);
  return fromDb;
}

interface Props {
  session?: Session;
  sections?: SessionSection[];
  bingoItems?: BingoItem[];
}

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
    setForm(prev => ({ ...prev, [field]: value }));
  };

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
        const result = await createSession({
          ...form,
          published: publish,
        });
        if (result.error) {
          toast.error(result.error);
          setSaving(false);
          return;
        }
        sessionId = result.data!.id;
      } else {
        const result = await updateSession(session!.id, {
          ...form,
          published: publish,
        });
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
      router.push('/admin/session/new');
      router.refresh();
    } catch (err) {
      toast.error('Ошибка при сохранении');
    }

    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Back */}
      <Button
        variant="ghost"
        onClick={() => { router.push('/admin/session/new'); router.refresh(); }}
        className="text-zinc-400"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Назад к списку
      </Button>

      {/* Basic Info */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
        <h2 className="text-xl mb-6 font-bold">Основная информация</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label>Название фильма *</Label>
            <Input
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="Blade Runner 2049"
              className="bg-zinc-800 border-zinc-700"
            />
          </div>

          <div>
            <Label>Год</Label>
            <Input
              type="number"
              value={form.year}
              onChange={(e) => updateField('year', parseInt(e.target.value) || 0)}
              className="bg-zinc-800 border-zinc-700"
            />
          </div>

          <div>
            <Label>Жанр</Label>
            <Input
              value={form.genre}
              onChange={(e) => updateField('genre', e.target.value)}
              placeholder="Научная фантастика, Нео-нуар"
              className="bg-zinc-800 border-zinc-700"
            />
          </div>

          <div>
            <Label>Дата встречи</Label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => updateField('date', e.target.value)}
              className="bg-zinc-800 border-zinc-700"
            />
          </div>

          <div>
            <Label>Ведущий</Label>
            <Input
              value={form.host}
              onChange={(e) => updateField('host', e.target.value)}
              placeholder="Александр"
              className="bg-zinc-800 border-zinc-700"
            />
          </div>

          <div>
            <Label>Режиссёр</Label>
            <Input
              value={form.director}
              onChange={(e) => updateField('director', e.target.value)}
              placeholder="Дени Вильнёв"
              className="bg-zinc-800 border-zinc-700"
            />
          </div>

          <div>
            <Label>Длительность</Label>
            <Input
              value={form.runtime}
              onChange={(e) => updateField('runtime', e.target.value)}
              placeholder="164 мин"
              className="bg-zinc-800 border-zinc-700"
            />
          </div>

          <div className="md:col-span-2">
            <Label>URL постера *</Label>
            <Input
              value={form.poster_url}
              onChange={(e) => updateField('poster_url', e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="bg-zinc-800 border-zinc-700"
            />
          </div>

          <div className="md:col-span-2">
            <Label>URL фона (backdrop)</Label>
            <Input
              value={form.backdrop_url}
              onChange={(e) => updateField('backdrop_url', e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="bg-zinc-800 border-zinc-700"
            />
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
        <h2 className="text-xl mb-6 font-bold">Разделы контента</h2>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-zinc-800 flex-wrap h-auto">
            {slots
              .filter((s) => !s._deleted)
              .map((s) => {
                const displayTitle =
                  getSectionTitle({
                    id: s.id,
                    session_id: '',
                    type: s.type,
                    title: s.title,
                    icon: s.icon,
                    enabled: s.enabled,
                    sort_order: s.sortOrder,
                    content: s.content,
                  }) || '(без названия)';
                return (
                  <TabsTrigger
                    key={s.id}
                    value={s.id}
                    className="data-[state=active]:bg-zinc-700"
                  >
                    {displayTitle}
                    {!s.enabled && ' (выкл)'}
                  </TabsTrigger>
                );
              })}
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
                        onChange={(e) =>
                          updateSlotContent(s.id, { ...s.content, text: e.target.value })
                        }
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
      </div>

      {/* Bingo */}
      {!isNew && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-xl mb-6 font-bold">Кино-Бинго</h2>
          <BingoEditor sessionId={session!.id} initialItems={bingoItems} />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-4 pt-4 border-t border-zinc-800">
        <Button
          variant="ghost"
          onClick={() => { router.push('/admin/session/new'); router.refresh(); }}
          className="text-zinc-400"
        >
          Отмена
        </Button>

        <div className="flex gap-3">
          <Button
            onClick={() => handleSave(false)}
            variant="outline"
            disabled={saving}
            className="border-zinc-700 text-zinc-300"
          >
            <Save className="w-4 h-4 mr-2" />
            Сохранить черновик
          </Button>
          <Button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="bg-amber-500 hover:bg-amber-600 text-zinc-950"
          >
            <Eye className="w-4 h-4 mr-2" />
            Опубликовать
          </Button>
        </div>
      </div>
    </div>
  );
}
