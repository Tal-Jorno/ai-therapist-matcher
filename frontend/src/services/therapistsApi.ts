import { api } from './apiClient'
import type { Therapist, TherapistSearchParams, TherapistUpdateBody } from '../types'

function toQueryString(params: Record<string, string | number | boolean | undefined>) {
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue
    if (typeof v === 'string' && v.trim() === '') continue
    qs.set(k, String(v))
  }
  const str = qs.toString()
  return str ? `?${str}` : ''
}

export const therapistsApi = {
  list: (params: TherapistSearchParams = {}) => {
    const query = toQueryString({
      city: params.city,
      specialization: params.specialization,
      min_price: params.min_price,
      max_price: params.max_price,
      is_online: params.is_online,
      limit: params.limit ?? 50,
      offset: params.offset ?? 0,
    })

    return api.get<Therapist[]>(`/therapists${query}`)
  },

  getById: (userId: number) => api.get<Therapist>(`/therapists/${userId}`),

  update: (userId: number, body: TherapistUpdateBody) =>
    api.patch<Therapist, TherapistUpdateBody>(`/therapists/${userId}`, body),
}

