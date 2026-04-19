export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export function formatLongDate(dateString) {
  if (!dateString) return 'No calendar date yet'
  const date = new Date(`${dateString}T12:00:00`)

  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatShortDate(dateString) {
  if (!dateString) return 'Pending'
  const date = new Date(`${dateString}T12:00:00`)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function getPatchCycleDay(renewalDay = 4, dateInput = new Date()) {
  const date = typeof dateInput === 'string' ? new Date(`${dateInput}T12:00:00`) : dateInput
  return ((date.getDay() - renewalDay + 7) % 7) + 1
}

export function deriveLogDate(program, weekNumber, dayOfWeek) {
  if (!program?.startDate) return null

  const start = new Date(`${program.startDate}T12:00:00`)
  start.setDate(start.getDate() + (weekNumber - 1) * 7 + dayOfWeek)

  return start.toISOString().slice(0, 10)
}

export function getPhaseForWeek(program, weekNumber) {
  if (!program) return 'Protocol'
  return weekNumber >= program.phaseTwoStartWeek ? 'Phase 2' : 'Phase 1'
}

export function getDoseForWeek(program, weekNumber) {
  if (!program) return null
  return weekNumber >= program.phaseTwoStartWeek ? program.phaseTwoDoseMg : program.phaseOneDoseMg
}

export function getWeekRange(program, weekNumber) {
  if (!program?.startDate) return ''

  const start = new Date(`${program.startDate}T12:00:00`)
  start.setDate(start.getDate() + (weekNumber - 1) * 7)

  const end = new Date(start)
  end.setDate(end.getDate() + 6)

  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
}

export function getInitialSelection(program, logs) {
  if (program?.startDate) {
    const today = new Date()
    const start = new Date(`${program.startDate}T12:00:00`)
    const diffDays = Math.floor((today.getTime() - start.getTime()) / 86400000)
    const week = clamp(Math.floor(diffDays / 7) + 1, 1, program.totalWeeks || 8)
    const day = clamp(today.getDay(), 0, 6)
    return { week, day }
  }

  if (logs.length > 0) {
    const latest = [...logs].sort((a, b) => {
      if (a.weekNumber !== b.weekNumber) return b.weekNumber - a.weekNumber
      return b.dayOfWeek - a.dayOfWeek
    })[0]

    return { week: latest.weekNumber, day: latest.dayOfWeek }
  }

  return { week: 1, day: new Date().getDay() }
}

export function average(values) {
  if (!values.length) return 0
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
}

export function calculateCalories({ proteinGrams, carbsGrams, fatGrams }) {
  return (Number(proteinGrams) || 0) * 4 + (Number(carbsGrams) || 0) * 4 + (Number(fatGrams) || 0) * 9
}
