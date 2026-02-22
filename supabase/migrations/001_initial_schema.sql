-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Section type enum
CREATE TYPE section_type AS ENUM ('director', 'cinematography', 'influence', 'themes', 'facts');

-- Sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  year INTEGER NOT NULL,
  genre TEXT NOT NULL DEFAULT '',
  date DATE NOT NULL,
  "host" TEXT NOT NULL DEFAULT '',
  poster_url TEXT NOT NULL,
  backdrop_url TEXT NOT NULL DEFAULT '',
  director TEXT,
  runtime TEXT,
  published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Session sections (content is JSONB, structure depends on type)
CREATE TABLE session_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  type section_type NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  content JSONB NOT NULL DEFAULT '{}',
  UNIQUE(session_id, type)
);

-- Bingo items (per session)
CREATE TABLE bingo_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- Rating categories (global)
CREATE TABLE rating_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  sort_order INTEGER DEFAULT 0
);

-- Ratings (per session per user, scores is JSONB map {category: 1-5})
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  scores JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, user_id)
);

-- Admin settings (key-value)
CREATE TABLE admin_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- RLS policies
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE bingo_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE rating_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Public read for published sessions
CREATE POLICY "Public read published sessions"
  ON sessions FOR SELECT
  USING (published = true);

-- Service role full access on sessions
CREATE POLICY "Service role full access sessions"
  ON sessions FOR ALL
  USING (auth.role() = 'service_role');

-- Public read sections of published sessions
CREATE POLICY "Public read sections"
  ON session_sections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = session_sections.session_id
      AND sessions.published = true
    )
  );

CREATE POLICY "Service role full access sections"
  ON session_sections FOR ALL
  USING (auth.role() = 'service_role');

-- Public read bingo items of published sessions
CREATE POLICY "Public read bingo items"
  ON bingo_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = bingo_items.session_id
      AND sessions.published = true
    )
  );

CREATE POLICY "Service role full access bingo"
  ON bingo_items FOR ALL
  USING (auth.role() = 'service_role');

-- Public read rating categories
CREATE POLICY "Public read categories"
  ON rating_categories FOR SELECT
  USING (true);

CREATE POLICY "Service role full access categories"
  ON rating_categories FOR ALL
  USING (auth.role() = 'service_role');

-- Public read and insert ratings
CREATE POLICY "Public read ratings"
  ON ratings FOR SELECT
  USING (true);

CREATE POLICY "Public insert ratings"
  ON ratings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public update own ratings"
  ON ratings FOR UPDATE
  USING (true);

CREATE POLICY "Service role full access ratings"
  ON ratings FOR ALL
  USING (auth.role() = 'service_role');

-- Admin settings only via service role
CREATE POLICY "Service role full access settings"
  ON admin_settings FOR ALL
  USING (auth.role() = 'service_role');

-- Enable realtime for ratings
ALTER PUBLICATION supabase_realtime ADD TABLE ratings;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
