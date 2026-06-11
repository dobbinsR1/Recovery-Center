import { useState } from 'react'
import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { useAuth } from '../features/auth/AuthContext'
import {
  extendProgramTo16Weeks,
  fixWeekNumbers,
  importHistoricalData,
} from '../features/migration/migrationService'
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

const DATA_TOOLS = [
  {
    name: 'import',
    label: 'Import historical data',
    icon: 'pi pi-upload',
    description:
      'Brings in the Mar 3 – Apr 6 Oura data and Week 1 symptom logs from the original protocol. Safe to run multiple times.',
    run: (user) => importHistoricalData(user),
    describe: (result) =>
      `Imported ${result.ouraCount} Oura days, ${result.tagCount} tags, and ${result.logCount} symptom logs. Reload the page to see them.`,
  },
  {
    name: 'extend',
    label: 'Extend to 16 weeks',
    icon: 'pi pi-plus',
    description:
      'Adds weeks 9–16 so you can keep logging past the original window. Existing entries are not touched.',
    run: (user) => extendProgramTo16Weeks(user),
    describe: (result) =>
      result.alreadyExtended
        ? `Program is already ${result.totalWeeks} weeks long — nothing to add.`
        : `Added ${result.added} new weeks — total is now ${result.totalWeeks}. Reload the page to see them.`,
  },
  {
    name: 'fix-weeks',
    label: 'Fix week numbers',
    icon: 'pi pi-sync',
    description:
      "Re-assigns any entries whose week number doesn't match their actual date. Run this if entries appear in the wrong week.",
    run: (user) => fixWeekNumbers(user),
    describe: (result) =>
      result.fixed === 0
        ? 'All entries are already in the correct week.'
        : `Moved ${result.fixed} ${result.fixed === 1 ? 'entry' : 'entries'} to the correct week. Reload the page to see the changes.`,
  },
]

export default function SettingsPage() {
  const { snapshot, loading } = useRecoveryData()
  const { user } = useAuth()
  const [toolStatus, setToolStatus] = useState({ name: null, state: 'idle', message: '' })

  const runTool = async (tool) => {
    setToolStatus({ name: tool.name, state: 'running', message: '' })
    try {
      const result = await tool.run(user)
      setToolStatus({ name: tool.name, state: 'done', message: tool.describe(result) })
    } catch (err) {
      setToolStatus({ name: tool.name, state: 'error', message: err.message ?? 'Unknown error' })
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
            <h2>Settings</h2>
            <p className="section-copy">Export your data and run one-time maintenance tools.</p>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="card-title">Exports</h3>
        <div className="section-stack">
          <p className="section-copy">
            Download a full copy of your recovery data — useful for backups or sharing with your
            care team.
          </p>
          <div className="grid-two">
            <Button label="Export JSON snapshot" icon="pi pi-download" onClick={exportJson} />
            <Button label="Export CSV logs" icon="pi pi-file-export" outlined onClick={exportCsv} />
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="card-title">Data tools</h3>
        <div className="section-stack">
          {DATA_TOOLS.map((tool) => (
            <div key={tool.name} className="metric-line">
              <div>
                <strong>{tool.label}</strong>
                <p className="section-copy">{tool.description}</p>
              </div>
              <Button
                label={toolStatus.name === tool.name && toolStatus.state === 'running' ? 'Running…' : 'Run'}
                icon={
                  toolStatus.name === tool.name && toolStatus.state === 'running'
                    ? 'pi pi-spin pi-spinner'
                    : tool.icon
                }
                outlined
                loading={toolStatus.name === tool.name && toolStatus.state === 'running'}
                disabled={toolStatus.state === 'running' && toolStatus.name !== tool.name}
                onClick={() => runTool(tool)}
              />
            </div>
          ))}

          {toolStatus.state === 'done' ? (
            <p className="section-copy" style={{ color: 'var(--green-500)' }}>
              {toolStatus.message}
            </p>
          ) : null}
          {toolStatus.state === 'error' ? (
            <p className="section-copy" style={{ color: 'var(--red-500)' }}>
              Error: {toolStatus.message}
            </p>
          ) : null}
        </div>
      </Card>
    </div>
  )
}
