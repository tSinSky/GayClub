'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Props {
  open: boolean;
  onSubmit: (name: string) => void;
}

export default function BingoNameDialog({ open, onSubmit }: Props) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 1) return;
    onSubmit(trimmed);
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md bg-zinc-900 border-amber-500/30" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-amber-500 text-center text-xl">
            Как тебя зовут?
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-center">
            Это имя увидят другие игроки в таблице результатов
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <Input
            autoFocus
            placeholder="Твоё имя"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={30}
            className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-amber-500/50"
          />
          <Button
            type="submit"
            disabled={name.trim().length < 1}
            className="bg-amber-500 text-zinc-950 hover:bg-amber-400 font-bold disabled:opacity-40"
          >
            Начать игру
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
