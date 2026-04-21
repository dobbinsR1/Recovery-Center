import { PrimeReactProvider } from 'primereact/api'
import 'primereact/resources/themes/lara-dark-teal/theme.css'
import 'primereact/resources/primereact.min.css'
import 'primeicons/primeicons.css'
import 'primeflex/primeflex.css'
import { AuthProvider } from '../features/auth/AuthContext'

export function AppProviders({ children }) {
  return (
    <PrimeReactProvider value={{ ripple: true, inputStyle: 'filled' }}>
      <AuthProvider>{children}</AuthProvider>
    </PrimeReactProvider>
  )
}
