-- Recovery Center sample seed data for the current normalized schema.
-- Intended for local review and development.
-- In a real Supabase project, the auth user should be created through Supabase Auth
-- and the profile row will be created automatically by the auth trigger.

insert into public.profiles (
  id,
  email,
  username,
  full_name,
  timezone
) values (
  '11111111-1111-1111-1111-111111111111',
  'sample@recovery.local',
  'sample-user',
  'Sample User',
  'America/Chicago'
)
on conflict (id) do nothing;

insert into public.recovery_programs (
  id,
  user_id,
  name,
  start_date,
  total_weeks,
  phase_two_starts_week,
  phase_one_dose_mg,
  phase_two_dose_mg,
  patch_renewal_weekday,
  is_active
) values (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'BPC-157 + TB-500 Recovery Protocol',
  '2026-03-01',
  8,
  5,
  1.00,
  2.00,
  4,
  true
)
on conflict (id) do nothing;

insert into public.recovery_weeks (
  id,
  program_id,
  week_number,
  starts_on,
  ends_on,
  phase_label,
  dose_mg
) values
  ('30000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 1, '2026-03-01', '2026-03-07', 'Phase 1', 1.00),
  ('30000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 2, '2026-03-08', '2026-03-14', 'Phase 1', 1.00),
  ('30000000-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 3, '2026-03-15', '2026-03-21', 'Phase 1', 1.00),
  ('30000000-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', 4, '2026-03-22', '2026-03-28', 'Phase 1', 1.00),
  ('30000000-0000-0000-0000-000000000005', '22222222-2222-2222-2222-222222222222', 5, '2026-03-29', '2026-04-04', 'Phase 2', 2.00),
  ('30000000-0000-0000-0000-000000000006', '22222222-2222-2222-2222-222222222222', 6, '2026-04-05', '2026-04-11', 'Phase 2', 2.00),
  ('30000000-0000-0000-0000-000000000007', '22222222-2222-2222-2222-222222222222', 7, '2026-04-12', '2026-04-18', 'Phase 2', 2.00),
  ('30000000-0000-0000-0000-000000000008', '22222222-2222-2222-2222-222222222222', 8, '2026-04-19', '2026-04-25', 'Phase 2', 2.00)
on conflict (program_id, week_number) do nothing;

insert into public.supplements (
  id,
  user_id,
  name,
  is_custom,
  is_active
) values
  ('40000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Vitamin D', false, true),
  ('40000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Magnesium', false, true),
  ('40000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Fish Oil', false, true),
  ('40000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'B Complex', false, true),
  ('40000000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'Vitamin C', false, true),
  ('40000000-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 'Zinc', false, true),
  ('40000000-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', 'Turmeric', false, true),
  ('40000000-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', 'Probiotics', false, true),
  ('40000000-0000-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111', 'CoQ10', false, true),
  ('40000000-0000-0000-0000-000000000010', '11111111-1111-1111-1111-111111111111', 'NAC', false, true)
on conflict (user_id, name) do nothing;

insert into public.daily_entries (
  id,
  user_id,
  program_id,
  week_id,
  entry_date,
  week_number,
  day_of_week,
  patch_cycle_day,
  alcohol_used,
  notes,
  meals,
  water_oz,
  protein_g,
  carbs_g,
  fat_g
) values
  ('50000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '30000000-0000-0000-0000-000000000001', '2026-03-03', 1, 2, 5, false, '', 'Breakfast: eggs and toast; Lunch: chicken bowl; Dinner: steak and rice', 80, 130, 170, 55),
  ('50000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '30000000-0000-0000-0000-000000000001', '2026-03-04', 1, 3, 6, false, '', 'Breakfast: yogurt; Lunch: turkey wrap; Dinner: salmon and potatoes', 72, 120, 160, 50),
  ('50000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '30000000-0000-0000-0000-000000000001', '2026-03-05', 1, 4, 7, false, 'Had some headaches today, maybe not enough carbs today', 'Breakfast: smoothie; Lunch: leftovers; Dinner: chicken and vegetables', 70, 110, 125, 45)
on conflict (program_id, week_number, day_of_week) do nothing;

insert into public.daily_symptom_scores (
  daily_entry_id,
  joint_pain,
  nerve_pain,
  energy,
  sleep_quality,
  afternoon_crash,
  tingling_numbness,
  brain_fog,
  fatigue,
  muscle_weakness,
  burning_pain
) values
  ('50000000-0000-0000-0000-000000000001', 7, 7, 6, 4, 7, 6, 7, 6, 6, 7),
  ('50000000-0000-0000-0000-000000000002', 7, 7, 6, 4, 8, 8, 7, 7, 5, 8),
  ('50000000-0000-0000-0000-000000000003', 6, 5, 7, 7, 4, 4, 7, 6, 6, 4)
on conflict (daily_entry_id) do nothing;

insert into public.daily_entry_supplements (
  daily_entry_id,
  supplement_id
) values
  ('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001'),
  ('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002'),
  ('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003'),
  ('50000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001'),
  ('50000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000006'),
  ('50000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000002'),
  ('50000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000007')
on conflict do nothing;

insert into public.oura_daily_metrics (
  id,
  user_id,
  daily_entry_id,
  metric_date,
  readiness_score,
  sleep_score,
  total_sleep_minutes,
  deep_sleep_minutes,
  rem_sleep_minutes,
  hrv,
  resting_heart_rate,
  steps,
  source
) values
  ('60000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '50000000-0000-0000-0000-000000000001', '2026-03-03', 88, 80, 424, 58, 62, 22, 71, 7666, 'seed'),
  ('60000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', '50000000-0000-0000-0000-000000000002', '2026-03-04', 83, 80, 460, 76, 78, 25, 70, 5248, 'seed'),
  ('60000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', '50000000-0000-0000-0000-000000000003', '2026-03-05', 95, 85, 500, 78, 96, 35, 63, 5328, 'seed')
on conflict (user_id, metric_date) do nothing;

insert into public.daily_tags (
  id,
  user_id,
  daily_entry_id,
  metric_date,
  label,
  source
) values
  ('70000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '50000000-0000-0000-0000-000000000003', '2026-03-05', 'Patch renewal', 'seed'),
  ('70000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', '50000000-0000-0000-0000-000000000003', '2026-03-05', 'Workout', 'seed')
on conflict do nothing;
