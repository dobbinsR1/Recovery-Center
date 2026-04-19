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

      <Card>
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

      <div className="grid-two">
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
    </div>
  )
}
