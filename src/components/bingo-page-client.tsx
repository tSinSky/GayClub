'use client';

import { useState, useEffect, useCallback } from 'react';
import BingoNameDialog from '@/components/bingo-name-dialog';
import BingoRules from '@/components/bingo-rules';
import BingoGrid from '@/components/bingo-grid';
import BingoLeaderboard from '@/components/bingo-leaderboard';

interface Props {
  items: string[];
  sessionId: string;
  sessionTitle: string;
}

const LS_USER_ID_KEY = 'cinema_club_user_id';
const LS_USER_NAME_KEY = 'cinema_club_user_name';

export default function BingoPageClient({ items, sessionId, sessionTitle }: Props) {
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [leaderboardKey, setLeaderboardKey] = useState(0);

  useEffect(() => {
    const savedId = localStorage.getItem(LS_USER_ID_KEY);
    const savedName = localStorage.getItem(LS_USER_NAME_KEY);

    if (savedId && savedName) {
      setUserId(savedId);
      setUserName(savedName);
    } else {
      setShowNameDialog(true);
    }
  }, []);

  const handleNameSubmit = (name: string) => {
    let id = localStorage.getItem(LS_USER_ID_KEY);
    if (!id) {
      id = `user_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(LS_USER_ID_KEY, id);
    }
    localStorage.setItem(LS_USER_NAME_KEY, name);
    setUserId(id);
    setUserName(name);
    setShowNameDialog(false);
  };

  const refreshLeaderboard = useCallback(() => {
    setLeaderboardKey((k) => k + 1);
  }, []);

  // Show name dialog
  if (showNameDialog || !userId || !userName) {
    return <BingoNameDialog open={true} onSubmit={handleNameSubmit} />;
  }

  return (
    <>
      <BingoRules />
      <BingoGrid
        items={items}
        sessionId={sessionId}
        sessionTitle={sessionTitle}
        userId={userId}
        userName={userName}
        onProgressChange={refreshLeaderboard}
      />
      <BingoLeaderboard
        sessionId={sessionId}
        currentUserId={userId}
        refreshKey={leaderboardKey}
      />
    </>
  );
}
