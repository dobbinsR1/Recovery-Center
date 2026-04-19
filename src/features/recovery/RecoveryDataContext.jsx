import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { average, calculateCalories, getInitialSelection } from '../../lib/date'
import { addSupplement, loadRecoverySnapshot, saveDailyLog } from './data/recoveryRepository'

const RecoveryDataContext = createContext(null)

function normalizeSnapshot(snapshot) {
  const dailyLogs = [...(snapshot.dailyLogs ?? [])]
    .map((log) => ({
      ...log,
      supplements: [...(log.supplements ?? [])].sort(),
      calories: calculateCalories(log),
    }))
    .sort((a, b) => {
      if (a.weekNumber !== b.weekNumber) return a.weekNumber - b.weekNumber
      return a.dayOfWeek - b.dayOfWeek
    })

  const logMap = Object.fromEntries(dailyLogs.map((log) => [`${log.weekNumber}_${log.dayOfWeek}`, log]))
  const ouraMetrics = [...(snapshot.ouraMetrics ?? [])]
  const ouraAverages = {
    readiness: average(ouraMetrics.map((metric) => metric.readinessScore).filter(Boolean)),
    sleep: average(ouraMetrics.map((metric) => metric.sleepScore).filter(Boolean)),
    hrv: average(ouraMetrics.map((metric) => metric.hrv).filter(Boolean)),
    restingHr: average(ouraMetrics.map((metric) => metric.restingHeartRate).filter(Boolean)),
    steps: average(ouraMetrics.map((metric) => metric.steps).filter(Boolean)),
  }

  return {
    ...snapshot,
    dailyLogs,
    logMap,
    ouraMetrics,
    ouraAverages,
    supplements: [...(snapshot.supplements ?? [])].sort(),
  }
}

export function RecoveryDataProvider({ children, user }) {
  const [snapshot, setSnapshot] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeWeek, setActiveWeek] = useState(1)
  const [activeDay, setActiveDay] = useState(new Date().getDay())

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        setLoading(true)
        const nextSnapshot = normalizeSnapshot(await loadRecoverySnapshot(user))
        const selection = getInitialSelection(nextSnapshot.program, nextSnapshot.dailyLogs)

        if (mounted) {
          setSnapshot(nextSnapshot)
          setActiveWeek(selection.week)
          setActiveDay(selection.day)
          setError(null)
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      mounted = false
    }
  }, [user])

  const refresh = async () => {
    const nextSnapshot = normalizeSnapshot(await loadRecoverySnapshot(user))
    setSnapshot(nextSnapshot)
  }

  const selectedLog = snapshot?.logMap?.[`${activeWeek}_${activeDay}`] ?? null

  const value = useMemo(
    () => ({
      snapshot,
      loading,
      error,
      activeWeek,
      activeDay,
      setActiveWeek,
      setActiveDay,
      selectedLog,
      refresh,
      saveLog: async (draft) => {
        await saveDailyLog(user, snapshot, draft)
        await refresh()
      },
      createSupplement: async (name) => {
        await addSupplement(user, name)
        await refresh()
      },
    }),
    [activeDay, activeWeek, error, loading, selectedLog, snapshot, user],
  )

  return <RecoveryDataContext.Provider value={value}>{children}</RecoveryDataContext.Provider>
}

export function useRecoveryData() {
  const value = useContext(RecoveryDataContext)

  if (!value) {
    throw new Error('useRecoveryData must be used within RecoveryDataProvider')
  }

  return value
}
