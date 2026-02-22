import SessionsList from '@/components/admin/sessions-list';
import SessionForm from '@/components/admin/session-form';
import { getSessions } from '@/lib/actions/sessions';

export const dynamic = 'force-dynamic';

export default async function AdminNewSessionPage() {
  const sessions = await getSessions();

  return (
    <div className="space-y-8">
      <SessionsList sessions={sessions} />

      <div className="border-t border-zinc-800 pt-8">
        <h2 className="text-xl font-bold mb-6">Новая встреча</h2>
        <SessionForm />
      </div>
    </div>
  );
}
