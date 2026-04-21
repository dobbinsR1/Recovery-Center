import { useRef, useState } from 'react'
import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { Chip } from 'primereact/chip'
import { ProgressBar } from 'primereact/progressbar'
import { ProgressSpinner } from 'primereact/progressspinner'
import { Tag } from 'primereact/tag'
import { OuraCharts } from '../components/charts/OuraCharts'
import { useAuth } from '../features/auth/AuthContext'
import { saveOuraImportBundle } from '../features/oura-import/data/ouraImportRepository'
import { buildPreviewMetrics } from '../features/oura-import/lib/ouraImportTransforms'
import { parseOuraZip } from '../features/oura-import/services/ouraZipService'
import { useRecoveryData } from '../features/recovery/RecoveryDataContext'
import { useAppToast } from '../features/ui/ToastContext'

const MIN_IMPORT_PROGRESS_MS = 5000

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

async function finishProgressCountdown(startedAt, setParseState) {
  const elapsed = Date.now() - startedAt
  const remaining = Math.max(0, MIN_IMPORT_PROGRESS_MS - elapsed)

  if (remaining <= 0) {
    setParseState((current) => ({
      ...current,
      percent: 100,
      stage: 'Conversion complete',
    }))
    return
  }

  const tickMs = 100
  const steps = Math.max(1, Math.ceil(remaining / tickMs))

  for (let step = 1; step <= steps; step += 1) {
    await wait(Math.min(tickMs, remaining))

    setParseState((current) => ({
      ...current,
      percent: Math.min(100, Math.max(current.percent, Math.round(94 + ((6 * step) / steps)))),
      stage: 'Finalizing charts',
    }))
  }
}

