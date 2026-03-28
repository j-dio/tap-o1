-- Migration: Schedule send-due-reminders Edge Function via pg_cron
-- Phase 6 fix: wire up the cron trigger that was never configured

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule the Edge Function every 15 minutes.
-- The function is deployed with --no-verify-jwt so no Authorization header is needed.
SELECT cron.schedule(
  'send-due-reminders',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://lewdavphrjbjncwrymly.supabase.co/functions/v1/send-due-reminders',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
