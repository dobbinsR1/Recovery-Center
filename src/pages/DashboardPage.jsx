import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { Tag } from 'primereact/tag'
import { Link } from 'react-router-dom'
import { DAYS, formatLongDate, getDoseForWeek, getPatchCycleDay, getPhaseForWeek } from '../lib/date'
import { useRecoveryData } from '../features/recovery/RecoveryDataContext'

export default function DashboardPage() {
  const { snapshot, loading, activeWeek, activeDay, selectedLog } = useRecoveryData()

  if (loading) {
    return <div className="mono">Loading dashboard snapshot...</div>
  }

  if (!snapshot?.program) {
    return (
      <Card>
        <h2 className="card-title">No active program yet</h2>
        <p className="section-copy">
          Your Supabase project is connected, but there is no active `recovery_programs` row yet. Seed the database
          with <code>supabase/schema.sql</code> and <code>supabase/seed.sql</code> or create the first program in
          Supabase.
        </p>
      </Card>
    )
  }

  const todayLabel = `${DAYS[activeDay]} • Week ${activeWeek}`
  const patchDay = getPatchCycleDay(snapshot.program.patchRenewalDay)
  const phase = getPhaseForWeek(snapshot.program, activeWeek)
  const dose = getDoseForWeek(snapshot.program, activeWeek)
  const lastLog = snapshot.dailyLogs.at(-1)

  return (
    <div className="section-stack">
      <Card className="hero-panel">
        <div className="page-header">
          <div>
            <h2>Today’s recovery posture</h2>
            <p className="section-copy">
              {todayLabel} • {formatLongDate(selectedLog?.logDate || lastLog?.logDate || snapshot.program.startDate)}
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
            <span className="kpi-value">{snapshot.ouraAverages.readiness}</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Supplements tracked</span>
            <span className="kpi-value">{snapshot.supplements.length}</span>
          </div>
        </div>
      </Card>

      <div className="grid-two">
        <Card>
          <h3 className="card-title">Current day summary</h3>
          {selectedLog ? (
            <div className="section-stack">
              <div className="metric-line">
                <span>Pain average</span>
                <strong>{Math.round((selectedLog.jointPain + selectedLog.nervePain) / 2)}/10</strong>
              </div>
              <div className="metric-line">
                <span>Energy</span>
                <strong>{selectedLog.energy}/10</strong>
              </div>
              <div className="metric-line">
                <span>Sleep quality</span>
                <strong>{selectedLog.sleepQuality}/10</strong>
              </div>
              <div className="metric-line">
                <span>Oura readiness</span>
                <strong>{selectedLog.ouraReadiness ?? '--'}</strong>
              </div>
              <div className="section-copy">{selectedLog.notes || 'No note saved for the selected day yet.'}</div>
            </div>
          ) : (
            <p className="section-copy">No day log saved yet for the selected week/day. Start in Daily log.</p>
          )}
        </Card>

        <Card>
          <h3 className="card-title">Move through the app fast</h3>
          <div className="section-stack">
            <Link to="/daily-log">
              <Button label="Open daily log" icon="pi pi-heart" fluid />
            </Link>
            <Link to="/nutrition">
              <Button label="Update nutrition" icon="pi pi-apple" outlined fluid />
            </Link>
            <Link to="/insights">
              <Button label="Review Oura charts" icon="pi pi-chart-line" text fluid />
            </Link>
          </div>
        </Card>
      </div>

      <div className="grid-two">
        <Card>
          <h3 className="card-title">Recent history</h3>
          <div className="section-stack">
            {snapshot.dailyLogs.slice(-4).reverse().map((log) => (
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
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="card-title">Supplement catalog</h3>
          <div className="chip-grid">
            {snapshot.supplements.map((supplement) => (
              <span key={supplement} className="supplement-chip">
                {supplement}
              </span>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
