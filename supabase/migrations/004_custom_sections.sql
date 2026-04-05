-- Migration 004: Add enum values for 'motivation' and 'custom'.
--
-- This migration ONLY adds enum values. It is deliberately separated from
-- the rest of the customizable-sections schema changes (migration 005)
-- because Postgres does not allow newly-added enum values to be referenced
-- as literals inside the same transaction that added them — a subsequent
-- statement like `CREATE UNIQUE INDEX ... WHERE type <> 'custom'` would
-- fail with:
--   ERROR: unsafe use of new value "custom" of enum type section_type
-- Splitting across two migration files forces each to run in its own
-- transaction, which is required for the new literal to become usable.

ALTER TYPE section_type ADD VALUE IF NOT EXISTS 'motivation';
ALTER TYPE section_type ADD VALUE IF NOT EXISTS 'custom';
