-- Ensure 'motivation' is in the enum (may already exist from a prior migration applied directly to the DB).
ALTER TYPE section_type ADD VALUE IF NOT EXISTS 'motivation';

-- Add 'custom' to the section_type enum (irreversible — enums cannot drop values).
ALTER TYPE section_type ADD VALUE IF NOT EXISTS 'custom';

-- Per-session override columns. NULL means "use the default from SECTION_CONFIG".
ALTER TABLE session_sections
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS icon TEXT;

-- Replace the full unique constraint with a partial unique index.
-- Built-ins remain unique per session; multiple 'custom' rows are allowed.
ALTER TABLE session_sections
  DROP CONSTRAINT IF EXISTS session_sections_session_id_type_key;

CREATE UNIQUE INDEX IF NOT EXISTS session_sections_builtin_unique
  ON session_sections (session_id, type)
  WHERE type <> 'custom';

-- Ordering index (scans are already small, but this avoids full-table sorts).
CREATE INDEX IF NOT EXISTS session_sections_order_idx
  ON session_sections (session_id, sort_order);
