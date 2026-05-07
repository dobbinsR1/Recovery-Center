import { memo, useEffect, useMemo, useState } from 'react'
import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { InputTextarea } from 'primereact/inputtextarea'
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

const METRIC_ROWS = [
  ['Joint pain', 'jointPain', '#d56c47'],
  ['Nerve pain', 'nervePain', '#d3a63f'],
  ['Energy', 'energy', '#4ade80'],
  ['Sleep quality', 'sleepQuality', '#60a5fa'],
  ['Afternoon crash', 'afternoonCrash', '#fb923c'],
  ['Tingling / numbness', 'tinglingNumbness', '#c084fc'],
  ['Brain fog', 'brainFog', '#7a94aa'],
  ['Fatigue', 'fatigue', '#94a3b8'],
  ['Muscle weakness', 'muscleWeakness', '#fde047'],
  ['Burning pain', 'burningPain', '#f87171'],
]

const SliderRow = memo(function SliderRow({ label, field, color, value, onChange }) {
  const pct = `${((value - 1) / 9) * 100}%`
  return (
    <div className="log-slider-row">
      <div className="metric-line">
        <strong>{label}</strong>
        <span className="mono" style={{ color, fontVariantNumeric: 'tabular-nums' }}>
          {value}/10
        </span>
      </div>
      <input
        type="range"
        className="rc-slider"
        style={{ '--slider-color': color, '--slider-pct': pct }}
        min={1}
        max={10}
        value={value}
        onChange={onChange}
      />
    </div>
  )
})

export function DailyLogForm({ program, activeWeek, activeDay, selectedLog, onSave, saving }) {
  const [form, setForm] = useState(DEFAULT_FORM)

  useEffect(() => {
    setForm({ ...DEFAULT_FORM, ...selectedLog })
  }, [selectedLog])

  const logDate = selectedLog?.logDate || deriveLogDate(program, activeWeek, activeDay)
  const patchCycleDay = selectedLog?.patchCycleDay || getPatchCycleDay(program?.patchRenewalDay, logDate)

  // One stable handler per field — setForm is stable so these never change.
  const handlers = useMemo(
    () =>
      Object.fromEntries(
        METRIC_ROWS.map(([, field]) => [
          field,
          (event) => setForm((current) => ({ ...current, [field]: Number(event.target.value) })),
        ]),
      ),
    [],
  )

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
            <p className="section-copy">Use the 1–10 scale to capture how the day actually landed.</p>
          </div>

          {METRIC_ROWS.map(([label, field, color]) => (
            <SliderRow
              key={field}
              label={label}
              field={field}
              color={color}
              value={form[field]}
              onChange={handlers[field]}
            />
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
      </Card>
    </div>
  )
}
