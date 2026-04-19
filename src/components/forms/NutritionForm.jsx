import { useEffect, useState } from 'react'
import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { Chip } from 'primereact/chip'
import { InputNumber } from 'primereact/inputnumber'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { calculateCalories } from '../../lib/date'

const DEFAULT_FORM = {
  proteinGrams: null,
  carbsGrams: null,
  fatGrams: null,
  waterOz: null,
  meals: '',
  supplements: [],
}

export function NutritionForm({
  selectedLog,
  supplementCatalog,
  onCreateSupplement,
  onSave,
  activeWeek,
  activeDay,
  saving,
}) {
  const [form, setForm] = useState(DEFAULT_FORM)
  const [customSupplement, setCustomSupplement] = useState('')

  useEffect(() => {
    setForm({
      ...DEFAULT_FORM,
      ...selectedLog,
      supplements: [...(selectedLog?.supplements ?? [])],
    })
  }, [selectedLog])

  const calories = calculateCalories(form)

  return (
    <div className="section-stack">
      <Card>
        <div className="page-header">
          <div>
            <h2>Nutrition and supplements</h2>
            <p className="section-copy">Store the day’s fuel next to symptoms so the week has context.</p>
          </div>
          <Chip label={`Week ${activeWeek} • Day ${activeDay + 1}`} className="mono" />
        </div>
      </Card>

      <Card>
        <div className="grid-three">
          <span className="p-float-label">
            <InputNumber
              inputId="protein"
              value={form.proteinGrams}
              onValueChange={(event) => setForm((current) => ({ ...current, proteinGrams: event.value }))}
            />
            <label htmlFor="protein">Protein (g)</label>
          </span>

          <span className="p-float-label">
            <InputNumber
              inputId="carbs"
              value={form.carbsGrams}
              onValueChange={(event) => setForm((current) => ({ ...current, carbsGrams: event.value }))}
            />
            <label htmlFor="carbs">Carbs (g)</label>
          </span>

          <span className="p-float-label">
            <InputNumber
              inputId="fat"
              value={form.fatGrams}
              onValueChange={(event) => setForm((current) => ({ ...current, fatGrams: event.value }))}
            />
            <label htmlFor="fat">Fat (g)</label>
          </span>
        </div>

        <div className="grid-two mt-3">
          <Card className="surface-card border-round-xl shadow-none border-1">
            <p className="kpi-label">Estimated calories</p>
            <p className="kpi-value">{calories || '---'}</p>
          </Card>

          <span className="p-float-label">
            <InputNumber
              inputId="water"
              value={form.waterOz}
              onValueChange={(event) => setForm((current) => ({ ...current, waterOz: event.value }))}
            />
            <label htmlFor="water">Water (oz)</label>
          </span>
        </div>
      </Card>

      <Card>
        <div className="section-stack">
          <div>
            <h3 className="card-title">Meals</h3>
            <p className="section-copy">Keep the meals readable enough that you can spot routines later.</p>
          </div>
          <InputTextarea
            autoResize
            rows={6}
            value={form.meals}
            onChange={(event) => setForm((current) => ({ ...current, meals: event.target.value }))}
            placeholder="Breakfast, lunch, dinner, snacks..."
          />
        </div>
      </Card>

      <Card>
        <div className="section-stack">
          <div className="page-header">
            <div>
              <h3 className="card-title">Supplements taken</h3>
              <p className="section-copy">Catalog stays separate from the selected supplements for this day.</p>
            </div>
          </div>

          <div className="chip-grid">
            {supplementCatalog.map((supplement) => {
              const active = form.supplements.includes(supplement)

              return (
                <button
                  key={supplement}
                  type="button"
                  className={`supplement-chip ${active ? 'active' : ''}`}
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      supplements: active
                        ? current.supplements.filter((item) => item !== supplement)
                        : [...current.supplements, supplement],
                    }))
                  }
                >
                  {supplement}
                </button>
              )
            })}
          </div>

          <div className="grid-two">
            <span className="p-input-icon-left">
              <i className="pi pi-plus" />
              <InputText
                value={customSupplement}
                onChange={(event) => setCustomSupplement(event.target.value)}
                placeholder="Add a custom supplement"
                onKeyDown={async (event) => {
                  if (event.key === 'Enter' && customSupplement.trim()) {
                    await onCreateSupplement(customSupplement)
                    setForm((current) => ({
                      ...current,
                      supplements: current.supplements.includes(customSupplement.trim())
                        ? current.supplements
                        : [...current.supplements, customSupplement.trim()],
                    }))
                    setCustomSupplement('')
                  }
                }}
              />
            </span>

            <Button
              label="Add supplement"
              outlined
              onClick={async () => {
                if (!customSupplement.trim()) return
                await onCreateSupplement(customSupplement)
                setForm((current) => ({
                  ...current,
                  supplements: current.supplements.includes(customSupplement.trim())
                    ? current.supplements
                    : [...current.supplements, customSupplement.trim()],
                }))
                setCustomSupplement('')
              }}
            />
          </div>

          <div>
            <Button
              label={saving ? 'Saving...' : 'Save nutrition'}
              icon="pi pi-save"
              loading={saving}
              onClick={() =>
                onSave({
                  ...selectedLog,
                  ...form,
                  weekNumber: activeWeek,
                  dayOfWeek: activeDay,
                })
              }
            />
          </div>
        </div>
      </Card>
    </div>
  )
}
