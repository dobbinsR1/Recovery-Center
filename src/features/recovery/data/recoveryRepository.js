import { deriveLogDate, getPatchCycleDay } from '../../../lib/date'
import { isSupabaseConfigured, supabase } from '../../../lib/supabase'
import { DEFAULT_SUPPLEMENTS } from './defaults'
const DEFAULT_PROGRAM_CONFIG = {
  name: 'BPC-157 + TB-500 Recovery Protocol',
  totalWeeks: 8,
  phaseTwoStartsWeek: 5,
  phaseOneDoseMg: 1,
  phaseTwoDoseMg: 2,
  patchRenewalWeekday: 4,
}

function normalizeUsername(username, fallback = 'user') {
  return (username || fallback).trim().toLowerCase()
}

function getUserProfilePayload(user, overrides = {}) {
  const email = overrides.email ?? user.email ?? null
  const metadata = user.user_metadata ?? {}
  const username =
    overrides.username ??
    normalizeUsername(metadata.username, email ? email.split('@')[0] : 'user')

  return {
    id: user.id,
    email,
    username,
    full_name: overrides.fullName ?? metadata.full_name ?? null,
    timezone: 'America/Chicago',
  }
}

function getProgramStartDate() {
  const today = new Date()
  const start = new Date(today)
  start.setHours(12, 0, 0, 0)
  start.setDate(start.getDate() - start.getDay())
  return start.toISOString().slice(0, 10)
}

function toAppProgram(row) {
  return {
    id: row.id,
    name: row.name,
    startDate: row.start_date,
    totalWeeks: row.total_weeks,
    phaseTwoStartWeek: row.phase_two_starts_week,
    phaseOneDoseMg: Number(row.phase_one_dose_mg ?? 0),
    phaseTwoDoseMg: Number(row.phase_two_dose_mg ?? 0),
    patchRenewalDay: row.patch_renewal_weekday,
    isActive: row.is_active,
  }
}

function toAppWeek(row) {
  return {
    id: row.id,
    weekNumber: row.week_number,
    startsOn: row.starts_on,
    endsOn: row.ends_on,
    doseMg: Number(row.dose_mg ?? 0),
    phaseLabel: row.phase_label,
  }
}

function toAppMetric(row, tags = []) {
  return {
    id: row.id,
    metricDate: row.metric_date,
    readinessScore: row.readiness_score,
    sleepScore: row.sleep_score,
    totalSleepMinutes: row.total_sleep_minutes,
    deepSleepMinutes: row.deep_sleep_minutes,
    remSleepMinutes: row.rem_sleep_minutes,
    hrv: row.hrv,
    restingHeartRate: row.resting_heart_rate,
    steps: row.steps,
    tags,
  }
}

function toAppLog(entry, scores = {}, supplementNames = [], metric = null) {
  return {
    id: entry.id,
    weekNumber: entry.week_number,
    dayOfWeek: entry.day_of_week,
    logDate: entry.entry_date,
    patchCycleDay: entry.patch_cycle_day,
    jointPain: scores.joint_pain ?? 5,
    nervePain: scores.nerve_pain ?? 5,
    energy: scores.energy ?? 5,
    sleepQuality: scores.sleep_quality ?? 5,
    afternoonCrash: scores.afternoon_crash ?? 5,
    tinglingNumbness: scores.tingling_numbness ?? 5,
    brainFog: scores.brain_fog ?? 5,
    fatigue: scores.fatigue ?? 5,
    muscleWeakness: scores.muscle_weakness ?? 5,
    burningPain: scores.burning_pain ?? 5,
    alcoholUsed: entry.alcohol_used,
    proteinGrams: entry.protein_g,
    carbsGrams: entry.carbs_g,
    fatGrams: entry.fat_g,
    waterOz: entry.water_oz,
    meals: entry.meals ?? '',
    notes: entry.notes ?? '',
    ouraReadiness: metric?.readinessScore ?? null,
    ouraSleepScore: metric?.sleepScore ?? null,
    ouraHrv: metric?.hrv ?? null,
    ouraRestingHr: metric?.restingHeartRate ?? null,
    supplements: supplementNames,
  }
}

