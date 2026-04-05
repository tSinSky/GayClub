import { verifyAdmin } from '@/lib/actions/admin';
import AdminLogin from '@/components/admin/admin-login';
import SessionsList from '@/components/admin/sessions-list';
import { getSessions } from '@/lib/actions/sessions';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const isAdmin = await verifyAdmin();

  if (!isAdmin) {
    return <AdminLogin />;
  }

  const sessions = await getSessions();

  return <SessionsList sessions={sessions} />;
}
