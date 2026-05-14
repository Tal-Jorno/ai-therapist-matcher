import { useEffect, useMemo, useRef, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { ApiError } from '../../services/apiClient'
import { matchApi } from '../../services/matchApi'
import type { MatchResultPayload, TherapistSummary } from '../../types'
import styles from './UserChatPage.module.css'
import { useAuth } from '../../auth/types'

type UiMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function normalizeTherapist(t: TherapistSummary) {
  return {
    ...t,
    languagesText: Array.isArray(t.languages)
      ? t.languages.join(', ')
      : (t.languages ?? ''),
  }
}

function pickAssistantMessage(payload: MatchResultPayload): string | null {
  const direct = payload.assistant_message
  if (typeof direct === 'string' && direct.trim()) return direct.trim()

  const anyPayload = payload as unknown as Record<string, unknown>
  const maybe = anyPayload['assistant_message']
  if (typeof maybe === 'string' && maybe.trim()) return maybe.trim()

  return null
}

export function UserChatPage() {
  const { session } = useAuth()
  const clientUserId = session?.user_id ?? 0
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<UiMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'כתבו לי מה אתם מחפשים/ות בפסיכולוג או בפסיכולוגית (בעיה מרכזית, עיר, שפה, אונליין/פרונטלי, תקציב).',
    },
  ])
  const [topTherapists, setTopTherapists] = useState<
    Array<TherapistSummary & { matching_reason?: string }>
  >([])

  const listRef = useRef<HTMLDivElement | null>(null)

  const sessionLabel = useMemo(() => {
    if (!sessionId) return 'טרם נוצרה שיחה'
    return `מזהה שיחה: ${sessionId}`
  }, [sessionId])

  async function ensureSessionId(): Promise<number> {
    if (sessionId) return sessionId
    if (!clientUserId) throw new Error('missing_client')
    const created = await matchApi.createSession({ client_user_id: clientUserId })
    setSessionId(created.id)
    return created.id
  }

  async function fetchResultsWithRetry(sid: number) {
    // The backend may finalize results inside the message request, but allow brief retry.
    for (let i = 0; i < 12; i++) {
      try {
        return await matchApi.getResults(sid)
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) {
          await sleep(500)
          continue
        }
        throw e
      }
    }

    throw new Error('results_timeout')
  }

  async function onSend() {
    const content = input.trim()
    if (!content || isLoading) return

    setError(null)
    setInput('')
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: 'user', content },
    ])

    // allow UI to paint new message
    queueMicrotask(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
    })

    setIsLoading(true)
    try {
      const sid = await ensureSessionId()
      await matchApi.sendMessage(sid, { content })

      const results = await fetchResultsWithRetry(sid)
      const payload = results.payload ?? {}

      const assistantText =
        pickAssistantMessage(payload) ??
        'מצאתי התאמות אפשריות על סמך ההודעה שלך. הנה התוצאות:'

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: assistantText },
      ])

      const top5 = payload.top5 ?? []
      const reasons = payload.reasons ?? []
      const normalized = top5.slice(0, 5).map((t, idx) => ({
        ...t,
        matching_reason: reasons[idx] ?? '',
      }))

      setTopTherapists(normalized)

      queueMicrotask(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
      })
    } catch (e) {
      const message =
        e instanceof ApiError
          ? 'לא הצלחנו לבצע התאמה כרגע. נסו שוב בעוד רגע.'
          : 'אירעה תקלה לא צפויה. נסו שוב.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  function resetChat() {
    setSessionId(null)
    setTopTherapists([])
    setError(null)
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content:
          'כתבו לי מה אתם מחפשים/ות בפסיכולוג או בפסיכולוגית (בעיה מרכזית, עיר, שפה, אונליין/פרונטלי, תקציב).',
      },
    ])
  }

  useEffect(() => {
    // If user changes (logout/login), reset chat state.
    const t = setTimeout(() => {
      resetChat()
    }, 0)
    return () => clearTimeout(t)
  }, [clientUserId])

  return (
    <div className={styles.layout}>
      <Card>
        <div className={styles.panelHeader}>
          <div>
            <h2 className={styles.panelTitle}>צ'אט התאמה</h2>
            <div className={styles.meta}>{sessionLabel}</div>
          </div>

          <button
            type="button"
            className={styles.ghostButton}
            onClick={resetChat}
            disabled={isLoading}
          >
            התחל מחדש
          </button>
        </div>

        <div className={styles.chatWrap}>
          <div ref={listRef} className={styles.messages} aria-label="Conversation">
            {messages.map((m) => {
              const rowClass =
                m.role === 'user' ? styles.userRow : styles.assistantRow
              const bubbleClass =
                m.role === 'user' ? styles.userBubble : styles.assistantBubble
              return (
                <div key={m.id} className={`${styles.bubbleRow} ${rowClass}`}>
                  <div className={`${styles.bubble} ${bubbleClass}`}>{m.content}</div>
                </div>
              )
            })}
          </div>

          {error ? <div className={styles.error}>{error}</div> : null}
          {isLoading ? (
            <div className={styles.loadingLine}>מעבד בקשה ומחשב התאמות…</div>
          ) : null}

          <div className={styles.composer}>
            <textarea
              className={styles.input}
              placeholder="לדוגמה: אני מחפש טיפול בחרדה, באזור תל אביב, בעברית, רצוי אונליין, עד 350₪"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void onSend()
                }
              }}
              disabled={isLoading}
            />

            <button
              type="button"
              className={styles.send}
              onClick={() => void onSend()}
              disabled={isLoading || input.trim().length === 0}
            >
              שלח
            </button>
          </div>

          <div className={styles.meta}>
            משתמש מחובר: <strong>#{clientUserId}</strong>
          </div>
        </div>
      </Card>

      <Card>
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>התאמות מובילות</h2>
          <div className={styles.meta}>עד 5 תוצאות</div>
        </div>

        <div className={styles.resultsWrap}>
          {topTherapists.length === 0 ? (
            <div className={styles.meta}>
              לאחר שליחת הודעה, כאן יופיעו התאמות והסבר קצר לכל מטפל/ת.
            </div>
          ) : (
            topTherapists.slice(0, 5).map((t) => {
              const nt = normalizeTherapist(t)
              return (
                <Card key={t.user_id} title={t.full_name}>
                  <div className={styles.therapistCard}>
                    <div className={styles.kv}>
                      <div className={styles.k}>התמחות</div>
                      <div className={styles.v}>{t.specialization}</div>
                    </div>

                    <div className={styles.kv}>
                      <div className={styles.k}>שפות</div>
                      <div className={styles.v}>{nt.languagesText || '—'}</div>
                    </div>

                    <div className={styles.kv}>
                      <div className={styles.k}>עיר</div>
                      <div className={styles.v}>{t.city ?? '—'}</div>
                    </div>

                    <div className={styles.kv}>
                      <div className={styles.k}>זמינות</div>
                      <div className={styles.v}>
                        <span className={styles.chip}>
                          <span
                            className={`${styles.chipDot} ${
                              t.is_online ? '' : styles.chipDotOff
                            }`}
                            aria-hidden="true"
                          />
                          {t.is_online ? 'אונליין זמין' : 'לא מסומן כאונליין'}
                        </span>
                      </div>
                    </div>

                    <div className={styles.kv}>
                      <div className={styles.k}>מחיר</div>
                      <div className={styles.v}>
                        {t.price_per_session ?? t.price_per_session === 0
                          ? `${t.price_per_session} ₪`
                          : '—'}
                      </div>
                    </div>

                    <div className={styles.reason}>
                      <strong>למה זה מתאים:</strong>{' '}
                      {t.matching_reason?.trim() ? t.matching_reason : '—'}
                    </div>
                  </div>
                </Card>
              )
            })
          )}
        </div>
      </Card>
    </div>
  )
}
