import { notFound } from 'next/navigation';
import SessionForm from '@/components/admin/session-form';
import { getSession } from '@/lib/actions/sessions';
import { getSessionSections } from '@/lib/actions/sections';
import { getBingoItems } from '@/lib/actions/bingo';

export default async function AdminEditSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [session, sections, bingoItems] = await Promise.all([
    getSession(id),
    getSessionSections(id),
    getBingoItems(id),
  ]);

  if (!session) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Редактировать: {session.title}</h1>
      <SessionForm session={session} sections={sections} bingoItems={bingoItems} />
    </div>
  );
}
