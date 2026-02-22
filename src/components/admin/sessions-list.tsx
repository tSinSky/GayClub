'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { deleteSession } from '@/lib/actions/sessions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import type { Session } from '@/types';

interface Props {
  sessions: Session[];
}

export default function SessionsList({ sessions }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Удалить встречу "${title}"?`)) return;

    setDeleting(id);
    const result = await deleteSession(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Встреча удалена');
      router.refresh();
    }
    setDeleting(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Встречи</h2>
        <Link href="/admin/session/new">
          <Button className="bg-amber-500 hover:bg-amber-600 text-zinc-950">
            <Plus className="w-4 h-4 mr-2" />
            Новая встреча
          </Button>
        </Link>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          <p>Нет встреч. Создайте первую!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center gap-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium truncate">{session.title}</h3>
                  {session.published ? (
                    <Eye className="w-4 h-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                  )}
                </div>
                <p className="text-sm text-zinc-500">
                  {session.year} • {new Date(session.date).toLocaleDateString('ru-RU')}
                  {session.host && ` • ${session.host}`}
                </p>
              </div>

              <div className="flex gap-2 flex-shrink-0">
                <Link href={`/admin/session/${session.id}`}>
                  <Button size="sm" variant="outline" className="border-zinc-700">
                    <Edit className="w-4 h-4" />
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-zinc-700 text-red-400 hover:text-red-300"
                  onClick={() => handleDelete(session.id, session.title)}
                  disabled={deleting === session.id}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
