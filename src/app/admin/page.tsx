import { verifyAdmin } from '@/lib/actions/admin';
import { redirect } from 'next/navigation';
import AdminLogin from '@/components/admin/admin-login';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const isAdmin = await verifyAdmin();

  if (isAdmin) {
    redirect('/admin/session/new');
  }

  return <AdminLogin />;
}
