import { Card } from 'primereact/card'
import { Tag } from 'primereact/tag'
import { DAYS, formatLongDate, getDoseForWeek, getPhaseForWeek, getPatchCycleDay } from '../lib/date'
import { painAverage, scoreColor } from '../lib/health'
import { useRecoveryData } from '../features/recovery/RecoveryDataContext'
import { AIInsightCard } from '../components/dashboard/AIInsightCard'

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
        <h2 className="card-title">Setting up your program</h2>
        <p className="section-copy">
          Your account is connected but no recovery program was found. Refresh the page to set one
          up automatically — your data is safe.
        </p>
      </Card>
    )
  }

  const todayLabel = `${DAYS[activeDay]} • Week ${activeWeek}`
  const patchDay = getPatchCycleDay(snapshot.program.patchRenewalDay)
  const phase = getPhaseForWeek(snapshot.program, activeWeek)
  const dose = getDoseForWeek(snapshot.program, activeWeek)

  // Compare the selected day against the entry immediately before it, so the
  // deltas stay meaningful even when reviewing an older day.
  const logs = snapshot.dailyLogs
  const currentLog = selectedLog ?? logs.at(-1) ?? null
  const currentIndex = currentLog ? logs.findIndex((log) => log.id === currentLog.id) : -1
  const previousLog = currentIndex > 0 ? logs[currentIndex - 1] : null

  const previousOura = previousLog
    ? snapshot.ouraMetrics.find((m) => m.metricDate === previousLog.logDate)
    : null
  const currentOura = currentLog
    ? snapshot.ouraMetrics.find((m) => m.metricDate === currentLog.logDate)
    : null

  const currentPainAvg = painAverage(currentLog)
  const previousPainAvg = painAverage(previousLog)

  const insightContext = {
    week: activeWeek,
    phase,
    patchCycleDay: patchDay,
    yesterday: previousLog
      ? {
          readiness: previousOura?.readinessScore ?? previousLog.ouraReadiness ?? null,
          sleepScore: previousOura?.sleepScore ?? previousLog.ouraSleepScore ?? null,
          hrv: previousOura?.hrv ?? previousLog.ouraHrv ?? null,
          restingHr: previousOura?.restingHeartRate ?? previousLog.ouraRestingHr ?? null,
          energy: previousLog.energy,
          painAvg: previousPainAvg,
          sleepQuality: previousLog.sleepQuality,
          alcoholUsed: previousLog.alcoholUsed,
          notes: previousLog.notes || null,
        }
      : null,
    today: currentLog
      ? {
          energy: currentLog.energy,
          painAvg: currentPainAvg,
          readiness: currentOura?.readinessScore ?? currentLog.ouraReadiness ?? null,
        }
      : null,
  }

  return (
    <div className="section-stack">
      <AIInsightCard context={insightContext} />

      <Card className="hero-panel">
        <div className="page-header">
          <div>
            <h2>Today at a glance</h2>
            <p className="section-copy">
              {todayLabel} • {formatLongDate(currentLog?.logDate || snapshot.program.startDate)}
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
            <span className="kpi-value">{logs.length}</span>
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
          <h3 className="card-title">Selected day summary</h3>
          {currentLog ? (
            <div className="section-stack">
              <div className="metric-line">
                <span>Pain average</span>
                <strong>
                  {currentPainAvg}/10
                  <DeltaBadge value={delta(currentPainAvg, previousPainAvg)} />
                </strong>
              </div>
              <div className="metric-line">
                <span>Energy</span>
                <strong>
                  {currentLog.energy}/10
                  <DeltaBadge value={delta(currentLog.energy, previousLog?.energy)} />
                </strong>
              </div>
              <div className="metric-line">
                <span>Sleep quality</span>
                <strong>
                  {currentLog.sleepQuality}/10
                  <DeltaBadge value={delta(currentLog.sleepQuality, previousLog?.sleepQuality)} />
                </strong>
              </div>
              <div className="metric-line">
                <span>Oura readiness</span>
                <strong style={{ color: scoreColor(currentOura?.readinessScore ?? currentLog.ouraReadiness) }}>
                  {currentOura?.readinessScore ?? currentLog.ouraReadiness ?? '--'}
                </strong>
              </div>
              <div className="section-copy">{currentLog.notes || 'No note saved for the selected day yet.'}</div>
            </div>
          ) : (
            <p className="section-copy">No day log saved yet for the selected week/day. Start in Daily log.</p>
          )}
        </Card>

        <Card>
          <h3 className="card-title">Previous day</h3>
          {previousLog ? (
            <div className="section-stack">
              <div className="metric-line">
                <span>Oura readiness</span>
                <strong style={{ color: scoreColor(previousOura?.readinessScore ?? previousLog.ouraReadiness) }}>
                  {previousOura?.readinessScore ?? previousLog.ouraReadiness ?? '--'}
                </strong>
              </div>
              <div className="metric-line">
                <span>Sleep score</span>
                <strong style={{ color: scoreColor(previousOura?.sleepScore ?? previousLog.ouraSleepScore) }}>
                  {previousOura?.sleepScore ?? previousLog.ouraSleepScore ?? '--'}
                </strong>
              </div>
              <div className="metric-line">
                <span>HRV</span>
                <strong>{previousOura?.hrv ?? previousLog.ouraHrv ?? '--'}</strong>
              </div>
              <div className="metric-line">
                <span>Pain avg</span>
                <strong>{previousPainAvg}/10</strong>
              </div>
              <div className="metric-line">
                <span>Energy</span>
                <strong>{previousLog.energy}/10</strong>
              </div>
              {previousLog.alcoholUsed ? (
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
            {logs
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
                    <span>Pain {painAverage(log)}</span>
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
              <strong>{logs.length} entries</strong>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