export default function OuraImportPage() {
  const { user } = useAuth()
  const { refresh } = useRecoveryData()
  const { showError, showSuccess } = useAppToast()
  const inputRef = useRef(null)
  const [parseState, setParseState] = useState({
    parsing: false,
    percent: 0,
    stage: '',
    currentFileName: '',
    processedTables: 0,
    totalTables: 0,
  })
  const [importBundle, setImportBundle] = useState(null)
  const [saving, setSaving] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const startImport = async (file) => {
    const startedAt = Date.now()

    setImportBundle(null)
    setParseState({
      parsing: true,
      percent: 0,
      stage: 'Preparing upload',
      currentFileName: file.name,
      processedTables: 0,
      totalTables: 0,
    })

    try {
      const parsedBundle = await parseOuraZip(file, (progress) => {
        setParseState((current) => ({
          ...current,
          ...progress,
          percent: Math.min(progress.percent ?? current.percent, 94),
          parsing: true,
        }))
      })

      await finishProgressCountdown(startedAt, setParseState)
      setImportBundle(parsedBundle)
      setParseState((current) => ({
        ...current,
        parsing: false,
        percent: 100,
      }))
      showSuccess(
        'Oura export converted',
        `Ready to preview — ${parsedBundle.derivedMetricCount} metric days and ${parsedBundle.derivedTagCount} tags.`,
        3800,
      )
    } catch (error) {
      setParseState({
        parsing: false,
        percent: 0,
        stage: '',
        currentFileName: '',
        processedTables: 0,
        totalTables: 0,
      })
      showError('Conversion failed', error.message || 'The zip file could not be converted.')
    }
  }

  const handleFileSelection = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    await startImport(file)
    event.target.value = ''
  }

  const handleSave = async () => {
    if (!importBundle) return

    setSaving(true)

    try {
      const result = await saveOuraImportBundle(user, importBundle)
      await refresh()
      showSuccess(
        'Import saved',
        `Synced ${result.derivedMetricCount} Oura metric days and ${result.derivedTagCount} tags into Supabase.`,
        4200,
      )
    } catch (error) {
      showError('Save failed', error.message || 'The converted tables could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  const previewData = importBundle ? buildPreviewMetrics(importBundle.tables) : null

  return (
    <div className="section-stack">
      <Card className="hero-panel">
        <div className="page-header">
          <div>
            <h2>Oura zip import</h2>
            <p className="section-copy">
              Upload an Oura export zip to instantly preview your readiness, sleep, HRV, steps, and
              tag data as charts, then save the batch into Supabase.
            </p>
          </div>
          <Tag value="Zip to charts" severity="info" />
        </div>

        <div className="import-upload-shell mt-4">
          <div className="import-dropzone">
            <div>
              <p className="card-title">Upload a zipped Oura export</p>
              <p className="section-copy">
                The parser extracts all CSV files and builds interactive charts from your data.
              </p>
              <p className="section-copy import-dropzone-hint">
                Desktop: drag and drop the Oura zip here or choose the file manually.
              </p>
            </div>

            <div
              className={`import-dropzone-actions import-dropzone-target ${dragActive ? 'drag-active' : ''}`}
              onDragEnter={(event) => {
                if (window.matchMedia('(max-width: 1120px)').matches) return
                event.preventDefault()
                setDragActive(true)
              }}
              onDragOver={(event) => {
                if (window.matchMedia('(max-width: 1120px)').matches) return
                event.preventDefault()
                event.dataTransfer.dropEffect = 'copy'
                setDragActive(true)
              }}
              onDragLeave={(event) => {
                if (window.matchMedia('(max-width: 1120px)').matches) return
                event.preventDefault()
                if (event.currentTarget.contains(event.relatedTarget)) return
                setDragActive(false)
              }}
              onDrop={async (event) => {
                if (window.matchMedia('(max-width: 1120px)').matches) return
                event.preventDefault()
                setDragActive(false)

                const [file] = [...event.dataTransfer.files]
                if (!file) return
                if (!file.name.toLowerCase().endsWith('.zip')) {
                  showError('Invalid file', 'Drop an Oura zip export file.')
                  return
                }

                await startImport(file)
              }}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".zip,application/zip"
                className="import-file-input"
                onChange={handleFileSelection}
              />
              <div className="import-dropzone-copy">
                <i className="pi pi-download import-dropzone-icon" />
                <span>{dragActive ? 'Drop the zip to upload' : 'Drag zip here'}</span>
              </div>
              <Button
                label="Choose zip"
                icon="pi pi-upload"
                onClick={() => inputRef.current?.click()}
                disabled={parseState.parsing}
              />
            </div>
          </div>

          {importBundle ? (
            <div className="chip-grid">
              <Chip label={importBundle.fileName} className="mono" />
              <Chip label={`${importBundle.derivedMetricCount} metric days`} className="mono" />
              <Chip label={`${importBundle.derivedTagCount} tags`} className="mono" />
            </div>
          ) : null}
        </div>
      </Card>

      {parseState.parsing ? (
        <Card className="import-progress-card">
          <div className="import-progress-shell">
            <div className="import-progress-visual">
              <ProgressSpinner strokeWidth="5" animationDuration=".9s" />
              <strong className="import-progress-value">{parseState.percent}%</strong>
            </div>

            <div className="section-stack">
              <div>
                <h3 className="card-title">{parseState.stage || 'Converting export'}</h3>
                <p className="section-copy">
                  {parseState.currentFileName || 'Reading zip archive'}
                  {parseState.totalTables
                    ? ` • ${parseState.processedTables}/${parseState.totalTables} tables`
                    : ''}
                </p>
              </div>
              <ProgressBar value={parseState.percent} showValue={false} />
            </div>
          </div>
        </Card>
      ) : null}

      {previewData ? (
        <>
          <OuraCharts metrics={previewData.metrics} averages={previewData.averages} />

          <Card>
            <div className="page-header">
              <div>
                <h3 className="card-title">Save import</h3>
                <p className="section-copy">
                  Saving syncs the metrics and tags shown above into Supabase. The Insights page
                  will update automatically.
                </p>
              </div>
              <Button
                label={saving ? 'Saving import...' : 'Save import to Supabase'}
                icon="pi pi-save"
                onClick={handleSave}
                loading={saving}
              />
            </div>
          </Card>
        </>
      ) : (
        !parseState.parsing && (
          <Card className="import-empty-card">
            <div className="section-stack">
              <h3 className="card-title">No import loaded yet</h3>
              <p className="section-copy">
                Upload an Oura zip export to preview your readiness, sleep, HRV, steps, and tag
                data as charts before saving to Supabase.
              </p>
            </div>
          </Card>
        )
      )}
    </div>
  )
}
