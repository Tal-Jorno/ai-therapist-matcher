import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { useAuth } from '../auth/types'
import { authApi } from '../services/authApi'
import type { UserRole } from '../auth/types'

type LocationState = { from?: { pathname?: string } }

export function LoginPage() {
  const { session, setSession } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [role, setRole] = useState<UserRole>('client')
  const [userId, setUserId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fromPath = useMemo(() => {
    const st = location.state as LocationState | null
    const p = st?.from?.pathname
    return typeof p === 'string' && p.trim() ? p : null
  }, [location.state])

  const defaultPath = role === 'therapist' ? '/therapist/dashboard' : '/user/chat'

  async function onLogin() {
    const id = Number(userId)
    if (!Number.isFinite(id) || id <= 0) {
      setError('אנא הזינו מזהה משתמש/ת תקין (מספר).')
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const next = await authApi.loginById({ role, user_id: id })
      setSession(next)
      navigate(fromPath ?? defaultPath, { replace: true })
    } catch (e) {
      if (authApi.isNotFound(e)) {
        setError('לא מצאנו משתמש/ת עם מזהה כזה. בדקו את המספר ונסו שוב.')
      } else {
        setError('לא הצלחנו להתחבר כרגע. נסו שוב בעוד רגע.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="stack">
      <Card title="התחברות">
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
          <form
            className="stack"
            onSubmit={(e) => {
              e.preventDefault()
              void onLogin()
            }}
          >
            <label>
              מי אתם?
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                style={{ width: '100%', marginTop: 6 }}
                disabled={isLoading}
              >
                <option value="client">מטופל/ת</option>
                <option value="therapist">מטפל/ת</option>
              </select>
            </label>

            <label>
              מזהה משתמש/ת
              <input
                inputMode="numeric"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                style={{ width: '100%', marginTop: 6 }}
                disabled={isLoading}
                required
                placeholder="לדוגמה: 12"
              />
            </label>

            {error ? <p style={{ color: 'crimson', margin: 0 }}>{error}</p> : null}

            <button type="submit" disabled={isLoading}>
              התחברות
            </button>

            <p style={{ margin: 0 }}>
              אין לכם חשבון מטופל/ת? <Link to="/register">הרשמה</Link>
            </p>
            <p style={{ margin: 0 }}>
              אתם מטפלים? <Link to="/therapist/register">יצירת פרופיל</Link>
            </p>
          </form>
        )}
      </Card>
    </div>
  )
}
