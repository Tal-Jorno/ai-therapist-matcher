import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { authApi } from '../services/authApi'
import { useAuth } from '../auth/types'

export function VerifyEmailPage() {
  const { setSession } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const token = useMemo(() => {
    const t = params.get('token')
    return typeof t === 'string' && t.trim() ? t.trim() : null
  }, [params])

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(
    token ? 'loading' : 'idle',
  )
  const [message, setMessage] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [devLink, setDevLink] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return

    let cancelled = false
    void (async () => {
      setStatus('loading')
      setMessage(null)
      try {
        const session = await authApi.verifyEmail({ token })
        if (cancelled) return
        setSession(session)
        setStatus('success')
        const next = session.role === 'therapist' ? '/therapist/dashboard' : '/user/chat'
        navigate(next, { replace: true })
      } catch {
        if (cancelled) return
        setStatus('error')
        setMessage('לא הצלחנו לאמת את המייל. ייתכן שהקישור פג תוקף או שכבר השתמשתם בו.')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [token, navigate, setSession])

  return (
    <div className="stack">
      <Card title="אימות אימייל">
        {status === 'loading' ? <p style={{ margin: 0 }}>מאמתים את המייל...</p> : null}

        {status === 'idle' ? (
          <div className="stack">
            <p style={{ margin: 0 }}>חסר פרמטר אימות. נא להשתמש בקישור שנשלח אליכם.</p>
            <details>
              <summary>שליחה מחדש של מייל אימות</summary>
              <div className="stack" style={{ marginTop: 12 }}>
                <label>
                  אימייל
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ width: '100%', marginTop: 6 }}
                    inputMode="email"
                  />
                </label>
                <button
                  type="button"
                  onClick={() =>
                    void (async () => {
                      setDevLink(null)
                      try {
                        const res = await authApi.resendVerification({ email: email.trim() })
                        if (import.meta.env.DEV && res.dev_verify_url) setDevLink(res.dev_verify_url)
                        setMessage('אם החשבון קיים ולא מאומת – שלחנו קישור חדש.')
                      } catch {
                        setMessage('לא הצלחנו לשלוח קישור חדש כרגע.')
                      }
                    })()
                  }
                >
                  שליחה מחדש
                </button>
                {import.meta.env.DEV && devLink ? (
                  <p style={{ margin: 0, direction: 'ltr', textAlign: 'left' }}>
                    DEV: <a href={devLink}>{devLink}</a>
                  </p>
                ) : null}
              </div>
            </details>
            <Link to="/login">מעבר להתחברות</Link>
          </div>
        ) : null}

        {status === 'error' ? (
          <div className="stack">
            <p style={{ margin: 0, color: 'crimson' }}>{message}</p>
            <details>
              <summary>שליחה מחדש של מייל אימות</summary>
              <div className="stack" style={{ marginTop: 12 }}>
                <label>
                  אימייל
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ width: '100%', marginTop: 6 }}
                    inputMode="email"
                  />
                </label>
                <button
                  type="button"
                  onClick={() =>
                    void (async () => {
                      setDevLink(null)
                      try {
                        const res = await authApi.resendVerification({ email: email.trim() })
                        if (import.meta.env.DEV && res.dev_verify_url) setDevLink(res.dev_verify_url)
                        setMessage('אם החשבון קיים ולא מאומת – שלחנו קישור חדש.')
                      } catch {
                        setMessage('לא הצלחנו לשלוח קישור חדש כרגע.')
                      }
                    })()
                  }
                >
                  שליחה מחדש
                </button>
                {import.meta.env.DEV && devLink ? (
                  <p style={{ margin: 0, direction: 'ltr', textAlign: 'left' }}>
                    DEV: <a href={devLink}>{devLink}</a>
                  </p>
                ) : null}
              </div>
            </details>
            <Link to="/login">חזרה להתחברות</Link>
          </div>
        ) : null}

        {status === 'success' ? <p style={{ margin: 0 }}>אימות הצליח. מעבירים אתכם...</p> : null}
      </Card>
    </div>
  )
}
