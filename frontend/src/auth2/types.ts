export type UserRole = 'client' | 'therapist'

export type AuthSession = {
  user_id: number
  role: UserRole
  full_name: string
  email?: string | null
}
