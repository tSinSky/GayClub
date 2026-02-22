import { useState, useEffect } from 'react';
import { Session, SessionSection } from '../../types';
import { getSession, saveSession } from '../../lib/storage';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Save, Eye, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import SectionEditor from './SectionEditor';

interface Props {
  sessionId: string | null;
  onSave: () => void;
  onCancel: () => void;
}

export default function SessionEditor({ sessionId, onSave, onCancel }: Props) {
  const [session, setSession] = useState<Session>(
    sessionId ? getSession(sessionId)! : createEmptySession()
  );

  function createEmptySession(): Session {
    return {
      id: `session_${Date.now()}`,
      title: '',
      year: new Date().getFullYear(),
      genre: '',
      date: new Date().toISOString().split('T')[0],
      host: '',
      posterUrl: '',
      backdropUrl: '',
      published: false,
      sections: [
        {
          id: 'director',
          type: 'director',
          enabled: true,
          content: { text: '' },
        },
        {
          id: 'cinematography',
          type: 'cinematography',
          enabled: true,
          content: { text: '' },
        },
        {
          id: 'influence',
          type: 'influence',
          enabled: true,
          content: { text: '' },
        },
        {
          id: 'themes',
          type: 'themes',
          enabled: true,
          content: { text: '' },
        },
        {
          id: 'facts',
          type: 'facts',
          enabled: true,
          content: { cards: [] },
        },
      ],
    };
  }

  const handleSave = (publish: boolean = false) => {
    if (!session.title || !session.posterUrl) {
      toast.error('Заполните название и URL постера');
      return;
    }

    const updatedSession = { ...session, published: publish };
    saveSession(updatedSession);
    toast.success(publish ? 'Встреча опубликована' : 'Встреча сохранена');
    onSave();
  };

  const updateField = <K extends keyof Session>(field: K, value: Session[K]) => {
    setSession(prev => ({ ...prev, [field]: value }));
  };

  const updateSection = (sectionId: string, updates: Partial<SessionSection>) => {
    setSession(prev => ({
      ...prev,
      sections: prev.sections.map(s =>
        s.id === sectionId ? { ...s, ...updates } : s
      ),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
        <h2 className="text-xl mb-6">Основная информация</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label>Название фильма *</Label>
            <Input
              value={session.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="Blade Runner 2049"
              className="bg-zinc-800 border-zinc-700"
            />
          </div>

          <div>
            <Label>Год</Label>
            <Input
              type="number"
              value={session.year}
              onChange={(e) => updateField('year', parseInt(e.target.value) || 0)}
              className="bg-zinc-800 border-zinc-700"
            />
          </div>

          <div>
            <Label>Жанр</Label>
            <Input
              value={session.genre}
              onChange={(e) => updateField('genre', e.target.value)}
              placeholder="Научная фантастика, Нео-нуар"
              className="bg-zinc-800 border-zinc-700"
            />
          </div>

          <div>
            <Label>Дата встречи</Label>
            <Input
              type="date"
              value={session.date}
              onChange={(e) => updateField('date', e.target.value)}
              className="bg-zinc-800 border-zinc-700"
            />
          </div>

          <div>
            <Label>Ведущий</Label>
            <Input
              value={session.host}
              onChange={(e) => updateField('host', e.target.value)}
              placeholder="Александр"
              className="bg-zinc-800 border-zinc-700"
            />
          </div>

          <div>
            <Label>Режиссёр</Label>
            <Input
              value={session.director || ''}
              onChange={(e) => updateField('director', e.target.value)}
              placeholder="Дени Вильнёв"
              className="bg-zinc-800 border-zinc-700"
            />
          </div>

          <div>
            <Label>Длительность</Label>
            <Input
              value={session.runtime || ''}
              onChange={(e) => updateField('runtime', e.target.value)}
              placeholder="164 мин"
              className="bg-zinc-800 border-zinc-700"
            />
          </div>

          <div className="md:col-span-2">
            <Label>URL постера *</Label>
            <Input
              value={session.posterUrl}
              onChange={(e) => updateField('posterUrl', e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="bg-zinc-800 border-zinc-700"
            />
          </div>

          <div className="md:col-span-2">
            <Label>URL фона (backdrop)</Label>
            <Input
              value={session.backdropUrl}
              onChange={(e) => updateField('backdropUrl', e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="bg-zinc-800 border-zinc-700"
            />
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
        <h2 className="text-xl mb-6">Разделы контента</h2>

        <Tabs defaultValue={session.sections[0]?.id} className="w-full">
          <TabsList className="bg-zinc-800 flex-wrap h-auto">
            {session.sections.map((section) => (
              <TabsTrigger
                key={section.id}
                value={section.id}
                className="data-[state=active]:bg-zinc-700"
                disabled={!section.enabled}
              >
                {getSectionTitle(section.type)}
                {!section.enabled && ' (выкл)'}
              </TabsTrigger>
            ))}
          </TabsList>

          {session.sections.map((section) => (
            <TabsContent key={section.id} value={section.id}>
              <div className="py-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={section.enabled}
                      onCheckedChange={(enabled) =>
                        updateSection(section.id, { enabled })
                      }
                    />
                    <Label>Включить раздел</Label>
                  </div>
                </div>

                {section.enabled && (
                  <SectionEditor
                    section={section}
                    onChange={(content) =>
                      updateSection(section.id, { content })
                    }
                  />
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-4 pt-4 border-t border-zinc-800">
        <Button
          variant="ghost"
          onClick={onCancel}
          className="text-zinc-400"
        >
          Отмена
        </Button>

        <div className="flex gap-3">
          <Button
            onClick={() => handleSave(false)}
            variant="outline"
            className="border-zinc-700 text-zinc-300"
          >
            <Save className="w-4 h-4 mr-2" />
            Сохранить черновик
          </Button>
          <Button
            onClick={() => handleSave(true)}
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

function getSectionTitle(type: string): string {
  const titles: { [key: string]: string } = {
    director: 'Режиссёр',
    cinematography: 'Операторская работа',
    influence: 'Влияние и контекст',
    themes: 'Темы и символизм',
    facts: 'Интересные факты',
  };
  return titles[type] || type;
}
