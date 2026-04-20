import { useEffect, useRef, useState } from 'react'
import { Button } from 'primereact/button'
import { Chip } from 'primereact/chip'
import { Skeleton } from 'primereact/skeleton'
import { NavLink, useLocation } from 'react-router-dom'
import recoveryCenterLogo from '../../assets/recovery_center.png'
import { FullscreenLoader } from '../ui/FullscreenLoader'
import { getDoseForWeek, getPatchCycleDay, getPhaseForWeek } from '../../lib/date'
import { useAuth } from '../../features/auth/AuthContext'
import { HomescreenPrompt } from '../mobile/HomescreenPrompt'
import { useRecoveryData } from '../../features/recovery/RecoveryDataContext'

const DESKTOP_NAV_ITEMS = [
  { to: '/home', icon: 'pi pi-home', label: 'Overview', short: '01' },
  { to: '/daily-log', icon: 'pi pi-heart', label: 'Daily log', short: '02' },
  { to: '/nutrition', icon: 'pi pi-apple', label: 'Nutrition', short: '03' },
  { to: '/insights', icon: 'pi pi-chart-line', label: 'Insights', short: '04' },
  { to: '/oura-import', icon: 'pi pi-upload', label: 'Oura import', short: '05' },
  { to: '/history', icon: 'pi pi-clock', label: 'History', short: '06' },
  { to: '/settings', icon: 'pi pi-cog', label: 'Settings', short: '07' },
]

const MOBILE_NAV_ITEMS = [
  { to: '/home', icon: 'pi pi-home', label: 'Home' },
  { to: '/daily-log', icon: 'pi pi-heart', label: 'Log' },
  { to: '/nutrition', icon: 'pi pi-apple', label: 'Food' },
  { to: '/insights', icon: 'pi pi-chart-line', label: 'Oura' },
  { to: '/history', icon: 'pi pi-clock', label: 'History' },
]

export function AppShell({ children }) {
  const { user, signOutCurrentUser } = useAuth()
  const { snapshot, loading, activeWeek } = useRecoveryData()
  const location = useLocation()
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef(null)
  const displayName = user?.user_metadata?.full_name || 'Aaron Dobbins'
  const displayInitials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

  useEffect(() => {
    function handleDocumentClick(event) {
      if (!profileMenuRef.current?.contains(event.target)) {
        setProfileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleDocumentClick)
    return () => document.removeEventListener('mousedown', handleDocumentClick)
  }, [])

  const phaseLabel = getPhaseForWeek(snapshot?.program, activeWeek)
  const dose = getDoseForWeek(snapshot?.program, activeWeek)
  const patchDay = snapshot?.program ? getPatchCycleDay(snapshot.program.patchRenewalDay) : 1

  return (
    <div className="app-shell">
      {loading ? <FullscreenLoader label="Loading your recovery snapshot…" /> : null}
      <div className="app-layout">
        <aside className="app-sidebar">
          <div className="brand-lockup">
            <img src={recoveryCenterLogo} alt="Recovery Center logo" className="brand-logo" />
            <span className="brand-pill">Recovery Center</span>
            <div>
              <h1 className="brand-title">Track the protocol with context.</h1>
              <p className="brand-copy">
                Daily symptoms, weekly movement, nutrition, and Oura trends in one workspace.
              </p>
            </div>
          </div>

          <nav className="sidebar-nav">
            {DESKTOP_NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === '/home'} className="sidebar-link">
                <span>
                  <i className={`${item.icon} mr-2`} />
                  {item.label}
                </span>
                <span>{item.short}</span>
              </NavLink>
            ))}
          </nav>

          <div className="support-panel">
            <div className="support-panel-header">
              <p className="brand-pill">Supabase live</p>
              <p className="support-copy">Connected to your auth session and recovery tracking tables.</p>
            </div>
            <div className="support-account-card">
              <div className="support-account-avatar">{displayInitials || 'AD'}</div>
              <div className="support-account-copy">
                <strong>{displayName}</strong>
                <span>{user?.email || 'No email available'}</span>
              </div>
            </div>
            <div className="support-panel-actions">
              <Button label="Sign out" text onClick={signOutCurrentUser} />
            </div>
          </div>
        </aside>

        <main className="app-main">
          <header className="topbar">
            <div className="topbar-title-group">
              <h1>{snapshot?.program?.name || 'Recovery Center'}</h1>
              <h2 className="mobile-header-title">Recovery Center</h2>
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
                    <Chip
                      label={location.pathname === '/home' ? 'Dashboard' : location.pathname.slice(1).replace('-', ' ')}
                      className="mono"
                    />
                  </>
                )}
              </div>
            </div>

            <div className="topbar-actions">
              <div className="mobile-profile-menu" ref={profileMenuRef}>
                <button
                  type="button"
                  className={`mobile-profile-badge ${profileMenuOpen ? 'active' : ''}`}
                  aria-label={displayName}
                  aria-expanded={profileMenuOpen}
                  onClick={() => setProfileMenuOpen((open) => !open)}
                >
                  <div className="mobile-profile-avatar">{displayInitials}</div>
                </button>

                {profileMenuOpen ? (
                  <div className="mobile-profile-dropdown">
                    <strong>{displayName}</strong>
                    <NavLink to="/settings" className="mobile-profile-link" onClick={() => setProfileMenuOpen(false)}>
                      Open settings
                    </NavLink>
                  </div>
                ) : null}
              </div>
              <div className="mobile-page-actions">
                <Button
                  icon="pi pi-sign-out"
                  rounded
                  text
                  className="mobile-signout-button"
                  aria-label="Sign out"
                  onClick={signOutCurrentUser}
                />
              </div>
            </div>
          </header>

          {children || <Outlet />}
        </main>
      </div>

      <HomescreenPrompt />

      <nav className="mobile-nav">
        {MOBILE_NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/home'}>
            <i className={item.icon} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
