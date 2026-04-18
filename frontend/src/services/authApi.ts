import { api, ApiError } from './apiClient'
import type { AuthSession, UserRole } from '../auth/types'

type BackendRole = 'CLIENT' | 'THERAPIST'

function normalizeRole(role: BackendRole | string): UserRole {
  return role === 'THERAPIST' ? 'therapist' : 'client'
}

function safeName(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

export const authApi = {
  registerClient: async (body: { email: string; full_name?: string }) => {
    const res = await api.post<
      { user_id: number; role: BackendRole; email: string; full_name: string | null },
      { email: string; full_name?: string | null }
    >('/clients/register', {
      email: body.email,
      full_name: body.full_name?.trim() ? body.full_name.trim() : null,
    })

    const session: AuthSession = {
      user_id: res.user_id,
      role: normalizeRole(res.role),
      email: res.email ?? null,
      full_name: safeName(res.full_name, 'מטופל/ת'),
    }
    return session
  },

  registerTherapist: async (body: {
    email: string
    full_name: string
    specialization: string
    city?: string
    languages?: string
    bio?: string
    is_online?: boolean
    price_per_session?: number | null
  }) => {
    const res = await api.post<
      { user_id: number; full_name: string; specialization: string },
      Record<string, unknown>
    >('/therapists/register', {
      email: body.email,
      full_name: body.full_name,
      specialization: body.specialization,
      bio: body.bio?.trim() ? body.bio.trim() : null,
      languages: body.languages?.trim() ? body.languages.trim() : null,
      city: body.city?.trim() ? body.city.trim() : null,
      is_online: body.is_online ?? true,
      price_per_session: body.price_per_session ?? null,
    })

    const session: AuthSession = {
      user_id: res.user_id,
      role: 'therapist',
      email: body.email,
      full_name: safeName(res.full_name, 'מטפל/ת'),
    }
    return session
  },

  loginById: async (opts: { role: UserRole; user_id: number }) => {
    if (opts.role === 'client') {
      const res = await api.get<
        { id: number; role: BackendRole; email: string; full_name: string | null }
      >(`/clients/${opts.user_id}`)

      const session: AuthSession = {
        user_id: res.id,
        role: normalizeRole(res.role),
        email: res.email ?? null,
        full_name: safeName(res.full_name, 'מטופל/ת'),
      }
      return session
    }

    const res = await api.get<{ user_id: number; full_name: string }>(
      `/therapists/${opts.user_id}`,
    )

    const session: AuthSession = {
      user_id: res.user_id,
      role: 'therapist',
      full_name: safeName(res.full_name, 'מטפל/ת'),
      email: null,
    }
    return session
  },

  isNotFound: (e: unknown) => e instanceof ApiError && e.status === 404,
}

