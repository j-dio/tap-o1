-- Migration: Task overrides for user-managed task state
-- Phase 5: Task Management

CREATE TABLE public.task_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  custom_status text CHECK (custom_status IN ('pending', 'done', 'dismissed')),
  priority text CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  notes text,
  reminder_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT uq_task_overrides_user_task UNIQUE (user_id, task_id)
);

ALTER TABLE public.task_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Task overrides: user can access own"
  ON public.task_overrides FOR SELECT
  USING (user_id = (select auth.uid()));

CREATE POLICY "Task overrides: user can insert own"
  ON public.task_overrides FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Task overrides: user can update own"
  ON public.task_overrides FOR UPDATE
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Task overrides: user can delete own"
  ON public.task_overrides FOR DELETE
  USING (user_id = (select auth.uid()));

CREATE INDEX idx_task_overrides_user_id ON public.task_overrides(user_id);
CREATE INDEX idx_task_overrides_task_id ON public.task_overrides(task_id);

CREATE TRIGGER on_task_overrides_updated
  BEFORE UPDATE ON public.task_overrides
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
