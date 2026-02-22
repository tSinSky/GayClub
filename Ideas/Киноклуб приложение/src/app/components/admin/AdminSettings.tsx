import { useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import {
  getGeminiApiKey,
  saveGeminiApiKey,
  getRatingCategories,
  saveRatingCategories,
  setAdminPassword,
} from '../../lib/storage';
import { RatingCategory } from '../../types';
import { Plus, Trash2, Key, Star, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSettings() {
  const [geminiKey, setGeminiKey] = useState(getGeminiApiKey() || '');
  const [testingApi, setTestingApi] = useState(false);
  const [apiStatus, setApiStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [categories, setCategories] = useState<RatingCategory[]>(getRatingCategories());
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSaveGeminiKey = () => {
    saveGeminiApiKey(geminiKey);
    toast.success('API ключ сохранён');
  };

  const handleTestGeminiApi = async () => {
    if (!geminiKey) {
      toast.error('Введите API ключ');
      return;
    }

    setTestingApi(true);
    setApiStatus('idle');

    // Mock API test - replace with actual Gemini API call
    setTimeout(() => {
      setTestingApi(false);
      setApiStatus('success');
      toast.success('Подключение к Gemini API успешно! (демо)');
    }, 1500);

    // In production, replace with:
    /*
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Test' }] }],
          }),
        }
      );
      if (response.ok) {
        setApiStatus('success');
        toast.success('Подключение к Gemini API успешно!');
      } else {
        throw new Error('API error');
      }
    } catch (error) {
      setApiStatus('error');
      toast.error('Ошибка подключения к Gemini API');
    } finally {
      setTestingApi(false);
    }
    */
  };

  const handleAddCategory = () => {
    const newCat: RatingCategory = {
      id: `cat_${Date.now()}`,
      name: 'Новая категория',
    };
    const updated = [...categories, newCat];
    setCategories(updated);
    saveRatingCategories(updated);
  };

  const handleUpdateCategory = (id: string, name: string) => {
    const updated = categories.map(c => (c.id === id ? { ...c, name } : c));
    setCategories(updated);
    saveRatingCategories(updated);
  };

  const handleRemoveCategory = (id: string) => {
    const updated = categories.filter(c => c.id !== id);
    setCategories(updated);
    saveRatingCategories(updated);
  };

  const handleGenerateCategories = () => {
    if (!geminiKey) {
      toast.error('Сначала добавьте Gemini API ключ');
      return;
    }

    // Mock AI category generation
    const mockCategories: RatingCategory[] = [
      { id: 'story', name: 'Сюжет', icon: 'BookOpen' },
      { id: 'visual', name: 'Визуал', icon: 'Eye' },
      { id: 'soundtrack', name: 'Саундтрек', icon: 'Music' },
      { id: 'acting', name: 'Актёрская игра', icon: 'Users' },
      { id: 'overall', name: 'Общее впечатление', icon: 'Star' },
    ];
    setCategories(mockCategories);
    saveRatingCategories(mockCategories);
    toast.success('Категории сгенерированы! (демо)');
  };

  const handleChangePassword = () => {
    if (!newPassword || newPassword !== confirmPassword) {
      toast.error('Пароли не совпадают');
      return;
    }

    setAdminPassword(newPassword);
    setNewPassword('');
    setConfirmPassword('');
    toast.success('Пароль изменён');
  };

  return (
    <div className="space-y-8">
      {/* Gemini API Settings */}
      <Card className="bg-zinc-900/50 border-zinc-800 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-5 h-5 text-purple-500" />
          <h3 className="text-xl">Gemini API</h3>
        </div>

        <div className="space-y-4">
          <div>
            <Label>API Ключ</Label>
            <div className="flex gap-2">
              <Input
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIza..."
                className="bg-zinc-800 border-zinc-700"
              />
              <Button
                onClick={handleSaveGeminiKey}
                className="bg-zinc-800 hover:bg-zinc-700"
              >
                Сохранить
              </Button>
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              Получите ключ на{' '}
              <a
                href="https://makersuite.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:underline"
              >
                Google AI Studio
              </a>
            </p>
          </div>

          <div>
            <Button
              onClick={handleTestGeminiApi}
              disabled={testingApi || !geminiKey}
              variant="outline"
              className="border-zinc-700"
            >
              {testingApi ? (
                'Тестирование...'
              ) : (
                <>
                  {apiStatus === 'success' && <CheckCircle className="w-4 h-4 mr-2 text-green-500" />}
                  {apiStatus === 'error' && <AlertCircle className="w-4 h-4 mr-2 text-red-500" />}
                  Тест соединения
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Rating Categories */}
      <Card className="bg-zinc-900/50 border-zinc-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Star className="w-5 h-5 text-amber-500" />
            <h3 className="text-xl">Категории оценки</h3>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleGenerateCategories}
              variant="outline"
              className="border-purple-600 text-purple-400 hover:bg-purple-600/10"
            >
              <Sparkles className="w-4 h-4 mr-1" />
              AI
            </Button>
            <Button
              size="sm"
              onClick={handleAddCategory}
              className="bg-zinc-800 hover:bg-zinc-700"
            >
              <Plus className="w-4 h-4 mr-1" />
              Добавить
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat.id} className="flex gap-2">
              <Input
                value={cat.name}
                onChange={(e) => handleUpdateCategory(cat.id, e.target.value)}
                className="bg-zinc-800 border-zinc-700"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleRemoveCategory(cat.id)}
                className="text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Password Change */}
      <Card className="bg-zinc-900/50 border-zinc-800 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Key className="w-5 h-5 text-amber-500" />
          <h3 className="text-xl">Изменить пароль</h3>
        </div>

        <div className="space-y-3">
          <div>
            <Label>Новый пароль</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="bg-zinc-800 border-zinc-700"
            />
          </div>
          <div>
            <Label>Повторите пароль</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-zinc-800 border-zinc-700"
            />
          </div>
          <Button
            onClick={handleChangePassword}
            className="bg-amber-500 hover:bg-amber-600 text-zinc-950"
          >
            Изменить пароль
          </Button>
        </div>
      </Card>
    </div>
  );
}
