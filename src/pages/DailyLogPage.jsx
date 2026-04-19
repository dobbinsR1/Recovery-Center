import { useState } from 'react'
import { Message } from 'primereact/message'
import { WeekDayPicker } from '../components/dashboard/WeekDayPicker'
import { DailyLogForm } from '../components/forms/DailyLogForm'
import { useRecoveryData } from '../features/recovery/RecoveryDataContext'

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
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  if (loading) {
    return <div className="mono">Loading daily log...</div>
  }

  return (
    <div className="section-stack">
      {saved ? <Message severity="success" text="Day log saved." /> : null}

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
