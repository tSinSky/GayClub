import Link from 'next/link';
import { Film, Settings, LogOut, Plus, List } from 'lucide-react';
import { verifyAdmin, logoutAdmin } from '@/lib/actions/admin';
import { Button } from '@/components/ui/button';
import { redirect } from 'next/navigation';

async function LogoutButton() {
  async function handleLogout() {
    'use server';
    await logoutAdmin();
    redirect('/admin');
  }

  return (
    <form action={handleLogout}>
      <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-zinc-100">
        <LogOut className="w-4 h-4 mr-2" />
        Выйти
      </Button>
    </form>
  );
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAdmin = await verifyAdmin();

  if (!isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin/session/new" className="flex items-center gap-2 text-amber-500">
              <Film className="w-5 h-5" />
              <span className="font-bold">Киноклуб</span>
            </Link>
            <div className="flex items-center gap-1">
              <Link href="/admin/session/new">
                <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-zinc-100">
                  <List className="w-4 h-4 mr-2" />
                  Встречи
                </Button>
              </Link>
              <Link href="/admin/settings">
                <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-zinc-100">
                  <Settings className="w-4 h-4 mr-2" />
                  Настройки
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" target="_blank">
              <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-zinc-100">
                Сайт
              </Button>
            </Link>
            <LogoutButton />
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
