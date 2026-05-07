"""
Recovery Center — Oura CSV Importer
====================================
Reads all 40 Oura export CSVs and upserts them into Supabase.

SETUP:
  pip install supabase pandas

USAGE:
  1. Set your Supabase URL and Service Role Key below (or use env vars)
  2. Make sure you've already run recovery_center_migration.sql in Supabase
  3. Put your CSV files in the same folder as this script (or update CSV_DIR)
  4. Run: python import_oura.py
"""

import os
import json
import pandas as pd
from supabase import create_client, Client

# ── CONFIG ──────────────────────────────────────────────────────────────────
SUPABASE_URL  = os.environ.get("SUPABASE_URL",  "https://YOUR_PROJECT.supabase.co")
SUPABASE_KEY  = os.environ.get("SUPABASE_KEY",  "YOUR_SERVICE_ROLE_KEY")  # Use service role, not anon
CSV_DIR       = os.path.dirname(os.path.abspath(__file__))  # folder with this script
# ────────────────────────────────────────────────────────────────────────────

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Map: csv filename suffix → (table_name, json_columns, date_columns, bool_columns)
TABLE_MAP = {
    "applicationdebugstate":          ("application_debug_state",          [],                                             [], []),
    "behaviorcoachingevent":          ("behavior_coaching_event",           [],                                             ["day"], []),
    "behaviorcoachingsession":        ("behavior_coaching_session",         [],                                             ["enrollment_date","last_weekly_check_in","unenrollment_date"], []),
    "bloodglucose":                   ("blood_glucose",                     [],                                             [], []),
    "dailyactivity":                  ("daily_activity",                    ["class_5_min","contributors","met"],           ["day"], []),
    "dailycardiovascularage":         ("daily_cardiovascular_age",          [],                                             ["day"], []),
    "dailycyclephases":               ("daily_cycle_phases",                [],                                             ["day"], []),
    "dailymetabolicscore":            ("daily_metabolic_score",             ["aggregated_contributor_scores","contributor_scores","contributor_values"], ["day"], []),
    "dailyreadiness":                 ("daily_readiness",                   ["contributors"],                               ["day"], []),
    "dailyresilience":                ("daily_resilience",                  ["contributors"],                               ["day"], []),
    "dailysleep":                     ("daily_sleep",                       ["contributors"],                               ["day"], []),
    "dailysmoothedcardiovascularage": ("daily_smoothed_cardiovascular_age", [],                                             ["day"], []),
    "dailyspo2":                      ("daily_spo2",                        [],                                             ["day"], []),
    "dailystress":                    ("daily_stress",                      [],                                             ["day"], []),
    "daytimestress":                  ("daytime_stress",                    [],                                             [], []),
    "enhancedtag":                    ("enhanced_tag",                      [],                                             ["end_day","start_day"], []),
    "fooditem":                       ("food_item",                         [],                                             [], []),
    "glp1settings":                   ("glp1_settings",                     [],                                             [], ["enabled"]),

    # ── Batch 2 ─────────────────────────────────────────────────────────────
    "heartrate":                      ("heart_rate",                        [],                                             [], []),
    "hormonalcontraceptionusage":     ("hormonal_contraception_usage",      ["schedule"],                                   ["method_end_date","method_start_date","unit_start_date"], ["is_continuous"]),
    "labtestresult":                  ("lab_test_result",                   ["observations"],                               [], ["abnormal_result"]),
    "labtestresultinsights":          ("lab_test_result_insights",          ["actions","questions"],                        [], []),
    "meal":                           ("meal",                              ["food_item_ids","meal_scoring_result","nutrition_details"], ["day"], ["favorite"]),
    "medicationadministrationlog":    ("medication_administration_log",     ["tags","regime"],                              [], ["is_skipped"]),
    "medicationprofile":              ("medication_profile",                ["indications"],                                ["start_date","end_date"], []),
    "nonhormonalcontraceptionusage":  ("non_hormonal_contraception_usage",  ["schedule"],                                   ["method_end_date","method_start_date","unit_start_date"], []),
    "otherreproductivehormone":       ("other_reproductive_hormone",        ["other_reproductive_hormones"],                ["method_end_date","method_start_date"], []),
    "rawlocation":                    ("raw_location",                      [],                                             [], []),
    "restmodeperiod":                 ("rest_mode_period",                  ["episodes"],                                   ["end_day","start_day"], []),
    "ringbatterylevel":               ("ring_battery_level",                [],                                             [], ["charging","in_charger"]),
    "ringconfiguration":              ("ring_configuration",                [],                                             [], []),
    "session":                        ("session",                          ["heart_rate","heart_rate_variability"],         ["day"], []),
    "sleepmodel":                     ("sleep_model",                       ["heart_rate","hrv","readiness","movement_30_sec","sleep_phase_30_sec","sleep_phase_5_min"], ["day"], ["low_battery_alert"]),
    "sleepstorysession":              ("sleep_story_session",               [],                                             ["day"], []),
    "sleeptime":                      ("sleep_time",                        ["optimal_bedtime"],                            ["day"], []),
    "surveyresponse":                 ("survey_response",                   ["answers"],                                    [], []),

    # ── Batch 3 ─────────────────────────────────────────────────────────────
    "temperature":                    ("temperature",                       [],                                             [], []),
    "userconsentsettings":            ("user_consent_settings",             [],                                             [], []),
    "vo2max":                         ("vo2_max",                           [],                                             ["day"], []),
    "workout":                        ("workout",                           [],                                             ["day"], []),
}

