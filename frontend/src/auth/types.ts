import {
  Fragment,
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { Card } from '../components/ui/Card'

// -----------------
// Types
// -----------------
export type UserRole = 'client' | 'therapist'

export type AuthSession = {
  user_id: number
  role: UserRole
  full_name: string
  email?: string | null
}

// -----------------
// localStorage
// -----------------
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

// -----------------
// React Context
// -----------------
export type AuthContextValue = {
  session: AuthSession | null
  isReady: boolean
  setSession: (session: AuthSession | null) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider(props: { children: ReactNode }) {
  const [session, setSessionState] = useState<AuthSession | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Defer to satisfy react-hooks/set-state-in-effect
    const t = setTimeout(() => {
      const stored = loadSessionFromStorage()
      setSessionState(stored)
      setIsReady(true)
    }, 0)

    return () => clearTimeout(t)
  }, [])

  const setSession = useCallback((next: AuthSession | null) => {
    setSessionState(next)

    if (next) saveSessionToStorage(next)
    else clearSessionFromStorage()
  }, [])

  const logout = useCallback(() => {
    setSession(null)
  }, [setSession])

  const value = useMemo<AuthContextValue>(
    () => ({ session, isReady, setSession, logout }),
    [session, isReady, setSession, logout],
  )

  return createElement(AuthContext.Provider, { value }, props.children)
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

// -----------------
// Route Guard
// -----------------
export function RequireRole(props: { role: UserRole; children: ReactNode }) {
  const { session, isReady } = useAuth()
  const location = useLocation()

  if (!isReady) {
    return createElement(
      'div',
      { className: 'stack' },
      createElement(
        Card,
        {
          title: 'טוען...',
          children: createElement('p', null, 'בודקים התחברות.'),
        },
      ),
    )
  }

  if (!session) {
    return createElement(Navigate, {
      to: '/login',
      replace: true,
      state: { from: location },
    })
  }

  if (session.role !== props.role) {
    const safePath = session.role === 'therapist' ? '/therapist/dashboard' : '/user/chat'
    const audienceText = props.role === 'therapist' ? 'מטפלים' : 'מטופלים'

    return createElement(
      'div',
      { className: 'stack' },
      createElement(
        Card,
        {
          title: 'אין הרשאה',
          children: createElement(
            Fragment,
            null,
            createElement('p', null, `העמוד הזה מיועד ל${audienceText} בלבד.`),
            createElement(
              'p',
              null,
              'מעבר לאזור המתאים: ',
              createElement(Link, { to: safePath }, 'לחצו כאן'),
            ),
          ),
        },
      ),
    )
  }

  return createElement(Fragment, null, props.children)
}
