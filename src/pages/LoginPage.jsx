import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { Divider } from 'primereact/divider'
import { InputText } from 'primereact/inputtext'
import { Message } from 'primereact/message'
import { Password } from 'primereact/password'
import { useAuth } from '../features/auth/AuthContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const { isSupabaseConfigured, signInWithPassword } = useAuth()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      await signInWithPassword({ identifier, password })
      navigate('/', { replace: true })
    } catch (submitError) {
      setError(submitError.message || 'Unable to sign in.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-shell">
      <section className="login-hero">
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
              <strong>Supabase ready</strong>
              <span className="section-copy">Runs with mock data now and switches to Supabase when env vars are added.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="login-card-wrap">
        <Card className="login-card">
          <div className="section-stack">
            <div className="login-context">
              <h2 className="card-title">Sign in</h2>
              <p className="section-copy">
                {isSupabaseConfigured
                  ? 'Use your Supabase auth credentials or switch to the seeded demo workspace.'
                  : 'Supabase is not configured yet, so the app will open in seeded demo mode by default.'}
              </p>
            </div>

            {error ? <Message className="login-support" severity="error" text={error} /> : null}
            {!isSupabaseConfigured ? (
              <Message
                className="login-support"
                severity="info"
                text="Demo mode is active. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable live auth."
              />
            ) : null}

            <form onSubmit={handleSubmit} className="section-stack">
              <span className="p-float-label">
                <InputText
                  id="identifier"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  className="w-full"
                />
                <label htmlFor="identifier">{isSupabaseConfigured ? 'Email' : 'Username'}</label>
              </span>

              <span className="p-float-label">
                <Password
                  id="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  toggleMask
                  feedback={false}
                  inputClassName="w-full"
                  className="w-full"
                />
                <label htmlFor="password">Password</label>
              </span>

              <Button type="submit" label={loading ? 'Signing in...' : 'Sign in'} loading={loading} />
            </form>

            <div className="login-demo">
              <Divider align="center">
                <span className="mono">demo mode</span>
              </Divider>
            </div>
          </div>
        </Card>
      </section>
    </div>
  )
}
