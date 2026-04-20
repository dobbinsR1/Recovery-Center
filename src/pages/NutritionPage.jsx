import { useState } from 'react'
import { WeekDayPicker } from '../components/dashboard/WeekDayPicker'
import { NutritionForm } from '../components/forms/NutritionForm'
import { useRecoveryData } from '../features/recovery/RecoveryDataContext'
import { useAppToast } from '../features/ui/ToastContext'

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
  const { showError, showSuccess } = useAppToast()
  const [saving, setSaving] = useState(false)

  if (loading) {
    return <div className="mono">Loading nutrition view...</div>
  }

  return (
    <div className="section-stack">
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
        onCreateSupplement={async (name) => {
          try {
            await createSupplement(name)
            showSuccess(
              'Supplement added',
              'The supplement catalog was updated in Supabase.',
            )
            return true
          } catch (error) {
            showError('Could not add supplement', error.message || 'The supplement could not be saved.')
            return false
          }
        }}
        onSave={async (draft) => {
          setSaving(true)

          try {
            await saveLog(draft)
            showSuccess(
              'Nutrition saved',
              'Nutrition and supplements were updated in Supabase.',
            )
          } catch (error) {
            showError('Save failed', error.message || 'Nutrition could not be updated.')
          } finally {
            setSaving(false)
          }
        }}
      />
    </div>
  )
}
