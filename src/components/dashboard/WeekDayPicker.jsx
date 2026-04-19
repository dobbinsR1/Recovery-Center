import { Card } from 'primereact/card'
import { Tag } from 'primereact/tag'
import { DAYS, getWeekRange } from '../../lib/date'

export function WeekDayPicker({
  program,
  activeWeek,
  activeDay,
  setActiveWeek,
  setActiveDay,
  logMap,
}) {
  return (
    <Card>
      <div className="page-grid">
        <div className="page-header">
          <div>
            <h2>Week and day focus</h2>
            <p className="section-copy">Switch context by protocol week or jump to a specific day entry.</p>
          </div>
          <Tag value={getWeekRange(program, activeWeek) || 'Protocol window'} severity="info" />
        </div>

        <div className="week-strip">
          {Array.from({ length: program?.totalWeeks || 8 }, (_, index) => {
            const weekNumber = index + 1
            const hasLogs = DAYS.some((_, day) => logMap?.[`${weekNumber}_${day}`])

            return (
              <button
                key={weekNumber}
                type="button"
                className={`week-button ${weekNumber === activeWeek ? 'active' : ''}`}
                onClick={() => setActiveWeek(weekNumber)}
              >
                <strong>Week {weekNumber}</strong>
                <div className="mono text-sm mt-1">{hasLogs ? 'saved' : 'open'}</div>
              </button>
            )
          })}
        </div>

        <div className="day-strip">
          {DAYS.map((label, day) => {
            const entry = logMap?.[`${activeWeek}_${day}`]

            return (
              <button
                key={label}
                type="button"
                className={`day-button ${day === activeDay ? 'active' : ''}`}
                onClick={() => setActiveDay(day)}
              >
                <strong>{label}</strong>
                <div className="mono text-xs mt-1">{entry ? 'logged' : 'new'}</div>
              </button>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
