import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { InputText } from 'primereact/inputtext'
import { Password } from 'primereact/password'
import { useAuth } from '../features/auth/AuthContext'
import { useAppToast } from '../features/ui/ToastContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const { isSupabaseConfigured, signInWithPassword, signUpWithPassword } = useAuth()
  const { showError, showSuccess } = useAppToast()
  const [mode, setMode] = useState('signin')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)

    try {
      if (isSupabaseConfigured && mode === 'signup') {
        const data = await signUpWithPassword({
          username,
          email,
          password,
          fullName,
        })

        if (data.session) {
          showSuccess('Account created', 'Your Recovery Center account is ready.')
          navigate('/', { replace: true })
        } else {
          showSuccess(
            'Account created',
            'Check your email if confirmation is required, then sign in.',
            4200,
          )
          setMode('signin')
          setIdentifier(email)
          setPassword('')
        }
      } else {
        await signInWithPassword({ identifier, password })
        showSuccess('Signed in', 'Login validation succeeded.')
        navigate('/', { replace: true })
      }
    } catch (submitError) {
      showError('Login failed', submitError.message || 'Unable to sign in.')
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
              <strong>Supabase backed</strong>
              <span className="section-copy">Authentication and recovery tracking write directly to your Supabase project.</span>
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
                  ? 'Use Supabase Auth for password login. Recovery Center stores your username and tracking data in Supabase.'
                  : 'Add your Supabase URL and anon key to enable authentication.'}
              </p>
            </div>

            <div className="week-strip">
              <button
                type="button"
                className={`week-button ${mode === 'signin' ? 'active' : ''}`}
                onClick={() => {
                  setMode('signin')
                }}
              >
                Sign in
              </button>
              <button
                type="button"
                className={`week-button ${mode === 'signup' ? 'active' : ''}`}
                onClick={() => {
                  setMode('signup')
                }}
              >
                Create account
              </button>
            </div>

            <form onSubmit={handleSubmit} className="section-stack">
              {mode === 'signup' ? (
                <>
                  <span className="p-float-label">
                    <InputText
                      id="username"
                      value={username}
                      onChange={(event) => setUsername(event.target.value.toLowerCase())}
                      className="w-full"
                    />
                    <label htmlFor="username">Username</label>
                  </span>

                  <span className="p-float-label">
                    <InputText
                      id="fullName"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      className="w-full"
                    />
                    <label htmlFor="fullName">Full name</label>
                  </span>

                  <span className="p-float-label">
                    <InputText
                      id="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="w-full"
                    />
                    <label htmlFor="email">Email</label>
                  </span>
                </>
              ) : (
                <span className="p-float-label">
                  <InputText
                    id="identifier"
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    className="w-full"
                  />
                  <label htmlFor="identifier">Email or username</label>
                </span>
              )}

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

              <Button
                type="submit"
                label={
                  loading
                    ? mode === 'signup'
                      ? 'Creating account...'
                      : 'Signing in...'
                    : mode === 'signup'
                      ? 'Create account'
                      : 'Sign in'
                }
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
