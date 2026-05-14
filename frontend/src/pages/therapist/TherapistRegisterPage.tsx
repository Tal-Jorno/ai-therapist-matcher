import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card } from '../../components/ui/Card'
import { ApiError } from '../../services/apiClient'
import { authApi } from '../../services/authApi'
import { useAuth } from '../../auth/types'

export function TherapistRegisterPage() {
  const { setSession } = useAuth()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [specialization, setSpecialization] = useState('')
  const [city, setCity] = useState('')
  const [languages, setLanguages] = useState('')
  const [bio, setBio] = useState('')
  const [isOnline, setIsOnline] = useState(true)
  const [price, setPrice] = useState('')

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onRegister() {
    if (!email.trim() || !fullName.trim() || !specialization.trim()) {
      setError('אנא מלאו אימייל, שם מלא והתמחות.')
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const session = await authApi.registerTherapist({
        email: email.trim(),
        full_name: fullName.trim(),
        specialization: specialization.trim(),
        city,
        languages,
        bio,
        is_online: isOnline,
        price_per_session: price.trim() ? Number(price) : null,
      })
      setSession(session)
      navigate('/therapist/dashboard', { replace: true })
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError('האימייל כבר קיים במערכת. נסו להתחבר.')
      } else {
        setError('לא הצלחנו להשלים הרשמה כרגע. נסו שוב בעוד רגע.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="stack">
      <Card title="אזור מטפלים • הרשמה / פרופיל">
        <form
          className="stack"
          onSubmit={(e) => {
            e.preventDefault()
            void onRegister()
          }}
        >
          <div className="grid">
            <label>
              שם מלא
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={{ width: '100%', marginTop: 6 }}
                disabled={isLoading}
                required
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
          </div>

          <label>
            התמחות
            <input
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              style={{ width: '100%', marginTop: 6 }}
              disabled={isLoading}
              placeholder="למשל: חרדה, זוגיות, דיכאון"
              required
            />
          </label>

          <div className="grid">
            <label>
              עיר (אופציונלי)
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                style={{ width: '100%', marginTop: 6 }}
                disabled={isLoading}
              />
            </label>
            <label>
              שפות (אופציונלי)
              <input
                value={languages}
                onChange={(e) => setLanguages(e.target.value)}
                style={{ width: '100%', marginTop: 6 }}
                disabled={isLoading}
                placeholder="לדוגמה: עברית, English"
              />
            </label>
          </div>

          <label>
            אודות (אופציונלי)
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              style={{ width: '100%', marginTop: 6, minHeight: 110 }}
              disabled={isLoading}
            />
          </label>

          <div className="grid">
            <label>
              מחיר לפגישה (₪) (אופציונלי)
              <input
                inputMode="numeric"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                style={{ width: '100%', marginTop: 6 }}
                disabled={isLoading}
                placeholder="350"
              />
            </label>

            <label style={{ alignSelf: 'end' }}>
              <input
                type="checkbox"
                checked={isOnline}
                onChange={(e) => setIsOnline(e.target.checked)}
                disabled={isLoading}
                style={{ marginInlineEnd: 8 }}
              />
              זמין/ה לאונליין
            </label>
          </div>

          {error ? <p style={{ color: 'crimson', margin: 0 }}>{error}</p> : null}

          <button type="submit" disabled={isLoading}>
            יצירת חשבון מטפל/ת
          </button>

          <p style={{ margin: 0 }}>
            כבר רשומים? <Link to="/login">התחברות</Link>
          </p>
        </form>
      </Card>
    </div>
  )
}
