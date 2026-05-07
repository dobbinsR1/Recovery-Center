function cleanCellValue(value) {
  if (value == null) return null
  if (typeof value !== 'string') return value

  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

function parseInteger(value) {
  if (value == null || value === '') return null
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : null
}

function parseRoundedInteger(value) {
  if (value == null || value === '') return null
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? Math.round(parsed) : null
}

function secondsToMinutes(value) {
  const parsed = parseInteger(value)
  if (!Number.isFinite(parsed)) return null
  return Math.round(parsed / 60)
}

const OURA_TIMEZONE = 'America/Chicago'

function formatDateInTimeZone(value, timeZone = OURA_TIMEZONE) {
  if (!value) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

function metricDateFromTimestamp(timestamp) {
  return formatDateInTimeZone(timestamp)
}

function toTitleCase(value) {
  return value.replace(/\b\w/g, (char) => char.toUpperCase())
}

function getCsvByteSize(csvText) {
  return new TextEncoder().encode(csvText).length
}

export function slugFromPath(path) {
  return path
    .split('/')
    .pop()
    .replace(/\.csv$/i, '')
    .toLowerCase()
}

export function prettifyTagCode(tagCode) {
  if (!tagCode) return null

  return toTitleCase(
    tagCode
      .replace(/^tag_generic_/i, '')
      .replace(/_/g, ' ')
      .trim(),
  )
}

export function buildImportTable({ path, csvText, rows, columns, index }) {
  const sourceFolder = path.split('/').slice(0, -1).join('/')
  const tableName = path.split('/').pop()
  const tableSlug = slugFromPath(path)
  const normalizedRows = rows.map((row, rowIndex) => ({
    __rowId: `${tableSlug}-${rowIndex + 1}`,
    ...Object.fromEntries(columns.map((column) => [column, cleanCellValue(row[column])])),
  }))

  return {
    id: `${tableSlug}-${index + 1}`,
    sourcePath: path,
    sourceFolder,
    tableName,
    tableSlug,
    columns,
    rows: normalizedRows,
    rowCount: normalizedRows.length,
    csvText,
    csvByteSize: getCsvByteSize(csvText),
    previewRows: normalizedRows.slice(0, 25),
  }
}

function indexTablesBySlug(tables) {
  return new Map(tables.map((table) => [table.tableSlug, table]))
}

function buildSamplesByDate(rows, metricDateSelector, sampleSelector) {
  const samplesByDate = new Map()

  for (const row of rows) {
    const metricDate = metricDateSelector(row)
    const sample = sampleSelector(row)

    if (!metricDate || !sample) continue

    if (!samplesByDate.has(metricDate)) {
      samplesByDate.set(metricDate, [])
    }

    samplesByDate.get(metricDate).push(sample)
  }

  for (const [metricDate, samples] of samplesByDate.entries()) {
    samplesByDate.set(
      metricDate,
      samples.sort((left, right) => String(left.timestamp).localeCompare(String(right.timestamp))),
    )
  }

  return samplesByDate
}

function pickPrimarySleepRows(rows) {
  const byDay = new Map()

  for (const row of rows) {
    if (!row.day) continue

    const current = byDay.get(row.day)
    const candidateScore = parseInteger(row.total_sleep_duration) ?? 0
    const currentScore = parseInteger(current?.total_sleep_duration) ?? 0
    const isPreferredType = row.type === 'long_sleep'
    const currentPreferredType = current?.type === 'long_sleep'

    if (!current) {
      byDay.set(row.day, row)
      continue
    }

    if (isPreferredType && !currentPreferredType) {
      byDay.set(row.day, row)
      continue
    }

    if (isPreferredType === currentPreferredType && candidateScore > currentScore) {
      byDay.set(row.day, row)
    }
  }

  return byDay
}

export function buildDerivedMetricRows(tables, userId) {
  const tableMap = indexTablesBySlug(tables)
  const metricsByDate = new Map()

  const ensureMetric = (metricDate) => {
    if (!metricsByDate.has(metricDate)) {
      metricsByDate.set(metricDate, {
        user_id: userId,
        metric_date: metricDate,
        readiness_score: null,
        sleep_score: null,
        total_sleep_minutes: null,
        deep_sleep_minutes: null,
        rem_sleep_minutes: null,
        hrv: null,
        resting_heart_rate: null,
        steps: null,
        source: 'oura_zip',
      })
    }

    return metricsByDate.get(metricDate)
  }

  for (const row of tableMap.get('dailyreadiness')?.rows ?? []) {
    if (!row.day) continue
    ensureMetric(row.day).readiness_score = parseInteger(row.score)
  }

  for (const row of tableMap.get('dailysleep')?.rows ?? []) {
    if (!row.day) continue
    ensureMetric(row.day).sleep_score = parseInteger(row.score)
  }

  for (const row of tableMap.get('dailyactivity')?.rows ?? []) {
    if (!row.day) continue
    ensureMetric(row.day).steps = parseInteger(row.steps)
  }

  const primarySleepRows = pickPrimarySleepRows(tableMap.get('sleepmodel')?.rows ?? [])
  const heartRateSamplesByDate = buildSamplesByDate(
    tableMap.get('heartrate')?.rows ?? [],
    (row) => metricDateFromTimestamp(row.timestamp),
    (row) => {
      const bpm = parseInteger(row.bpm)
      if (!row.timestamp || bpm == null) return null

      return {
        timestamp: row.timestamp,
        bpm,
        source: row.source ?? null,
      }
    },
  )
  const stressSamplesByDate = buildSamplesByDate(
    tableMap.get('daytimestress')?.rows ?? [],
    (row) => metricDateFromTimestamp(row.timestamp),
    (row) => {
      const stressValue = parseInteger(row.stress_value)
      if (!row.timestamp || stressValue == null) return null

      return {
        timestamp: row.timestamp,
        value: stressValue,
      }
    },
  )
  const recoverySamplesByDate = buildSamplesByDate(
    tableMap.get('daytimestress')?.rows ?? [],
    (row) => metricDateFromTimestamp(row.timestamp),
    (row) => {
      const recoveryValue = parseInteger(row.recovery_value)
      if (!row.timestamp || recoveryValue == null) return null

      return {
        timestamp: row.timestamp,
        value: recoveryValue,
      }
    },
  )

  for (const [day, row] of primarySleepRows.entries()) {
    const metric = ensureMetric(day)
    metric.total_sleep_minutes = secondsToMinutes(row.total_sleep_duration)
    metric.deep_sleep_minutes = secondsToMinutes(row.deep_sleep_duration)
    metric.rem_sleep_minutes = secondsToMinutes(row.rem_sleep_duration)
    metric.hrv = parseInteger(row.average_hrv)
    metric.resting_heart_rate = parseInteger(row.lowest_heart_rate) ?? parseRoundedInteger(row.average_heart_rate)
    metric.sleep_start_at = row.bedtime_start ?? null
    metric.sleep_end_at = row.bedtime_end ?? null
  }

  for (const [day, metric] of metricsByDate.entries()) {
    metric.heart_rate_samples = heartRateSamplesByDate.get(day) ?? []
    metric.stress_samples = stressSamplesByDate.get(day) ?? []
    metric.recovery_samples = recoverySamplesByDate.get(day) ?? []
  }

  return [...metricsByDate.values()]
}

export function buildDerivedTagRows(tables, userId) {
  const tableMap = indexTablesBySlug(tables)
  const rows = tableMap.get('enhancedtag')?.rows ?? []

  return rows
    .map((row) => {
      const metricDate =
        row.start_day ??
        row.end_day ??
        metricDateFromTimestamp(row.start_time) ??
        metricDateFromTimestamp(row.end_time)
      const label = row.custom_tag_name ?? prettifyTagCode(row.tag_type_code)

      if (!metricDate || !label) {
        return null
      }

      return {
        user_id: userId,
        metric_date: metricDate,
        label,
        source: 'oura_zip',
      }
    })
    .filter(Boolean)
}

export function buildPreviewMetrics(tables) {
  const metricRows = buildDerivedMetricRows(tables, 'preview')
  const tagRows = buildDerivedTagRows(tables, 'preview')

  const tagsByDate = new Map()
  for (const row of tagRows) {
    if (!tagsByDate.has(row.metric_date)) tagsByDate.set(row.metric_date, [])
    tagsByDate.get(row.metric_date).push(row.label)
  }

  const metrics = metricRows.map((row) => ({
    id: row.metric_date,
    metricDate: row.metric_date,
    readinessScore: row.readiness_score,
    sleepScore: row.sleep_score,
    totalSleepMinutes: row.total_sleep_minutes,
    deepSleepMinutes: row.deep_sleep_minutes,
    remSleepMinutes: row.rem_sleep_minutes,
    hrv: row.hrv,
    restingHeartRate: row.resting_heart_rate,
    steps: row.steps,
    sleepStartAt: row.sleep_start_at ?? null,
    sleepEndAt: row.sleep_end_at ?? null,
    heartRateSamples: row.heart_rate_samples ?? [],
    stressSamples: row.stress_samples ?? [],
    recoverySamples: row.recovery_samples ?? [],
    tags: tagsByDate.get(row.metric_date) ?? [],
  }))

  function avg(values) {
    const v = values.filter((x) => x != null)
    return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null
  }

  return {
    metrics,
    averages: {
      readiness: avg(metrics.map((m) => m.readinessScore)),
      sleep: avg(metrics.map((m) => m.sleepScore)),
      hrv: avg(metrics.map((m) => m.hrv)),
      steps: avg(metrics.map((m) => m.steps)),
    },
  }
}

export function summarizeImport(tables, userId = 'preview') {
  const metricRows = buildDerivedMetricRows(tables, userId)
  const tagRows = buildDerivedTagRows(tables, userId)

  return {
    tableCount: tables.length,
    rowCount: tables.reduce((total, table) => total + table.rowCount, 0),
    derivedMetricCount: metricRows.length,
    derivedTagCount: tagRows.length,
  }
}
