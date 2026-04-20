import { useState } from 'react'
import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { useAuth } from '../features/auth/AuthContext'
import { fixWeekNumbers, importHistoricalData } from '../features/migration/migrationService'
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
  const { user } = useAuth()
  const [importStatus, setImportStatus] = useState('idle')
  const [importResult, setImportResult] = useState(null)
  const [importError, setImportError] = useState(null)

  const [fixStatus, setFixStatus] = useState('idle')
  const [fixResult, setFixResult] = useState(null)
  const [fixError, setFixError] = useState(null)

  const runImport = async () => {
    setImportStatus('running')
    setImportResult(null)
    setImportError(null)
    try {
      const result = await importHistoricalData(user)
      setImportResult(result)
      setImportStatus('done')
    } catch (err) {
      setImportError(err.message ?? 'Unknown error')
      setImportStatus('error')
    }
  }

  const runFixWeeks = async () => {
    setFixStatus('running')
    setFixResult(null)
    setFixError(null)
    try {
      const result = await fixWeekNumbers(user)
      setFixResult(result)
      setFixStatus('done')
    } catch (err) {
      setFixError(err.message ?? 'Unknown error')
      setFixStatus('error')
    }
  }

  if (loading) {
    return null
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

      <Card>
        <h3 className="card-title">Import Historical Data</h3>
        <div className="section-stack">
          <p className="section-copy">
            Imports your Mar 3 – Apr 6 Oura data and Week 1 symptom logs from the original protocol,
            and resets the program start date to March 1, 2026. Safe to run multiple times.
          </p>
          <Button
            label={importStatus === 'running' ? 'Importing…' : 'Import historical data'}
            icon={importStatus === 'running' ? 'pi pi-spin pi-spinner' : 'pi pi-upload'}
            loading={importStatus === 'running'}
            onClick={runImport}
          />
          {importStatus === 'done' && importResult && (
            <p className="section-copy" style={{ color: 'var(--green-500)' }}>
              Done — {importResult.ouraCount} Oura days, {importResult.tagCount} tags,{' '}
              {importResult.logCount} symptom logs imported. Reload the page to see updated data.
            </p>
          )}
          {importStatus === 'error' && (
            <p className="section-copy" style={{ color: 'var(--red-500)' }}>
              Error: {importError}
            </p>
          )}
        </div>
      </Card>

      <Card>
        <h3 className="card-title">Fix Week Numbers</h3>
        <div className="section-stack">
          <p className="section-copy">
            Re-assigns any entries whose week number doesn't match their actual date. Run this if
            entries appear in the wrong week after the historical import.
          </p>
          <Button
            label={fixStatus === 'running' ? 'Fixing…' : 'Fix week numbers'}
            icon={fixStatus === 'running' ? 'pi pi-spin pi-spinner' : 'pi pi-sync'}
            loading={fixStatus === 'running'}
            onClick={runFixWeeks}
          />
          {fixStatus === 'done' && fixResult && (
            <p className="section-copy" style={{ color: 'var(--green-500)' }}>
              Done — {fixResult.fixed} {fixResult.fixed === 1 ? 'entry' : 'entries'} moved to the
              correct week. Reload the page to see the changes.
            </p>
          )}
          {fixStatus === 'error' && (
            <p className="section-copy" style={{ color: 'var(--red-500)' }}>
              Error: {fixError}
            </p>
          )}
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
