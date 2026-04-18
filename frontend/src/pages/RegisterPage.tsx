import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { ApiError } from '../services/apiClient'
import { authApi } from '../services/authApi'
import { useAuth } from '../auth/types'

export function RegisterPage() {
  const { setSession } = useAuth()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onRegister() {
    const e = email.trim()
    if (!e) {
      setError('אנא הזינו אימייל תקין.')
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const session = await authApi.registerClient({
        email: e,
        full_name: fullName.trim() ? fullName.trim() : undefined,
      })
      setSession(session)
      navigate('/user/chat', { replace: true })
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

  return (
    <div className="stack">
      <Card title="הרשמה">
        <form
          className="stack"
          onSubmit={(e) => {
            e.preventDefault()
            void onRegister()
          }}
        >
          <label>
            שם מלא (אופציונלי)
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={{ width: '100%', marginTop: 6 }}
              disabled={isLoading}
            />
          </label>

          <label>
            אימייל
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', marginTop: 6 }}
              disabled={isLoading}
              required
            />
          </label>

          {error ? <p style={{ color: 'crimson', margin: 0 }}>{error}</p> : null}

          <button type="submit" disabled={isLoading}>
            הרשמה
          </button>

          <p style={{ margin: 0 }}>
            כבר רשומים? <Link to="/login">התחברות</Link>
          </p>
        </form>
      </Card>
    </div>
  )
}
