-- Recovery Center — Oura Extended Tables Migration
-- Run this in your Supabase SQL editor before running import_oura.py
-- All tables use TEXT for IDs and JSONB for structured data columns.

-- ── Batch 1 ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS application_debug_state (
  id                  TEXT PRIMARY KEY,
  timestamp           TIMESTAMPTZ,
  data                TEXT
);

CREATE TABLE IF NOT EXISTS behavior_coaching_event (
  id                  TEXT PRIMARY KEY,
  day                 DATE,
  event_type          TEXT,
  data                TEXT
);

CREATE TABLE IF NOT EXISTS behavior_coaching_session (
  id                  TEXT PRIMARY KEY,
  enrollment_date     DATE,
  last_weekly_check_in DATE,
  unenrollment_date   DATE,
  status              TEXT,
  data                TEXT
);

CREATE TABLE IF NOT EXISTS blood_glucose (
  id                  TEXT PRIMARY KEY,
  timestamp           TIMESTAMPTZ,
  glucose_mg_dl       NUMERIC,
  source              TEXT,
  data                TEXT
);

CREATE TABLE IF NOT EXISTS daily_activity (
  id                  TEXT PRIMARY KEY,
  day                 DATE,
  score               NUMERIC,
  active_calories     NUMERIC,
  total_calories      NUMERIC,
  steps               NUMERIC,
  equivalent_walking_distance NUMERIC,
  high_activity_met_minutes NUMERIC,
  medium_activity_met_minutes NUMERIC,
  low_activity_met_minutes NUMERIC,
  non_wear_time       NUMERIC,
  resting_time        NUMERIC,
  sedentary_time      NUMERIC,
  class_5_min         JSONB,
  contributors        JSONB,
  met                 JSONB
);

CREATE TABLE IF NOT EXISTS daily_cardiovascular_age (
  id                  TEXT PRIMARY KEY,
  day                 DATE,
  vascular_age        NUMERIC
);

CREATE TABLE IF NOT EXISTS daily_cycle_phases (
  id                  TEXT PRIMARY KEY,
  day                 DATE,
  cycle_phase         TEXT,
  cycle_day           NUMERIC
);

CREATE TABLE IF NOT EXISTS daily_metabolic_score (
  id                  TEXT PRIMARY KEY,
  day                 DATE,
  score               NUMERIC,
  aggregated_contributor_scores JSONB,
  contributor_scores  JSONB,
  contributor_values  JSONB
);

CREATE TABLE IF NOT EXISTS daily_readiness (
  id                  TEXT PRIMARY KEY,
  day                 DATE,
  score               NUMERIC,
  temperature_deviation NUMERIC,
  temperature_trend_deviation NUMERIC,
  contributors        JSONB
);

CREATE TABLE IF NOT EXISTS daily_resilience (
  id                  TEXT PRIMARY KEY,
  day                 DATE,
  level               TEXT,
  contributors        JSONB
);

CREATE TABLE IF NOT EXISTS daily_sleep (
  id                  TEXT PRIMARY KEY,
  day                 DATE,
  score               NUMERIC,
  contributors        JSONB
);

CREATE TABLE IF NOT EXISTS daily_smoothed_cardiovascular_age (
  id                  TEXT PRIMARY KEY,
  day                 DATE,
  vascular_age        NUMERIC
);

CREATE TABLE IF NOT EXISTS daily_spo2 (
  id                  TEXT PRIMARY KEY,
  day                 DATE,
  spo2_percentage_average NUMERIC
);

CREATE TABLE IF NOT EXISTS daily_stress (
  id                  TEXT PRIMARY KEY,
  day                 DATE,
  stress_high         NUMERIC,
  recovery_high       NUMERIC,
  day_summary         TEXT
);

CREATE TABLE IF NOT EXISTS daytime_stress (
  id                  TEXT PRIMARY KEY,
  timestamp           TIMESTAMPTZ,
  stress_level        NUMERIC
);

CREATE TABLE IF NOT EXISTS enhanced_tag (
  id                  TEXT PRIMARY KEY,
  tag_type_code       TEXT,
  start_time          TIMESTAMPTZ,
  end_time            TIMESTAMPTZ,
  start_day           DATE,
  end_day             DATE,
  comment             TEXT
);

CREATE TABLE IF NOT EXISTS food_item (
  id                  TEXT PRIMARY KEY,
  name                TEXT,
  calories            NUMERIC,
  protein             NUMERIC,
  carbs               NUMERIC,
  fat                 NUMERIC,
  data                TEXT
);

CREATE TABLE IF NOT EXISTS glp1_settings (
  id                  TEXT PRIMARY KEY,
  enabled             BOOLEAN,
  data                TEXT
);

-- ── Batch 2 ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS heart_rate (
  timestamp           TIMESTAMPTZ PRIMARY KEY,
  bpm                 NUMERIC,
  source              TEXT
);

CREATE TABLE IF NOT EXISTS hormonal_contraception_usage (
  id                  TEXT PRIMARY KEY,
  method_type         TEXT,
  method_start_date   DATE,
  method_end_date     DATE,
  unit_start_date     DATE,
  is_continuous       BOOLEAN,
  schedule            JSONB
);

CREATE TABLE IF NOT EXISTS lab_test_result (
  id                  TEXT PRIMARY KEY,
  timestamp           TIMESTAMPTZ,
  test_type           TEXT,
  abnormal_result     BOOLEAN,
  observations        JSONB
);

CREATE TABLE IF NOT EXISTS lab_test_result_insights (
  id                  TEXT PRIMARY KEY,
  lab_test_result_id  TEXT,
  actions             JSONB,
  questions           JSONB
);

