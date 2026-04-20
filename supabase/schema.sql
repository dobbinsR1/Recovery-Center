create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  username text,
  full_name text,
  timezone text not null default 'America/Chicago',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles add column if not exists username text;
create unique index if not exists profiles_username_unique on public.profiles (username);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    username,
    full_name
  )
  values (
    new.id,
    new.email,
    lower(
      coalesce(
        nullif(trim(new.raw_user_meta_data ->> 'username'), ''),
        split_part(coalesce(new.email, 'user'), '@', 1)
      )
    ),
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), '')
  )
  on conflict (id) do update
  set
    email = excluded.email,
    username = coalesce(public.profiles.username, excluded.username),
    full_name = coalesce(public.profiles.full_name, excluded.full_name);

  return new;
end;
$$;

create or replace function public.resolve_login_email(login_username text)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select email
  from public.profiles
  where username = lower(trim(login_username))
  limit 1;
$$;

grant execute on function public.resolve_login_email(text) to anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create table if not exists public.recovery_programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  start_date date not null,
  total_weeks integer not null check (total_weeks > 0),
  phase_two_starts_week integer not null check (phase_two_starts_week > 0),
  phase_one_dose_mg numeric(6,2),
  phase_two_dose_mg numeric(6,2),
  patch_renewal_weekday smallint not null check (patch_renewal_weekday between 0 and 6),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.recovery_weeks (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.recovery_programs(id) on delete cascade,
  week_number integer not null check (week_number > 0),
  starts_on date not null,
  ends_on date not null,
  phase_label text not null,
  dose_mg numeric(6,2),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (program_id, week_number)
);

create table if not exists public.daily_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  program_id uuid not null references public.recovery_programs(id) on delete cascade,
  week_id uuid references public.recovery_weeks(id) on delete set null,
  entry_date date not null,
  week_number integer not null check (week_number > 0),
  day_of_week smallint not null check (day_of_week between 0 and 6),
  patch_cycle_day smallint check (patch_cycle_day between 1 and 7),
  alcohol_used boolean not null default false,
  notes text,
  meals text,
  water_oz integer check (water_oz is null or water_oz >= 0),
  protein_g integer check (protein_g is null or protein_g >= 0),
  carbs_g integer check (carbs_g is null or carbs_g >= 0),
  fat_g integer check (fat_g is null or fat_g >= 0),
  calories integer generated always as (
    (coalesce(protein_g, 0) * 4) +
    (coalesce(carbs_g, 0) * 4) +
    (coalesce(fat_g, 0) * 9)
  ) stored,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, entry_date),
  unique (program_id, week_number, day_of_week)
);

create table if not exists public.daily_symptom_scores (
  daily_entry_id uuid primary key references public.daily_entries(id) on delete cascade,
  joint_pain smallint not null check (joint_pain between 1 and 10),
  nerve_pain smallint not null check (nerve_pain between 1 and 10),
  energy smallint not null check (energy between 1 and 10),
  sleep_quality smallint not null check (sleep_quality between 1 and 10),
  afternoon_crash smallint not null check (afternoon_crash between 1 and 10),
  tingling_numbness smallint not null check (tingling_numbness between 1 and 10),
  brain_fog smallint not null check (brain_fog between 1 and 10),
  fatigue smallint not null check (fatigue between 1 and 10),
  muscle_weakness smallint not null check (muscle_weakness between 1 and 10),
  burning_pain smallint not null check (burning_pain between 1 and 10),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.supplements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  is_custom boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, name)
);

create table if not exists public.daily_entry_supplements (
  daily_entry_id uuid not null references public.daily_entries(id) on delete cascade,
  supplement_id uuid not null references public.supplements(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (daily_entry_id, supplement_id)
);

create table if not exists public.oura_daily_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  daily_entry_id uuid unique references public.daily_entries(id) on delete set null,
  metric_date date not null,
  readiness_score integer check (readiness_score is null or readiness_score between 0 and 100),
  sleep_score integer check (sleep_score is null or sleep_score between 0 and 100),
  total_sleep_minutes integer check (total_sleep_minutes is null or total_sleep_minutes >= 0),
  deep_sleep_minutes integer check (deep_sleep_minutes is null or deep_sleep_minutes >= 0),
  rem_sleep_minutes integer check (rem_sleep_minutes is null or rem_sleep_minutes >= 0),
  hrv integer check (hrv is null or hrv >= 0),
  resting_heart_rate integer check (resting_heart_rate is null or resting_heart_rate >= 0),
  steps integer check (steps is null or steps >= 0),
  source text not null default 'manual',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, metric_date)
);

