import { useEffect, useRef, useState } from 'react'
import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { Skeleton } from 'primereact/skeleton'
import { clearCachedInsight, generateDailyInsight, getCachedInsight, setCachedInsight } from '../../features/insights/aiInsight'

const STATIC_FALLBACKS = [
  'Listen to your body today — rest and good nutrition go a long way in recovery. Stay consistent with your supplements and keep hydration up.',
  'Every day on the protocol is progress. Focus on quality sleep tonight and let your body do its repair work.',
  'Recovery is built in the quiet days too. Prioritize your routine and check in with how you feel after meals.',
]

function getTodayString() {
  return new Date().toISOString().slice(0, 10)
}

export function AIInsightCard({ context }) {
  const [message, setMessage] = useState(() => getCachedInsight(getTodayString()))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const hasApiKey = Boolean(import.meta.env.VITE_ANTHROPIC_API_KEY)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => { isMounted.current = false }
  }, [])

  useEffect(() => {
    if (message || !hasApiKey) return
    generate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function generate() {
    setLoading(true)
    setError(false)
    try {
      const today = getTodayString()
      const text = await generateDailyInsight(context)
      if (!isMounted.current) return
      if (text) {
        setCachedInsight(today, text)
        setMessage(text)
      } else {
        setError(true)
      }
    } catch {
      if (isMounted.current) setError(true)
    } finally {
      if (isMounted.current) setLoading(false)
    }
  }

  function handleRefresh() {
    clearCachedInsight(getTodayString())
    setMessage(null)
    generate()
  }

  const fallback = STATIC_FALLBACKS[new Date().getDay() % STATIC_FALLBACKS.length]
  const displayMessage = message || (error || !hasApiKey ? fallback : null)

  return (
    <Card className="ai-insight-card">
      <div className="ai-insight-header">
        <div className="ai-insight-icon">✦</div>
        <span className="brand-pill">Daily insight</span>
        {hasApiKey ? (
          <Button
            icon="pi pi-refresh"
            text
            rounded
            size="small"
            className="ai-insight-refresh"
            aria-label="Regenerate insight"
            loading={loading}
            onClick={handleRefresh}
          />
        ) : null}
      </div>

      {loading ? (
        <div className="ai-insight-skeleton">
          <Skeleton width="100%" height="1.2rem" borderRadius="8px" />
          <Skeleton width="80%" height="1.2rem" borderRadius="8px" className="mt-2" />
        </div>
      ) : (
        <p className="ai-insight-message">{displayMessage}</p>
      )}
    </Card>
  )
}
