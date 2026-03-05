-- Migration: Add in_progress to task_overrides custom_status
-- Phase: UI/UX Overhaul - Action Board

-- Drop existing CHECK constraint
ALTER TABLE public.task_overrides
DROP CONSTRAINT IF EXISTS task_overrides_custom_status_check;

-- Re-add with in_progress included
ALTER TABLE public.task_overrides
ADD CONSTRAINT task_overrides_custom_status_check
CHECK (custom_status IN ('pending', 'in_progress', 'done', 'dismissed'));
