import { getPatchCycleDay } from '../../lib/date'
import { supabase } from '../../lib/supabase'
import { DAILY_LOGS, OURA_IMPORT } from './historicalData'

const PROTOCOL_START = '2026-03-01'
const PATCH_RENEWAL_WEEKDAY = 4
const TOTAL_WEEKS = 8
const PHASE_TWO_START_WEEK = 5
const PHASE_ONE_DOSE = 1
const PHASE_TWO_DOSE = 2

const TARGET_TOTAL_WEEKS = 16

function addDays(isoDate, days) {
  const d = new Date(`${isoDate}T12:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function weekNumberForDate(startDate, entryDate) {
  const start = new Date(`${startDate}T12:00:00`)
  const entry = new Date(`${entryDate}T12:00:00`)
  const days = Math.floor((entry - start) / 86400000)
  return Math.floor(days / 7) + 1
}

export async function extendProgramTo16Weeks(user) {
  const { data: programRow, error: programError } = await supabase
    .from('recovery_programs')
    .select(
      'id, start_date, total_weeks, phase_two_starts_week, phase_one_dose_mg, phase_two_dose_mg',
    )
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (programError) throw programError

  const {
    id: programId,
    start_date: startDate,
    total_weeks: currentTotalWeeks,
    phase_two_starts_week: phaseTwoStartsWeek,
    phase_one_dose_mg: phaseOneDose,
    phase_two_dose_mg: phaseTwoDose,
  } = programRow

  if (currentTotalWeeks >= TARGET_TOTAL_WEEKS) {
    return { added: 0, totalWeeks: currentTotalWeeks, alreadyExtended: true }
  }

  const newWeekRows = []
  for (let weekNumber = currentTotalWeeks + 1; weekNumber <= TARGET_TOTAL_WEEKS; weekNumber += 1) {
    const offset = (weekNumber - 1) * 7
    const isPhaseTwo = weekNumber >= phaseTwoStartsWeek
    newWeekRows.push({
      program_id: programId,
      week_number: weekNumber,
      starts_on: addDays(startDate, offset),
      ends_on: addDays(startDate, offset + 6),
      phase_label: isPhaseTwo ? 'Phase 2' : 'Phase 1',
      dose_mg: isPhaseTwo ? phaseTwoDose : phaseOneDose,
    })
  }

  const { error: weeksError } = await supabase
    .from('recovery_weeks')
    .upsert(newWeekRows, { onConflict: 'program_id,week_number' })

  if (weeksError) throw weeksError

  const { error: updateError } = await supabase
    .from('recovery_programs')
    .update({ total_weeks: TARGET_TOTAL_WEEKS })
    .eq('id', programId)

  if (updateError) throw updateError

  return {
    added: newWeekRows.length,
    totalWeeks: TARGET_TOTAL_WEEKS,
    alreadyExtended: false,
  }
}

export async function fixWeekNumbers(user) {
  const { data: programRow, error: programError } = await supabase
    .from('recovery_programs')
    .select('id, start_date, total_weeks')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (programError) throw programError
  const { id: programId, start_date: startDate, total_weeks: programTotalWeeks } = programRow
  const totalWeeks = programTotalWeeks ?? TOTAL_WEEKS

  const { data: weekRows, error: weeksError } = await supabase
    .from('recovery_weeks')
    .select('id, week_number')
    .eq('program_id', programId)

  if (weeksError) throw weeksError
  const weekIdByNumber = new Map(weekRows.map((w) => [w.week_number, w.id]))

  const { data: entries, error: entriesError } = await supabase
    .from('daily_entries')
    .select('id, entry_date, week_number')
    .eq('program_id', programId)

  if (entriesError) throw entriesError

  const toUpdate = entries.filter((e) => {
    const correct = weekNumberForDate(startDate, e.entry_date)
    return correct !== e.week_number && correct >= 1 && correct <= totalWeeks
  })

  for (const entry of toUpdate) {
    const correctWeek = weekNumberForDate(startDate, entry.entry_date)
    const { error } = await supabase
      .from('daily_entries')
      .update({ week_number: correctWeek, week_id: weekIdByNumber.get(correctWeek) ?? null })
      .eq('id', entry.id)
    if (error) throw error
  }

  return { fixed: toUpdate.length }
}

export async function importHistoricalData(user) {
  // Step A: update program start_date
  const { error: updateError } = await supabase
    .from('recovery_programs')
    .update({ start_date: PROTOCOL_START })
    .eq('user_id', user.id)
    .eq('is_active', true)

  if (updateError) throw updateError

  const { data: programRow, error: programError } = await supabase
    .from('recovery_programs')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (programError) throw programError
  const programId = programRow.id

  // Step B: upsert recovery_weeks with corrected date ranges
  const weekRows = Array.from({ length: TOTAL_WEEKS }, (_, i) => {
    const weekNumber = i + 1
    const offset = (weekNumber - 1) * 7
    return {
      program_id: programId,
      week_number: weekNumber,
      starts_on: addDays(PROTOCOL_START, offset),
      ends_on: addDays(PROTOCOL_START, offset + 6),
      phase_label: weekNumber >= PHASE_TWO_START_WEEK ? 'Phase 2' : 'Phase 1',
      dose_mg: weekNumber >= PHASE_TWO_START_WEEK ? PHASE_TWO_DOSE : PHASE_ONE_DOSE,
    }
  })

  const { error: weeksError } = await supabase
    .from('recovery_weeks')
    .upsert(weekRows, { onConflict: 'program_id,week_number' })

  if (weeksError) throw weeksError

  // Fetch week 1 id for daily entry linking
  const { data: week1Row, error: week1Error } = await supabase
    .from('recovery_weeks')
    .select('id')
    .eq('program_id', programId)
    .eq('week_number', 1)
    .single()

  if (week1Error) throw week1Error
  const week1Id = week1Row.id

  // Step C: upsert oura_daily_metrics
  const metricRows = OURA_IMPORT.map((x) => ({
    user_id: user.id,
    metric_date: x.d,
    readiness_score: x.rd,
    sleep_score: x.ss,
    total_sleep_minutes: x.tm,
    deep_sleep_minutes: x.dm,
    rem_sleep_minutes: x.rm,
    hrv: x.hv,
    resting_heart_rate: x.rh,
    steps: x.st,
    source: 'manual',
  }))

  const { error: metricsError } = await supabase
    .from('oura_daily_metrics')
    .upsert(metricRows, { onConflict: 'user_id,metric_date' })

  if (metricsError) throw metricsError

  // Step D: replace daily_tags for the imported date range
  const taggedEntries = OURA_IMPORT.filter((x) => x.tg.length > 0)
  const affectedDates = taggedEntries.map((x) => x.d)

  if (affectedDates.length > 0) {
    const { error: deleteTagsError } = await supabase
      .from('daily_tags')
      .delete()
      .eq('user_id', user.id)
      .in('metric_date', affectedDates)

    if (deleteTagsError) throw deleteTagsError

    const tagRows = taggedEntries.flatMap((x) =>
      x.tg.map((label) => ({
        user_id: user.id,
        metric_date: x.d,
        label,
        source: 'manual',
      })),
    )

    const { error: insertTagsError } = await supabase.from('daily_tags').insert(tagRows)
    if (insertTagsError) throw insertTagsError
  }

  // Step E: upsert daily_entries
  const entryPayloads = DAILY_LOGS.map((log) => ({
    user_id: user.id,
    program_id: programId,
    week_id: week1Id,
    entry_date: log.date,
    week_number: log.weekNumber,
    day_of_week: log.dayOfWeek,
    patch_cycle_day: getPatchCycleDay(PATCH_RENEWAL_WEEKDAY, log.date),
    alcohol_used: log.alc,
    notes: log.notes,
    meals: '',
    water_oz: null,
    protein_g: null,
    carbs_g: null,
    fat_g: null,
  }))

  const { data: savedEntries, error: entriesError } = await supabase
    .from('daily_entries')
    .upsert(entryPayloads, { onConflict: 'program_id,week_number,day_of_week' })
    .select('id,week_number,day_of_week')

  if (entriesError) throw entriesError

  // Step F: upsert daily_symptom_scores
  const scorePayloads = (savedEntries ?? []).map((entry) => {
    const log = DAILY_LOGS.find(
      (l) => l.weekNumber === entry.week_number && l.dayOfWeek === entry.day_of_week,
    )
    return {
      daily_entry_id: entry.id,
      joint_pain: log.joint,
      nerve_pain: log.nerve,
      energy: log.energy,
      sleep_quality: log.sleep,
      afternoon_crash: log.crash,
      tingling_numbness: log.tingle,
      brain_fog: log.fog,
      fatigue: log.fatigue,
      muscle_weakness: log.weakness,
      burning_pain: log.burn,
    }
  })

  if (scorePayloads.length > 0) {
    const { error: scoresError } = await supabase
      .from('daily_symptom_scores')
      .upsert(scorePayloads, { onConflict: 'daily_entry_id' })

    if (scoresError) throw scoresError
  }

  return {
    ouraCount: metricRows.length,
    tagCount: taggedEntries.reduce((sum, x) => sum + x.tg.length, 0),
    logCount: savedEntries?.length ?? 0,
  }
}
