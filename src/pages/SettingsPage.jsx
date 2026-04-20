import { Card } from 'primereact/card'
import { Button } from 'primereact/button'
import { useRecoveryData } from '../features/recovery/RecoveryDataContext'

function downloadFile(filename, mimeType, content) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export default function SettingsPage() {
  const { snapshot, loading } = useRecoveryData()

  if (loading) {
    return <div className="mono">Loading settings...</div>
  }

  const exportJson = () => {
    downloadFile(
      'recovery-center-export.json',
      'application/json',
      JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          snapshot,
        },
        null,
        2,
      ),
    )
  }

  const exportCsv = () => {
    const header = [
      'week',
      'day_of_week',
      'log_date',
      'joint_pain',
      'nerve_pain',
      'energy',
      'sleep_quality',
      'afternoon_crash',
      'tingling_numbness',
      'brain_fog',
      'fatigue',
      'muscle_weakness',
      'burning_pain',
      'alcohol_used',
      'notes',
    ]

    const rows = snapshot.dailyLogs.map((log) =>
      [
        log.weekNumber,
        log.dayOfWeek,
        log.logDate,
        log.jointPain,
        log.nervePain,
        log.energy,
        log.sleepQuality,
        log.afternoonCrash,
        log.tinglingNumbness,
        log.brainFog,
        log.fatigue,
        log.muscleWeakness,
        log.burningPain,
        log.alcoholUsed ? 'yes' : 'no',
        `"${(log.notes || '').replace(/"/g, '""')}"`,
      ].join(','),
    )

    downloadFile('recovery-center-logs.csv', 'text/csv', [header.join(','), ...rows].join('\n'))
  }

  return (
    <div className="section-stack">
      <Card>
        <div className="page-header">
          <div>
            <h2>Settings and handoff</h2>
            <p className="section-copy">Export recovery data and review the project files behind the live Supabase build.</p>
          </div>
        </div>
      </Card>

      <div className="grid-two">
        <Card>
          <h3 className="card-title">Exports</h3>
          <div className="section-stack">
            <Button label="Export JSON snapshot" icon="pi pi-download" onClick={exportJson} />
            <Button label="Export CSV logs" icon="pi pi-file-export" outlined onClick={exportCsv} />
          </div>
        </Card>

        <Card>
          <h3 className="card-title">Project files</h3>
          <div className="section-stack">
            <p className="footer-note">Schema: <code>supabase/schema.sql</code></p>
            <p className="footer-note">Seed data: <code>supabase/seed.sql</code></p>
            <p className="footer-note">Discovery: <code>docs/recovery-center-discovery.md</code></p>
            <p className="footer-note">Build plan: <code>docs/recovery-center-build-plan.md</code></p>
          </div>
        </Card>
      </div>
    </div>
  )
}
