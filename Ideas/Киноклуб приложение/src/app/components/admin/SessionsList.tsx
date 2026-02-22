import { getSessions, deleteSession } from '../../lib/storage';
import { Session } from '../../types';
import { Edit, Trash2, Eye, EyeOff, Calendar } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';

interface Props {
  onEdit: (id: string) => void;
}

export default function SessionsList({ onEdit }: Props) {
  const sessions = getSessions();

  const handleDelete = (id: string, title: string) => {
    if (confirm(`Удалить встречу "${title}"?`)) {
      deleteSession(id);
      toast.success('Встреча удалена');
      window.location.reload();
    }
  };

  if (sessions.length === 0) {
    return (
      <div className="text-center py-20 text-zinc-500">
        <Calendar className="w-16 h-16 mx-auto mb-4 text-zinc-700" />
        <p className="text-lg mb-2">Пока нет встреч</p>
        <p className="text-sm">Создайте первую встречу киноклуба</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sessions.map((session: Session) => (
        <div
          key={session.id}
          className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-colors"
        >
          <div className="flex gap-6">
            {/* Poster */}
            <img
              src={session.posterUrl}
              alt={session.title}
              className="w-24 h-36 object-cover rounded"
            />

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-xl mb-1">{session.title}</h3>
                  <p className="text-sm text-zinc-400">
                    {session.year} • {session.genre}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {session.published ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-500/10 border border-green-500/20 text-green-400 text-xs">
                      <Eye className="w-3 h-3" />
                      Опубликовано
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-zinc-700/50 border border-zinc-700 text-zinc-400 text-xs">
                      <EyeOff className="w-3 h-3" />
                      Черновик
                    </span>
                  )}
                </div>
              </div>

              <div className="text-sm text-zinc-500 mb-4">
                <p>Дата: {new Date(session.date).toLocaleDateString('ru-RU')}</p>
                <p>Ведущий: {session.host}</p>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => onEdit(session.id)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Редактировать
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(session.id, session.title)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
