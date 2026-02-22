'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Plus, Trash2, Sparkles } from 'lucide-react';
import { changeAdminPassword } from '@/lib/actions/admin';
import { saveRatingCategories } from '@/lib/actions/categories';
import { toast } from 'sonner';
import type { RatingCategory } from '@/types';

interface Props {
  categories: RatingCategory[];
}

export default function AdminSettings({ categories: initialCategories }: Props) {
  // Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Categories
  const [categories, setCategories] = useState(initialCategories);
  const [savingCategories, setSavingCategories] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast.error('Заполните оба поля');
      return;
    }

    setChangingPassword(true);
    const result = await changeAdminPassword(currentPassword, newPassword);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Пароль изменён');
      setCurrentPassword('');
      setNewPassword('');
    }
    setChangingPassword(false);
  };

  const addCategory = () => {
    setCategories([
      ...categories,
      {
        id: `cat_${Date.now()}`,
        name: '',
        icon: null,
        sort_order: categories.length,
      },
    ]);
  };

  const updateCategory = (index: number, name: string) => {
    const newCategories = [...categories];
    newCategories[index] = { ...newCategories[index], name };
    setCategories(newCategories);
  };

  const removeCategory = (index: number) => {
    setCategories(categories.filter((_, i) => i !== index));
  };

  const handleSaveCategories = async () => {
    const valid = categories.filter(c => c.name.trim());
    if (valid.length === 0) {
      toast.error('Добавьте хотя бы одну категорию');
      return;
    }

    setSavingCategories(true);
    const result = await saveRatingCategories(
      valid.map((c, i) => ({ ...c, sort_order: i }))
    );
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Категории сохранены');
    }
    setSavingCategories(false);
  };

  const handleAIStub = () => {
    toast.info('Скоро будет доступно', {
      description: 'AI-интеграция появится в следующем обновлении',
    });
  };

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Rating Categories */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
        <h2 className="text-xl mb-6 font-bold">Категории оценок</h2>

        <div className="space-y-2 mb-4">
          {categories.map((cat, i) => (
            <div key={cat.id} className="flex gap-2">
              <Input
                value={cat.name}
                onChange={(e) => updateCategory(i, e.target.value)}
                placeholder="Название категории"
                className="bg-zinc-800 border-zinc-700"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeCategory(i)}
                className="text-red-400 flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={addCategory} className="text-xs">
            <Plus className="w-3 h-3 mr-1" />
            Добавить категорию
          </Button>
          <Button
            onClick={handleSaveCategories}
            disabled={savingCategories}
            className="bg-amber-500 hover:bg-amber-600 text-zinc-950"
          >
            <Save className="w-4 h-4 mr-2" />
            {savingCategories ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
        <h2 className="text-xl mb-6 font-bold">Сменить пароль</h2>

        <div className="space-y-4">
          <div>
            <Label>Текущий пароль</Label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="bg-zinc-800 border-zinc-700"
            />
          </div>
          <div>
            <Label>Новый пароль</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="bg-zinc-800 border-zinc-700"
            />
          </div>
          <Button
            onClick={handleChangePassword}
            disabled={changingPassword}
            className="bg-amber-500 hover:bg-amber-600 text-zinc-950"
          >
            {changingPassword ? 'Сохранение...' : 'Сменить пароль'}
          </Button>
        </div>
      </div>

      {/* AI Integration (stub) */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
        <h2 className="text-xl mb-6 font-bold">AI Интеграция</h2>

        <div className="space-y-4">
          <div>
            <Label>Gemini API Key</Label>
            <Input
              type="password"
              placeholder="API ключ..."
              className="bg-zinc-800 border-zinc-700"
              disabled
            />
          </div>
          <Button onClick={handleAIStub} className="bg-purple-600 hover:bg-purple-700 text-white">
            <Sparkles className="w-4 h-4 mr-2" />
            Настроить AI
          </Button>
          <p className="text-xs text-zinc-500">
            AI-генерация контента появится в следующем обновлении
          </p>
        </div>
      </div>
    </div>
  );
}
