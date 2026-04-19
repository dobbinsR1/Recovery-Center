# Recovery Center Prototype Data Extraction

Source file: `Recovery_Command_Center.jsx`

## What the prototype already defines

The prototype is a single-screen recovery dashboard with four working areas:

1. Daily symptom logging
2. Daily nutrition and supplements logging
3. Oura sleep/recovery trend review
4. Historical review of saved entries

It also carries protocol context:

- 8-week program
- Dose increase starting at week 5
- Week-based and day-based navigation
- Patch-cycle tracking across 7 days
- Backup/restore behavior

## Extracted constants and reference data

### Program and navigation constants

- `WEEKS = 8`
- `DOSE_UP = 5`
- `DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]`
- `PATCH_RENEWAL = 4`
- `PATCH_LABELS = ["Peak", "Strong", "Good", "Moderate", "Fading", "Low", "Minimal"]`

### Default supplement list

- Vitamin D
- Magnesium
- Fish Oil
- B Complex
- Vitamin C
- Zinc
- Turmeric
- Probiotics
- CoQ10
- NAC

### Imported Oura sample dataset

The file contains 35 imported Oura rows from `2026-03-03` through `2026-04-06`.

Per imported day the prototype stores:

- `d`: date
- `rd`: readiness score
- `ss`: sleep score
- `tm`: total sleep minutes
- `dm`: deep sleep minutes
- `rm`: REM sleep minutes
- `hv`: HRV
- `rh`: resting heart rate
- `st`: steps
- `tg`: tags / flagged events

### Pre-seeded daily recovery entries

The file also contains three pre-seeded daily entries:

- Week 1 / Tuesday
- Week 1 / Wednesday
- Week 1 / Thursday

These entries already prove the app needs durable week/day storage, not just ad hoc notes.

## Extracted data groups

### 1. Program-level data

This data belongs to a recovery protocol, not to a single day:

- Program name
- Program start date
- Total weeks
- Dose change week
- Phase 1 dose
- Phase 2 dose
- Patch renewal weekday
- Active/inactive state

### 2. Daily recovery log data

These are the main symptom and observation fields saved per day:

- `week`
- `day`
- `patchDay`
- `joint`
- `nerve`
- `energy`
- `sleep`
- `crash`
- `tingle`
- `fog`
- `fatigue`
- `weakness`
- `burn`
- `alc`
- `notes`

### 3. Daily nutrition data

These are also day-scoped:

- `protein`
- `carbs`
- `fat`
- `water`
- `meals`
- `vits`

The prototype also derives calories from macros:

- `calories = protein * 4 + carbs * 4 + fat * 9`

### 4. Wearable / Oura daily data

The prototype currently mixes two Oura patterns:

1. Manual daily snapshot fields in the form:
   - `oReady`
   - `oSleep`
   - `oHrv`
   - `oHr`
2. Bulk imported Oura rows in `OURA_IMPORT`

That means the real app should store Oura metrics in a dedicated table, while still allowing manual entry when CSV import is not available yet.

### 5. Tags and event markers

Imported Oura rows use `tg[]` to mark events like:

- Patch renewal
- Workout
- Nap
- Caffeine
- Tea
- Meditation
- Camping
- Family time
- Pain
- Alcohol
- Headache
- Poor sleep
- Pickle ball
- Peptide Dose
- Relaxing

This should become a reusable daily tag model rather than a freeform one-off field.

## Extracted product requirements

### Required views from the prototype

- Login page
- Main recovery dashboard
- Week selector
- Day selector
- Log tab
- Nutrition tab
- Oura tab
- History tab

### Required behaviors

- Save one day at a time
- Browse by week and day
- Track protocol phase based on current week
- Track patch-cycle day
- Add custom supplements
- Export data
- Restore data
- View historical entries
- Show Oura trends and flagged days

## Recommended database shape from this prototype

The most stable shape for Supabase is:

1. `profiles`
2. `recovery_programs`
3. `recovery_weeks`
4. `daily_entries`
5. `daily_symptom_scores`
6. `supplements`
7. `daily_entry_supplements`
8. `oura_daily_metrics`
9. `daily_tags`

This keeps week-level organization explicit while still preserving real calendar dates.

## Field-to-table mapping

| Prototype field | Meaning | Recommended destination |
| --- | --- | --- |
| `week` | program week number | `daily_entries.week_number` |
| `day` | weekday index | `daily_entries.day_of_week` |
| `patchDay` | patch-cycle day | `daily_entries.patch_cycle_day` |
| `joint`, `nerve`, `energy`, `sleep`, `crash`, `tingle`, `fog`, `fatigue`, `weakness`, `burn` | symptom scores | `daily_symptom_scores.*` |
| `alc` | alcohol used that day | `daily_entries.alcohol_used` |
| `notes` | daily note | `daily_entries.notes` |
| `protein`, `carbs`, `fat`, `water`, `meals` | nutrition log | `daily_entries.*` |
| `vits` | supplements taken | `daily_entry_supplements` join table |
| `oReady`, `oSleep`, `oHrv`, `oHr` | manual wearable metrics | `oura_daily_metrics.*` |
| `d`, `rd`, `ss`, `tm`, `dm`, `rm`, `hv`, `rh`, `st` | imported Oura metrics | `oura_daily_metrics.*` |
| `tg[]` | day markers | `daily_tags` |

## Key design decision

The prototype indexes logs as `week_day`, but the real app should also store an actual `entry_date`.

Reason:

- week/day is perfect for protocol tracking
- real dates are required for Supabase queries, charts, imports, auth-scoped history, and future calendar views

The recommended model stores both:

- `entry_date` for real-world chronology
- `week_number` and `day_of_week` for protocol navigation
