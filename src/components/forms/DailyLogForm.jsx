import { useEffect, useState } from 'react'
import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { InputTextarea } from 'primereact/inputtextarea'
import { Slider } from 'primereact/slider'
import { Tag } from 'primereact/tag'
import { ToggleButton } from 'primereact/togglebutton'
import { DAYS, deriveLogDate, formatLongDate, getPatchCycleDay } from '../../lib/date'

const DEFAULT_FORM = {
  jointPain: 5,
  nervePain: 5,
  energy: 5,
  sleepQuality: 5,
  afternoonCrash: 5,
  tinglingNumbness: 5,
  brainFog: 5,
  fatigue: 5,
  muscleWeakness: 5,
  burningPain: 5,
  alcoholUsed: false,
  notes: '',
}

function metricRows() {
  return [
    ['Joint pain', 'jointPain', '#d56c47'],
    ['Nerve pain', 'nervePain', '#d3a63f'],
    ['Energy', 'energy', '#177e72'],
    ['Sleep quality', 'sleepQuality', '#478bb0'],
    ['Afternoon crash', 'afternoonCrash', '#d88852'],
    ['Tingling / numbness', 'tinglingNumbness', '#a46f4e'],
    ['Brain fog', 'brainFog', '#517a67'],
    ['Fatigue', 'fatigue', '#6b7a61'],
    ['Muscle weakness', 'muscleWeakness', '#8f7766'],
    ['Burning pain', 'burningPain', '#c95a54'],
  ]
}

export function DailyLogForm({ program, activeWeek, activeDay, selectedLog, onSave, saving }) {
  const [form, setForm] = useState(DEFAULT_FORM)

  useEffect(() => {
    setForm({
      ...DEFAULT_FORM,
      ...selectedLog,
    })
  }, [selectedLog])

  const logDate = selectedLog?.logDate || deriveLogDate(program, activeWeek, activeDay)
  const patchCycleDay = selectedLog?.patchCycleDay || getPatchCycleDay(program?.patchRenewalDay, logDate)

  return (
    <div className="section-stack">
      <Card>
        <div className="page-header">
          <div>
            <h2>{DAYS[activeDay]} log</h2>
            <p className="section-copy">{formatLongDate(logDate)} • Patch day {patchCycleDay} of 7</p>
          </div>
          <Tag value={`Week ${activeWeek}`} />
        </div>
      </Card>

      <Card>
        <div className="section-stack">
          <div>
            <h3 className="card-title">Core symptoms and neuro panel</h3>
            <p className="section-copy">Use the 1-10 scale to capture how the day actually landed.</p>
          </div>

          {metricRows().map(([label, field, color]) => (
            <div key={field} className="page-grid">
              <div className="metric-line">
                <strong>{label}</strong>
                <span className="mono" style={{ color }}>
                  {form[field]}/10
                </span>
              </div>
              <Slider
                value={form[field]}
                min={1}
                max={10}
                onChange={(event) => setForm((current) => ({ ...current, [field]: event.value }))}
              />
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="section-stack">
          <div className="metric-line">
            <div>
              <h3 className="card-title">Context notes</h3>
              <p className="section-copy">Flag obvious triggers and leave enough context for week-over-week review.</p>
            </div>
            <ToggleButton
              checked={form.alcoholUsed}
              onChange={(event) => setForm((current) => ({ ...current, alcoholUsed: event.value }))}
              onLabel="Alcohol used"
              offLabel="No alcohol"
              onIcon="pi pi-exclamation-triangle"
              offIcon="pi pi-check"
            />
          </div>

          <InputTextarea
            autoResize
            rows={5}
            value={form.notes}
            onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
            placeholder="Observations, triggers, wins, treatment notes..."
          />

          <div>
            <Button
              label={saving ? 'Saving...' : 'Save day log'}
              icon="pi pi-save"
              loading={saving}
              onClick={() =>
                onSave({
                  ...selectedLog,
                  ...form,
                  weekNumber: activeWeek,
                  dayOfWeek: activeDay,
                  logDate,
                  patchCycleDay,
                })
              }
            />
          </div>
        </div>
      </Card>
    </div>
  )
}
