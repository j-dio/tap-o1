-- Add url column to tasks table if it doesn't exist.
-- The column was in the original migration (002) but may not have been
-- applied to all environments.
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS url text;
