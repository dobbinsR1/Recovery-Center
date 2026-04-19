import { deriveLogDate, getPatchCycleDay } from '../../../lib/date'
import { isSupabaseConfigured, supabase } from '../../../lib/supabase'
import { createMockSnapshot } from './mockData'

const DEMO_SESSION_KEY = 'recovery-center-demo-session'
const DEMO_DATA_KEY = 'recovery-center-demo-data'
const DEMO_AUTH_EVENT = 'recovery-center-auth-change'
const MOCK_USERNAME = 'dobbins'
const MOCK_PASSWORD = 'admin'

function safeClone(value) {
  return JSON.parse(JSON.stringify(value))
}

function emitDemoAuthEvent() {
  window.dispatchEvent(new CustomEvent(DEMO_AUTH_EVENT))
}

function readDemoSession() {
  const raw = window.localStorage.getItem(DEMO_SESSION_KEY)
  return raw ? JSON.parse(raw) : null
}

function writeDemoSession(session) {
  if (session) {
    window.localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session))
  } else {
    window.localStorage.removeItem(DEMO_SESSION_KEY)
  }

  emitDemoAuthEvent()
}

function readDemoSnapshot() {
  const raw = window.localStorage.getItem(DEMO_DATA_KEY)

  if (!raw) {
    const snapshot = createMockSnapshot()
    window.localStorage.setItem(DEMO_DATA_KEY, JSON.stringify(snapshot))
    return snapshot
  }

  return JSON.parse(raw)
}

function writeDemoSnapshot(snapshot) {
  window.localStorage.setItem(DEMO_DATA_KEY, JSON.stringify(snapshot))
}

function toAppLog(row, supplementNames = []) {
  return {
    id: row.id,
    weekNumber: row.week_number,
    dayOfWeek: row.day_of_week,
    logDate: row.log_date,
    patchCycleDay: row.patch_cycle_day,
    jointPain: row.joint_pain,
    nervePain: row.nerve_pain,
    energy: row.energy,
    sleepQuality: row.sleep_quality,
    afternoonCrash: row.afternoon_crash,
    tinglingNumbness: row.tingling_numbness,
    brainFog: row.brain_fog,
    fatigue: row.fatigue,
    muscleWeakness: row.muscle_weakness,
    burningPain: row.burning_pain,
    alcoholUsed: row.alcohol_used,
    proteinGrams: row.protein_grams,
    carbsGrams: row.carbs_grams,
    fatGrams: row.fat_grams,
    waterOz: row.water_oz,
    meals: row.meals ?? '',
    notes: row.notes ?? '',
    ouraReadiness: row.oura_readiness,
    ouraSleepScore: row.oura_sleep_score,
    ouraHrv: row.oura_hrv,
    ouraRestingHr: row.oura_resting_hr,
    supplements: supplementNames,
  }
}

