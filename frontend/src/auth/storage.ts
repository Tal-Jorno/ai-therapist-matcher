import type { AuthSession } from './types'

export const SESSION_STORAGE_KEY = 'psychologi_session_v1'

function isAuthSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== 'object') return false

  const v = value as Record<string, unknown>

  return (
    typeof v.user_id === 'number' &&
    (v.role === 'client' || v.role === 'therapist') &&
    typeof v.full_name === 'string' &&
    (v.email === undefined || v.email === null || typeof v.email === 'string')
  )
}

export function loadSessionFromStorage(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) return null

    const parsed: unknown = JSON.parse(raw)
    if (!isAuthSession(parsed)) return null

    return parsed
  } catch {
    return null
  }
}

export function saveSessionToStorage(session: AuthSession): void {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
  } catch {
    // ignore (storage full / blocked)
  }
}

export function clearSessionFromStorage(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY)
  } catch {
    // ignore
  }
}