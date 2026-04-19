-- Recovery Center mock seed
--
-- This file is intentionally a preview seed for schema review.
-- Replace the UUID below with a real Supabase auth user id after you create
-- a demo account in your project.

-- Example:
-- select auth.uid();
-- Then replace every occurrence of DEMO_USER_ID_HERE with that uuid.

insert into public.profiles (id, email, full_name, timezone)
values (
  'DEMO_USER_ID_HERE',
  'demo@recoverycenter.app',
  'Recovery Center Demo User',
  'America/Chicago'
)
on conflict (id) do update
set
  email = excluded.email,
  full_name = excluded.full_name,
  timezone = excluded.timezone;

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
)
values (
  '11111111-1111-1111-1111-111111111111',
  'DEMO_USER_ID_HERE',
  'BPC-157 + TB-500 protocol',
  '2026-03-01',
  8,
  5,
  1.00,
  2.00,
  4,
  true
)
on conflict (id) do nothing;

insert into public.recovery_weeks (id, program_id, week_number, starts_on, ends_on, phase_label, dose_mg)
values
  ('20000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 1, '2026-03-01', '2026-03-07', 'Phase 1', 1.00),
  ('20000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 2, '2026-03-08', '2026-03-14', 'Phase 1', 1.00),
  ('20000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 3, '2026-03-15', '2026-03-21', 'Phase 1', 1.00),
  ('20000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 4, '2026-03-22', '2026-03-28', 'Phase 1', 1.00),
  ('20000000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 5, '2026-03-29', '2026-04-04', 'Phase 2', 2.00),
  ('20000000-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 6, '2026-04-05', '2026-04-11', 'Phase 2', 2.00),
  ('20000000-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', 7, '2026-04-12', '2026-04-18', 'Phase 2', 2.00),
  ('20000000-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', 8, '2026-04-19', '2026-04-25', 'Phase 2', 2.00)
on conflict (program_id, week_number) do nothing;

insert into public.supplements (id, user_id, name, is_custom)
values
  ('30000000-0000-0000-0000-000000000001', 'DEMO_USER_ID_HERE', 'Vitamin D', false),
  ('30000000-0000-0000-0000-000000000002', 'DEMO_USER_ID_HERE', 'Magnesium', false),
  ('30000000-0000-0000-0000-000000000003', 'DEMO_USER_ID_HERE', 'Fish Oil', false),
  ('30000000-0000-0000-0000-000000000004', 'DEMO_USER_ID_HERE', 'B Complex', false),
  ('30000000-0000-0000-0000-000000000005', 'DEMO_USER_ID_HERE', 'Vitamin C', false),
  ('30000000-0000-0000-0000-000000000006', 'DEMO_USER_ID_HERE', 'Zinc', false),
  ('30000000-0000-0000-0000-000000000007', 'DEMO_USER_ID_HERE', 'Turmeric', false),
  ('30000000-0000-0000-0000-000000000008', 'DEMO_USER_ID_HERE', 'Probiotics', false),
  ('30000000-0000-0000-0000-000000000009', 'DEMO_USER_ID_HERE', 'CoQ10', false),
  ('30000000-0000-0000-0000-000000000010', 'DEMO_USER_ID_HERE', 'NAC', false)
on conflict do nothing;

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
)
values
  (
    '40000000-0000-0000-0000-000000000001',
    'DEMO_USER_ID_HERE',
    '11111111-1111-1111-1111-111111111111',
    '20000000-0000-0000-0000-000000000001',
    '2026-03-03',
    1,
    2,
    5,
    false,
    '',
    '',
    null,
    null,
    null,
    null
  ),
  (
    '40000000-0000-0000-0000-000000000002',
    'DEMO_USER_ID_HERE',
    '11111111-1111-1111-1111-111111111111',
    '20000000-0000-0000-0000-000000000001',
    '2026-03-04',
    1,
    3,
    6,
    false,
    '',
    '',
    null,
    null,
    null,
    null
  ),
  (
    '40000000-0000-0000-0000-000000000003',
    'DEMO_USER_ID_HERE',
    '11111111-1111-1111-1111-111111111111',
    '20000000-0000-0000-0000-000000000001',
    '2026-03-05',
    1,
    4,
    7,
    false,
    'Had some headaches today, maybe not enough carbs today',
    '',
    null,
    null,
    null,
    null
  )
on conflict do nothing;

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
)
values
  ('40000000-0000-0000-0000-000000000001', 7, 7, 6, 4, 7, 6, 7, 6, 6, 7),
  ('40000000-0000-0000-0000-000000000002', 7, 7, 6, 4, 8, 8, 7, 7, 5, 8),
  ('40000000-0000-0000-0000-000000000003', 6, 5, 7, 7, 4, 4, 7, 6, 6, 4)
on conflict (daily_entry_id) do nothing;

insert into public.daily_entry_supplements (daily_entry_id, supplement_id)
values
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001'),
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002'),
  ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002'),
  ('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000007')
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
)
values
  ('50000000-0000-0000-0000-000000000001', 'DEMO_USER_ID_HERE', '40000000-0000-0000-0000-000000000001', '2026-03-03', 88, 80, 424, 58, 62, 22, 71, 7666, 'import'),
  ('50000000-0000-0000-0000-000000000002', 'DEMO_USER_ID_HERE', '40000000-0000-0000-0000-000000000002', '2026-03-04', 83, 80, 460, 76, 78, 25, 70, 5248, 'import'),
  ('50000000-0000-0000-0000-000000000003', 'DEMO_USER_ID_HERE', '40000000-0000-0000-0000-000000000003', '2026-03-05', 95, 85, 500, 78, 96, 35, 63, 5328, 'import'),
  ('50000000-0000-0000-0000-000000000004', 'DEMO_USER_ID_HERE', null, '2026-03-06', 63, 52, 274, 36, 50, 36, 61, 9344, 'import'),
  ('50000000-0000-0000-0000-000000000005', 'DEMO_USER_ID_HERE', null, '2026-03-07', 70, 44, 413, 10, 39, 33, 66, 3512, 'import'),
  ('50000000-0000-0000-0000-000000000006', 'DEMO_USER_ID_HERE', null, '2026-03-08', 81, 79, 473, 43, 86, 22, 67, 6698, 'import'),
  ('50000000-0000-0000-0000-000000000007', 'DEMO_USER_ID_HERE', null, '2026-03-09', 83, 82, 466, 55, 103, 27, 64, 7450, 'import'),
  ('50000000-0000-0000-0000-000000000008', 'DEMO_USER_ID_HERE', null, '2026-03-10', 74, 68, 372, 51, 81, 27, 67, 5227, 'import');

insert into public.daily_tags (id, user_id, daily_entry_id, metric_date, label, source)
values
  ('60000000-0000-0000-0000-000000000001', 'DEMO_USER_ID_HERE', '40000000-0000-0000-0000-000000000003', '2026-03-05', 'Patch renewal', 'import'),
  ('60000000-0000-0000-0000-000000000002', 'DEMO_USER_ID_HERE', '40000000-0000-0000-0000-000000000003', '2026-03-05', 'Workout', 'import'),
  ('60000000-0000-0000-0000-000000000003', 'DEMO_USER_ID_HERE', null, '2026-03-07', 'Nap', 'import');
