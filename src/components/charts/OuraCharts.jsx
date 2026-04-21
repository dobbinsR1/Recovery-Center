import { useEffect, useMemo, useState } from 'react'
import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { Dropdown } from 'primereact/dropdown'
import { Tag } from 'primereact/tag'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Link } from 'react-router-dom'
import { formatShortDate } from '../../lib/date'

function average(values) {
  if (!values.length) return null
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1))
}

function buildChartData(metrics) {
  return [...metrics]
    .sort((left, right) => left.metricDate.localeCompare(right.metricDate))
    .map((metric, index, allMetrics) => {
      const previousMetric = allMetrics[index - 1]

      return {
        ...metric,
        dateLabel: formatShortDate(metric.metricDate),
        sleepHours: metric.totalSleepMinutes ? Number((metric.totalSleepMinutes / 60).toFixed(1)) : null,
        deepHours: metric.deepSleepMinutes ? Number((metric.deepSleepMinutes / 60).toFixed(1)) : null,
        remHours: metric.remSleepMinutes ? Number((metric.remSleepMinutes / 60).toFixed(1)) : null,
        tagCount: metric.tags.length,
        readinessDelta:
          previousMetric?.readinessScore != null && metric.readinessScore != null
            ? metric.readinessScore - previousMetric.readinessScore
            : null,
        sleepDelta:
          previousMetric?.sleepScore != null && metric.sleepScore != null
            ? metric.sleepScore - previousMetric.sleepScore
            : null,
      }
    })
}

function buildTagFrequency(metrics) {
  const frequency = new Map()

  for (const metric of metrics) {
    for (const tag of metric.tags) {
      frequency.set(tag, (frequency.get(tag) ?? 0) + 1)
    }
  }

  return [...frequency.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 8)
}

function buildIntradayChartData(metric) {
  const byTime = new Map()

  for (const sample of metric?.heartRateSamples ?? []) {
    const sampleDate = new Date(sample.timestamp)
    const label = sampleDate.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    })

    const key = sampleDate.toISOString()

    byTime.set(key, {
      ...(byTime.get(key) ?? { timeLabel: label, timeValue: sampleDate.getTime(), heartRate: null, stress: null, recovery: null }),
      heartRate: sample.bpm,
    })
  }

  for (const sample of metric?.stressSamples ?? []) {
    const sampleDate = new Date(sample.timestamp)
    const label = sampleDate.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    })

    const key = sampleDate.toISOString()

    byTime.set(key, {
      ...(byTime.get(key) ?? { timeLabel: label, timeValue: sampleDate.getTime(), heartRate: null, stress: null, recovery: null }),
      stress: sample.value,
    })
  }

  for (const sample of metric?.recoverySamples ?? []) {
    const sampleDate = new Date(sample.timestamp)
    const label = sampleDate.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    })

    const key = sampleDate.toISOString()

    byTime.set(key, {
      ...(byTime.get(key) ?? { timeLabel: label, timeValue: sampleDate.getTime(), heartRate: null, stress: null, recovery: null }),
      recovery: sample.value,
    })
  }

  return [...byTime.values()].sort((left, right) => left.timeValue - right.timeValue)
}

function hasIntradayData(metric) {
  return Boolean(
    metric?.heartRateSamples?.length ||
      metric?.stressSamples?.length ||
      metric?.recoverySamples?.length ||
      metric?.sleepStartAt ||
      metric?.sleepEndAt,
  )
}

function findPeak(metrics, selector, compare = 'max') {
  const filtered = metrics.filter((metric) => selector(metric) != null)
  if (!filtered.length) return null

  return filtered.reduce((best, current) => {
    const bestValue = selector(best)
    const currentValue = selector(current)

    if (compare === 'min') {
      return currentValue < bestValue ? current : best
    }

    return currentValue > bestValue ? current : best
  })
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  return (
    <div className="surface-card p-3 border-round-xl shadow-3">
      <div className="mono text-sm mb-2">{label}</div>
      {payload.map((entry) => (
        <div key={entry.dataKey ?? entry.name} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: <strong>{entry.value ?? '--'}</strong>
        </div>
      ))}
    </div>
  )
}

function EmptyInsightsState() {
  return (
    <Card className="hero-panel">
      <div className="section-stack">
        <div>
          <h2>Insights need Oura data</h2>
          <p className="section-copy">
            Import an Oura zip export first. Once it is saved, this page will generate readiness, sleep, HRV, steps,
            and tag-based graphs from the synced data.
          </p>
        </div>

        <div>
          <Link to="/oura-import">
            <Button label="Open Oura import" icon="pi pi-upload" />
          </Link>
        </div>
      </div>
    </Card>
  )
}

