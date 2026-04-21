-- Adds intraday sample columns to oura_daily_metrics.
-- Run once in the Supabase SQL editor.
alter table public.oura_daily_metrics
  add column if not exists sleep_start_at timestamptz,
  add column if not exists sleep_end_at   timestamptz,
  add column if not exists heart_rate_samples jsonb not null default '[]'::jsonb,
  add column if not exists stress_samples    jsonb not null default '[]'::jsonb,
  add column if not exists recovery_samples  jsonb not null default '[]'::jsonb;
