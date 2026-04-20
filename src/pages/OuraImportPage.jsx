import { useRef, useState } from 'react'
import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { Chip } from 'primereact/chip'
import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { Dialog } from 'primereact/dialog'
import { ProgressBar } from 'primereact/progressbar'
import { ProgressSpinner } from 'primereact/progressspinner'
import { Tag } from 'primereact/tag'
import { useAuth } from '../features/auth/AuthContext'
import { saveOuraImportBundle } from '../features/oura-import/data/ouraImportRepository'
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
      stage: 'Finalizing preview tables',
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
  const [activeIndex, setActiveIndex] = useState(0)
  const [saving, setSaving] = useState(false)
  const [expandedCell, setExpandedCell] = useState(null)
  const [dragActive, setDragActive] = useState(false)

  const activeTable = importBundle?.tables?.[activeIndex] ?? null

  const startImport = async (file) => {
    const startedAt = Date.now()

    setImportBundle(null)
    setActiveIndex(0)
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
        `Prepared ${parsedBundle.tableCount} tables and ${parsedBundle.rowCount.toLocaleString()} rows for review.`,
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

  const renderCellBody = (rowData, columnName) => {
    const rawValue = rowData[columnName]

    if (rawValue == null || rawValue === '') {
      return <span className="import-cell-empty">--</span>
    }

    const value = String(rawValue)
    const isLong = value.length > 96 || value.includes('{"') || value.includes('["') || value.includes('1111111111')

    if (!isLong) {
      return (
        <span className="import-cell-value" title={value}>
          {value}
        </span>
      )
    }

    return (
      <div className="import-cell-expandable">
        <span className="import-cell-preview" title={value}>
          {value.slice(0, 88)}...
        </span>
        <Button
          type="button"
          label="See more"
          text
          size="small"
          className="import-cell-button"
          onClick={() =>
            setExpandedCell({
              columnName,
              rowId: rowData.__rowId,
              value,
            })
          }
        />
      </div>
    )
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

  return (
    <div className="section-stack">
      <Card className="hero-panel">
        <div className="page-header">
          <div>
            <h2>Oura zip import</h2>
            <p className="section-copy">
              Upload an Oura export zip, convert every CSV into sortable preview tables, review them one by one, then
              save the batch into Supabase.
            </p>
          </div>
          <Tag value="Zip to tables" severity="info" />
        </div>

        <div className="import-upload-shell mt-4">
          <div className="import-dropzone">
            <div>
              <p className="card-title">Upload a zipped Oura export</p>
              <p className="section-copy">
                The parser will extract all CSV files from the archive and build preview tables.
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
              <Chip label={`${importBundle.tableCount} tables`} className="mono" />
              <Chip label={`${importBundle.rowCount.toLocaleString()} rows`} className="mono" />
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

      {activeTable ? (
        <>
          <Card>
            <div className="page-header">
              <div>
                <h3 className="card-title">Preview carousel</h3>
                <p className="section-copy">
                  Move left or right to inspect each converted CSV table before saving it into Supabase.
                </p>
              </div>

              <div className="import-carousel-controls">
                <Button
                  icon="pi pi-arrow-left"
                  rounded
                  outlined
                  onClick={() => setActiveIndex((index) => Math.max(0, index - 1))}
                  disabled={activeIndex === 0}
                  aria-label="Previous table"
                />
                <Tag value={`${activeIndex + 1} / ${importBundle.tables.length}`} />
                <Button
                  icon="pi pi-arrow-right"
                  rounded
                  outlined
                  onClick={() => setActiveIndex((index) => Math.min(importBundle.tables.length - 1, index + 1))}
                  disabled={activeIndex === importBundle.tables.length - 1}
                  aria-label="Next table"
                />
              </div>
            </div>
          </Card>

          <Card className="import-table-card">
            <div className="page-header">
              <div>
                <h3 className="card-title">{activeTable.tableName}</h3>
                <p className="section-copy">
                  {activeTable.sourceFolder} • {activeTable.rowCount.toLocaleString()} rows • {activeTable.columns.length} columns
                </p>
              </div>

              <div className="chip-grid">
                <Chip label={`${Math.round(activeTable.csvByteSize / 1024)} KB`} className="mono" />
                <Chip label={activeTable.tableSlug} className="mono" />
              </div>
            </div>

            <div className="import-table-frame">
              <DataTable
                value={activeTable.rows}
                dataKey="__rowId"
                paginator
                rows={10}
                rowsPerPageOptions={[10, 25, 50]}
                scrollable
                scrollHeight="flex"
                stripedRows
                removableSort
                size="small"
                className="oura-preview-table"
              >
                {activeTable.columns.map((column) => (
                  <Column
                    key={column}
                    field={column}
                    header={column}
                    sortable
                    body={(rowData) => renderCellBody(rowData, column)}
                    style={{ width: '10rem', minWidth: '10rem', maxWidth: '10rem' }}
                    headerClassName="import-table-header"
                    bodyClassName="import-table-body"
                  />
                ))}
              </DataTable>
            </div>
          </Card>

          <Card>
            <div className="page-header">
              <div>
                <h3 className="card-title">Save import</h3>
                <p className="section-copy">
                  Saving syncs recognized daily metrics and tags into the app’s existing Oura tables. The raw preview
                  tables stay in the browser for review only.
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
        <Card className="import-empty-card">
          <div className="section-stack">
            <h3 className="card-title">No import loaded yet</h3>
            <p className="section-copy">
              Select an Oura zip export to generate preview tables. The converted tables will appear here in a
              left-right carousel with sortable columns.
            </p>
          </div>
        </Card>
      )}

      <Dialog
        header={expandedCell ? `Full value • ${expandedCell.columnName}` : 'Full value'}
        visible={Boolean(expandedCell)}
        style={{ width: 'min(72rem, 92vw)' }}
        breakpoints={{ '960px': '94vw' }}
        onHide={() => setExpandedCell(null)}
      >
        <pre className="import-cell-dialog">{expandedCell?.value}</pre>
      </Dialog>
    </div>
  )
}