CREATE TABLE IF NOT EXISTS meal (
  id                  TEXT PRIMARY KEY,
  day                 DATE,
  meal_type           TEXT,
  name                TEXT,
  favorite            BOOLEAN,
  food_item_ids       JSONB,
  meal_scoring_result JSONB,
  nutrition_details   JSONB
);

CREATE TABLE IF NOT EXISTS medication_administration_log (
  id                  TEXT PRIMARY KEY,
  timestamp           TIMESTAMPTZ,
  medication_id       TEXT,
  is_skipped          BOOLEAN,
  tags                JSONB,
  regime              JSONB
);

CREATE TABLE IF NOT EXISTS medication_profile (
  id                  TEXT PRIMARY KEY,
  name                TEXT,
  start_date          DATE,
  end_date            DATE,
  indications         JSONB
);

CREATE TABLE IF NOT EXISTS non_hormonal_contraception_usage (
  id                  TEXT PRIMARY KEY,
  method_type         TEXT,
  method_start_date   DATE,
  method_end_date     DATE,
  unit_start_date     DATE,
  schedule            JSONB
);

CREATE TABLE IF NOT EXISTS other_reproductive_hormone (
  id                  TEXT PRIMARY KEY,
  method_start_date   DATE,
  method_end_date     DATE,
  other_reproductive_hormones JSONB
);

CREATE TABLE IF NOT EXISTS raw_location (
  id                  TEXT PRIMARY KEY,
  timestamp           TIMESTAMPTZ,
  latitude            NUMERIC,
  longitude           NUMERIC,
  altitude            NUMERIC,
  accuracy            NUMERIC
);

CREATE TABLE IF NOT EXISTS rest_mode_period (
  id                  TEXT PRIMARY KEY,
  start_day           DATE,
  end_day             DATE,
  episodes            JSONB
);

CREATE TABLE IF NOT EXISTS ring_battery_level (
  id                  TEXT PRIMARY KEY,
  timestamp           TIMESTAMPTZ,
  level               NUMERIC,
  charging            BOOLEAN,
  in_charger          BOOLEAN
);

CREATE TABLE IF NOT EXISTS ring_configuration (
  id                  TEXT PRIMARY KEY,
  color               TEXT,
  design              TEXT,
  firmware_version    TEXT,
  hardware_type       TEXT,
  set_up_at           TIMESTAMPTZ,
  size                NUMERIC
);

CREATE TABLE IF NOT EXISTS session (
  id                  TEXT PRIMARY KEY,
  day                 DATE,
  start_datetime      TIMESTAMPTZ,
  end_datetime        TIMESTAMPTZ,
  type                TEXT,
  mood                TEXT,
  heart_rate          JSONB,
  heart_rate_variability JSONB
);

CREATE TABLE IF NOT EXISTS sleep_model (
  id                  TEXT PRIMARY KEY,
  day                 DATE,
  average_breath      NUMERIC,
  average_heart_rate  NUMERIC,
  average_hrv         NUMERIC,
  awake_time          NUMERIC,
  bedtime_end         TIMESTAMPTZ,
  bedtime_start       TIMESTAMPTZ,
  deep_sleep_duration NUMERIC,
  efficiency          NUMERIC,
  latency             NUMERIC,
  light_sleep_duration NUMERIC,
  low_battery_alert   BOOLEAN,
  period              NUMERIC,
  rem_sleep_duration  NUMERIC,
  restless_periods    NUMERIC,
  sleep_phase_5_min   JSONB,
  sleep_phase_30_sec  JSONB,
  movement_30_sec     JSONB,
  heart_rate_samples  JSONB,
  hrv_samples         JSONB,
  readiness           JSONB,
  sleep_score_delta   NUMERIC,
  time_in_bed         NUMERIC,
  total_sleep_duration NUMERIC,
  type                TEXT
);

CREATE TABLE IF NOT EXISTS sleep_story_session (
  id                  TEXT PRIMARY KEY,
  day                 DATE,
  start_time          TIMESTAMPTZ,
  end_time            TIMESTAMPTZ,
  story_id            TEXT,
  play_duration_ms    NUMERIC
);

CREATE TABLE IF NOT EXISTS sleep_time (
  id                  TEXT PRIMARY KEY,
  day                 DATE,
  recommendation      TEXT,
  status              TEXT,
  optimal_bedtime     JSONB
);

CREATE TABLE IF NOT EXISTS survey_response (
  id                  TEXT PRIMARY KEY,
  timestamp           TIMESTAMPTZ,
  survey_type         TEXT,
  answers             JSONB
);

-- ── Batch 3 ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS temperature (
  id                  TEXT PRIMARY KEY,
  day                 DATE,
  timestamp           TIMESTAMPTZ,
  temperature         NUMERIC,
  device_temperature  NUMERIC
);

CREATE TABLE IF NOT EXISTS user_consent_settings (
  id                  TEXT PRIMARY KEY,
  timestamp           TIMESTAMPTZ,
  data                TEXT
);

CREATE TABLE IF NOT EXISTS vo2_max (
  id                  TEXT PRIMARY KEY,
  day                 DATE,
  vo2_max             NUMERIC
);

CREATE TABLE IF NOT EXISTS workout (
  id                  TEXT PRIMARY KEY,
  day                 DATE,
  activity            TEXT,
  calories            NUMERIC,
  distance            NUMERIC,
  intensity           TEXT,
  label               TEXT,
  source              TEXT,
  start_datetime      TIMESTAMPTZ,
  end_datetime        TIMESTAMPTZ
);