async function ensureProfile(user) {
  const payload = getUserProfilePayload(user)
  const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' })
  if (error) throw error
}

async function createDefaultWorkspace(user) {
  await ensureProfile(user)

  const { data: programRow, error: programError } = await supabase
    .from('recovery_programs')
    .insert({
      user_id: user.id,
      name: DEFAULT_PROGRAM_CONFIG.name,
      start_date: getProgramStartDate(),
      total_weeks: DEFAULT_PROGRAM_CONFIG.totalWeeks,
      phase_two_starts_week: DEFAULT_PROGRAM_CONFIG.phaseTwoStartsWeek,
      phase_one_dose_mg: DEFAULT_PROGRAM_CONFIG.phaseOneDoseMg,
      phase_two_dose_mg: DEFAULT_PROGRAM_CONFIG.phaseTwoDoseMg,
      patch_renewal_weekday: DEFAULT_PROGRAM_CONFIG.patchRenewalWeekday,
      is_active: true,
    })
    .select('*')
    .single()

  if (programError) throw programError

  const program = toAppProgram(programRow)
  const weeks = Array.from({ length: program.totalWeeks }, (_, index) => {
    const weekNumber = index + 1

    return {
      program_id: program.id,
      week_number: weekNumber,
      starts_on: deriveLogDate(program, weekNumber, 0),
      ends_on: deriveLogDate(program, weekNumber, 6),
      phase_label: weekNumber >= program.phaseTwoStartWeek ? 'Phase 2' : 'Phase 1',
      dose_mg: weekNumber >= program.phaseTwoStartWeek ? program.phaseTwoDoseMg : program.phaseOneDoseMg,
    }
  })

  const { error: weeksError } = await supabase.from('recovery_weeks').insert(weeks)
  if (weeksError) throw weeksError

  const { error: supplementsError } = await supabase.from('supplements').upsert(
    DEFAULT_SUPPLEMENTS.map((name) => ({
      user_id: user.id,
      name,
      is_custom: false,
      is_active: true,
    })),
    { onConflict: 'user_id,name' },
  )

  if (supplementsError) throw supplementsError
}

async function ensureRecoveryWorkspace(user) {
  await ensureProfile(user)

  const { data: existingProgram, error } = await supabase
    .from('recovery_programs')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error

  if (!existingProgram) {
    await createDefaultWorkspace(user)
  }
}

