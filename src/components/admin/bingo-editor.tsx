'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Save } from 'lucide-react';
import { saveBingoItems } from '@/lib/actions/bingo';
import { toast } from 'sonner';
import type { BingoItem } from '@/types';

interface Props {
  sessionId: string;
  initialItems: BingoItem[];
}

export default function BingoEditor({ sessionId, initialItems }: Props) {
  const [items, setItems] = useState<string[]>(
    initialItems.length > 0 ? initialItems.map(i => i.text) : ['']
  );
  const [saving, setSaving] = useState(false);

  const addItem = () => {
    setItems([...items, '']);
  };

  const updateItem = (index: number, text: string) => {
    const newItems = [...items];
    newItems[index] = text;
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    const validItems = items.filter(text => text.trim());
    if (validItems.length < 16) {
      toast.error('Нужно минимум 16 элементов для бинго (сетка 4x4)');
      return;
    }

    setSaving(true);
    const result = await saveBingoItems(
      sessionId,
      validItems.map((text, i) => ({ text: text.trim(), sort_order: i }))
    );

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Бинго сохранено');
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Элементы бинго ({items.filter(t => t.trim()).length} / мин. 16)</Label>
        <Button size="sm" variant="outline" onClick={addItem} type="button" className="text-xs">
          <Plus className="w-3 h-3 mr-1" />
          Добавить
        </Button>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-xs text-zinc-600 w-6 pt-2.5 text-right flex-shrink-0">{i + 1}</span>
            <Input
              value={item}
              onChange={(e) => updateItem(i, e.target.value)}
              placeholder="Текст элемента бинго"
              className="bg-zinc-800 border-zinc-700"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => removeItem(i)}
              type="button"
              className="text-red-400 flex-shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      <Button
        onClick={handleSave}
        disabled={saving}
        className="bg-amber-500 hover:bg-amber-600 text-zinc-950"
      >
        <Save className="w-4 h-4 mr-2" />
        {saving ? 'Сохранение...' : 'Сохранить бинго'}
      </Button>
    </div>
  );
}
