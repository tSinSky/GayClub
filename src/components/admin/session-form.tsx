'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Eye, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import SectionEditor from './section-editor';
import BingoEditor from './bingo-editor';
import { createSession, updateSession } from '@/lib/actions/sessions';
import { upsertSection, toggleSection } from '@/lib/actions/sections';
import { SECTION_CONFIG, SECTION_TYPES } from '@/lib/constants';
import type { Session, SessionSection, SectionContent, SectionType, BingoItem } from '@/types';

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

  // Build section state from existing sections or empty defaults
  const [sectionState, setSectionState] = useState<Record<SectionType, { enabled: boolean; content: SectionContent }>>(() => {
    const state: Record<string, { enabled: boolean; content: SectionContent }> = {};
    for (const type of SECTION_TYPES) {
      const existing = sections.find(s => s.type === type);
      state[type] = {
        enabled: existing?.enabled ?? true,
        content: existing?.content || (type === 'facts' ? { cards: [] } : { text: '' }),
      };
    }
    return state as Record<SectionType, { enabled: boolean; content: SectionContent }>;
  });

  const [saving, setSaving] = useState(false);

  const updateField = (field: string, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const updateSectionContent = (type: SectionType, content: SectionContent) => {
    setSectionState(prev => ({
      ...prev,
      [type]: { ...prev[type], content },
    }));
  };

  const toggleSectionEnabled = (type: SectionType, enabled: boolean) => {
    setSectionState(prev => ({
      ...prev,
      [type]: { ...prev[type], enabled },
    }));
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

      // Save sections
      for (const type of SECTION_TYPES) {
        const s = sectionState[type];
        await upsertSection(
          sessionId!,
          type,
          s.content,
          s.enabled,
          SECTION_TYPES.indexOf(type)
        );
      }

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

        <Tabs defaultValue="director" className="w-full">
          <TabsList className="bg-zinc-800 flex-wrap h-auto">
            {SECTION_TYPES.map((type) => (
              <TabsTrigger
                key={type}
                value={type}
                className="data-[state=active]:bg-zinc-700"
              >
                {SECTION_CONFIG[type].title}
                {!sectionState[type].enabled && ' (выкл)'}
              </TabsTrigger>
            ))}
          </TabsList>

          {SECTION_TYPES.map((type) => (
            <TabsContent key={type} value={type}>
              <div className="py-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={sectionState[type].enabled}
                      onCheckedChange={(enabled) => toggleSectionEnabled(type, enabled)}
                    />
                    <Label>Включить раздел</Label>
                  </div>
                </div>

                {sectionState[type].enabled && (
                  <SectionEditor
                    type={type}
                    content={sectionState[type].content}
                    onChange={(content) => updateSectionContent(type, content)}
                  />
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
