import { OuraCharts } from '../components/charts/OuraCharts'
import { useRecoveryData } from '../features/recovery/RecoveryDataContext'

export default function InsightsPage() {
  const { snapshot, loading } = useRecoveryData()

  if (loading) {
    return <div className="mono">Loading insights...</div>
  }

  return <OuraCharts metrics={snapshot.ouraMetrics} averages={snapshot.ouraAverages} />
}
