import { useEffect, useMemo, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { ApiError } from '../../services/apiClient'
import { therapistsApi } from '../../services/therapistsApi'
import type { Therapist } from '../../types'
import styles from './UserSearchPage.module.css'

type OnlineFilter = 'any' | 'online' | 'in_person'

function normalizeLanguagesText(languages: string | null | undefined) {
  const text = (languages ?? '').trim()
  if (!text) return ''

  // best-effort cleanup for common formats: "Hebrew, English" or "Hebrew|English"
  return text
    .replace(/\s*\|\s*/g, ', ')
    .replace(/\s*,\s*/g, ', ')
    .trim()
}

function asNumber(value: string) {
  const v = value.trim()
  if (!v) return undefined
  const n = Number(v)
  if (!Number.isFinite(n)) return undefined
  return n
}

function formatPrice(value: Therapist['price_per_session']) {
  if (value === null || value === undefined) return 'לא צוין'
  const n = typeof value === 'string' ? Number(value) : value
  if (!Number.isFinite(n)) return String(value)
  return `${n}₪`
}

function onlineLabel(isOnline: boolean) {
  return isOnline ? 'אונליין זמין' : 'פרונטלי בלבד'
}

function matchesLanguage(t: Therapist, languageQuery: string) {
  const q = languageQuery.trim().toLowerCase()
  if (!q) return true
  const langs = normalizeLanguagesText(t.languages).toLowerCase()
  return langs.includes(q)
}

export function UserSearchPage() {
  const [city, setCity] = useState('')
  const [specialization, setSpecialization] = useState('')
  const [language, setLanguage] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [online, setOnline] = useState<OnlineFilter>('any')

  const [therapists, setTherapists] = useState<Therapist[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filteredTherapists = useMemo(() => {
    return therapists.filter((t) => matchesLanguage(t, language))
  }, [therapists, language])

  async function fetchTherapists() {
    setIsLoading(true)
    setError(null)
    try {
      const isOnlineParam =
        online === 'any' ? undefined : online === 'online' ? true : false

      const data = await therapistsApi.list({
        city,
        specialization,
        min_price: asNumber(minPrice),
        max_price: asNumber(maxPrice),
        is_online: isOnlineParam,
        limit: 100,
        offset: 0,
      })
      setTherapists(data)
    } catch (e) {
      const message =
        e instanceof ApiError
          ? 'לא הצלחנו לטעון מטפלים כרגע. נסו שוב בעוד רגע.'
          : 'אירעה תקלה לא צפויה בעת טעינת מטפלים.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  function resetFilters() {
    setCity('')
    setSpecialization('')
    setLanguage('')
    setMinPrice('')
    setMaxPrice('')
    setOnline('any')
  }

  useEffect(() => {
    // Defer to avoid "setState-in-effect" lint rule and keep initial render stable.
    const t = setTimeout(() => {
      void fetchTherapists()
    }, 0)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={styles.layout}>
      <Card>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.title}>חיפוש מטפלים</h1>
            <p className={styles.subtitle}>סינון לפי עיר, התמחות, מחיר ואונליין</p>
          </div>
          <div className={styles.statusText}>
            {isLoading
              ? 'טוען תוצאות…'
              : `נמצאו ${filteredTherapists.length} מטפלים/ות`}
          </div>
        </div>

        <form
          className={styles.filtersForm}
          onSubmit={(e) => {
            e.preventDefault()
            void fetchTherapists()
          }}
        >
          <div className={`${styles.field} ${styles.col4}`}>
            <div className={styles.label}>עיר</div>
            <input
              className={styles.input}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="למשל: תל אביב"
            />
          </div>

          <div className={`${styles.field} ${styles.col4}`}>
            <div className={styles.label}>התמחות</div>
            <input
              className={styles.input}
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              placeholder="למשל: חרדה, זוגיות"
            />
          </div>

          <div className={`${styles.field} ${styles.col4}`}>
            <div className={styles.label}>שפה (סינון בצד לקוח)</div>
            <input
              className={styles.input}
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              placeholder="למשל: עברית"
            />
          </div>

          <div className={`${styles.field} ${styles.col3}`}>
            <div className={styles.label}>מחיר מינימלי</div>
            <input
              className={styles.input}
              inputMode="numeric"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="0"
            />
          </div>

          <div className={`${styles.field} ${styles.col3}`}>
            <div className={styles.label}>מחיר מקסימלי</div>
            <input
              className={styles.input}
              inputMode="numeric"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="500"
            />
          </div>

          <div className={`${styles.field} ${styles.col3}`}>
            <div className={styles.label}>אונליין</div>
            <select
              className={styles.select}
              value={online}
              onChange={(e) => setOnline(e.target.value as OnlineFilter)}
            >
              <option value="any">הכול</option>
              <option value="online">רק אונליין</option>
              <option value="in_person">רק פרונטלי</option>
            </select>
          </div>

          <div className={`${styles.field} ${styles.col3}`}>
            <div className={styles.label}>פעולות</div>
            <div className={styles.actions}>
              <button
                type="submit"
                className={styles.primaryButton}
                disabled={isLoading}
              >
                חפש
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => {
                  resetFilters()
                  queueMicrotask(() => void fetchTherapists())
                }}
                disabled={isLoading}
              >
                נקה
              </button>
            </div>
          </div>

          <div className={`${styles.note} ${styles.col12}`}>
            הטיפ: אם אין תוצאות, נסו להסיר מסננים או להרחיב טווח מחיר.
          </div>
        </form>
      </Card>

      {error ? <div className={styles.errorBox}>{error}</div> : null}

      <div className={styles.statusRow}>
        <div className={styles.statusText}>
          {isLoading ? 'טוען מטפלים…' : 'תוצאות חיפוש'}
        </div>
      </div>

      {isLoading ? (
        <div className={styles.emptyBox}>טוען רשימת מטפלים…</div>
      ) : filteredTherapists.length === 0 ? (
        <div className={styles.emptyBox}>
          לא נמצאו מטפלים מתאימים למסננים שבחרתם. נסו לשנות עיר/התמחות/מחיר.
        </div>
      ) : (
        <div className={styles.resultsGrid}>
          {filteredTherapists.map((t) => {
            const languagesText = normalizeLanguagesText(t.languages)
            return (
              <Card key={t.user_id} title={t.full_name}>
                <div className={styles.therapistCard}>
                  <div className={styles.kv}>
                    <div className={styles.k}>התמחות</div>
                    <div className={styles.v}>{t.specialization}</div>
                  </div>

                  <div className={styles.kv}>
                    <div className={styles.k}>עיר</div>
                    <div className={styles.v}>{t.city ?? 'לא צוין'}</div>
                  </div>

                  <div className={styles.kv}>
                    <div className={styles.k}>שפות</div>
                    <div className={styles.v}>{languagesText || 'לא צוין'}</div>
                  </div>

                  <div className={styles.kv}>
                    <div className={styles.k}>מחיר</div>
                    <div className={styles.v}>{formatPrice(t.price_per_session)}</div>
                  </div>

                  <div className={styles.chips}>
                    <span className={styles.chip}>
                      <span
                        className={`${styles.chipDot} ${
                          t.is_online ? '' : styles.chipDotOff
                        }`}
                        aria-hidden="true"
                      />
                      {onlineLabel(t.is_online)}
                    </span>
                  </div>

                  {t.bio ? (
                    <div className={styles.kv}>
                      <div className={styles.k}>אודות</div>
                      <div className={styles.v}>{t.bio}</div>
                    </div>
                  ) : null}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
