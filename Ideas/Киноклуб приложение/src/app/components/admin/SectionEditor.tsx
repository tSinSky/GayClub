import { SessionSection, SectionContent } from '../../types';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Sparkles, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { getGeminiApiKey } from '../../lib/storage';

interface Props {
  section: SessionSection;
  onChange: (content: SectionContent) => void;
}

export default function SectionEditor({ section, onChange }: Props) {
  const [generating, setGenerating] = useState(false);

  const handleGenerateAI = async () => {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      toast.error('Добавьте Gemini API ключ в настройках');
      return;
    }

    setGenerating(true);
    
    // Mock AI generation - replace with actual Gemini API call
    setTimeout(() => {
      toast.success('Контент сгенерирован! (демо)');
      setGenerating(false);
      
      // Add mock generated content
      const mockContent = generateMockContent(section.type);
      onChange({ ...section.content, ...mockContent });
    }, 1500);
  };

  const updateText = (text: string) => {
    onChange({ ...section.content, text });
  };

  const addImage = () => {
    const images = section.content.images || [];
    onChange({
      ...section.content,
      images: [...images, ''],
    });
  };

  const updateImage = (index: number, url: string) => {
    const images = [...(section.content.images || [])];
    images[index] = url;
    onChange({ ...section.content, images });
  };

  const removeImage = (index: number) => {
    const images = (section.content.images || []).filter((_, i) => i !== index);
    onChange({ ...section.content, images });
  };

  const addVideo = () => {
    const videos = section.content.videos || [];
    onChange({
      ...section.content,
      videos: [...videos, { url: '', platform: 'youtube' }],
    });
  };

  const updateVideo = (index: number, url: string) => {
    const videos = [...(section.content.videos || [])];
    videos[index] = { ...videos[index], url };
    onChange({ ...section.content, videos });
  };

  const removeVideo = (index: number) => {
    const videos = (section.content.videos || []).filter((_, i) => i !== index);
    onChange({ ...section.content, videos });
  };

  const addQuote = () => {
    const quotes = section.content.quotes || [];
    onChange({
      ...section.content,
      quotes: [...quotes, { text: '', author: '' }],
    });
  };

  const updateQuote = (index: number, field: 'text' | 'author' | 'imageUrl', value: string) => {
    const quotes = [...(section.content.quotes || [])];
    quotes[index] = { ...quotes[index], [field]: value };
    onChange({ ...section.content, quotes });
  };

  const removeQuote = (index: number) => {
    const quotes = (section.content.quotes || []).filter((_, i) => i !== index);
    onChange({ ...section.content, quotes });
  };

  const addCard = () => {
    const cards = section.content.cards || [];
    onChange({
      ...section.content,
      cards: [...cards, { title: '', description: '' }],
    });
  };

  const updateCard = (index: number, field: 'title' | 'description' | 'imageUrl', value: string) => {
    const cards = [...(section.content.cards || [])];
    cards[index] = { ...cards[index], [field]: value };
    onChange({ ...section.content, cards });
  };

  const removeCard = (index: number) => {
    const cards = (section.content.cards || []).filter((_, i) => i !== index);
    onChange({ ...section.content, cards });
  };

  return (
    <div className="space-y-6">
      {/* AI Generate Button */}
      <div>
        <Button
          onClick={handleGenerateAI}
          disabled={generating}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {generating ? 'Генерация...' : 'Сгенерировать через AI'}
        </Button>
        <p className="text-xs text-zinc-500 mt-2">
          Использует Gemini API для генерации контента
        </p>
      </div>

      {/* Main Text */}
      <div>
        <Label>Текст</Label>
        <Textarea
          value={section.content.text || ''}
          onChange={(e) => updateText(e.target.value)}
          placeholder="Основной текст раздела..."
          className="bg-zinc-800 border-zinc-700 min-h-32"
        />
      </div>

      {/* Type-specific fields */}
      {section.type === 'cinematography' && (
        <>
          {/* Images */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Изображения кадров</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={addImage}
                className="text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                Добавить
              </Button>
            </div>
            {(section.content.images || []).map((img, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <Input
                  value={img}
                  onChange={(e) => updateImage(i, e.target.value)}
                  placeholder="URL изображения"
                  className="bg-zinc-800 border-zinc-700"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeImage(i)}
                  className="text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Videos */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Видео (YouTube/Vimeo)</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={addVideo}
                className="text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                Добавить
              </Button>
            </div>
            {(section.content.videos || []).map((vid, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <Input
                  value={vid.url}
                  onChange={(e) => updateVideo(i, e.target.value)}
                  placeholder="https://www.youtube.com/embed/..."
                  className="bg-zinc-800 border-zinc-700"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeVideo(i)}
                  className="text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </>
      )}

      {section.type === 'themes' && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Цитаты</Label>
            <Button
              size="sm"
              variant="outline"
              onClick={addQuote}
              className="text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              Добавить
            </Button>
          </div>
          {(section.content.quotes || []).map((quote, i) => (
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
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeQuote(i)}
                className="text-red-400 mt-2"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Удалить
              </Button>
            </div>
          ))}
        </div>
      )}

      {section.type === 'facts' && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Карточки фактов</Label>
            <Button
              size="sm"
              variant="outline"
              onClick={addCard}
              className="text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              Добавить
            </Button>
          </div>
          {(section.content.cards || []).map((card, i) => (
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
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeCard(i)}
                className="text-red-400 mt-2"
              >
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

function generateMockContent(type: string): Partial<SectionContent> {
  // Mock AI-generated content
  switch (type) {
    case 'director':
      return {
        text: 'Сгенерированный текст о режиссёре и его уникальном стиле...',
      };
    case 'cinematography':
      return {
        text: 'Анализ операторской работы, использования света и композиции кадров...',
      };
    case 'influence':
      return {
        text: 'Влияние фильма на киноиндустрию и культуру. Исторический контекст создания...',
      };
    case 'themes':
      return {
        text: 'Глубокий разбор тем и символизма в фильме...',
      };
    case 'facts':
      return {
        cards: [
          {
            title: 'Интересный факт 1',
            description: 'Подробности о создании фильма...',
          },
        ],
      };
    default:
      return {};
  }
}
