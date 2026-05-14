import { api, ApiError } from './apiClient'
import type { AuthSession, UserRole } from '../auth/types'

type BackendRole = 'CLIENT' | 'THERAPIST'

type BackendSession = {
  user_id: number
  role: BackendRole
  email: string | null
  full_name: string | null
  email_verified: boolean
}

function normalizeRole(role: BackendRole | string): UserRole {
  return role === 'THERAPIST' ? 'therapist' : 'client'
}

function safeName(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function toSession(res: BackendSession): AuthSession {
  return {
    user_id: res.user_id,
    role: normalizeRole(res.role),
    email: res.email ?? null,
    full_name:
      normalizeRole(res.role) === 'therapist'
        ? safeName(res.full_name, 'מטפל/ת')
        : safeName(res.full_name, 'מטופל/ת'),
    email_verified: Boolean(res.email_verified),
  }
}

export const authApi = {
  googleLogin: async (body: { id_token: string; role?: UserRole }) => {
    const res = await api.post<BackendSession, { id_token: string; role: BackendRole }>(
      '/auth/google',
      {
        id_token: body.id_token,
        role: body.role === 'therapist' ? 'THERAPIST' : 'CLIENT',
      },
    )
    return toSession(res)
  },

  registerEmail: async (body: { role: UserRole; email: string; password: string; full_name?: string }) => {
    const res = await api.post<
      { session: BackendSession; dev_verify_token?: string; dev_verify_url?: string },
      { role: BackendRole; email: string; password: string; full_name?: string | null }
    >('/auth/register', {
      role: body.role === 'therapist' ? 'THERAPIST' : 'CLIENT',
      email: body.email,
      password: body.password,
      full_name: body.full_name?.trim() ? body.full_name.trim() : null,
    })

    return { session: toSession(res.session), dev_verify_url: res.dev_verify_url, dev_verify_token: res.dev_verify_token }
  },

  registerTherapistEmail: async (body: {
    email: string
    password: string
    full_name: string
    specialization: string
    city?: string
    languages?: string
    bio?: string
    is_online?: boolean
    price_per_session?: number | null
  }) => {
    const res = await api.post<
      { session: BackendSession; dev_verify_token?: string; dev_verify_url?: string },
      Record<string, unknown>
    >('/auth/therapist/register', {
      email: body.email,
      password: body.password,
      full_name: body.full_name,
      specialization: body.specialization,
      bio: body.bio?.trim() ? body.bio.trim() : null,
      languages: body.languages?.trim() ? body.languages.trim() : null,
      city: body.city?.trim() ? body.city.trim() : null,
      is_online: body.is_online ?? true,
      price_per_session: body.price_per_session ?? null,
    })

    return { session: toSession(res.session), dev_verify_url: res.dev_verify_url, dev_verify_token: res.dev_verify_token }
  },

  loginEmail: async (body: { email: string; password: string }) => {
    const res = await api.post<BackendSession, { email: string; password: string }>('/auth/login', body)
    return toSession(res)
  },

  verifyEmail: async (body: { token: string }) => {
    const res = await api.post<BackendSession, { token: string }>('/auth/verify-email', body)
    return toSession(res)
  },

  resendVerification: async (body: { email: string }) => {
    const res = await api.post<{ status: 'ok'; dev_verify_url?: string }, { email: string }>(
      '/auth/resend-verification',
      body,
    )
    return res
  },

  isNotFound: (e: unknown) => e instanceof ApiError && e.status === 404,
  isUnauthorized: (e: unknown) => e instanceof ApiError && e.status === 401,
}
