import { Outlet } from 'react-router';
import { Toaster } from './ui/sonner';
import { useEffect } from 'react';
import { initializeMockData } from '../lib/mockData';

export default function Root() {
  useEffect(() => {
    initializeMockData();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Outlet />
      <Toaster theme="dark" />
    </div>
  );
}
