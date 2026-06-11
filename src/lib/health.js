// Shared health-score helpers so every page colors values the same way.

export function scoreColor(value) {
  if (value == null) return 'inherit'
  if (value >= 80) return '#4ade80'
  if (value >= 60) return '#fbbf24'
  return '#f87171'
}

export function painAverage(log) {
  if (!log) return null
  return Math.round((log.jointPain + log.nervePain) / 2)
}
