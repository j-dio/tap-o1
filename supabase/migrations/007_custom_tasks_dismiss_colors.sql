-- Migration 007: Custom Tasks, Dismiss-All, Course Colors
-- Adds support for user-created custom tasks alongside imported UVEC/GClassroom tasks.

-- 1. Extend tasks.source CHECK to include 'custom'
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_source_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_source_check
  CHECK (source IN ('uvec', 'gclassroom', 'custom'));

-- 2. Extend courses.source CHECK to include 'custom'
ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_source_check;
ALTER TABLE courses ADD CONSTRAINT courses_source_check
  CHECK (source IN ('uvec', 'gclassroom', 'custom'));

-- 3. Add is_custom flag to tasks (default false for all existing rows)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_custom boolean NOT NULL DEFAULT false;

-- 4. Index for filtering custom tasks
CREATE INDEX IF NOT EXISTS idx_tasks_is_custom ON tasks(is_custom) WHERE is_custom = true;

-- End of migration