async function loadSupabaseSnapshot(user) {
  await ensureRecoveryWorkspace(user)

  const { data: programRow, error: programError } = await supabase
    .from('recovery_programs')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (programError) throw programError

  if (!programRow) {
    return {
      mode: 'supabase',
      program: null,
      weeks: [],
      dailyLogs: [],
      supplements: [],
      ouraMetrics: [],
    }
  }

  const program = toAppProgram(programRow)

  const [
    { data: weekRows, error: weeksError },
    { data: entryRows, error: entriesError },
    { data: supplementRows, error: supplementsError },
    { data: metricRows, error: metricsError },
    { data: tagRows, error: tagsError },
  ] = await Promise.all([
    supabase.from('recovery_weeks').select('*').eq('program_id', program.id).order('week_number'),
    supabase.from('daily_entries').select('*').eq('program_id', program.id).order('week_number').order('day_of_week'),
    supabase.from('supplements').select('*').eq('user_id', user.id).eq('is_active', true).order('name'),
    supabase.from('oura_daily_metrics').select('*').eq('user_id', user.id).order('metric_date'),
    supabase.from('daily_tags').select('*').eq('user_id', user.id),
  ])

  if (weeksError || entriesError || supplementsError || metricsError || tagsError) {
    throw weeksError || entriesError || supplementsError || metricsError || tagsError
  }

  const entryIds = (entryRows ?? []).map((entry) => entry.id)
  const [
    { data: scoreRows, error: scoresError },
    { data: supplementLinks, error: supplementLinksError },
  ] = await Promise.all([
    entryIds.length
      ? supabase.from('daily_symptom_scores').select('*').in('daily_entry_id', entryIds)
      : Promise.resolve({ data: [], error: null }),
    entryIds.length
      ? supabase.from('daily_entry_supplements').select('daily_entry_id, supplement_id').in('daily_entry_id', entryIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  if (scoresError || supplementLinksError) {
    throw scoresError || supplementLinksError
  }

  const scoresByEntryId = new Map((scoreRows ?? []).map((score) => [score.daily_entry_id, score]))
  const supplementNamesById = new Map((supplementRows ?? []).map((supplement) => [supplement.id, supplement.name]))
  const supplementNamesByEntryId = new Map()

  for (const link of supplementLinks ?? []) {
    if (!supplementNamesByEntryId.has(link.daily_entry_id)) {
      supplementNamesByEntryId.set(link.daily_entry_id, [])
    }

    const supplementName = supplementNamesById.get(link.supplement_id)
    if (supplementName) {
      supplementNamesByEntryId.get(link.daily_entry_id).push(supplementName)
    }
  }

  const tagsByDate = new Map()
  for (const tag of tagRows ?? []) {
    if (!tag.metric_date) continue
    if (!tagsByDate.has(tag.metric_date)) {
      tagsByDate.set(tag.metric_date, [])
    }
    tagsByDate.get(tag.metric_date).push(tag.label)
  }

  const metrics = (metricRows ?? []).map((metric) => toAppMetric(metric, tagsByDate.get(metric.metric_date) ?? []))
  const metricsByEntryId = new Map(
    (metricRows ?? [])
      .filter((metric) => metric.daily_entry_id)
      .map((metric) => [
        metric.daily_entry_id,
        toAppMetric(metric, tagsByDate.get(metric.metric_date) ?? []),
      ]),
  )
  const metricsByDate = new Map(metrics.map((metric) => [metric.metricDate, metric]))

  const dailyLogs = (entryRows ?? []).map((entry) =>
    toAppLog(
      entry,
      scoresByEntryId.get(entry.id),
      supplementNamesByEntryId.get(entry.id) ?? [],
      metricsByEntryId.get(entry.id) ?? metricsByDate.get(entry.entry_date) ?? null,
    ),
  )

  return {
    mode: 'supabase',
    program,
    weeks: (weekRows ?? []).map(toAppWeek),
    dailyLogs,
    supplements: (supplementRows ?? []).map((supplement) => supplement.name),
    ouraMetrics: metrics,
  }
}

async function saveSupabaseLog(user, snapshot, draft) {
  const program = snapshot?.program
  if (!program) {
    throw new Error('No active recovery program was found for this user.')
  }

  const logDate = draft.logDate || deriveLogDate(program, draft.weekNumber, draft.dayOfWeek)
  const patchCycleDay = draft.patchCycleDay || getPatchCycleDay(program.patchRenewalDay, logDate)
  const week = snapshot.weeks.find((item) => item.weekNumber === draft.weekNumber)

  const { data: savedEntry, error: entryError } = await supabase
    .from('daily_entries')
    .upsert(
      {
        id: draft.id,
        user_id: user.id,
        program_id: program.id,
        week_id: week?.id ?? null,
        entry_date: logDate,
        week_number: draft.weekNumber,
        day_of_week: draft.dayOfWeek,
        patch_cycle_day: patchCycleDay,
        alcohol_used: draft.alcoholUsed,
        notes: draft.notes || '',
        meals: draft.meals || '',
        water_oz: draft.waterOz || null,
        protein_g: draft.proteinGrams || null,
        carbs_g: draft.carbsGrams || null,
        fat_g: draft.fatGrams || null,
      },
      { onConflict: 'program_id,week_number,day_of_week' },
    )
    .select('*')
    .single()

  if (entryError) throw entryError

  const { error: symptomError } = await supabase.from('daily_symptom_scores').upsert(
    {
      daily_entry_id: savedEntry.id,
      joint_pain: draft.jointPain,
      nerve_pain: draft.nervePain,
      energy: draft.energy,
      sleep_quality: draft.sleepQuality,
      afternoon_crash: draft.afternoonCrash,
      tingling_numbness: draft.tinglingNumbness,
      brain_fog: draft.brainFog,
      fatigue: draft.fatigue,
      muscle_weakness: draft.muscleWeakness,
      burning_pain: draft.burningPain,
    },
    { onConflict: 'daily_entry_id' },
  )

  if (symptomError) throw symptomError

  const selectedSupplementNames = [...new Set((draft.supplements ?? []).map((name) => name.trim()).filter(Boolean))]
  if (selectedSupplementNames.length > 0) {
    const { data: existingSupplements, error: existingSupplementsError } = await supabase
      .from('supplements')
      .select('id,name')
      .eq('user_id', user.id)
      .in('name', selectedSupplementNames)

    if (existingSupplementsError) throw existingSupplementsError

    const existingNames = new Set((existingSupplements ?? []).map((supplement) => supplement.name))
    const missingNames = selectedSupplementNames.filter((name) => !existingNames.has(name))

    if (missingNames.length > 0) {
      const { error: insertSupplementsError } = await supabase.from('supplements').insert(
        missingNames.map((name) => ({
          user_id: user.id,
          name,
          is_custom: true,
          is_active: true,
        })),
      )

      if (insertSupplementsError) throw insertSupplementsError
    }
  }

  const { data: supplementRows, error: supplementRowsError } = selectedSupplementNames.length
    ? await supabase
        .from('supplements')
        .select('id,name')
        .eq('user_id', user.id)
        .in('name', selectedSupplementNames)
    : { data: [], error: null }

  if (supplementRowsError) throw supplementRowsError

  const { error: deleteLinksError } = await supabase
    .from('daily_entry_supplements')
    .delete()
    .eq('daily_entry_id', savedEntry.id)

  if (deleteLinksError) throw deleteLinksError

  if ((supplementRows ?? []).length > 0) {
    const { error: insertLinksError } = await supabase.from('daily_entry_supplements').insert(
      supplementRows.map((supplement) => ({
        daily_entry_id: savedEntry.id,
        supplement_id: supplement.id,
      })),
    )

    if (insertLinksError) throw insertLinksError
  }
}

export async function getInitialSession() {
  if (!isSupabaseConfigured) {
    return null
  }

  const { data } = await supabase.auth.getSession()
  return data.session?.user ?? null
}

export function subscribeToAuthChanges(callback) {
  if (!isSupabaseConfigured) {
    return () => {}
  }

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null)
  })

  return () => subscription.unsubscribe()
}

