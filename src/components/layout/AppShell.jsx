import { Button } from 'primereact/button'
import { Chip } from 'primereact/chip'
import { Skeleton } from 'primereact/skeleton'
import { NavLink, useLocation } from 'react-router-dom'
import { getDoseForWeek, getPatchCycleDay, getPhaseForWeek } from '../../lib/date'
import { useAuth } from '../../features/auth/AuthContext'
import { useRecoveryData } from '../../features/recovery/RecoveryDataContext'

const NAV_ITEMS = [
  { to: '/', icon: 'pi pi-home', label: 'Overview', short: '01' },
  { to: '/daily-log', icon: 'pi pi-heart', label: 'Daily log', short: '02' },
  { to: '/nutrition', icon: 'pi pi-apple', label: 'Nutrition', short: '03' },
  { to: '/insights', icon: 'pi pi-chart-line', label: 'Insights', short: '04' },
  { to: '/history', icon: 'pi pi-clock', label: 'History', short: '05' },
  { to: '/settings', icon: 'pi pi-cog', label: 'Settings', short: '06' },
]

export function AppShell({ children }) {
  const { user, signOutCurrentUser } = useAuth()
  const { snapshot, loading, activeWeek } = useRecoveryData()
  const location = useLocation()

  const phaseLabel = getPhaseForWeek(snapshot?.program, activeWeek)
  const dose = getDoseForWeek(snapshot?.program, activeWeek)
  const patchDay = snapshot?.program ? getPatchCycleDay(snapshot.program.patchRenewalDay) : 1

  return (
    <div className="app-shell">
      <div className="app-layout">
        <aside className="app-sidebar">
          <div className="brand-lockup">
            <span className="brand-pill">Recovery Center</span>
            <div>
              <h1 className="brand-title">Track the protocol with context.</h1>
              <p className="brand-copy">
                Daily symptoms, weekly movement, nutrition, and Oura trends in one workspace.
              </p>
            </div>
          </div>

          <nav className="sidebar-nav">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === '/'} className="sidebar-link">
                <span>
                  <i className={`${item.icon} mr-2`} />
                  {item.label}
                </span>
                <span>{item.short}</span>
              </NavLink>
            ))}
          </nav>

          <div className="support-panel">
            <div>
              <p className="brand-pill">Supabase live</p>
              <p className="support-copy">Connected to your auth session and recovery tracking tables.</p>
            </div>
            <div>
              <strong>{user?.email}</strong>
            </div>
            <Button label="Sign out" text onClick={signOutCurrentUser} />
          </div>
        </aside>

        <main className="app-main">
          <header className="topbar">
            <div>
              <h1>{loading ? 'Loading dashboard...' : snapshot?.program?.name || 'Recovery Center'}</h1>
              <div className="topbar-meta">
                {loading ? (
                  <Skeleton width="12rem" height="2rem" borderRadius="999px" />
                ) : (
                  <>
                    <Chip
                      label={`${phaseLabel}${dose ? ` • ${dose}mg` : ''}`}
                      className="mono"
                    />
                    <Chip label={`Patch day ${patchDay} / 7`} className="mono" />
                    <Chip label={location.pathname === '/' ? 'Dashboard' : location.pathname.slice(1).replace('-', ' ')} className="mono" />
                  </>
                )}
              </div>
            </div>

            <div className="mobile-page-actions">
              <Button icon="pi pi-sign-out" rounded text aria-label="Sign out" onClick={signOutCurrentUser} />
            </div>
          </header>

          {children || <Outlet />}
        </main>
      </div>

      <nav className="mobile-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'}>
            <i className={item.icon} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
