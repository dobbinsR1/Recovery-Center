import { Card } from 'primereact/card'
import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { Tag } from 'primereact/tag'
import { DAYS, formatShortDate } from '../../lib/date'

function historyRow(log) {
  const pain = Math.round((log.jointPain + log.nervePain) / 2)
  const neuro = Math.round(
    (log.tinglingNumbness + log.brainFog + log.fatigue + log.muscleWeakness + log.burningPain) / 5,
  )

  return {
    ...log,
    dayLabel: `${DAYS[log.dayOfWeek]} • Week ${log.weekNumber}`,
    pain,
    neuro,
  }
}

export function HistoryList({ logs }) {
  const rows = logs.map(historyRow).slice().reverse()
  const latestRow = rows[0] ?? null

  return (
    <div className="section-stack">
      <Card>
        <div className="page-header">
          <div>
            <h2>History</h2>
            <p className="section-copy">Review logged entries with symptoms, Oura context, and nutrition notes in one table.</p>
          </div>
          <Tag value={`${rows.length} entries`} />
        </div>
      </Card>

      <Card className="history-mobile-summary">
        <div className="section-stack">
          <div className="metric-line">
            <span className="kpi-label">Latest entry</span>
            <strong>{latestRow ? formatShortDate(latestRow.logDate) : 'No entries yet'}</strong>
          </div>
          {latestRow ? (
            <>
              <div className="metric-line">
                <span>{latestRow.dayLabel}</span>
                <Tag value={latestRow.alcoholUsed ? 'Alcohol logged' : 'No alcohol'} severity={latestRow.alcoholUsed ? 'danger' : 'success'} />
              </div>
              <div className="history-mobile-stat-grid">
                <div className="history-mobile-stat">
                  <span>Pain</span>
                  <strong>{latestRow.pain}</strong>
                </div>
                <div className="history-mobile-stat">
                  <span>Neuro</span>
                  <strong>{latestRow.neuro}</strong>
                </div>
                <div className="history-mobile-stat">
                  <span>Energy</span>
                  <strong>{latestRow.energy}</strong>
                </div>
                <div className="history-mobile-stat">
                  <span>Sleep</span>
                  <strong>{latestRow.sleepQuality}</strong>
                </div>
              </div>
            </>
          ) : (
            <p className="section-copy">Daily check-ins will show up here once logging starts.</p>
          )}
        </div>
      </Card>

      <Card className="history-table-shell">
        <DataTable value={rows} paginator rows={8} responsiveLayout="scroll" stripedRows>
          <Column field="dayLabel" header="Day" />
          <Column header="Date" body={(row) => formatShortDate(row.logDate)} />
          <Column field="pain" header="Pain" />
          <Column field="neuro" header="Neuro" />
          <Column field="energy" header="Energy" />
          <Column field="sleepQuality" header="Sleep" />
          <Column field="ouraReadiness" header="Oura" />
          <Column header="Alcohol" body={(row) => (row.alcoholUsed ? 'Yes' : 'No')} />
        </DataTable>
      </Card>

      <div className="grid-two history-desktop-grid">
        {rows.slice(0, 6).map((row) => (
          <div key={row.id} className="history-card">
            <div className="metric-line">
              <strong>{row.dayLabel}</strong>
              <span className="mono">{formatShortDate(row.logDate)}</span>
            </div>
            <div className="metric-line">
              <span>Pain {row.pain}</span>
              <span>Neuro {row.neuro}</span>
              <span>Energy {row.energy}</span>
            </div>
            <div className="section-copy">
              {row.notes || 'No notes saved for this day.'}
            </div>
          </div>
        ))}
      </div>

      <div className="history-mobile-list">
        {rows.map((row) => (
          <article key={row.id} className="history-mobile-card">
            <div className="history-mobile-card-header">
              <div>
                <strong>{formatShortDate(row.logDate)}</strong>
                <div className="history-mobile-card-subtitle">{row.dayLabel}</div>
              </div>
              <div className="history-mobile-chip-group">
                <Tag value={row.alcoholUsed ? 'Alcohol' : 'Clear'} severity={row.alcoholUsed ? 'danger' : 'success'} />
                {row.ouraReadiness != null ? <Tag value={`Oura ${row.ouraReadiness}`} severity="info" /> : null}
              </div>
            </div>

            <div className="history-mobile-stat-grid">
              <div className="history-mobile-stat">
                <span>Pain</span>
                <strong>{row.pain}</strong>
              </div>
              <div className="history-mobile-stat">
                <span>Neuro</span>
                <strong>{row.neuro}</strong>
              </div>
              <div className="history-mobile-stat">
                <span>Energy</span>
                <strong>{row.energy}</strong>
              </div>
              <div className="history-mobile-stat">
                <span>Sleep</span>
                <strong>{row.sleepQuality}</strong>
              </div>
            </div>

            {row.supplements?.length ? (
              <div className="history-mobile-chip-group">
                {row.supplements.slice(0, 3).map((supplement) => (
                  <Tag key={`${row.id}-${supplement}`} value={supplement} severity="contrast" />
                ))}
                {row.supplements.length > 3 ? <Tag value={`+${row.supplements.length - 3} more`} severity="secondary" /> : null}
              </div>
            ) : null}

            {row.notes ? (
              <div className="history-mobile-block">
                <span className="kpi-label">Notes</span>
                <p>{row.notes}</p>
              </div>
            ) : null}

            {row.meals ? (
              <div className="history-mobile-block">
                <span className="kpi-label">Meals</span>
                <p>{row.meals}</p>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  )
}
