import AdminSettingsComponent from '@/components/admin/admin-settings';
import { getRatingCategories } from '@/lib/actions/categories';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const categories = await getRatingCategories();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Настройки</h1>
      <AdminSettingsComponent categories={categories} />
    </div>
  );
}
