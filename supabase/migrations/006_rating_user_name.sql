-- Add user_name to ratings so we can display who voted
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS user_name TEXT;
