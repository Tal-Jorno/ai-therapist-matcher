export type MatchSession = {
  id: number
  client_user_id: number
  status: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export type MatchMessage = {
  id: number
  session_id: number
  role: 'user' | 'assistant' | string
  content: string
  created_at: string
}

export type TherapistSummary = {
  user_id: number
  full_name: string
  specialization: string
  languages: string[] | string | null
  city: string | null
  is_online: boolean
  price_per_session: number | string | null
}

export type MatchResultPayload = {
  top5?: TherapistSummary[]
  reasons?: string[]
  extraction?: Record<string, unknown>

  /** Some workflows may include this inside the payload */
  assistant_message?: string
}

export type MatchResultResponse = {
  session_id: number
  payload: MatchResultPayload
  created_at: string
}

