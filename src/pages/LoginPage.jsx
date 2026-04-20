import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { InputText } from 'primereact/inputtext'
import { Password } from 'primereact/password'
import recoveryCenterLogo from '../assets/recovery_center.png'
import { useAuth } from '../features/auth/AuthContext'
import { useAppToast } from '../features/ui/ToastContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const { isSupabaseConfigured, signInWithPassword } = useAuth()
  const { showError, showSuccess } = useAppToast()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)

    try {
      await signInWithPassword({ identifier, password })
      showSuccess('Signed in', 'Login validation succeeded.')
      navigate('/home', { replace: true })
    } catch (submitError) {
      showError('Login failed', submitError.message || 'Unable to sign in.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-shell">
      <section className="login-hero">
        <img src={recoveryCenterLogo} alt="Recovery Center logo" className="login-logo" />
        <span className="brand-pill">Recovery Center</span>
        <div>
          <h1 className="brand-title" style={{ fontSize: 'clamp(2.8rem, 6vw, 5rem)', lineHeight: 0.94 }}>
            your day your data in one spot
          </h1>
          <p className="brand-copy" style={{ fontSize: '1.05rem', maxWidth: 560, marginTop: '1rem' }}>
            Track the protocol week by week, store every day inside that week, and keep symptoms,
            nutrition, supplements, and Oura context in the same system.
          </p>
        </div>

        <div className="login-points">
          <div className="login-point">
            <i className="pi pi-table text-xl" />
            <div>
              <strong>Weekly structure</strong>
              <span className="section-copy">Every record is anchored to both a real date and a protocol week/day.</span>
            </div>
          </div>
          <div className="login-point">
            <i className="pi pi-mobile text-xl" />
            <div>
              <strong>Desktop and mobile views</strong>
              <span className="section-copy">Dense desktop dashboards, faster single-column mobile logging.</span>
            </div>
          </div>
          <div className="login-point">
            <i className="pi pi-database text-xl" />
            <div>
              <strong>Supabase backed</strong>
              <span className="section-copy">Authentication and recovery tracking write directly to your Supabase project.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="login-card-wrap">
        <Card className="login-card">
          <div className="section-stack">
            <div className="login-card-brand">
              <img src={recoveryCenterLogo} alt="Recovery Center logo" className="login-card-logo" />
              <div>
                <span className="brand-pill">Recovery Center</span>
              </div>
            </div>

            <div className="login-context">
              <h2 className="card-title">Sign in</h2>
              <p className="section-copy">
                {isSupabaseConfigured
                  ? 'Use Supabase Auth for password login. Recovery Center stores your username and tracking data in Supabase.'
                  : 'Add your Supabase URL and anon key to enable authentication.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="section-stack login-form">
              <label className="login-field">
                <span className="login-field-label">Email or username</span>
                <InputText
                  inputId="identifier"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  className="w-full"
                  placeholder="Email or username"
                />
              </label>

              <label className="login-field">
                <span className="login-field-label">Password</span>
                <Password
                  inputId="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  toggleMask
                  feedback={false}
                  inputClassName="w-full"
                  className="w-full login-password"
                  placeholder="Password"
                />
              </label>

              <Button
                type="submit"
                label={loading ? 'Signing in...' : 'Sign in'}
                loading={loading}
                disabled={!isSupabaseConfigured}
              />
            </form>
          </div>
        </Card>
      </section>
    </div>
  )
}
