import { useState } from 'react'
import { WeekDayPicker } from '../components/dashboard/WeekDayPicker'
import { DailyLogForm } from '../components/forms/DailyLogForm'
import { useRecoveryData } from '../features/recovery/RecoveryDataContext'
import { useAppToast } from '../features/ui/ToastContext'

export default function DailyLogPage() {
  const {
    snapshot,
    loading,
    activeWeek,
    activeDay,
    setActiveWeek,
    setActiveDay,
    selectedLog,
    saveLog,
  } = useRecoveryData()
  const { showError, showSuccess } = useAppToast()
  const [saving, setSaving] = useState(false)

  if (loading) {
    return <div className="mono">Loading daily log...</div>
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

      <DailyLogForm
        program={snapshot.program}
        activeWeek={activeWeek}
        activeDay={activeDay}
        selectedLog={selectedLog}
        saving={saving}
        onSave={async (draft) => {
          setSaving(true)

          try {
            await saveLog(draft)
            showSuccess(
              'Day log saved',
              'The daily tracking record was updated in Supabase.',
            )
          } catch (error) {
            showError('Save failed', error.message || 'The daily log could not be updated.')
          } finally {
            setSaving(false)
          }
        }}
      />
    </div>
  )
}
