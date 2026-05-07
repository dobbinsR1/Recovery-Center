import { PrimeReactProvider } from 'primereact/api'
import 'primereact/resources/themes/lara-dark-teal/theme.css'
import 'primereact/resources/primereact.min.css'
import 'primeicons/primeicons.css'
import 'primeflex/primeflex.css'
import { AuthProvider } from '../features/auth/AuthContext'
import { AppToastProvider } from '../features/ui/ToastContext'

export function AppProviders({ children }) {
  return (
    <PrimeReactProvider value={{ ripple: true, inputStyle: 'filled' }}>
      <AppToastProvider>
        <AuthProvider>{children}</AuthProvider>
      </AppToastProvider>
    </PrimeReactProvider>
  )
}
