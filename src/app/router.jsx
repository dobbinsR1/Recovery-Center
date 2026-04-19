import { BrowserRouter, HashRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { useAuth } from '../features/auth/AuthContext'
import { RecoveryDataProvider } from '../features/recovery/RecoveryDataContext'
import DashboardPage from '../pages/DashboardPage'
import DailyLogPage from '../pages/DailyLogPage'
import HistoryPage from '../pages/HistoryPage'
import InsightsPage from '../pages/InsightsPage'
import LoginPage from '../pages/LoginPage'
import NutritionPage from '../pages/NutritionPage'
import SettingsPage from '../pages/SettingsPage'

function ProtectedApp() {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="p-5 mono">Loading Recovery Center...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <RecoveryDataProvider user={user}>
      <AppShell>
        <Outlet />
      </AppShell>
    </RecoveryDataProvider>
  )
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="p-5 mono">Checking session...</div>
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return children
}

export function AppRouter() {
  const RouterComponent = import.meta.env.VITE_GITHUB_PAGES === 'true' ? HashRouter : BrowserRouter

  return (
    <RouterComponent>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicOnly>
              <LoginPage />
            </PublicOnly>
          }
        />

        <Route path="/" element={<ProtectedApp />}>
          <Route index element={<DashboardPage />} />
          <Route path="daily-log" element={<DailyLogPage />} />
          <Route path="nutrition" element={<NutritionPage />} />
          <Route path="insights" element={<InsightsPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </RouterComponent>
  )
}