function toMetric(row, tags = []) {
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

async function loadSupabaseSnapshot(user) {
  const { data: program } = await supabase
    .from('recovery_programs')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!program) {
    return {
      mode: 'supabase',
      program: null,
      weeks: [],
      dailyLogs: [],
      supplements: [],
      ouraMetrics: [],
    }
  }

  const [{ data: weeks }, { data: logs }, { data: supplements }, { data: metrics }, { data: tags }] = await Promise.all([
    supabase.from('program_weeks').select('*').eq('program_id', program.id).order('week_number'),
    supabase.from('daily_logs').select('*').eq('program_id', program.id).order('week_number').order('day_of_week'),
    supabase.from('supplements').select('*').eq('user_id', user.id).order('name'),
    supabase.from('oura_daily_metrics').select('*').eq('user_id', user.id).order('metric_date'),
    supabase.from('daily_tags').select('*').eq('user_id', user.id),
  ])

  const logIds = (logs ?? []).map((log) => log.id)
  const { data: supplementLinks } = logIds.length
    ? await supabase.from('daily_log_supplements').select('daily_log_id, supplement_id').in('daily_log_id', logIds)
    : { data: [] }

  const supplementById = new Map((supplements ?? []).map((supplement) => [supplement.id, supplement.name]))
  const linksByLogId = new Map()

  for (const link of supplementLinks ?? []) {
    if (!linksByLogId.has(link.daily_log_id)) {
      linksByLogId.set(link.daily_log_id, [])
    }

    const supplementName = supplementById.get(link.supplement_id)
    if (supplementName) {
      linksByLogId.get(link.daily_log_id).push(supplementName)
    }
  }

  const tagGroupsByMetricId = new Map()
  for (const tag of tags ?? []) {
    if (!tag.oura_metric_id) continue

    if (!tagGroupsByMetricId.has(tag.oura_metric_id)) {
      tagGroupsByMetricId.set(tag.oura_metric_id, [])
    }

    tagGroupsByMetricId.get(tag.oura_metric_id).push(tag.tag)
  }

  return {
    mode: 'supabase',
    program: {
      id: program.id,
      name: program.name,
      startDate: program.start_date,
      totalWeeks: program.total_weeks,
      phaseTwoStartWeek: program.phase_two_start_week,
      phaseOneDoseMg: Number(program.phase_one_dose_mg),
      phaseTwoDoseMg: Number(program.phase_two_dose_mg),
      patchRenewalDay: program.patch_renewal_day,
      isActive: program.is_active,
    },
    weeks: (weeks ?? []).map((week) => ({
      id: week.id,
      weekNumber: week.week_number,
      startsOn: week.starts_on,
      endsOn: week.ends_on,
      doseMg: Number(week.dose_mg ?? 0),
      phaseLabel: week.phase_label,
    })),
    dailyLogs: (logs ?? []).map((log) => toAppLog(log, linksByLogId.get(log.id) ?? [])),
    supplements: (supplements ?? []).map((supplement) => supplement.name),
    ouraMetrics: (metrics ?? []).map((metric) => toMetric(metric, tagGroupsByMetricId.get(metric.id) ?? [])),
  }
}

async function saveSupabaseLog(user, snapshot, draft) {
  const logDate = draft.logDate || deriveLogDate(snapshot.program, draft.weekNumber, draft.dayOfWeek)
  const patchCycleDay = draft.patchCycleDay || getPatchCycleDay(snapshot.program.patchRenewalDay, logDate)

  const upsertPayload = {
    id: draft.id,
    user_id: user.id,
    program_id: snapshot.program.id,
    week_number: draft.weekNumber,
    day_of_week: draft.dayOfWeek,
    log_date: logDate,
    patch_cycle_day: patchCycleDay,
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
    alcohol_used: draft.alcoholUsed,
    protein_grams: draft.proteinGrams || null,
    carbs_grams: draft.carbsGrams || null,
    fat_grams: draft.fatGrams || null,
    water_oz: draft.waterOz || null,
    meals: draft.meals || '',
    notes: draft.notes || '',
    oura_readiness: draft.ouraReadiness || null,
    oura_sleep_score: draft.ouraSleepScore || null,
    oura_hrv: draft.ouraHrv || null,
    oura_resting_hr: draft.ouraRestingHr || null,
  }

  const { data: savedRow, error } = await supabase
    .from('daily_logs')
    .upsert(upsertPayload, { onConflict: 'program_id,week_number,day_of_week' })
    .select('*')
    .single()

  if (error) throw error

  const selectedSupplementNames = [...new Set(draft.supplements ?? [])]
  if (selectedSupplementNames.length > 0) {
    const { data: existingSupplements } = await supabase
      .from('supplements')
      .select('id,name')
      .eq('user_id', user.id)
      .in('name', selectedSupplementNames)

    const existingNames = new Set((existingSupplements ?? []).map((supplement) => supplement.name))
    const missingNames = selectedSupplementNames.filter((name) => !existingNames.has(name))

    if (missingNames.length > 0) {
      await supabase.from('supplements').insert(
        missingNames.map((name) => ({
          user_id: user.id,
          name,
          is_default: false,
        })),
      )
    }
  }

  const { data: supplementRows } = await supabase
    .from('supplements')
    .select('id,name')
    .eq('user_id', user.id)
    .in('name', selectedSupplementNames.length ? selectedSupplementNames : [''])

  await supabase.from('daily_log_supplements').delete().eq('daily_log_id', savedRow.id)

  if ((supplementRows ?? []).length > 0) {
    await supabase.from('daily_log_supplements').insert(
      supplementRows.map((supplement) => ({
        daily_log_id: savedRow.id,
        supplement_id: supplement.id,
      })),
    )
  }
}