CHUNK_SIZE = 100  # rows per upsert batch


def clean_key(filename: str) -> str:
    """Strip timestamp prefix and .csv suffix to get the table map key."""
    name = os.path.basename(filename)
    # Remove leading timestamp like 1778190221578_
    if "_" in name:
        name = "_".join(name.split("_")[1:])
    return name.replace(".csv", "").lower()


def safe_json(val):
    """Try to parse a string as JSON; return as-is if it fails."""
    if pd.isna(val):
        return None
    if isinstance(val, (dict, list)):
        return val
    try:
        return json.loads(str(val))
    except Exception:
        return str(val)  # store as string if JSON parse fails


def import_csv(filepath: str):
    key = clean_key(filepath)
    if key not in TABLE_MAP:
        print(f"  ⚠️  No mapping found for key '{key}' — skipping.")
        return

    table_name, json_cols, date_cols, bool_cols = TABLE_MAP[key]

    df = pd.read_csv(filepath, sep=";", dtype=str)

    if df.empty:
        print(f"  ℹ️  {table_name} — empty file, skipping.")
        return

    # Clean up column names (strip whitespace)
    df.columns = [c.strip() for c in df.columns]

    # Replace NaN strings with None
    df = df.where(pd.notnull(df), None)

    # Parse JSON columns
    for col in json_cols:
        if col in df.columns:
            df[col] = df[col].apply(safe_json)

    # Parse date columns — convert empty strings to None
    for col in date_cols:
        if col in df.columns:
            df[col] = df[col].apply(lambda x: None if (x is None or str(x).strip() == "") else str(x).strip())

    # Parse boolean columns
    for col in bool_cols:
        if col in df.columns:
            df[col] = df[col].apply(lambda x: True if str(x).strip().lower() == "true" else (False if str(x).strip().lower() == "false" else None))

    # Convert to list of dicts, drop None values
    records = []
    for _, row in df.iterrows():
        rec = {k: v for k, v in row.items() if v is not None}
        records.append(rec)

    if not records:
        print(f"  ℹ️  {table_name} — no valid records after cleaning.")
        return

    # Upsert in chunks
    total = len(records)
    inserted = 0
    for i in range(0, total, CHUNK_SIZE):
        chunk = records[i:i + CHUNK_SIZE]
        try:
            supabase.table(table_name).upsert(chunk).execute()
            inserted += len(chunk)
        except Exception as e:
            print(f"  ❌ Error on chunk {i}–{i+len(chunk)}: {e}")

    print(f"  ✅ {table_name} — {inserted}/{total} rows upserted.")


def main():
    print("=" * 55)
    print("  Recovery Center — Oura Importer")
    print("=" * 55)

    csv_files = sorted([
        f for f in os.listdir(CSV_DIR)
        if f.endswith(".csv")
    ])

    if not csv_files:
        print("❌ No CSV files found in:", CSV_DIR)
        return

    for fname in csv_files:
        fpath = os.path.join(CSV_DIR, fname)
        print(f"\n→ {fname}")
        import_csv(fpath)

    print("\n✅ Done! All files processed.")


if __name__ == "__main__":
    main()
