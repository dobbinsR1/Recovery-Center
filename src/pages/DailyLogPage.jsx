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
    return null
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
        key={`${activeWeek}-${activeDay}-${selectedLog?.id ?? 'new'}`}
        program={snapshot.program}
        activeWeek={activeWeek}
        activeDay={activeDay}
        selectedLog={selectedLog}
        saving={saving}
        onSave={async (draft) => {
          setSaving(true)

          try {
            await saveLog(draft)
            showSuccess('Day log saved', 'Your daily check-in is saved.')
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
