# Recovery Center Discovery

## Source

Extracted from the provided `Recovery_Command_Center.jsx` prototype.

## What The Prototype Contains

The provided file is a single-screen recovery tracking prototype focused on:

- Daily symptom logging
- Weekly protocol tracking across 8 weeks
- Patch-cycle tracking across 7 days
- Nutrition and supplement logging
- Oura sleep/recovery/activity imports
- History review
- Local backup/restore and CSV export

## Core Constants And Settings

- Total protocol length: `8` weeks
- Dose increase starts at week: `5`
- Days of week: `sun`, `mon`, `tue`, `wed`, `thu`, `fri`, `sat`
- Patch renewal anchor day: `4` (`Thursday` in JavaScript `getDay()` indexing)
- Default supplements:
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

## Main Data Groups

### 1. Recovery Program / Protocol

The prototype implies a single active recovery program with:

- `8` total weeks
- Two phases:
  - Phase 1: weeks `1-4`, `1mg`
  - Phase 2: weeks `5-8`, `2mg`
- A patch cycle visualized as day `1-7`

### 2. Daily Recovery Log

Each entry is keyed by `week_day`, for example `1_2` for week 1, Tuesday.

Fields present in each log entry:

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
- `oReady`
- `oSleep`
- `oHrv`
- `oHr`
- `alc`
- `notes`
- `protein`
- `carbs`
- `fat`
- `water`
- `meals`
- `vits`

### 3. Symptom Dimensions

The log tab tracks these 1-10 scales:

- Joint pain
- Nerve pain
- Energy
- Sleep quality
- Afternoon crash
- Tingling / numbness
- Brain fog
- Fatigue
- Muscle weakness
- Burning pain

### 4. Nutrition Tracking

Per day:

- Protein grams
- Carbs grams
- Fat grams
- Derived calories
- Water ounces
- Meals notes
- Vitamins / supplements taken
- Custom supplement creation

### 5. Oura Data Import

The file includes a hardcoded imported dataset named `OURA_IMPORT` with 35 records from `2026-03-03` to `2026-04-06`.

Per imported Oura row:

- `d`: date
- `rd`: readiness score
- `ss`: sleep score
- `tm`: total sleep minutes
- `dm`: deep sleep minutes
- `rm`: REM sleep minutes
- `hv`: HRV
- `rh`: resting heart rate
- `st`: steps
- `tg`: tags / flags

Observed Oura tags in the sample:

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

### 6. Backup / Restore

The prototype supports:

- Serializing all logs and supplement list to JSON
- Restoring from pasted JSON
- CSV export of recovery log rows

## Sample Preseed Records Present In The Prototype

The file includes 3 preseeded entries:

### Week 1 / Tuesday

- Patch day: 5
- Joint pain: 7
- Nerve pain: 7
- Energy: 6
- Sleep quality: 4
- Afternoon crash: 7
- Tingling: 6
- Brain fog: 7
- Fatigue: 6
- Weakness: 6
- Burning pain: 7

### Week 1 / Wednesday

- Patch day: 6
- Joint pain: 7
- Nerve pain: 7
- Energy: 6
- Sleep quality: 4
- Afternoon crash: 8
- Tingling: 8
- Brain fog: 7
- Fatigue: 7
- Weakness: 5
- Burning pain: 8

### Week 1 / Thursday

- Patch day: 7
- Joint pain: 6
- Nerve pain: 5
- Energy: 7
- Sleep quality: 7
- Afternoon crash: 4
- Tingling: 4
- Brain fog: 7
- Fatigue: 6
- Weakness: 6
- Burning pain: 4
- Notes: `Had some headaches today, maybe not enough carbs today`

## Product Requirements Implied By The Prototype

### Functional

- User authentication
- Daily logging by week and day
- Weekly protocol navigation
- Patch-cycle status
- Nutrition tracking
- Supplement tracking
- Oura metric storage and visualization
- Historical review
- Export / backup capability

### UX

- Mobile-first daily logging flow
- Desktop dashboard with denser analytics
- Persistent logged state
- Fast switching between week/day records
- Clear separation between log input and chart/history review

## Recommended Normalized Entities

- `profiles`
- `recovery_programs`
- `program_weeks`
- `daily_logs`
- `supplements`
- `daily_log_supplements`
- `oura_daily_metrics`
- `daily_tags`

## Route-Level Screens Needed

- `Login`
- `Dashboard`
- `Daily Log`
- `Nutrition`
- `Oura Insights`
- `History`
- `Settings / Export`

## Important Modeling Decision

The prototype stores data by `week` and `day`, but real production data should also store an actual `log_date`.

Recommended rule:

- Keep `week_number` and `day_of_week` for protocol navigation
- Also store `log_date` for real calendar alignment, reporting, and Oura joins
