import { Card } from 'primereact/card'
import { Tag } from 'primereact/tag'
import { DAYS, formatLongDate, getDoseForWeek, getPhaseForWeek, getPatchCycleDay } from '../lib/date'
import { useRecoveryData } from '../features/recovery/RecoveryDataContext'
import { AIInsightCard } from '../components/dashboard/AIInsightCard'

function scoreColor(value) {
  if (value == null) return 'inherit'
  if (value >= 80) return '#4ade80'
  if (value >= 60) return '#fbbf24'
  return '#f87171'
}

function delta(current, previous) {
  if (current == null || previous == null) return null
  return current - previous
}

function DeltaBadge({ value }) {
  if (value == null) return null
  const positive = value > 0
  const zero = value === 0
  return (
    <span
      className="delta-badge"
      style={{ color: zero ? 'var(--rc-muted)' : positive ? '#4ade80' : '#f87171' }}
    >
      {zero ? '—' : positive ? `+${value}` : value}
    </span>
  )
}

export default function DashboardPage() {
  const { snapshot, loading, activeWeek, activeDay, selectedLog } = useRecoveryData()

  if (loading) {
    return null
  }

  if (!snapshot?.program) {
    return (
      <Card>
        <h2 className="card-title">No active program yet</h2>
        <p className="section-copy">
          Your Supabase project is connected, but there is no active <code>recovery_programs</code> row yet. Seed the
          database with <code>supabase/schema.sql</code> and <code>supabase/seed.sql</code> or create the first program
          in Supabase.
        </p>
      </Card>
    )
  }

  const todayLabel = `${DAYS[activeDay]} • Week ${activeWeek}`
  const patchDay = getPatchCycleDay(snapshot.program.patchRenewalDay)
  const phase = getPhaseForWeek(snapshot.program, activeWeek)
  const dose = getDoseForWeek(snapshot.program, activeWeek)
  const lastLog = snapshot.dailyLogs.at(-1)
  const yesterday = snapshot.dailyLogs.at(-2) ?? null
  const todayLog = selectedLog

  // Build context for AI insight
  const yesterdayOura = yesterday
    ? snapshot.ouraMetrics.find((m) => m.metricDate === yesterday.logDate)
    : null
  const todayOura = todayLog
    ? snapshot.ouraMetrics.find((m) => m.metricDate === todayLog.logDate)
    : null

  const insightContext = {
    week: activeWeek,
    phase,
    patchCycleDay: patchDay,
    yesterday: yesterday
      ? {
          readiness: yesterdayOura?.readinessScore ?? yesterday.ouraReadiness ?? null,
          sleepScore: yesterdayOura?.sleepScore ?? yesterday.ouraSleepScore ?? null,
          hrv: yesterdayOura?.hrv ?? yesterday.ouraHrv ?? null,
          restingHr: yesterdayOura?.restingHeartRate ?? yesterday.ouraRestingHr ?? null,
          energy: yesterday.energy,
          painAvg: Math.round((yesterday.jointPain + yesterday.nervePain) / 2),
          sleepQuality: yesterday.sleepQuality,
          alcoholUsed: yesterday.alcoholUsed,
          notes: yesterday.notes || null,
        }
      : null,
    today: todayLog
      ? {
          energy: todayLog.energy,
          painAvg: Math.round((todayLog.jointPain + todayLog.nervePain) / 2),
          readiness: todayOura?.readinessScore ?? todayLog.ouraReadiness ?? null,
        }
      : null,
  }

  const todayPainAvg = todayLog ? Math.round((todayLog.jointPain + todayLog.nervePain) / 2) : null
  const yesterdayPainAvg = yesterday ? Math.round((yesterday.jointPain + yesterday.nervePain) / 2) : null

  return (
    <div className="section-stack">
      <AIInsightCard context={insightContext} />

      <Card className="hero-panel">
        <div className="page-header">
          <div>
            <h2>Today's recovery posture</h2>
            <p className="section-copy">
              {todayLabel} •{' '}
              {formatLongDate(selectedLog?.logDate || lastLog?.logDate || snapshot.program.startDate)}
            </p>
          </div>
          <Tag value={`${phase}${dose ? ` • ${dose}mg` : ''}`} severity="success" />
        </div>

        <div className="kpi-grid mt-4">
          <div className="kpi-card">
            <span className="kpi-label">Patch cycle</span>
            <span className="kpi-value">{patchDay}/7</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Entries saved</span>
            <span className="kpi-value">{snapshot.dailyLogs.length}</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Readiness avg</span>
            <span className="kpi-value" style={{ color: scoreColor(snapshot.ouraAverages.readiness) }}>
              {snapshot.ouraAverages.readiness ?? '--'}
            </span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">HRV avg</span>
            <span className="kpi-value">{snapshot.ouraAverages.hrv ?? '--'}</span>
          </div>
        </div>
      </Card>

      <div className="grid-two">
        <Card>
          <h3 className="card-title">Current day summary</h3>
          {todayLog ? (
            <div className="section-stack">
              <div className="metric-line">
                <span>Pain average</span>
                <strong>
                  {todayPainAvg}/10
                  <DeltaBadge value={delta(todayPainAvg, yesterdayPainAvg)} />
                </strong>
              </div>
              <div className="metric-line">
                <span>Energy</span>
                <strong>
                  {todayLog.energy}/10
                  <DeltaBadge value={delta(todayLog.energy, yesterday?.energy)} />
                </strong>
              </div>
              <div className="metric-line">
                <span>Sleep quality</span>
                <strong>
                  {todayLog.sleepQuality}/10
                  <DeltaBadge value={delta(todayLog.sleepQuality, yesterday?.sleepQuality)} />
                </strong>
              </div>
              <div className="metric-line">
                <span>Oura readiness</span>
                <strong style={{ color: scoreColor(todayLog.ouraReadiness) }}>
                  {todayLog.ouraReadiness ?? '--'}
                </strong>
              </div>
              <div className="section-copy">{todayLog.notes || 'No note saved for the selected day yet.'}</div>
            </div>
          ) : (
            <p className="section-copy">No day log saved yet for the selected week/day. Start in Daily log.</p>
          )}
        </Card>

        <Card>
          <h3 className="card-title">Yesterday's numbers</h3>
          {yesterday ? (
            <div className="section-stack">
              <div className="metric-line">
                <span>Oura readiness</span>
                <strong style={{ color: scoreColor(yesterdayOura?.readinessScore ?? yesterday.ouraReadiness) }}>
                  {yesterdayOura?.readinessScore ?? yesterday.ouraReadiness ?? '--'}
                </strong>
              </div>
              <div className="metric-line">
                <span>Sleep score</span>
                <strong style={{ color: scoreColor(yesterdayOura?.sleepScore ?? yesterday.ouraSleepScore) }}>
                  {yesterdayOura?.sleepScore ?? yesterday.ouraSleepScore ?? '--'}
                </strong>
              </div>
              <div className="metric-line">
                <span>HRV</span>
                <strong>{yesterdayOura?.hrv ?? yesterday.ouraHrv ?? '--'}</strong>
              </div>
              <div className="metric-line">
                <span>Pain avg</span>
                <strong>{yesterdayPainAvg}/10</strong>
              </div>
              <div className="metric-line">
                <span>Energy</span>
                <strong>{yesterday.energy}/10</strong>
              </div>
              {yesterday.alcoholUsed ? (
                <Tag value="Alcohol logged" severity="warning" className="mt-1" />
              ) : null}
            </div>
          ) : (
            <p className="section-copy">No prior log to compare against yet.</p>
          )}
        </Card>
      </div>

      <div className="grid-two">
        <Card>
          <h3 className="card-title">Recent history</h3>
          <div className="section-stack">
            {snapshot.dailyLogs
              .slice(-4)
              .reverse()
              .map((log) => (
                <div key={log.id} className="history-card">
                  <div className="metric-line">
                    <strong>
                      Week {log.weekNumber} • {DAYS[log.dayOfWeek]}
                    </strong>
                    <span className="mono">{log.logDate}</span>
                  </div>
                  <div className="metric-line">
                    <span>Energy {log.energy}</span>
                    <span>Sleep {log.sleepQuality}</span>
                    <span>Pain {Math.round((log.jointPain + log.nervePain) / 2)}</span>
                    {log.ouraReadiness != null ? (
                      <span style={{ color: scoreColor(log.ouraReadiness) }}>
                        Ready {log.ouraReadiness}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
          </div>
        </Card>

        <Card>
          <h3 className="card-title">Protocol context</h3>
          <div className="section-stack">
            <div className="metric-line">
              <span>Current phase</span>
              <strong>{phase}</strong>
            </div>
            {dose ? (
              <div className="metric-line">
                <span>Dose</span>
                <strong>{dose}mg</strong>
              </div>
            ) : null}
            <div className="metric-line">
              <span>Patch renewal day</span>
              <strong>Day {patchDay} of 7</strong>
            </div>
            <div className="metric-line">
              <span>Program week</span>
              <strong>
                {activeWeek} / {snapshot.program.totalWeeks}
              </strong>
            </div>
            <div className="metric-line">
              <span>Total logs</span>
              <strong>{snapshot.dailyLogs.length} entries</strong>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
