import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { checkAdminPassword } from '../../lib/storage';
import { Lock, Plus, Settings } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import SessionEditor from '../admin/SessionEditor';
import SessionsList from '../admin/SessionsList';
import AdminSettings from '../admin/AdminSettings';

export default function AdminPage() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('sessions');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Check if already authenticated in this session
    const authenticated = sessionStorage.getItem('admin_authenticated');
    if (authenticated === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (checkAdminPassword(password)) {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_authenticated', 'true');
      setError('');
    } else {
      setError('Неверный пароль');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('admin_authenticated');
    setPassword('');
  };

  const handleCreateNew = () => {
    setEditingSessionId('new');
    setActiveTab('editor');
  };

  const handleEdit = (id: string) => {
    setEditingSessionId(id);
    setActiveTab('editor');
  };

  const handleSaveComplete = () => {
    setEditingSessionId(null);
    setActiveTab('sessions');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4">
              <Lock className="w-8 h-8 text-amber-500" />
            </div>
            <h1 className="text-3xl mb-2">Админ-панель</h1>
            <p className="text-zinc-500">Введите пароль для доступа</p>
            <p className="text-xs text-zinc-600 mt-2">
              (По умолчанию: cinema123)
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Пароль"
                className="bg-zinc-900 border-zinc-800 text-zinc-100"
                autoFocus
              />
              {error && (
                <p className="text-red-400 text-sm mt-2">{error}</p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-950"
            >
              Войти
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/')}
              className="w-full text-zinc-400"
            >
              Вернуться на главную
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl">Админ-панель</h1>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="border-zinc-700 text-zinc-300"
            >
              На главную
            </Button>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="text-zinc-400"
            >
              Выйти
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-6">
            <TabsList className="bg-zinc-900 border border-zinc-800">
              <TabsTrigger value="sessions" className="data-[state=active]:bg-zinc-800">
                Встречи
              </TabsTrigger>
              <TabsTrigger value="editor" className="data-[state=active]:bg-zinc-800">
                Редактор
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-zinc-800">
                <Settings className="w-4 h-4 mr-2" />
                Настройки
              </TabsTrigger>
            </TabsList>

            {activeTab === 'sessions' && (
              <Button
                onClick={handleCreateNew}
                className="bg-amber-500 hover:bg-amber-600 text-zinc-950"
              >
                <Plus className="w-4 h-4 mr-2" />
                Создать встречу
              </Button>
            )}
          </div>

          <TabsContent value="sessions" className="mt-0">
            <SessionsList onEdit={handleEdit} />
          </TabsContent>

          <TabsContent value="editor" className="mt-0">
            {editingSessionId ? (
              <SessionEditor
                sessionId={editingSessionId === 'new' ? null : editingSessionId}
                onSave={handleSaveComplete}
                onCancel={() => {
                  setEditingSessionId(null);
                  setActiveTab('sessions');
                }}
              />
            ) : (
              <div className="text-center py-20 text-zinc-500">
                Выберите встречу для редактирования или создайте новую
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            <AdminSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
