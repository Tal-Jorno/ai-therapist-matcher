import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { ApiError } from '../services/apiClient'
import { authApi } from '../services/authApi'
import { useAuth } from '../auth/types'
import styles from './AuthPage.module.css'
import { env } from '../services/env'
import { googlePromptForIdToken } from '../auth/google'

export function RegisterPage() {
  const { setSession } = useAuth()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [devLink, setDevLink] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const isGoogleEnabled = Boolean(env.googleClientId)

  async function onRegisterEmail() {
    const e = email.trim()
    if (!e) {
      setError('אנא הזינו אימייל תקין.')
      return
    }

    if (!password || password.length < 8) {
      setError('אנא בחרו סיסמה (לפחות 8 תווים).')
      return
    }

    if (password !== password2) {
      setError('הסיסמאות לא תואמות.')
      return
    }

    setIsLoading(true)
    setError(null)
    setInfo(null)
    setDevLink(null)
    try {
      const res = await authApi.registerEmail({
        role: 'client',
        email: e,
        password,
        full_name: fullName.trim() ? fullName.trim() : undefined,
      })
      setSession(res.session)

      setInfo('נרשמתם בהצלחה! כדי להפעיל את החשבון צריך לאמת את האימייל.')
      if (res.dev_verify_url) setDevLink(res.dev_verify_url)
      navigate('/verify-email', { replace: true })
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError('האימייל כבר קיים במערכת. נסו להתחבר.')
      } else if (import.meta.env.DEV && err instanceof ApiError) {
        const detail =
          err.body && typeof err.body === 'object'
            ? (err.body as Record<string, unknown>).detail
            : undefined
        setError(`שגיאת שרת (${err.status})${detail ? `: ${String(detail)}` : ''}`)
      } else {
        setError('לא הצלחנו להשלים הרשמה כרגע. נסו שוב בעוד רגע.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  async function onRegisterGoogle() {
    if (!env.googleClientId) return

    setIsLoading(true)
    setError(null)
    setInfo(null)
    setDevLink(null)
    try {
      const idToken = await googlePromptForIdToken({ clientId: env.googleClientId })
      const session = await authApi.googleLogin({ id_token: idToken, role: 'client' })
      setSession(session)
      navigate('/user/chat', { replace: true })
    } catch {
      setError('לא הצלחנו להירשם עם Google כרגע. נסו שוב בעוד רגע.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="stack">
      <div>
        <h1 className={styles.title}>הרשמה</h1>
        <p className={styles.subtitle}>אפשר להירשם עם Google או עם אימייל וסיסמה.</p>
      </div>

      <div className={styles.wrap}>
        <div className="stack">
          <Card>
            <div className="stack">
              <h3 className={styles.sectionTitle}>הרשמה עם Google (מטופלים)</h3>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnGoogle}`}
                onClick={() => void onRegisterGoogle()}
                disabled={isLoading || !isGoogleEnabled}
              >
                הרשמה עם Google
              </button>
              {!isGoogleEnabled && import.meta.env.DEV ? (
                <p className={styles.hint} style={{ direction: 'ltr', textAlign: 'left' }}>
                  DEV: Google Login כבוי. כדי להפעיל: הגדירו <code>googleClientId</code> ב-
                  <code>frontend/public/config.json</code>.
                </p>
              ) : null}
              <p className={styles.hint}>ההרשמה עם Google מיועדת כרגע למטופלים בלבד.</p>

              <div className={styles.sep} />

              <h3 className={styles.sectionTitle}>הרשמה עם אימייל וסיסמה</h3>
              <form
                className="stack"
                onSubmit={(e) => {
                  e.preventDefault()
                  void onRegisterEmail()
                }}
              >
                <label className={styles.field}>
                  שם מלא (אופציונלי)
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={styles.input}
                    disabled={isLoading}
                    autoComplete="name"
                  />
                </label>

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

                <div className="grid">
                  <label className={styles.field}>
                    סיסמה
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={styles.input}
                      disabled={isLoading}
                      required
                      type="password"
                      autoComplete="new-password"
                    />
                  </label>

                  <label className={styles.field}>
                    אימות סיסמה
                    <input
                      value={password2}
                      onChange={(e) => setPassword2(e.target.value)}
                      className={styles.input}
                      disabled={isLoading}
                      required
                      type="password"
                      autoComplete="new-password"
                    />
                  </label>
                </div>

                {error ? <p className={styles.error}>{error}</p> : null}
                {info ? <p className={styles.success}>{info}</p> : null}
                {import.meta.env.DEV && devLink ? (
                  <p className={styles.hint} style={{ direction: 'ltr', textAlign: 'left' }}>
                    DEV: קישור אימות: <a href={devLink}>{devLink}</a>
                  </p>
                ) : null}

                <div className={styles.btnRow}>
                  <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={isLoading}>
                    הרשמה
                  </button>
                  <Link to="/login">כבר רשומים? התחברות</Link>
                </div>
              </form>
            </div>
          </Card>
        </div>

        <div className={styles.side}>
          <Card title="מטפלים?">
            <p style={{ margin: 0 }}>
              לאזור מטפלים יש תהליך הרשמה נפרד (כולל פרטי פרופיל). עברו אל{' '}
              <Link to="/therapist/register">אזור מטפלים</Link>.
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
