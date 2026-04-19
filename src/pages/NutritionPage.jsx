import { useState } from 'react'
import { Message } from 'primereact/message'
import { WeekDayPicker } from '../components/dashboard/WeekDayPicker'
import { NutritionForm } from '../components/forms/NutritionForm'
import { useRecoveryData } from '../features/recovery/RecoveryDataContext'

export default function NutritionPage() {
  const {
    snapshot,
    loading,
    activeWeek,
    activeDay,
    setActiveWeek,
    setActiveDay,
    selectedLog,
    saveLog,
    createSupplement,
  } = useRecoveryData()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  if (loading) {
    return <div className="mono">Loading nutrition view...</div>
  }

  return (
    <div className="section-stack">
      {saved ? <Message severity="success" text="Nutrition saved." /> : null}

      <WeekDayPicker
        program={snapshot.program}
        activeWeek={activeWeek}
        activeDay={activeDay}
        setActiveWeek={setActiveWeek}
        setActiveDay={setActiveDay}
        logMap={snapshot.logMap}
      />

      <NutritionForm
        selectedLog={selectedLog}
        supplementCatalog={snapshot.supplements}
        activeWeek={activeWeek}
        activeDay={activeDay}
        saving={saving}
        onCreateSupplement={createSupplement}
        onSave={async (draft) => {
          setSaving(true)
          setSaved(false)

          try {
            await saveLog(draft)
            setSaved(true)
          } finally {
            setSaving(false)
          }
        }}
      />
    </div>
  )
}
