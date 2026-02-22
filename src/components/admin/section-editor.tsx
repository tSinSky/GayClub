'use client';

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Sparkles, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { SectionType, SectionContent, DirectorInfo, Film, VideoEmbed, Quote, FactCard } from '@/types';

interface Props {
  type: SectionType;
  content: SectionContent;
  onChange: (content: SectionContent) => void;
}

export default function SectionEditor({ type, content, onChange }: Props) {
  const handleGenerateAI = () => {
    toast.info('Скоро будет доступно', {
      description: 'AI-генерация контента появится в следующем обновлении',
    });
  };

  const updateText = (text: string) => {
    onChange({ ...content, text });
  };

  // Director helpers
  const updateDirector = (updates: Partial<DirectorInfo>) => {
    const currentDirector = content.director || { name: '', photo: '', bio: '', filmography: [] };
    onChange({ ...content, director: { ...currentDirector, ...updates } });
  };

  const addFilm = () => {
    const films = content.director?.filmography || [];
    updateDirector({ filmography: [...films, { title: '', year: new Date().getFullYear(), posterUrl: '' }] });
  };

  const updateFilm = (index: number, updates: Partial<Film>) => {
    const films = [...(content.director?.filmography || [])];
    films[index] = { ...films[index], ...updates };
    updateDirector({ filmography: films });
  };

  const removeFilm = (index: number) => {
    const films = (content.director?.filmography || []).filter((_, i) => i !== index);
    updateDirector({ filmography: films });
  };

  // Image helpers
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

  // Video helpers
  const addVideo = () => {
    onChange({ ...content, videos: [...(content.videos || []), { url: '', platform: 'youtube' }] });
  };

  const updateVideo = (index: number, url: string) => {
    const videos = [...(content.videos || [])];
    videos[index] = { ...videos[index], url };
    onChange({ ...content, videos });
  };

  const removeVideo = (index: number) => {
    onChange({ ...content, videos: (content.videos || []).filter((_, i) => i !== index) });
  };

  // Quote helpers
  const addQuote = () => {
    onChange({ ...content, quotes: [...(content.quotes || []), { text: '', author: '' }] });
  };

  const updateQuote = (index: number, field: keyof Quote, value: string) => {
    const quotes = [...(content.quotes || [])];
    quotes[index] = { ...quotes[index], [field]: value };
    onChange({ ...content, quotes });
  };

  const removeQuote = (index: number) => {
    onChange({ ...content, quotes: (content.quotes || []).filter((_, i) => i !== index) });
  };

  // Card helpers
  const addCard = () => {
    onChange({ ...content, cards: [...(content.cards || []), { title: '', description: '' }] });
  };

  const updateCard = (index: number, field: keyof FactCard, value: string) => {
    const cards = [...(content.cards || [])];
    cards[index] = { ...cards[index], [field]: value };
    onChange({ ...content, cards });
  };

  const removeCard = (index: number) => {
    onChange({ ...content, cards: (content.cards || []).filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-6">
      {/* AI Generate Button */}
      <div>
        <Button
          onClick={handleGenerateAI}
          type="button"
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Сгенерировать через AI
        </Button>
        <p className="text-xs text-zinc-500 mt-2">
          Использует AI для генерации контента
        </p>
      </div>

      {/* Main Text */}
      <div>
        <Label>Текст</Label>
        <Textarea
          value={content.text || ''}
          onChange={(e) => updateText(e.target.value)}
          placeholder="Основной текст раздела... Поддерживает **жирный**, *курсив*, [ссылки](url), списки и другой Markdown"
          className="bg-zinc-800 border-zinc-700 min-h-32"
        />
        <p className="text-xs text-zinc-500 mt-1">Поддерживает Markdown: **жирный**, *курсив*, ## заголовки, - списки, [ссылки](url)</p>
      </div>

      {/* Director-specific fields */}
      {type === 'director' && (
        <div className="space-y-4">
          <h4 className="font-medium text-zinc-300">Информация о режиссёре</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Имя</Label>
              <Input
                value={content.director?.name || ''}
                onChange={(e) => updateDirector({ name: e.target.value })}
                placeholder="Дени Вильнёв"
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            <div>
              <Label>Фото URL</Label>
              <Input
                value={content.director?.photo || ''}
                onChange={(e) => updateDirector({ photo: e.target.value })}
                placeholder="https://..."
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
          </div>
          <div>
            <Label>Биография</Label>
            <Textarea
              value={content.director?.bio || ''}
              onChange={(e) => updateDirector({ bio: e.target.value })}
              placeholder="Биография режиссёра... (поддерживает Markdown)"
              className="bg-zinc-800 border-zinc-700 min-h-24"
            />
            <p className="text-xs text-zinc-500 mt-1">Поддерживает Markdown</p>
          </div>

          {/* Filmography */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Фильмография</Label>
              <Button size="sm" variant="outline" onClick={addFilm} type="button" className="text-xs">
                <Plus className="w-3 h-3 mr-1" />
                Добавить
              </Button>
            </div>
            {(content.director?.filmography || []).map((film, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <Input
                  value={film.title}
                  onChange={(e) => updateFilm(i, { title: e.target.value })}
                  placeholder="Название"
                  className="bg-zinc-800 border-zinc-700"
                />
                <Input
                  type="number"
                  value={film.year}
                  onChange={(e) => updateFilm(i, { year: parseInt(e.target.value) || 0 })}
                  placeholder="Год"
                  className="bg-zinc-800 border-zinc-700 w-24"
                />
                <Input
                  value={film.posterUrl}
                  onChange={(e) => updateFilm(i, { posterUrl: e.target.value })}
                  placeholder="URL постера"
                  className="bg-zinc-800 border-zinc-700"
                />
                <Button size="sm" variant="ghost" onClick={() => removeFilm(i)} type="button" className="text-red-400">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cinematography-specific fields */}
      {type === 'cinematography' && (
        <>
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Изображения кадров</Label>
              <Button size="sm" variant="outline" onClick={addImage} type="button" className="text-xs">
                <Plus className="w-3 h-3 mr-1" />
                Добавить
              </Button>
            </div>
            {(content.images || []).map((img, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <Input
                  value={img}
                  onChange={(e) => updateImage(i, e.target.value)}
                  placeholder="URL изображения"
                  className="bg-zinc-800 border-zinc-700"
                />
                <Button size="sm" variant="ghost" onClick={() => removeImage(i)} type="button" className="text-red-400">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Видео (YouTube/Vimeo)</Label>
              <Button size="sm" variant="outline" onClick={addVideo} type="button" className="text-xs">
                <Plus className="w-3 h-3 mr-1" />
                Добавить
              </Button>
            </div>
            {(content.videos || []).map((vid, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <Input
                  value={vid.url}
                  onChange={(e) => updateVideo(i, e.target.value)}
                  placeholder="https://www.youtube.com/embed/..."
                  className="bg-zinc-800 border-zinc-700"
                />
                <Button size="sm" variant="ghost" onClick={() => removeVideo(i)} type="button" className="text-red-400">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Themes-specific fields */}
      {type === 'themes' && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Цитаты</Label>
            <Button size="sm" variant="outline" onClick={addQuote} type="button" className="text-xs">
              <Plus className="w-3 h-3 mr-1" />
              Добавить
            </Button>
          </div>
          {(content.quotes || []).map((quote, i) => (
            <div key={i} className="bg-zinc-800 p-4 rounded mb-3">
              <div className="space-y-2">
                <Textarea
                  value={quote.text}
                  onChange={(e) => updateQuote(i, 'text', e.target.value)}
                  placeholder="Текст цитаты"
                  className="bg-zinc-900 border-zinc-700"
                />
                <Input
                  value={quote.author || ''}
                  onChange={(e) => updateQuote(i, 'author', e.target.value)}
                  placeholder="Автор (опционально)"
                  className="bg-zinc-900 border-zinc-700"
                />
                <Input
                  value={quote.imageUrl || ''}
                  onChange={(e) => updateQuote(i, 'imageUrl', e.target.value)}
                  placeholder="URL изображения (опционально)"
                  className="bg-zinc-900 border-zinc-700"
                />
              </div>
              <Button size="sm" variant="ghost" onClick={() => removeQuote(i)} type="button" className="text-red-400 mt-2">
                <Trash2 className="w-3 h-3 mr-1" />
                Удалить
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Facts-specific fields */}
      {type === 'facts' && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Карточки фактов</Label>
            <Button size="sm" variant="outline" onClick={addCard} type="button" className="text-xs">
              <Plus className="w-3 h-3 mr-1" />
              Добавить
            </Button>
          </div>
          {(content.cards || []).map((card, i) => (
            <div key={i} className="bg-zinc-800 p-4 rounded mb-3">
              <div className="space-y-2">
                <Input
                  value={card.title}
                  onChange={(e) => updateCard(i, 'title', e.target.value)}
                  placeholder="Заголовок"
                  className="bg-zinc-900 border-zinc-700"
                />
                <Textarea
                  value={card.description}
                  onChange={(e) => updateCard(i, 'description', e.target.value)}
                  placeholder="Описание"
                  className="bg-zinc-900 border-zinc-700"
                />
                <Input
                  value={card.imageUrl || ''}
                  onChange={(e) => updateCard(i, 'imageUrl', e.target.value)}
                  placeholder="URL изображения (опционально)"
                  className="bg-zinc-900 border-zinc-700"
                />
              </div>
              <Button size="sm" variant="ghost" onClick={() => removeCard(i)} type="button" className="text-red-400 mt-2">
                <Trash2 className="w-3 h-3 mr-1" />
                Удалить
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