export function OuraCharts({ metrics, averages }) {
  const intradayMetrics = useMemo(
    () =>
      [...metrics]
        .filter(hasIntradayData)
        .sort((left, right) => right.metricDate.localeCompare(left.metricDate)),
    [metrics],
  )
  const intradayOptions = useMemo(
    () =>
      (intradayMetrics.length ? intradayMetrics : [...metrics].sort((left, right) => right.metricDate.localeCompare(left.metricDate)))
        .map((metric) => ({
          label: formatShortDate(metric.metricDate),
          value: metric.metricDate,
        })),
    [intradayMetrics, metrics],
  )
  const [selectedMetricDate, setSelectedMetricDate] = useState(intradayOptions[0]?.value ?? null)

  useEffect(() => {
    if (!intradayOptions.some((option) => option.value === selectedMetricDate)) {
      setSelectedMetricDate(intradayOptions[0]?.value ?? null)
    }
  }, [intradayOptions, selectedMetricDate])

  const selectedIntradayMetric =
    intradayMetrics.find((metric) => metric.metricDate === selectedMetricDate) ??
    metrics.find((metric) => metric.metricDate === selectedMetricDate) ??
    intradayMetrics[0] ??
    metrics.at(-1)
  const intradayChartData = buildIntradayChartData(selectedIntradayMetric)
  if (!metrics.length) {
    return <EmptyInsightsState />
  }

  const chartData = buildChartData(metrics)
  const flaggedDays = metrics.filter((metric) => metric.tags.length > 0)
  const tagFrequency = buildTagFrequency(metrics)
  const topReadinessDay = findPeak(metrics, (metric) => metric.readinessScore, 'max')
  const lowestSleepDay = findPeak(metrics, (metric) => metric.sleepScore, 'min')
  const highestHrvDay = findPeak(metrics, (metric) => metric.hrv, 'max')
  const longestSleepDay = findPeak(metrics, (metric) => metric.totalSleepMinutes, 'max')

  return (
    <div className="section-stack">
      <Card className="hero-panel">
        <div className="page-header">
          <div>
            <h2>Oura insights</h2>
            <p className="section-copy">Charts and summaries below are generated directly from the Oura metrics synced into Supabase.</p>
          </div>
          <Tag value={`${metrics.length} days`} severity="info" />
        </div>

        <div className="mobile-oura-upload-cta mt-3">
          <Link to="/oura-import">
            <Button label="Upload Oura Data" icon="pi pi-upload" fluid />
          </Link>
        </div>

        <div className="kpi-grid mt-4">
          <div className="kpi-card">
            <span className="kpi-label">Readiness avg</span>
            <span className="kpi-value">{averages.readiness ?? '--'}</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Sleep avg</span>
            <span className="kpi-value">{averages.sleep ?? '--'}</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">HRV avg</span>
            <span className="kpi-value">{averages.hrv ?? '--'}</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Steps avg</span>
            <span className="kpi-value">{averages.steps != null ? Math.round(averages.steps).toLocaleString() : '--'}</span>
          </div>
        </div>
      </Card>

      <div className="grid-two">
        <Card>
          <h3 className="card-title">Notable days</h3>
          <div className="section-stack">
            <div className="metric-line">
              <span>Top readiness</span>
              <strong>
                {topReadinessDay ? `${topReadinessDay.readinessScore} • ${formatShortDate(topReadinessDay.metricDate)}` : '--'}
              </strong>
            </div>
            <div className="metric-line">
              <span>Lowest sleep score</span>
              <strong>
                {lowestSleepDay ? `${lowestSleepDay.sleepScore} • ${formatShortDate(lowestSleepDay.metricDate)}` : '--'}
              </strong>
            </div>
            <div className="metric-line">
              <span>Highest HRV</span>
              <strong>{highestHrvDay ? `${highestHrvDay.hrv} • ${formatShortDate(highestHrvDay.metricDate)}` : '--'}</strong>
            </div>
            <div className="metric-line">
              <span>Longest sleep</span>
              <strong>
                {longestSleepDay
                  ? `${Number((longestSleepDay.totalSleepMinutes / 60).toFixed(1))}h • ${formatShortDate(longestSleepDay.metricDate)}`
                  : '--'}
              </strong>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="card-title">Tag frequency</h3>
          {tagFrequency.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={tagFrequency} layout="vertical" margin={{ left: 20, right: 10 }}>
                <CartesianGrid stroke="rgba(72, 95, 83, 0.12)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis dataKey="label" type="category" tick={{ fontSize: 11 }} width={110} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#177e72" radius={[0, 8, 8, 0]} name="Occurrences">
                  {tagFrequency.map((tag) => (
                    <Cell key={tag.label} fill={tag.label.toLowerCase().includes('alcohol') ? '#d56c47' : '#177e72'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="section-copy">No Oura tags have been synced yet.</p>
          )}
        </Card>
      </div>

      <div className="grid-two">
        <Card className="chart-card">
          <h3 className="card-title">Readiness and sleep score</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData}>
              <CartesianGrid stroke="rgba(72, 95, 83, 0.12)" />
              <XAxis dataKey="dateLabel" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[30, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line type="monotone" dataKey="readinessScore" stroke="#177e72" strokeWidth={3} dot={false} name="Readiness" />
              <Line type="monotone" dataKey="sleepScore" stroke="#d56c47" strokeWidth={3} dot={false} name="Sleep" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="chart-card">
          <h3 className="card-title">HRV and resting heart rate</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData}>
              <CartesianGrid stroke="rgba(72, 95, 83, 0.12)" />
              <XAxis dataKey="dateLabel" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="hrv" stroke="#177e72" strokeWidth={3} dot={false} name="HRV" />
              <Line yAxisId="right" type="monotone" dataKey="restingHeartRate" stroke="#d3a63f" strokeWidth={3} dot={false} name="Resting HR" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="chart-card">
        <div className="page-header">
          <div>
            <h3 className="card-title">Time-based day view</h3>
            <p className="section-copy">
              View heart rate, stress, recovery, and sleep timing for a single Oura day pulled back from Supabase.
            </p>
          </div>
          <Dropdown
            value={selectedMetricDate}
            options={intradayOptions}
            onChange={(event) => setSelectedMetricDate(event.value)}
            className="oura-day-picker"
          />
        </div>

        <div className="grid-two mt-4">
          <div className="kpi-card">
            <span className="kpi-label">Sleep start</span>
            <span className="kpi-value">
              {selectedIntradayMetric?.sleepStartAt
                ? new Date(selectedIntradayMetric.sleepStartAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
                : '--'}
            </span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Sleep end</span>
            <span className="kpi-value">
              {selectedIntradayMetric?.sleepEndAt
                ? new Date(selectedIntradayMetric.sleepEndAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
                : '--'}
            </span>
          </div>
        </div>

        {intradayChartData.length ? (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={intradayChartData} margin={{ top: 20, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid stroke="rgba(72, 95, 83, 0.12)" />
              <XAxis dataKey="timeLabel" tick={{ fontSize: 11 }} minTickGap={24} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="heartRate" stroke="#177e72" strokeWidth={3} dot={false} name="Heart rate" />
              <Line yAxisId="right" type="monotone" dataKey="stress" stroke="#d56c47" strokeWidth={2.5} dot={false} name="Stress" />
              <Line yAxisId="right" type="monotone" dataKey="recovery" stroke="#d3a63f" strokeWidth={2.5} dot={false} name="Recovery" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="section-copy mt-4">No time-based Oura samples were synced for this day yet.</p>
        )}
      </Card>

      <div className="grid-two">
        <Card className="chart-card">
          <h3 className="card-title">Sleep stages and duration</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData}>
              <CartesianGrid stroke="rgba(72, 95, 83, 0.12)" />
              <XAxis dataKey="dateLabel" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line type="monotone" dataKey="sleepHours" stroke="#d56c47" strokeWidth={3} dot={false} name="Total sleep (h)" />
              <Line type="monotone" dataKey="deepHours" stroke="#177e72" strokeWidth={3} dot={false} name="Deep (h)" />
              <Line type="monotone" dataKey="remHours" stroke="#d3a63f" strokeWidth={3} dot={false} name="REM (h)" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="chart-card">
          <h3 className="card-title">Daily steps and tag load</h3>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={chartData}>
              <CartesianGrid stroke="rgba(72, 95, 83, 0.12)" />
              <XAxis dataKey="dateLabel" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="steps"
                stroke="#177e72"
                fill="rgba(23, 126, 114, 0.18)"
                name="Steps"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="tagCount"
                stroke="#d56c47"
                strokeWidth={3}
                dot={false}
                name="Tag count"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid-two">
        <Card className="chart-card">
          <h3 className="card-title">Day-over-day score change</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData}>
              <CartesianGrid stroke="rgba(72, 95, 83, 0.12)" />
              <XAxis dataKey="dateLabel" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line type="monotone" dataKey="readinessDelta" stroke="#177e72" strokeWidth={3} dot={false} name="Readiness change" />
              <Line type="monotone" dataKey="sleepDelta" stroke="#d56c47" strokeWidth={3} dot={false} name="Sleep change" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="card-title">Tagged days</h3>
          <div className="section-stack">
            {flaggedDays.length ? (
              flaggedDays.slice().reverse().slice(0, 8).map((metric) => (
                <div key={metric.id} className="history-card">
                  <div className="metric-line">
                    <strong>{formatShortDate(metric.metricDate)}</strong>
                    <span className="mono">
                      Ready {metric.readinessScore ?? '--'} • Sleep {metric.sleepScore ?? '--'}
                    </span>
                  </div>
                  <div className="chip-grid">
                    {metric.tags.map((tag) => (
                      <Tag
                        key={`${metric.id}-${tag}`}
                        value={tag}
                        severity={
                          tag.toLowerCase().includes('alcohol')
                            ? 'danger'
                            : tag.toLowerCase().includes('pain') || tag.toLowerCase().includes('headache')
                              ? 'warning'
                              : 'info'
                        }
                      />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="section-copy">No tagged days were found in the synced Oura data.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
