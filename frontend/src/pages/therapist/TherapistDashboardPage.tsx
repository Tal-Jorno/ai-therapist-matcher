import { useEffect, useMemo, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { ApiError } from '../../services/apiClient'
import { therapistsApi } from '../../services/therapistsApi'
import type { Therapist, TherapistUpdateBody } from '../../types'
import styles from './TherapistDashboardPage.module.css'
import { useAuth } from '../../auth/types'

type ProfileStatus = 'active' | 'inactive'

function initials(name: string) {
  const parts = name
    .split(/\s+/)
    .map((p) => p.trim())
    .filter(Boolean)
  const a = parts[0]?.[0] ?? 'מ'
  const b = parts[1]?.[0] ?? ''
  return `${a}${b}`
}

function normalizePrice(value: Therapist['price_per_session']): number | null {
  if (value === null || value === undefined) return null
  const n = typeof value === 'string' ? Number(value) : value
  return Number.isFinite(n) ? n : null
}

function formatPrice(value: Therapist['price_per_session']) {
  const n = normalizePrice(value)
  if (n === null) return 'לא צוין'
  return `${n}₪`
}

function safeString(v: string | null | undefined) {
  const t = (v ?? '').trim()
  return t ? t : 'לא צוין'
}

export function TherapistDashboardPage() {
  const { session } = useAuth()
  const therapistUserId = session?.user_id ?? 0

  const [profile, setProfile] = useState<Therapist | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Mocked for now (payment/activation comes later)
  const [status] = useState<ProfileStatus>('inactive')

  const [draft, setDraft] = useState<TherapistUpdateBody>({})

  const headerName = profile?.full_name ?? 'מטפל/ת'
  const headerEmail = 'לא זמין בשלב זה'

  const statusText =
    status === 'active' ? 'הפרופיל שלך פעיל' : 'הפרופיל שלך לא פעיל עדיין'

  const statusHint =
    status === 'active'
      ? 'הפרופיל מוצג למטופלים בחיפוש.'
      : 'בהמשך: לאחר השלמת תשלום, הפרופיל יהפוך לפעיל.'

  const canEdit = profile !== null && !isLoading

  const displayLanguages = useMemo(() => safeString(profile?.languages), [profile?.languages])

  async function fetchProfile() {
    if (!therapistUserId) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await therapistsApi.getById(therapistUserId)
      setProfile(data)
      setDraft({
        full_name: data.full_name,
        specialization: data.specialization,
        city: data.city ?? null,
        languages: data.languages ?? null,
        bio: data.bio ?? null,
        price_per_session: normalizePrice(data.price_per_session),
        is_online: data.is_online,
      })
    } catch (e) {
      const message =
        e instanceof ApiError
          ? 'לא הצלחנו לטעון את פרטי הפרופיל כרגע.'
          : 'אירעה תקלה לא צפויה בעת טעינת הפרופיל.'
      setError(message)
      setProfile(null)
    } finally {
      setIsLoading(false)
    }
  }

  async function onSave() {
    if (!profile) return
    setIsSaving(true)
    setError(null)
    try {
      const updated = await therapistsApi.update(profile.user_id, {
        full_name: draft.full_name ?? undefined,
        specialization: draft.specialization ?? undefined,
        city: draft.city ?? undefined,
        languages: draft.languages ?? undefined,
        bio: draft.bio ?? undefined,
        price_per_session: draft.price_per_session ?? undefined,
        is_online: draft.is_online ?? undefined,
      })
      setProfile(updated)
      setIsEditing(false)
    } catch (e) {
      const message =
        e instanceof ApiError
          ? 'לא הצלחנו לשמור שינויים כרגע. נסו שוב בעוד רגע.'
          : 'אירעה תקלה לא צפויה בעת שמירת הפרופיל.'
      setError(message)
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    // Defer to avoid setState-in-effect lint rule and keep initial render stable.
    if (!therapistUserId) return
    const t = setTimeout(() => {
      void fetchProfile()
    }, 0)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [therapistUserId])

  return (
    <div className={styles.layout}>
      <Card>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>אזור אישי למטפל</h1>
            <p className={styles.subtitle}>ניהול פרופיל ותצוגה למטופלים</p>
          </div>

          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => void fetchProfile()}
              disabled={isLoading || isSaving || !therapistUserId}
            >
              רענן
            </button>

            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => setIsEditing(true)}
              disabled={!canEdit || isEditing}
            >
              ערוך פרופיל
            </button>
          </div>
        </div>
      </Card>

      {error ? <div className={styles.errorBox}>{error}</div> : null}
      {isLoading ? <div className={styles.loadingLine}>טוען פרטים…</div> : null}

      <div className={styles.grid}>
        <Card title="סטטוס פרופיל">
          <div className={styles.statusBox}>
            <h3 className={styles.statusTitle}>מצב</h3>
            <div className={styles.statusPill}>
              <span
                className={`${styles.dot} ${status === 'active' ? styles.dotOn : ''}`}
                aria-hidden="true"
              />
              <span>{statusText}</span>
            </div>
            <div className={styles.meta}>{statusHint}</div>
          </div>
        </Card>

        <Card title="פרטי פרופיל">
          {profile ? (
            <div className="stack">
              <div className={styles.profileTop}>
                {profile.image_url ? (
                  <img
                    className={styles.avatarImg}
                    src={profile.image_url}
                    alt="תמונת פרופיל"
                  />
                ) : (
                  <div className={styles.avatar} aria-label="Placeholder avatar">
                    {initials(profile.full_name)}
                  </div>
                )}
                <div>
                  <h2 className={styles.name}>{headerName}</h2>
                  <div className={styles.meta}>{headerEmail}</div>
                </div>
              </div>

              <div className={styles.kv}>
                <div className={styles.k}>עיר</div>
                <div className={styles.v}>{safeString(profile.city)}</div>
              </div>

              <div className={styles.kv}>
                <div className={styles.k}>שפות</div>
                <div className={styles.v}>{displayLanguages}</div>
              </div>

              <div className={styles.kv}>
                <div className={styles.k}>התמחות</div>
                <div className={styles.v}>{safeString(profile.specialization)}</div>
              </div>

              <div className={styles.kv}>
                <div className={styles.k}>אודות</div>
                <div className={styles.v}>{safeString(profile.bio)}</div>
              </div>

              <div className={styles.kv}>
                <div className={styles.k}>מחיר לפגישה</div>
                <div className={styles.v}>{formatPrice(profile.price_per_session)}</div>
              </div>

              <div className={styles.kv}>
                <div className={styles.k}>אונליין</div>
                <div className={styles.v}>{profile.is_online ? 'כן' : 'לא'}</div>
              </div>
            </div>
          ) : (
            <div className={styles.meta}>
              אין נתוני פרופיל להצגה. בדמו, ודאו שקיים מטפל עם המזהה שבחרתם.
            </div>
          )}
        </Card>
      </div>

      {isEditing && profile ? (
        <Card title="עריכת פרופיל">
          <form
            className={styles.form}
            onSubmit={(e) => {
              e.preventDefault()
              void onSave()
            }}
          >
            <div className={styles.field}>
              <div className={styles.label}>שם מלא</div>
              <input
                className={styles.input}
                value={draft.full_name ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, full_name: e.target.value }))}
                disabled={isSaving}
              />
            </div>

            <div className={styles.row2}>
              <div className={styles.field}>
                <div className={styles.label}>עיר</div>
                <input
                  className={styles.input}
                  value={draft.city ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, city: e.target.value }))}
                  disabled={isSaving}
                />
              </div>

              <div className={styles.field}>
                <div className={styles.label}>שפות</div>
                <input
                  className={styles.input}
                  value={draft.languages ?? ''}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, languages: e.target.value }))
                  }
                  placeholder="לדוגמה: עברית, English"
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className={styles.field}>
              <div className={styles.label}>התמחות</div>
              <input
                className={styles.input}
                value={draft.specialization ?? ''}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, specialization: e.target.value }))
                }
                disabled={isSaving}
              />
            </div>

            <div className={styles.field}>
              <div className={styles.label}>אודות</div>
              <textarea
                className={styles.textarea}
                value={draft.bio ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, bio: e.target.value }))}
                disabled={isSaving}
              />
            </div>

            <div className={styles.row2}>
              <div className={styles.field}>
                <div className={styles.label}>מחיר לפגישה (₪)</div>
                <input
                  className={styles.input}
                  inputMode="numeric"
                  value={draft.price_per_session ?? ''}
                  onChange={(e) => {
                    const v = e.target.value.trim()
                    setDraft((d) => ({
                      ...d,
                      price_per_session: v === '' ? null : Number(v),
                    }))
                  }}
                  disabled={isSaving}
                />
              </div>

              <div className={styles.field}>
                <div className={styles.label}>אונליין</div>
                <label className={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={!!draft.is_online}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, is_online: e.target.checked }))
                    }
                    disabled={isSaving}
                  />
                  זמין/ה לאונליין
                </label>
              </div>
            </div>

            <div className={styles.headerActions}>
              <button
                type="submit"
                className={styles.primaryButton}
                disabled={isSaving}
              >
                שמור
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
              >
                ביטול
              </button>
            </div>

            <div className={styles.meta}>
              הערה: העלאת תמונה/תשלום עדיין לא מחוברים. סטטוס פרופיל הוא דמו בשלב זה.
            </div>
          </form>
        </Card>
      ) : null}
    </div>
  )
}
