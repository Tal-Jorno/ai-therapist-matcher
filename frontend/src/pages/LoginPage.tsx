import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { useAuth } from '../auth/types'
import { authApi } from '../services/authApi'
import type { UserRole } from '../auth/types'
import styles from './AuthPage.module.css'
import { env } from '../services/env'
import { googlePromptForIdToken } from '../auth/google'

type LocationState = { from?: { pathname?: string } }

export function LoginPage() {
  const { session, setSession } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [role, setRole] = useState<UserRole>('client')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const isGoogleEnabled = Boolean(env.googleClientId)

  const fromPath = useMemo(() => {
    const st = location.state as LocationState | null
    const p = st?.from?.pathname
    return typeof p === 'string' && p.trim() ? p : null
  }, [location.state])

  const defaultPath = role === 'therapist' ? '/therapist/dashboard' : '/user/chat'

  async function onLoginEmail() {
    const e = email.trim()
    if (!e) {
      setError('אנא הזינו אימייל תקין.')
      return
    }
    if (!password) {
      setError('אנא הזינו סיסמה.')
      return
    }

    setIsLoading(true)
    setError(null)
    setInfo(null)
    try {
      const next = await authApi.loginEmail({ email: e, password })
      setSession(next)

      if (!next.email_verified) {
        setInfo('התחברתם בהצלחה, אבל צריך לאמת את האימייל. בדקו את תיבת הדואר שלכם.')
        navigate('/verify-email', { replace: true })
        return
      }

      navigate(fromPath ?? defaultPath, { replace: true })
    } catch (e) {
      if (authApi.isUnauthorized(e)) setError('אימייל או סיסמה לא נכונים.')
      else setError('לא הצלחנו להתחבר כרגע. נסו שוב בעוד רגע.')
    } finally {
      setIsLoading(false)
    }
  }

  async function onLoginGoogle() {
    if (!env.googleClientId) return

    setIsLoading(true)
    setError(null)
    setInfo(null)
    try {
      const idToken = await googlePromptForIdToken({ clientId: env.googleClientId })
      const next = await authApi.googleLogin({ id_token: idToken, role })
      setSession(next)
      navigate(fromPath ?? defaultPath, { replace: true })
    } catch {
      setError('לא הצלחנו להתחבר עם Google כרגע. נסו שוב בעוד רגע.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="stack">
      <div>
        <h1 className={styles.title}>התחברות</h1>
        <p className={styles.subtitle}>בחרו את הדרך הנוחה לכם להתחבר.</p>
      </div>

      <div className={styles.wrap}>
        <div className="stack">
          <Card>
            <div className="stack">
              <div className={styles.btnRow}>
                <span className={styles.pill}>תפקיד</span>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className={styles.input}
                  disabled={isLoading}
                >
                  <option value="client">מטופל/ת</option>
                  <option value="therapist">מטפל/ת</option>
                </select>
              </div>

              <div className={styles.sep} />

              <h3 className={styles.sectionTitle}>התחברות עם Google</h3>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnGoogle}`}
                onClick={() => void onLoginGoogle()}
                disabled={isLoading || !isGoogleEnabled}
              >
                התחברות עם Google
              </button>
              {!isGoogleEnabled && import.meta.env.DEV ? (
                <p className={styles.hint} style={{ direction: 'ltr', textAlign: 'left' }}>
                  DEV: Google Login כבוי. כדי להפעיל: הגדירו <code>googleClientId</code> ב-
                  <code>frontend/public/config.json</code>.
                </p>
              ) : null}
              <p className={styles.hint}>
                ברירת המחדל בהרשמה עם Google היא למטופלים. למטפלים מומלץ ליצור חשבון עם אימייל וסיסמה.
              </p>

              <div className={styles.sep} />

              <h3 className={styles.sectionTitle}>התחברות עם אימייל וסיסמה</h3>
              <form
                className="stack"
                onSubmit={(e) => {
                  e.preventDefault()
                  void onLoginEmail()
                }}
              >
                <label className={styles.field}>
                  אימייל
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={styles.input}
                    disabled={isLoading}
                    required
                    inputMode="email"
                    autoComplete="email"
                  />
                </label>
                <label className={styles.field}>
                  סיסמה
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={styles.input}
                    disabled={isLoading}
                    required
                    type="password"
                    autoComplete="current-password"
                  />
                </label>

                {error ? <p className={styles.error}>{error}</p> : null}
                {info ? <p className={styles.success}>{info}</p> : null}

                <div className={styles.btnRow}>
                  <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={isLoading}>
                    התחברות
                  </button>
                  <Link to="/register">הרשמה</Link>
                </div>
              </form>
            </div>
          </Card>
        </div>

        <div className={styles.side}>
          <Card title="מדריך קצר">
            <ul className="list">
              <li>לאחר התחברות: מטופל/ת → /user/chat</li>
              <li>לאחר התחברות: מטפל/ת → /therapist/dashboard</li>
              <li>חשבונות אימייל/סיסמה דורשים אימות מייל לפני שימוש מלא.</li>
            </ul>
          </Card>
        </div>
      </div>

      <Card>
        {session ? (
          <div className="stack">
            <p style={{ margin: 0 }}>
              אתם כבר מחוברים/ות בתור <strong>{session.full_name}</strong>.
            </p>
            <Link to={session.role === 'therapist' ? '/therapist/dashboard' : '/user/chat'}>
              מעבר לאזור האישי
            </Link>
          </div>
        ) : (
          <div className="stack">
            <p style={{ margin: 0 }}>
              מטפלים? מומלץ להירשם דרך <Link to="/therapist/register">אזור מטפלים</Link>.
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}
