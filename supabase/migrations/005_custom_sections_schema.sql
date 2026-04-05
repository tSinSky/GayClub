-- Migration 005: Schema changes for customizable sections.
--
-- Must run AFTER migration 004 has committed (which adds 'custom' to the
-- section_type enum). The partial unique index below references 'custom'
-- as a literal, which requires the enum value to already be usable in
-- this transaction.

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
