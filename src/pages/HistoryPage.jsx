import { HistoryList } from '../components/history/HistoryList'
import { useRecoveryData } from '../features/recovery/RecoveryDataContext'

export default function HistoryPage() {
  const { snapshot, loading } = useRecoveryData()

  if (loading) {
    return <div className="mono">Loading history...</div>
  }

  return <HistoryList logs={snapshot.dailyLogs} />
}
