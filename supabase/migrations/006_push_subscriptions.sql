-- Migration: Push subscription and notification log tables
-- Phase 6: Push Notifications

-- Push subscriptions table — stores Web Push API subscription data per user
CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT uq_push_sub_endpoint UNIQUE (user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Push subs: user can select own"
  ON public.push_subscriptions FOR SELECT
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Push subs: user can insert own"
  ON public.push_subscriptions FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Push subs: user can delete own"
  ON public.push_subscriptions FOR DELETE
  USING (user_id = (SELECT auth.uid()));

CREATE INDEX idx_push_subs_user_id ON public.push_subscriptions(user_id);

-- Notification log table — tracks sent notifications to prevent duplicates
CREATE TABLE public.notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  sent_at timestamptz DEFAULT now(),
  type text NOT NULL DEFAULT 'due_reminder',
  CONSTRAINT uq_notification_user_task_type UNIQUE (user_id, task_id, type)
);

ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Notification log: user can select own"
  ON public.notification_log FOR SELECT
  USING (user_id = (SELECT auth.uid()));

-- Service role bypass for Edge Function inserts (service_role key bypasses RLS)
-- No INSERT policy needed for notification_log — Edge Function uses service_role key

CREATE INDEX idx_notification_log_user_id ON public.notification_log(user_id);
CREATE INDEX idx_notification_log_task_id ON public.notification_log(task_id);
CREATE INDEX idx_notification_log_user_task ON public.notification_log(user_id, task_id, type);
