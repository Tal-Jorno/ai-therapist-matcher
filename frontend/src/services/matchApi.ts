import { api } from './apiClient'
import type {
  MatchResultResponse,
  MatchSession,
} from '../types'

export const matchApi = {
  createSession: (body: { client_user_id: number }) =>
    api.post<MatchSession, { client_user_id: number }>(
      '/match/sessions',
      body,
    ),

  sendMessage: (sessionId: number, body: { content: string }) =>
    api.post<unknown, { content: string }>(
      `/match/sessions/${sessionId}/message`,
      body,
    ),

  getResults: (sessionId: number) =>
    api.get<MatchResultResponse>(`/match/sessions/${sessionId}/results`),
}

