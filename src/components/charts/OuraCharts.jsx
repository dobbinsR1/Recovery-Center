import { Card } from 'primereact/card'
import { Tag } from 'primereact/tag'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatShortDate } from '../../lib/date'

function buildChartData(metrics) {
  return metrics.map((metric) => ({
    ...metric,
    dateLabel: formatShortDate(metric.metricDate),
    sleepHours: metric.totalSleepMinutes ? Number((metric.totalSleepMinutes / 60).toFixed(1)) : null,
    deepHours: metric.deepSleepMinutes ? Number((metric.deepSleepMinutes / 60).toFixed(1)) : null,
    remHours: metric.remSleepMinutes ? Number((metric.remSleepMinutes / 60).toFixed(1)) : null,
  }))
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  return (
    <div className="surface-card p-3 border-round-xl shadow-3">
      <div className="mono text-sm mb-2">{label}</div>
      {payload.map((entry) => (
        <div key={entry.name} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: <strong>{entry.value}</strong>
        </div>
      ))}
    </div>
  )
}

export function OuraCharts({ metrics, averages }) {
  const chartData = buildChartData(metrics)
  const flaggedDays = metrics.filter((metric) => metric.tags.length > 0)

  return (
    <div className="section-stack">
      <Card className="hero-panel">
        <div className="page-header">
          <div>
            <h2>Oura import window</h2>
            <p className="section-copy">The seeded demo keeps 35 days of readiness, sleep, HRV, and flagged events.</p>
          </div>
          <Tag value={`${metrics.length} days`} severity="info" />
        </div>

        <div className="kpi-grid mt-4">
          <div className="kpi-card">
            <span className="kpi-label">Readiness avg</span>
            <span className="kpi-value">{averages.readiness}</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Sleep avg</span>
            <span className="kpi-value">{averages.sleep}</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">HRV avg</span>
            <span className="kpi-value">{averages.hrv}</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Steps avg</span>
            <span className="kpi-value">{averages.steps.toLocaleString()}</span>
          </div>
        </div>
      </Card>

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
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line type="monotone" dataKey="hrv" stroke="#177e72" strokeWidth={3} dot={false} name="HRV" />
              <Line type="monotone" dataKey="restingHeartRate" stroke="#d3a63f" strokeWidth={3} dot={false} name="Resting HR" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid-two">
        <Card className="chart-card">
          <h3 className="card-title">Sleep stages</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <CartesianGrid stroke="rgba(72, 95, 83, 0.12)" />
              <XAxis dataKey="dateLabel" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="sleepHours" fill="#d56c47" name="Total sleep" radius={[8, 8, 0, 0]} />
              <Bar dataKey="deepHours" fill="#177e72" name="Deep" radius={[8, 8, 0, 0]} />
              <Bar dataKey="remHours" fill="#d3a63f" name="REM" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="chart-card">
          <h3 className="card-title">Daily steps</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <CartesianGrid stroke="rgba(72, 95, 83, 0.12)" />
              <XAxis dataKey="dateLabel" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="steps" fill="#177e72" name="Steps" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <h3 className="card-title">Flagged days</h3>
        <div className="section-stack">
          {flaggedDays.map((metric) => (
            <div key={metric.id} className="history-card">
              <div className="metric-line">
                <strong>{formatShortDate(metric.metricDate)}</strong>
                <span className="mono">Ready {metric.readinessScore}</span>
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
          ))}
        </div>
      </Card>
    </div>
  )
}
