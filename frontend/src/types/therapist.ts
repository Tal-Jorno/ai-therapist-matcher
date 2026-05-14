export type Therapist = {
  user_id: number
  full_name: string
  specialization: string
  bio?: string | null
  /** Backend currently returns a single string (nullable) */
  languages?: string | null
  city?: string | null
  is_online: boolean
  /** Backend returns Decimal; it may arrive as number or string */
  price_per_session?: number | string | null

  /** Frontend-only optional field (backend may add later) */
  image_url?: string | null
}

export type TherapistSearchParams = {
  city?: string
  specialization?: string
  min_price?: number
  max_price?: number
  is_online?: boolean
  limit?: number
  offset?: number
}

export type TherapistUpdateBody = {
  full_name?: string | null
  specialization?: string | null
  bio?: string | null
  languages?: string | null
  city?: string | null
  is_online?: boolean | null
  price_per_session?: number | null
}