create table if not exists public.daily_tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  daily_entry_id uuid references public.daily_entries(id) on delete cascade,
  metric_date date,
  label text not null,
  source text not null default 'manual',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_recovery_programs_updated_at on public.recovery_programs;
create trigger set_recovery_programs_updated_at
before update on public.recovery_programs
for each row execute function public.set_updated_at();

drop trigger if exists set_recovery_weeks_updated_at on public.recovery_weeks;
create trigger set_recovery_weeks_updated_at
before update on public.recovery_weeks
for each row execute function public.set_updated_at();

drop trigger if exists set_daily_entries_updated_at on public.daily_entries;
create trigger set_daily_entries_updated_at
before update on public.daily_entries
for each row execute function public.set_updated_at();

drop trigger if exists set_daily_symptom_scores_updated_at on public.daily_symptom_scores;
create trigger set_daily_symptom_scores_updated_at
before update on public.daily_symptom_scores
for each row execute function public.set_updated_at();

drop trigger if exists set_supplements_updated_at on public.supplements;
create trigger set_supplements_updated_at
before update on public.supplements
for each row execute function public.set_updated_at();

drop trigger if exists set_oura_daily_metrics_updated_at on public.oura_daily_metrics;
create trigger set_oura_daily_metrics_updated_at
before update on public.oura_daily_metrics
for each row execute function public.set_updated_at();

drop trigger if exists set_daily_tags_updated_at on public.daily_tags;
create trigger set_daily_tags_updated_at
before update on public.daily_tags
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.recovery_programs enable row level security;
alter table public.recovery_weeks enable row level security;
alter table public.daily_entries enable row level security;
alter table public.daily_symptom_scores enable row level security;
alter table public.supplements enable row level security;
alter table public.daily_entry_supplements enable row level security;
alter table public.oura_daily_metrics enable row level security;
alter table public.daily_tags enable row level security;

drop policy if exists "profiles are self-owned" on public.profiles;
create policy "profiles are self-owned"
on public.profiles
for all
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "programs are self-owned" on public.recovery_programs;
create policy "programs are self-owned"
on public.recovery_programs
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "weeks follow program ownership" on public.recovery_weeks;
create policy "weeks follow program ownership"
on public.recovery_weeks
for all
using (
  exists (
    select 1
    from public.recovery_programs p
    where p.id = recovery_weeks.program_id
      and p.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.recovery_programs p
    where p.id = recovery_weeks.program_id
      and p.user_id = auth.uid()
  )
);

drop policy if exists "daily entries are self-owned" on public.daily_entries;
create policy "daily entries are self-owned"
on public.daily_entries
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "symptom scores follow entry ownership" on public.daily_symptom_scores;
create policy "symptom scores follow entry ownership"
on public.daily_symptom_scores
for all
using (
  exists (
    select 1
    from public.daily_entries e
    where e.id = daily_symptom_scores.daily_entry_id
      and e.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.daily_entries e
    where e.id = daily_symptom_scores.daily_entry_id
      and e.user_id = auth.uid()
  )
);

drop policy if exists "supplements are self-owned" on public.supplements;
create policy "supplements are self-owned"
on public.supplements
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "entry supplements follow entry ownership" on public.daily_entry_supplements;
create policy "entry supplements follow entry ownership"
on public.daily_entry_supplements
for all
using (
  exists (
    select 1
    from public.daily_entries e
    where e.id = daily_entry_supplements.daily_entry_id
      and e.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.daily_entries e
    where e.id = daily_entry_supplements.daily_entry_id
      and e.user_id = auth.uid()
  )
);

drop policy if exists "oura metrics are self-owned" on public.oura_daily_metrics;
create policy "oura metrics are self-owned"
on public.oura_daily_metrics
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "daily tags are self-owned" on public.daily_tags;
create policy "daily tags are self-owned"
on public.daily_tags
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