export async function signUpWithPassword({ username, email, password, fullName }) {
  if (!isSupabaseConfigured) {
    throw new Error('Sign up is only available when Supabase is configured.')
  }

  const normalizedUsername = normalizeUsername(username)
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: normalizedUsername,
        full_name: fullName || null,
      },
    },
  })

  if (error) throw error

  if (data.user && data.session) {
    await ensureRecoveryWorkspace(data.user)
  }

  return data
}

export async function signInWithPassword({ identifier, password }) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase authentication is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
  }

  const normalizedIdentifier = identifier.trim()
  let email = normalizedIdentifier

  if (!normalizedIdentifier.includes('@')) {
    const { data: resolvedEmail, error: resolveError } = await supabase.rpc('resolve_login_email', {
      login_username: normalizeUsername(normalizedIdentifier),
    })

    if (resolveError) {
      if ((resolveError.message ?? '').includes('resolve_login_email')) {
        throw new Error('Username login is not enabled yet. Apply the latest supabase/schema.sql changes or sign in with email.')
      }

      throw new Error('Username lookup failed. Check the Supabase connection and try again.')
    }

    if (!resolvedEmail) {
      throw new Error('Invalid username or password.')
    }

    email = resolvedEmail
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error

  if (data.user) {
    await ensureRecoveryWorkspace(data.user)
  }

  return data.user
}

export async function signOutCurrentUser() {
  if (!isSupabaseConfigured) {
    return
  }

  await supabase.auth.signOut()
}

export async function loadRecoverySnapshot(user) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
  }

  return loadSupabaseSnapshot(user)
}

export async function addSupplement(user, name) {
  const trimmed = name.trim()
  if (!trimmed) return

  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
  }

  const { error } = await supabase.from('supplements').upsert(
    {
      user_id: user.id,
      name: trimmed,
      is_custom: true,
      is_active: true,
    },
    { onConflict: 'user_id,name' },
  )

  if (error) throw error
}

export async function saveDailyLog(user, snapshot, draft) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
  }

  await saveSupabaseLog(user, snapshot, draft)
}
