-- Bingo progress (multiplayer state per session per user)
CREATE TABLE bingo_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  marked JSONB NOT NULL DEFAULT '[]',
  completed_at TIMESTAMPTZ,
  win_lines JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, user_id)
);

-- RLS
ALTER TABLE bingo_progress ENABLE ROW LEVEL SECURITY;

-- Public read (anyone can see the leaderboard)
CREATE POLICY "Public read bingo progress"
  ON bingo_progress FOR SELECT
  USING (true);

-- Public insert (anyone can start playing)
CREATE POLICY "Public insert bingo progress"
  ON bingo_progress FOR INSERT
  WITH CHECK (true);

-- Public update (anyone can update their own marks)
CREATE POLICY "Public update bingo progress"
  ON bingo_progress FOR UPDATE
  USING (true);

-- Public delete (for reset)
CREATE POLICY "Public delete bingo progress"
  ON bingo_progress FOR DELETE
  USING (true);

-- Service role full access
CREATE POLICY "Service role full access bingo progress"
  ON bingo_progress FOR ALL
  USING (auth.role() = 'service_role');

-- Enable realtime for live leaderboard updates
ALTER PUBLICATION supabase_realtime ADD TABLE bingo_progress;