export async function getInitialSession() {
  if (!isSupabaseConfigured) {
    return readDemoSession()
  }

  const { data } = await supabase.auth.getSession()
  return data.session?.user ?? null
}

export function subscribeToAuthChanges(callback) {
  if (!isSupabaseConfigured) {
    const handler = () => callback(readDemoSession())
    window.addEventListener(DEMO_AUTH_EVENT, handler)
    return () => window.removeEventListener(DEMO_AUTH_EVENT, handler)
  }

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null)
  })

  return () => subscription.unsubscribe()
}

export async function signInWithPassword({ identifier, password }) {
  if (!isSupabaseConfigured) {
    if (identifier !== MOCK_USERNAME || password !== MOCK_PASSWORD) {
      throw new Error('Invalid username or password.')
    }

    const user = {
      id: 'demo-user',
      email: `${MOCK_USERNAME}@demo.local`,
      username: MOCK_USERNAME,
      isDemo: true,
      mode: 'demo',
    }

    writeDemoSession(user)
    return user
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email: identifier, password })
  if (error) throw error
  return data.user
}

export async function signInDemo() {
  const user = {
    id: 'demo-user',
    email: `${MOCK_USERNAME}@demo.local`,
    username: MOCK_USERNAME,
    isDemo: true,
    mode: 'demo',
  }

  writeDemoSession(user)
  return user
}

export async function signOutCurrentUser() {
  if (!isSupabaseConfigured) {
    writeDemoSession(null)
    return
  }

  await supabase.auth.signOut()
}

export async function loadRecoverySnapshot(user) {
  if (!isSupabaseConfigured || user?.isDemo) {
    return safeClone(readDemoSnapshot())
  }

  return loadSupabaseSnapshot(user)
}

export async function addSupplement(user, name) {
  const trimmed = name.trim()
  if (!trimmed) return

  if (!isSupabaseConfigured || user?.isDemo) {
    const snapshot = readDemoSnapshot()
    if (!snapshot.supplements.includes(trimmed)) {
      snapshot.supplements.push(trimmed)
      snapshot.supplements.sort()
      writeDemoSnapshot(snapshot)
    }
    return
  }

  await supabase.from('supplements').upsert({
    user_id: user.id,
    name: trimmed,
    is_default: false,
  }, { onConflict: 'user_id,name' })
}

export async function saveDailyLog(user, snapshot, draft) {
  if (!isSupabaseConfigured || user?.isDemo) {
    const localSnapshot = readDemoSnapshot()
    const index = localSnapshot.dailyLogs.findIndex(
      (log) => log.weekNumber === draft.weekNumber && log.dayOfWeek === draft.dayOfWeek,
    )

    const logDate = draft.logDate || deriveLogDate(localSnapshot.program, draft.weekNumber, draft.dayOfWeek)
    const patchCycleDay = draft.patchCycleDay || getPatchCycleDay(localSnapshot.program.patchRenewalDay, logDate)

    const nextLog = {
      ...draft,
      id: draft.id || `demo-log-${draft.weekNumber}-${draft.dayOfWeek}`,
      logDate,
      patchCycleDay,
    }

    if (index >= 0) {
      localSnapshot.dailyLogs[index] = nextLog
    } else {
      localSnapshot.dailyLogs.push(nextLog)
    }

    const supplementSet = new Set(localSnapshot.supplements)
    for (const supplement of draft.supplements ?? []) {
      supplementSet.add(supplement)
    }

    localSnapshot.supplements = [...supplementSet].sort()
    writeDemoSnapshot(localSnapshot)
    return
  }

  await saveSupabaseLog(user, snapshot, draft)
}
