
-- Enable pg_net for HTTP calls from Postgres
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Add error tracking column to notifications
ALTER TABLE public.notifications 
  ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Remove any pre-existing job with same name
DO $$
BEGIN
  PERFORM cron.unschedule('invoke-process-notifications');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Schedule Edge Function invocation 5 min after check (8:05 AM daily)
SELECT cron.schedule(
  'invoke-process-notifications',
  '5 8 * * *',
  $$
  SELECT net.http_post(
    url := 'https://zsmddafjjltnwuodlxef.supabase.co/functions/v1/process-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzbWRkYWZqamx0bnd1b2RseGVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyMzQwMjAsImV4cCI6MjA3NTgxMDAyMH0.cScPI6CxredFg1rPelXYTQA02VV_lEK0IJT5gu1qBXU'
    ),
    body := '{}'::jsonb
  );
  $$
);
